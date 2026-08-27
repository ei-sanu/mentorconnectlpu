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
exports.MentorshipSchema = exports.Mentorship = exports.MentorshipStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var MentorshipStatus;
(function (MentorshipStatus) {
    MentorshipStatus["ACTIVE"] = "ACTIVE";
    MentorshipStatus["PAUSED"] = "PAUSED";
    MentorshipStatus["COMPLETED"] = "COMPLETED";
    MentorshipStatus["CANCELLED"] = "CANCELLED";
    MentorshipStatus["AT_RISK"] = "AT_RISK";
    MentorshipStatus["INACTIVE"] = "INACTIVE";
})(MentorshipStatus || (exports.MentorshipStatus = MentorshipStatus = {}));
let Mentorship = class Mentorship {
};
exports.Mentorship = Mentorship;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Mentorship.prototype, "studentProfileId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'MentorProfile', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Mentorship.prototype, "mentorProfileId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: MentorshipStatus.ACTIVE, enum: MentorshipStatus, index: true }),
    __metadata("design:type", String)
], Mentorship.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: Date.now }),
    __metadata("design:type", Date)
], Mentorship.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Mentorship.prototype, "endDate", void 0);
exports.Mentorship = Mentorship = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Mentorship);
exports.MentorshipSchema = mongoose_1.SchemaFactory.createForClass(Mentorship);
//# sourceMappingURL=mentorship.schema.js.map