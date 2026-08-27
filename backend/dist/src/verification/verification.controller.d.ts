import { VerificationService } from './verification.service';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { RequestChangesDto } from './dto/request-changes.dto';
export declare class VerificationController {
    private readonly verificationService;
    constructor(verificationService: VerificationService);
    submit(user: any, dto: SubmitVerificationDto): Promise<any>;
    getAll(): Promise<any>;
    getOne(id: string): Promise<any>;
    approve(id: string, reviewer: any): Promise<any>;
    reject(id: string, reviewer: any, dto: RejectVerificationDto): Promise<any>;
    requestChanges(id: string, reviewer: any, dto: RequestChangesDto): Promise<any>;
    sendOtp(user: any, body: {
        phoneNumber: string;
        countryCode: string;
    }, ip: string): Promise<any>;
    resendOtp(user: any, ip: string): Promise<any>;
    verifyOtp(user: any, body: {
        otp: string;
    }): Promise<any>;
    getStatus(user: any): Promise<any>;
    verifyWidgetToken(user: any, body: {
        token: string;
    }): Promise<any>;
}
