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
exports.ActionItemSchema = exports.ActionItem = exports.ActionItemStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var ActionItemStatus;
(function (ActionItemStatus) {
    ActionItemStatus["PENDING"] = "PENDING";
    ActionItemStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ActionItemStatus["COMPLETED"] = "COMPLETED";
    ActionItemStatus["OVERDUE"] = "OVERDUE";
})(ActionItemStatus || (exports.ActionItemStatus = ActionItemStatus = {}));
let ActionItem = class ActionItem {
};
exports.ActionItem = ActionItem;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Mentorship', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ActionItem.prototype, "mentorshipId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Goal', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ActionItem.prototype, "goalId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ActionItem.prototype, "task", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ActionItem.prototype, "assignedToId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ActionItem.prototype, "createdById", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date }),
    __metadata("design:type", Date)
], ActionItem.prototype, "dueDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: ActionItemStatus.PENDING, enum: ActionItemStatus, index: true }),
    __metadata("design:type", String)
], ActionItem.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], ActionItem.prototype, "completedAt", void 0);
exports.ActionItem = ActionItem = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ActionItem);
exports.ActionItemSchema = mongoose_1.SchemaFactory.createForClass(ActionItem);
//# sourceMappingURL=action-item.schema.js.map