import { ConfigService } from '@nestjs/config';
export declare class Msg91Service {
    private readonly configService;
    private readonly logger;
    private readonly isEnabled;
    private readonly authKey;
    private readonly widgetId;
    private readonly templateId;
    private readonly senderId;
    private readonly expirySeconds;
    private readonly apiBaseUrl;
    private readonly devOtp;
    constructor(configService: ConfigService);
    verifyWidgetToken(clientId: string): Promise<{
        mobile: string;
    }>;
    private normalizeForMsg91;
    extractReqId(responseBody: any): string;
    get isWidgetMode(): boolean;
    sendOtp(phoneNumber: string): Promise<any>;
    resendOtp(phoneNumber: string, reqId?: string): Promise<any>;
    verifyOtp(phoneNumber: string, otp: string, reqId?: string): Promise<boolean>;
}
