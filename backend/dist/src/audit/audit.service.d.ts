import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../database/schemas/audit-log.schema';
export declare class AuditService {
    private readonly auditLogModel;
    constructor(auditLogModel: Model<AuditLogDocument>);
    log(actorId: string | null, action: string, entity: string, entityId: string, metadata?: any, ipAddress?: string): Promise<AuditLog & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    findAll(limit?: number): Promise<any[]>;
}
