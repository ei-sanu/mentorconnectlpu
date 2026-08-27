import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Feedback, FeedbackDocument } from '../database/schemas/feedback.schema';
import { Mentorship, MentorshipDocument } from '../database/schemas/mentorship.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
    @InjectModel(Mentorship.name)
    private readonly mentorshipModel: Model<MentorshipDocument>,
  ) {}

  async createFeedback(mentorshipId: string, submitterId: string, dto: CreateFeedbackDto) {
    const mentorship = await this.mentorshipModel
      .findById(mentorshipId)
      .populate('studentProfileId')
      .populate('mentorProfileId')
      .lean();

    if (!mentorship) {
      throw new NotFoundException('Mentorship not found');
    }

    const studentUserIdStr = (mentorship.studentProfileId as any).userId?.toString();
    const mentorUserIdStr = (mentorship.mentorProfileId as any).userId?.toString();

    if (
      studentUserIdStr !== submitterId &&
      mentorUserIdStr !== submitterId
    ) {
      throw new ForbiddenException('Access denied. You do not participate in this mentorship.');
    }

    // Prevent duplicate feedback
    const existing = await this.feedbackModel.findOne({
      mentorshipId: new Types.ObjectId(mentorshipId),
      submitterId: new Types.ObjectId(submitterId),
    });

    if (existing) {
      throw new BadRequestException('Feedback has already been submitted for this mentorship.');
    }

    const feedback = new this.feedbackModel({
      mentorshipId: new Types.ObjectId(mentorshipId),
      submitterId: new Types.ObjectId(submitterId),
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

  async getFeedback(mentorshipId: string, userId: string) {
    const mentorship = await this.mentorshipModel
      .findById(mentorshipId)
      .populate('studentProfileId')
      .populate('mentorProfileId')
      .lean();

    if (!mentorship) {
      throw new NotFoundException('Mentorship not found');
    }

    const studentUserIdStr = (mentorship.studentProfileId as any).userId?.toString();
    const mentorUserIdStr = (mentorship.mentorProfileId as any).userId?.toString();

    if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const list = await this.feedbackModel
      .find({ mentorshipId: new Types.ObjectId(mentorshipId) })
      .populate('submitterId')
      .lean();

    return list.map((f: any) => ({
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
}
