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
exports.MentorProfileSchema = exports.MentorProfile = exports.MentorStatus = exports.VerificationStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "PENDING";
    VerificationStatus["VERIFIED"] = "VERIFIED";
    VerificationStatus["REJECTED"] = "REJECTED";
    VerificationStatus["EXPIRED"] = "EXPIRED";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var MentorStatus;
(function (MentorStatus) {
    MentorStatus["ACTIVE"] = "ACTIVE";
    MentorStatus["PAUSED"] = "PAUSED";
    MentorStatus["INACTIVE"] = "INACTIVE";
})(MentorStatus || (exports.MentorStatus = MentorStatus = {}));
let MentorProfile = class MentorProfile {
};
exports.MentorProfile = MentorProfile;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MentorProfile.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], MentorProfile.prototype, "graduationYear", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MentorProfile.prototype, "programme", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MentorProfile.prototype, "currentCompany", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MentorProfile.prototype, "currentDesignation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], MentorProfile.prototype, "yearsOfExperience", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], MentorProfile.prototype, "industry", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [], index: true }),
    __metadata("design:type", Array)
], MentorProfile.prototype, "expertise", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], MentorProfile.prototype, "mentoringAreas", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MentorProfile.prototype, "bio", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MentorProfile.prototype, "careerSummary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 3 }),
    __metadata("design:type", Number)
], MentorProfile.prototype, "maxCapacity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], MentorProfile.prototype, "currentMenteesCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true, index: true }),
    __metadata("design:type", Boolean)
], MentorProfile.prototype, "acceptingMentees", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: VerificationStatus.PENDING, index: true, enum: VerificationStatus }),
    __metadata("design:type", String)
], MentorProfile.prototype, "verificationStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: MentorStatus.INACTIVE, index: true, enum: MentorStatus }),
    __metadata("design:type", String)
], MentorProfile.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], MentorProfile.prototype, "profileVisibility", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Number], index: false }),
    __metadata("design:type", Array)
], MentorProfile.prototype, "mentorEmbedding", void 0);
exports.MentorProfile = MentorProfile = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MentorProfile);
exports.MentorProfileSchema = mongoose_1.SchemaFactory.createForClass(MentorProfile);
//# sourceMappingURL=mentor-profile.schema.js.map