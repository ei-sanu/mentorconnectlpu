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
exports.OpportunitySchema = exports.Opportunity = exports.OpportunityStatus = exports.OpportunityType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var OpportunityType;
(function (OpportunityType) {
    OpportunityType["FULL_TIME"] = "FULL_TIME";
    OpportunityType["INTERNSHIP"] = "INTERNSHIP";
    OpportunityType["CO_OP"] = "CO_OP";
    OpportunityType["HACKATHON"] = "HACKATHON";
    OpportunityType["REFERRAL"] = "REFERRAL";
})(OpportunityType || (exports.OpportunityType = OpportunityType = {}));
var OpportunityStatus;
(function (OpportunityStatus) {
    OpportunityStatus["UPCOMING"] = "UPCOMING";
    OpportunityStatus["ACTIVE"] = "ACTIVE";
    OpportunityStatus["CLOSED"] = "CLOSED";
})(OpportunityStatus || (exports.OpportunityStatus = OpportunityStatus = {}));
let Opportunity = class Opportunity {
};
exports.Opportunity = Opportunity;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Opportunity.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Opportunity.prototype, "company", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: OpportunityType, default: OpportunityType.FULL_TIME }),
    __metadata("design:type", String)
], Opportunity.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Opportunity.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Opportunity.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: OpportunityStatus.UPCOMING, enum: OpportunityStatus, index: true }),
    __metadata("design:type", String)
], Opportunity.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Opportunity.prototype, "postedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Opportunity.prototype, "applyBy", void 0);
exports.Opportunity = Opportunity = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Opportunity);
exports.OpportunitySchema = mongoose_1.SchemaFactory.createForClass(Opportunity);
//# sourceMappingURL=opportunity.schema.js.map