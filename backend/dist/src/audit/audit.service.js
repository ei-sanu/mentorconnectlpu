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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const audit_log_schema_1 = require("../database/schemas/audit-log.schema");
let AuditService = class AuditService {
    constructor(auditLogModel) {
        this.auditLogModel = auditLogModel;
    }
    async log(actorId, action, entity, entityId, metadata, ipAddress) {
        const logEntry = new this.auditLogModel({
            actorId: actorId ? new mongoose_2.Types.ObjectId(actorId) : undefined,
            action,
            entity,
            entityId,
            metadata,
            ipAddress,
        });
        await logEntry.save();
        return logEntry.toObject();
    }
    async findAll(limit = 100) {
        const list = await this.auditLogModel
            .find()
            .populate('actorId')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        return list.map((l) => ({
            ...l,
            id: l._id.toString(),
            actor: l.actorId
                ? {
                    id: l.actorId._id?.toString(),
                    firstName: l.actorId.firstName,
                    lastName: l.actorId.lastName,
                    email: l.actorId.email,
                }
                : null,
        }));
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(audit_log_schema_1.AuditLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AuditService);
//# sourceMappingURL=audit.service.js.map