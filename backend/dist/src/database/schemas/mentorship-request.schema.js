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
exports.MentorshipRequestSchema = exports.MentorshipRequest = exports.RequestStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "PENDING";
    RequestStatus["ACCEPTED"] = "ACCEPTED";
    RequestStatus["DECLINED"] = "DECLINED";
    RequestStatus["EXPIRED"] = "EXPIRED";
    RequestStatus["CANCELLED"] = "CANCELLED";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
let MentorshipRequest = class MentorshipRequest {
};
exports.MentorshipRequest = MentorshipRequest;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MentorshipRequest.prototype, "studentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'MentorProfile', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MentorshipRequest.prototype, "mentorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MentorshipRequest.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], MentorshipRequest.prototype, "goal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: RequestStatus.PENDING, enum: RequestStatus, index: true }),
    __metadata("design:type", String)
], MentorshipRequest.prototype, "status", void 0);
exports.MentorshipRequest = MentorshipRequest = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MentorshipRequest);
exports.MentorshipRequestSchema = mongoose_1.SchemaFactory.createForClass(MentorshipRequest);
//# sourceMappingURL=mentorship-request.schema.js.map