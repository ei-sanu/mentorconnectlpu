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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngagementLogSchema = exports.EngagementLog = exports.RiskLevel = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["HEALTHY"] = "HEALTHY";
    RiskLevel["NEEDS_ATTENTION"] = "NEEDS_ATTENTION";
    RiskLevel["AT_RISK"] = "AT_RISK";
    RiskLevel["INACTIVE"] = "INACTIVE";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
let EngagementLog = class EngagementLog {
};
exports.EngagementLog = EngagementLog;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Mentorship', required: true, unique: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], EngagementLog.prototype, "mentorshipId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date, default: Date.now }),
    __metadata("design:type", Date)
], EngagementLog.prototype, "lastInteractionDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], EngagementLog.prototype, "sessionsCompletedCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], EngagementLog.prototype, "sessionsMissedCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], EngagementLog.prototype, "goalsCompletedCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], EngagementLog.prototype, "actionItemsCompletedCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], EngagementLog.prototype, "daysSinceLastInteraction", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0.0 }),
    __metadata("design:type", Number)
], EngagementLog.prototype, "riskScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: RiskLevel.HEALTHY, enum: RiskLevel, index: true }),
    __metadata("design:type", String)
], EngagementLog.prototype, "riskLevel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], EngagementLog.prototype, "reasons", void 0);
exports.EngagementLog = EngagementLog = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], EngagementLog);
exports.EngagementLogSchema = mongoose_1.SchemaFactory.createForClass(EngagementLog);
//# sourceMappingURL=engagement-log.schema.js.map