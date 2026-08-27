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
exports.GoalSchema = exports.Goal = exports.GoalStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var GoalStatus;
(function (GoalStatus) {
    GoalStatus["NOT_STARTED"] = "NOT_STARTED";
    GoalStatus["IN_PROGRESS"] = "IN_PROGRESS";
    GoalStatus["COMPLETED"] = "COMPLETED";
    GoalStatus["CANCELLED"] = "CANCELLED";
})(GoalStatus || (exports.GoalStatus = GoalStatus = {}));
let Goal = class Goal {
};
exports.Goal = Goal;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Mentorship', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Goal.prototype, "mentorshipId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Goal.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Goal.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Goal.prototype, "progress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: GoalStatus.NOT_STARTED, enum: GoalStatus, index: true }),
    __metadata("design:type", String)
], Goal.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date }),
    __metadata("design:type", Date)
], Goal.prototype, "targetDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Goal.prototype, "completedAt", void 0);
exports.Goal = Goal = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Goal);
exports.GoalSchema = mongoose_1.SchemaFactory.createForClass(Goal);
//# sourceMappingURL=goal.schema.js.map