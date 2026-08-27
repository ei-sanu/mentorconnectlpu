import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Msg91Service {
  private readonly logger = new Logger(Msg91Service.name);
  
  private readonly isEnabled: boolean;
  private readonly authKey: string;
  private readonly widgetId: string;
  private readonly templateId: string;
  private readonly senderId: string;
  private readonly expirySeconds: number;
  private readonly apiBaseUrl: string;
  private readonly devOtp: string;

  constructor(private readonly configService: ConfigService) {
    this.isEnabled = this.configService.get<string>('MSG91_ENABLED') !== 'false';
    this.authKey = this.configService.get<string>('MSG91_AUTH_KEY') || '';
    this.widgetId = this.configService.get<string>('MSG91_WIDGET_ID') || '';
    this.templateId = this.configService.get<string>('MSG91_OTP_TEMPLATE_ID') || '';
    this.senderId = this.configService.get<string>('MSG91_SENDER_ID') || '';
    this.expirySeconds = parseInt(this.configService.get<string>('MSG91_OTP_EXPIRY_SECONDS') || '300', 10);
    this.apiBaseUrl = this.configService.get<string>('MSG91_API_BASE_URL') || 'https://control.msg91.com/api/v5';
    this.devOtp = this.configService.get<string>('DEV_PHONE_OTP') || '123456';

    if (!this.isEnabled) {
      this.logger.warn('⚠️ MSG91 is DISABLED. Development OTP bypass is active.');
    }
  }

  /**
   * Verify a widget clientId token (returned by MSG91's otp-provider.js success callback).
   * Calls MSG91's verifyToken endpoint to get the verified mobile number.
   * Dev mode returns a mock phone when MSG91_ENABLED=false.
   */
  async verifyWidgetToken(clientId: string): Promise<{ mobile: string }> {
    if (!this.isEnabled) {
      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException('SMS Verification unavailable in production without MSG91 credentials.');
      }
      this.logger.warn(`[DEV SIMULATION] verifyWidgetToken: clientId=${clientId} → mock mobile returned.`);
      return { mobile: '+919999999999' }; // Dev placeholder
    }

    if (!this.authKey || !this.widgetId) {
      this.logger.error('MSG91_AUTH_KEY or MSG91_WIDGET_ID not configured in backend environment.');
      throw new InternalServerErrorException('SMS provider not configured.');
    }

    try {
      const url = `${this.apiBaseUrl}/widget/verifyToken?widgetId=${this.widgetId}&token=${encodeURIComponent(clientId)}`;
      this.logger.log(`Calling MSG91 verifyWidgetToken: widgetId=${this.widgetId}, token=***`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'authkey': this.authKey,
          'Content-Type': 'application/json',
        },
      });

      const body = await response.json();
      this.logger.debug(`MSG91 verifyWidgetToken response: ${JSON.stringify({ type: body.type, message: body.message })}`);

      if (!response.ok || body.type === 'error') {
        this.logger.warn(`MSG91 verifyWidgetToken failed: ${JSON.stringify(body)}`);
        throw new BadRequestException(body.message || 'Widget token verification failed with MSG91.');
      }

      // MSG91 returns: { type: 'success', message: 'Verified', mobile: '91xxxxxxxxxx' }
      const mobile = body.mobile ? `+${body.mobile}`.replace(/^\+\+/, '+') : '';
      if (!mobile) {
        throw new BadRequestException('MSG91 did not return a verified mobile number.');
      }

      return { mobile };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`MSG91 verifyWidgetToken network error: ${err.message}`);
      throw new InternalServerErrorException('Failed to communicate with SMS verification provider.');
    }
  }

  /**
   * Helper to normalize mobile number for MSG91 (E.164 without leading plus).
   * E.g., +919876543210 -> 919876543210
   */
  private normalizeForMsg91(phoneNumber: string): string {
    return phoneNumber.replace(/^\+/, '');
  }

  /**
   * Extract the OTP session request ID (reqId) from a MSG91 send/retry response.
   * Widget & standard APIs return it under `reqId`, `request_id`, `requestId`,
   * or as a hex string inside `message` (e.g. {"message":"366879716368373535393036","type":"success"}).
   */
  extractReqId(responseBody: any): string {
    if (!responseBody || typeof responseBody !== 'object') return '';
    const candidate: unknown =
      responseBody.reqId ?? responseBody.request_id ?? responseBody.requestId ?? responseBody.message;
    if (typeof candidate !== 'string') return '';
    const trimmed = candidate.trim();
    // MSG91 request IDs are long hex strings — guards against prose like "Simulation OTP sent"
    return /^[0-9a-f]{16,}$/i.test(trimmed) ? trimmed : '';
  }

  /** True when configured to use the MSG91 Widget API instead of the standard OTP API. */
  get isWidgetMode(): boolean {
    return !!this.widgetId && !this.templateId;
  }

  async sendOtp(phoneNumber: string): Promise<any> {
    const normalizedMobile = this.normalizeForMsg91(phoneNumber);
    
    if (!this.isEnabled) {
      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException('SMS Verification unavailable in production.');
      }
      this.logger.warn(`[DEV SIMULATION] Send OTP to normalized phone: ${normalizedMobile}. Expected OTP: ${this.devOtp}`);
      return { success: true, message: 'Simulation OTP sent successfully' };
    }

    if (!this.authKey) {
      this.logger.error('MSG91_AUTH_KEY is not configured in backend environment.');
      throw new InternalServerErrorException('SMS provider not configured.');
    }

    const useWidgetApi = !this.templateId && !!this.widgetId;

    if (!this.templateId && !this.widgetId) {
      this.logger.error('Neither MSG91_OTP_TEMPLATE_ID nor MSG91_WIDGET_ID is configured.');
      throw new InternalServerErrorException('SMS provider not configured.');
    }

    try {
      let url = '';
      let payload: any = {};
      const headers = {
        'Content-Type': 'application/json',
        'authkey': this.authKey,
      };

      if (useWidgetApi) {
        url = `https://control.msg91.com/api/v5/widget/sendOtp`;
        payload = {
          widgetId: this.widgetId,
          identifier: normalizedMobile,
        };
        this.logger.log(`Calling MSG91 Widget sendOtp API for: ${normalizedMobile.substring(0, 4)}******`);
      } else {
        url = `${this.apiBaseUrl}/otp?template_id=${this.templateId}&mobile=${normalizedMobile}&authkey=${this.authKey}`;
        payload = {
          expiry: this.expirySeconds / 60, // MSG91 expects expiry in minutes
        };
        if (this.senderId) {
          payload.sender = this.senderId;
        }
        this.logger.log(`Calling MSG91 Standard sendOtp API for: ${normalizedMobile.substring(0, 4)}******`);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseBody = await response.json();
      if (!response.ok || responseBody.type === 'error') {
        this.logger.error(`MSG91 API error during sendOtp: ${JSON.stringify(responseBody)}`);
        throw new InternalServerErrorException(responseBody.message || 'Failed to send OTP via provider.');
      }

      this.logger.log(`MSG91 sendOtp raw response: ${JSON.stringify(responseBody)}`);
      return responseBody;
    } catch (error: any) {
      this.logger.error(`Failed to send OTP via MSG91: ${error.message}`);
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to communicate with SMS provider.');
    }
  }

  async resendOtp(phoneNumber: string, reqId?: string): Promise<any> {
    const normalizedMobile = this.normalizeForMsg91(phoneNumber);

    if (!this.isEnabled) {
      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException('SMS Verification unavailable in production.');
      }
      this.logger.warn(`[DEV SIMULATION] Resend OTP to: ${normalizedMobile}`);
      return { success: true, message: 'Simulation OTP resent successfully' };
    }

    if (!this.authKey) {
      throw new InternalServerErrorException('SMS provider not configured.');
    }

    const useWidgetApi = !!reqId && !this.templateId && !!this.widgetId;

    try {
      let url = '';
      let payload: any = {};
      const headers = {
        'Content-Type': 'application/json',
        'authkey': this.authKey,
      };

      if (useWidgetApi) {
        url = `https://control.msg91.com/api/v5/widget/retryOtp`;
        payload = {
          widgetId: this.widgetId,
          reqId: reqId,
        };
        this.logger.log(`Calling MSG91 Widget retryOtp API for reqId: ${reqId}`);
      } else {
        url = `${this.apiBaseUrl}/otp/retry?authkey=${this.authKey}&mobile=${normalizedMobile}&retrytype=text`;
        this.logger.log(`Calling MSG91 Standard resendOtp (retry) for: ${normalizedMobile.substring(0, 4)}******`);
      }

      const response = await fetch(url, {
        method: useWidgetApi ? 'POST' : 'GET',
        headers: useWidgetApi ? headers : { 'authkey': this.authKey },
        body: useWidgetApi ? JSON.stringify(payload) : undefined,
      });

      const responseBody = await response.json();
      if (!response.ok || responseBody.type === 'error') {
        this.logger.error(`MSG91 API error during resendOtp: ${JSON.stringify(responseBody)}`);
        throw new InternalServerErrorException(responseBody.message || 'Failed to resend OTP via provider.');
      }

      return responseBody;
    } catch (error: any) {
      this.logger.error(`Failed to resend OTP via MSG91: ${error.message}`);
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to communicate with SMS provider.');
    }
  }

  async verifyOtp(phoneNumber: string, otp: string, reqId?: string): Promise<boolean> {
    const normalizedMobile = this.normalizeForMsg91(phoneNumber);

    if (!this.isEnabled) {
      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException('SMS Verification unavailable in production.');
      }
      this.logger.warn(`[DEV SIMULATION] Verify OTP for ${normalizedMobile} with code ${otp}`);
      return otp === this.devOtp;
    }

    if (!this.authKey) {
      throw new InternalServerErrorException('SMS provider not configured.');
    }

    const useWidgetApi = !!this.widgetId && !this.templateId;

    try {
      let url = '';
      let payload: any = {};
      const headers = {
        'Content-Type': 'application/json',
        'authkey': this.authKey,
      };

      if (useWidgetApi) {
        url = `https://control.msg91.com/api/v5/widget/verifyOtp`;
        payload = {
          widgetId: this.widgetId,
          otp: otp,
          // reqId is required — without it MSG91 can't resolve the session
          ...(reqId ? { reqId } : { identifier: normalizedMobile }),
        };
        this.logger.log(`Calling MSG91 Widget verifyOtp for: ${normalizedMobile.substring(0, 4)}****** (reqId=${reqId ?? 'none'})`);
      } else {
        url = `${this.apiBaseUrl}/otp/verify?authkey=${this.authKey}&mobile=${normalizedMobile}&otp=${otp}`;
        this.logger.log(`Calling MSG91 Standard verifyOtp for: ${normalizedMobile.substring(0, 4)}******`);
      }

      const response = await fetch(url, {
        method: useWidgetApi ? 'POST' : 'GET',
        headers: useWidgetApi ? headers : { 'authkey': this.authKey },
        body: useWidgetApi ? JSON.stringify(payload) : undefined,
      });

      const responseBody = await response.json();
      this.logger.log(`MSG91 verifyOtp raw response: ${JSON.stringify(responseBody)}`);

      if (!response.ok || responseBody.type === 'error' || responseBody.hasError) {
        this.logger.warn(`MSG91 OTP verification failed response: ${JSON.stringify(responseBody)}`);
        return false;
      }

      if (useWidgetApi) {
        // MSG91 Widget verifyOtp returns an access-token JWT on success
        return !!(responseBody['access-token'] || responseBody.accessToken || responseBody.type === 'success' || responseBody.message === 'Verified');
      }
      return responseBody.type === 'success';
    } catch (error: any) {
      this.logger.error(`Failed to verify OTP via MSG91: ${error.message}`);
      return false;
    }
  }
}
