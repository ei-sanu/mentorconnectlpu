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
exports.SessionSchema = exports.Session = exports.CalendarSyncStatus = exports.SessionStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["SCHEDULED"] = "SCHEDULED";
    SessionStatus["COMPLETED"] = "COMPLETED";
    SessionStatus["CANCELLED"] = "CANCELLED";
    SessionStatus["RESCHEDULED"] = "RESCHEDULED";
    SessionStatus["NO_SHOW"] = "NO_SHOW";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var CalendarSyncStatus;
(function (CalendarSyncStatus) {
    CalendarSyncStatus["PENDING"] = "PENDING";
    CalendarSyncStatus["FAILED"] = "FAILED";
    CalendarSyncStatus["SYNCED"] = "SYNCED";
})(CalendarSyncStatus || (exports.CalendarSyncStatus = CalendarSyncStatus = {}));
let Session = class Session {
};
exports.Session = Session;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Mentorship', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Session.prototype, "mentorshipId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Session.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date }),
    __metadata("design:type", Date)
], Session.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date }),
    __metadata("design:type", Date)
], Session.prototype, "endTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'Asia/Kolkata' }),
    __metadata("design:type", String)
], Session.prototype, "timezone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: SessionStatus.SCHEDULED, enum: SessionStatus, index: true }),
    __metadata("design:type", String)
], Session.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Session.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Session.prototype, "meetingUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Session.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Session.prototype, "calendarEventId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: CalendarSyncStatus.PENDING, enum: CalendarSyncStatus }),
    __metadata("design:type", String)
], Session.prototype, "calendarSyncStatus", void 0);
exports.Session = Session = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Session);
exports.SessionSchema = mongoose_1.SchemaFactory.createForClass(Session);
exports.SessionSchema.index({ mentorshipId: 1, startTime: 1 });
//# sourceMappingURL=session.schema.js.map