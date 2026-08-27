import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserDocument } from '../database/schemas/user.schema';
export declare class ClerkAuthGuard implements CanActivate {
    private readonly userModel;
    private readonly logger;
    private jwksClientInstance;
    constructor(userModel: Model<UserDocument>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
