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
exports.AlumniVerificationSchema = exports.AlumniVerification = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const mentor_profile_schema_1 = require("./mentor-profile.schema");
let AlumniVerification = class AlumniVerification {
};
exports.AlumniVerification = AlumniVerification;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'MentorProfile', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AlumniVerification.prototype, "mentorProfileId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'StudentProfile', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AlumniVerification.prototype, "studentProfileId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed, required: true }),
    __metadata("design:type", Object)
], AlumniVerification.prototype, "submittedData", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: mentor_profile_schema_1.VerificationStatus.PENDING, enum: mentor_profile_schema_1.VerificationStatus, index: true }),
    __metadata("design:type", String)
], AlumniVerification.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AlumniVerification.prototype, "reviewerId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], AlumniVerification.prototype, "reviewedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AlumniVerification.prototype, "rejectionReason", void 0);
exports.AlumniVerification = AlumniVerification = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], AlumniVerification);
exports.AlumniVerificationSchema = mongoose_1.SchemaFactory.createForClass(AlumniVerification);
//# sourceMappingURL=alumni-verification.schema.js.map