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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const feedback_schema_1 = require("../database/schemas/feedback.schema");
const mentorship_schema_1 = require("../database/schemas/mentorship.schema");
let FeedbackService = class FeedbackService {
    constructor(feedbackModel, mentorshipModel) {
        this.feedbackModel = feedbackModel;
        this.mentorshipModel = mentorshipModel;
    }
    async createFeedback(mentorshipId, submitterId, dto) {
        const mentorship = await this.mentorshipModel
            .findById(mentorshipId)
            .populate('studentProfileId')
            .populate('mentorProfileId')
            .lean();
        if (!mentorship) {
            throw new common_1.NotFoundException('Mentorship not found');
        }
        const studentUserIdStr = mentorship.studentProfileId.userId?.toString();
        const mentorUserIdStr = mentorship.mentorProfileId.userId?.toString();
        if (studentUserIdStr !== submitterId &&
            mentorUserIdStr !== submitterId) {
            throw new common_1.ForbiddenException('Access denied. You do not participate in this mentorship.');
        }
        const existing = await this.feedbackModel.findOne({
            mentorshipId: new mongoose_2.Types.ObjectId(mentorshipId),
            submitterId: new mongoose_2.Types.ObjectId(submitterId),
        });
        if (existing) {
            throw new common_1.BadRequestException('Feedback has already been submitted for this mentorship.');
        }
        const feedback = new this.feedbackModel({
            mentorshipId: new mongoose_2.Types.ObjectId(mentorshipId),
            submitterId: new mongoose_2.Types.ObjectId(submitterId),
            rating: dto.rating,
            comments: dto.comments,
            usefulness: dto.usefulness,
            learningOutcome: dto.learningOutcome,
            preparedness: dto.preparedness,
            progressScore: dto.progressScore,
            engagement: dto.engagement,
        });
        await feedback.save();
        return {
            ...feedback.toObject(),
            id: feedback._id.toString(),
        };
    }
    async getFeedback(mentorshipId, userId) {
        const mentorship = await this.mentorshipModel
            .findById(mentorshipId)
            .populate('studentProfileId')
            .populate('mentorProfileId')
            .lean();
        if (!mentorship) {
            throw new common_1.NotFoundException('Mentorship not found');
        }
        const studentUserIdStr = mentorship.studentProfileId.userId?.toString();
        const mentorUserIdStr = mentorship.mentorProfileId.userId?.toString();
        if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const list = await this.feedbackModel
            .find({ mentorshipId: new mongoose_2.Types.ObjectId(mentorshipId) })
            .populate('submitterId')
            .lean();
        return list.map((f) => ({
            ...f,
            id: f._id.toString(),
            submitter: f.submitterId
                ? {
                    ...f.submitterId,
                    id: f.submitterId._id?.toString(),
                }
                : null,
        }));
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(feedback_schema_1.Feedback.name)),
    __param(1, (0, mongoose_1.InjectModel)(mentorship_schema_1.Mentorship.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map