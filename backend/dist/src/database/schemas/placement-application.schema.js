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
exports.PlacementApplicationSchema = exports.PlacementApplication = exports.PlacementStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var PlacementStatus;
(function (PlacementStatus) {
    PlacementStatus["APPLIED"] = "APPLIED";
    PlacementStatus["SHORTLISTED"] = "SHORTLISTED";
    PlacementStatus["INTERVIEW_SCHEDULED"] = "INTERVIEW_SCHEDULED";
    PlacementStatus["OFFERED"] = "OFFERED";
    PlacementStatus["REJECTED"] = "REJECTED";
    PlacementStatus["PLACED"] = "PLACED";
})(PlacementStatus || (exports.PlacementStatus = PlacementStatus = {}));
let PlacementApplication = class PlacementApplication {
};
exports.PlacementApplication = PlacementApplication;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PlacementApplication.prototype, "studentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Opportunity', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PlacementApplication.prototype, "opportunityId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: PlacementStatus, default: PlacementStatus.APPLIED, index: true }),
    __metadata("design:type", String)
], PlacementApplication.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], PlacementApplication.prototype, "interviewDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '' }),
    __metadata("design:type", String)
], PlacementApplication.prototype, "notes", void 0);
exports.PlacementApplication = PlacementApplication = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PlacementApplication);
exports.PlacementApplicationSchema = mongoose_1.SchemaFactory.createForClass(PlacementApplication);
//# sourceMappingURL=placement-application.schema.js.map