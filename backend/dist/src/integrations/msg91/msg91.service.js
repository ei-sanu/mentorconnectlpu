"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Msg91Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Msg91Service = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let Msg91Service = Msg91Service_1 = class Msg91Service {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(Msg91Service_1.name);
        this.isEnabled = this.configService.get('MSG91_ENABLED') !== 'false';
        this.authKey = this.configService.get('MSG91_AUTH_KEY') || '';
        this.widgetId = this.configService.get('MSG91_WIDGET_ID') || '';
        this.templateId = this.configService.get('MSG91_OTP_TEMPLATE_ID') || '';
        this.senderId = this.configService.get('MSG91_SENDER_ID') || '';
        this.expirySeconds = parseInt(this.configService.get('MSG91_OTP_EXPIRY_SECONDS') || '300', 10);
        this.apiBaseUrl = this.configService.get('MSG91_API_BASE_URL') || 'https://control.msg91.com/api/v5';
        this.devOtp = this.configService.get('DEV_PHONE_OTP') || '123456';
        if (!this.isEnabled) {
            this.logger.warn('⚠️ MSG91 is DISABLED. Development OTP bypass is active.');
        }
    }
    async verifyWidgetToken(clientId) {
        if (!this.isEnabled) {
            if (process.env.NODE_ENV === 'production') {
                throw new common_1.InternalServerErrorException('SMS Verification unavailable in production without MSG91 credentials.');
            }
            this.logger.warn(`[DEV SIMULATION] verifyWidgetToken: clientId=${clientId} → mock mobile returned.`);
            return { mobile: '+919999999999' };
        }
        if (!this.authKey || !this.widgetId) {
            this.logger.error('MSG91_AUTH_KEY or MSG91_WIDGET_ID not configured in backend environment.');
            throw new common_1.InternalServerErrorException('SMS provider not configured.');
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
                throw new common_1.BadRequestException(body.message || 'Widget token verification failed with MSG91.');
            }
            const mobile = body.mobile ? `+${body.mobile}`.replace(/^\+\+/, '+') : '';
            if (!mobile) {
                throw new common_1.BadRequestException('MSG91 did not return a verified mobile number.');
            }
            return { mobile };
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            this.logger.error(`MSG91 verifyWidgetToken network error: ${err.message}`);
            throw new common_1.InternalServerErrorException('Failed to communicate with SMS verification provider.');
        }
    }
    normalizeForMsg91(phoneNumber) {
        return phoneNumber.replace(/^\+/, '');
    }
    extractReqId(responseBody) {
        if (!responseBody || typeof responseBody !== 'object')
            return '';
        const candidate = responseBody.reqId ?? responseBody.request_id ?? responseBody.requestId ?? responseBody.message;
        if (typeof candidate !== 'string')
            return '';
        const trimmed = candidate.trim();
        return /^[0-9a-f]{16,}$/i.test(trimmed) ? trimmed : '';
    }
    get isWidgetMode() {
        return !!this.widgetId && !this.templateId;
    }
    async sendOtp(phoneNumber) {
        const normalizedMobile = this.normalizeForMsg91(phoneNumber);
        if (!this.isEnabled) {
            if (process.env.NODE_ENV === 'production') {
                throw new common_1.InternalServerErrorException('SMS Verification unavailable in production.');
            }
            this.logger.warn(`[DEV SIMULATION] Send OTP to normalized phone: ${normalizedMobile}. Expected OTP: ${this.devOtp}`);
            return { success: true, message: 'Simulation OTP sent successfully' };
        }
        if (!this.authKey) {
            this.logger.error('MSG91_AUTH_KEY is not configured in backend environment.');
            throw new common_1.InternalServerErrorException('SMS provider not configured.');
        }
        const useWidgetApi = !this.templateId && !!this.widgetId;
        if (!this.templateId && !this.widgetId) {
            this.logger.error('Neither MSG91_OTP_TEMPLATE_ID nor MSG91_WIDGET_ID is configured.');
            throw new common_1.InternalServerErrorException('SMS provider not configured.');
        }
        try {
            let url = '';
            let payload = {};
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
            }
            else {
                url = `${this.apiBaseUrl}/otp?template_id=${this.templateId}&mobile=${normalizedMobile}&authkey=${this.authKey}`;
                payload = {
                    expiry: this.expirySeconds / 60,
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
                throw new common_1.InternalServerErrorException(responseBody.message || 'Failed to send OTP via provider.');
            }
            this.logger.log(`MSG91 sendOtp raw response: ${JSON.stringify(responseBody)}`);
            return responseBody;
        }
        catch (error) {
            this.logger.error(`Failed to send OTP via MSG91: ${error.message}`);
            if (error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to communicate with SMS provider.');
        }
    }
    async resendOtp(phoneNumber, reqId) {
        const normalizedMobile = this.normalizeForMsg91(phoneNumber);
        if (!this.isEnabled) {
            if (process.env.NODE_ENV === 'production') {
                throw new common_1.InternalServerErrorException('SMS Verification unavailable in production.');
            }
            this.logger.warn(`[DEV SIMULATION] Resend OTP to: ${normalizedMobile}`);
            return { success: true, message: 'Simulation OTP resent successfully' };
        }
        if (!this.authKey) {
            throw new common_1.InternalServerErrorException('SMS provider not configured.');
        }
        const useWidgetApi = !!reqId && !this.templateId && !!this.widgetId;
        try {
            let url = '';
            let payload = {};
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
            }
            else {
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
                throw new common_1.InternalServerErrorException(responseBody.message || 'Failed to resend OTP via provider.');
            }
            return responseBody;
        }
        catch (error) {
            this.logger.error(`Failed to resend OTP via MSG91: ${error.message}`);
            if (error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to communicate with SMS provider.');
        }
    }
    async verifyOtp(phoneNumber, otp, reqId) {
        const normalizedMobile = this.normalizeForMsg91(phoneNumber);
        if (!this.isEnabled) {
            if (process.env.NODE_ENV === 'production') {
                throw new common_1.InternalServerErrorException('SMS Verification unavailable in production.');
            }
            this.logger.warn(`[DEV SIMULATION] Verify OTP for ${normalizedMobile} with code ${otp}`);
            return otp === this.devOtp;
        }
        if (!this.authKey) {
            throw new common_1.InternalServerErrorException('SMS provider not configured.');
        }
        const useWidgetApi = !!this.widgetId && !this.templateId;
        try {
            let url = '';
            let payload = {};
            const headers = {
                'Content-Type': 'application/json',
                'authkey': this.authKey,
            };
            if (useWidgetApi) {
                url = `https://control.msg91.com/api/v5/widget/verifyOtp`;
                payload = {
                    widgetId: this.widgetId,
                    otp: otp,
                    ...(reqId ? { reqId } : { identifier: normalizedMobile }),
                };
                this.logger.log(`Calling MSG91 Widget verifyOtp for: ${normalizedMobile.substring(0, 4)}****** (reqId=${reqId ?? 'none'})`);
            }
            else {
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
                return !!(responseBody['access-token'] || responseBody.accessToken || responseBody.type === 'success' || responseBody.message === 'Verified');
            }
            return responseBody.type === 'success';
        }
        catch (error) {
            this.logger.error(`Failed to verify OTP via MSG91: ${error.message}`);
            return false;
        }
    }
};
exports.Msg91Service = Msg91Service;
exports.Msg91Service = Msg91Service = Msg91Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], Msg91Service);
//# sourceMappingURL=msg91.service.js.map