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
exports.OpportunityApplicationSchema = exports.OpportunityApplication = exports.ApplicationStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const opportunity_schema_1 = require("./opportunity.schema");
const user_schema_1 = require("./user.schema");
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["APPLIED"] = "APPLIED";
    ApplicationStatus["SHORTLISTED"] = "SHORTLISTED";
    ApplicationStatus["INTERVIEW"] = "INTERVIEW";
    ApplicationStatus["SELECTED"] = "SELECTED";
    ApplicationStatus["REJECTED"] = "REJECTED";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
let OpportunityApplication = class OpportunityApplication {
};
exports.OpportunityApplication = OpportunityApplication;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: opportunity_schema_1.Opportunity.name, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], OpportunityApplication.prototype, "opportunityId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: user_schema_1.User.name, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], OpportunityApplication.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: ApplicationStatus.APPLIED, enum: ApplicationStatus, index: true }),
    __metadata("design:type", String)
], OpportunityApplication.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], OpportunityApplication.prototype, "notes", void 0);
exports.OpportunityApplication = OpportunityApplication = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], OpportunityApplication);
exports.OpportunityApplicationSchema = mongoose_1.SchemaFactory.createForClass(OpportunityApplication);
exports.OpportunityApplicationSchema.index({ opportunityId: 1, userId: 1 }, { unique: true });
//# sourceMappingURL=opportunity-application.schema.js.map