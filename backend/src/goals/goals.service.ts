import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Goal, GoalDocument, GoalStatus } from '../database/schemas/goal.schema';
import { Mentorship, MentorshipDocument } from '../database/schemas/mentorship.schema';
import { CreateGoalDto } from './dto/create-goal.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class GoalsService {
  constructor(
    @InjectModel(Goal.name)
    private readonly goalModel: Model<GoalDocument>,
    @InjectModel(Mentorship.name)
    private readonly mentorshipModel: Model<MentorshipDocument>,
    private readonly notifications: NotificationsService,
  ) {}

  async findGoalsForMentorship(mentorshipId: string, userId: string): Promise<any[]> {
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
      throw new ForbiddenException('Access denied. You do not participate in this mentorship.');
    }

    const list = await this.goalModel
      .find({ mentorshipId: new Types.ObjectId(mentorshipId) })
      .sort({ targetDate: 1 })
      .lean();

    return list.map((g) => ({
      ...g,
      id: g._id.toString(),
    }));
  }

  async createGoal(mentorshipId: string, userId: string, dto: CreateGoalDto): Promise<any> {
    const mentorship = await this.mentorshipModel
      .findById(mentorshipId)
      .populate({ path: 'studentProfileId', populate: { path: 'userId' } })
      .populate({ path: 'mentorProfileId', populate: { path: 'userId' } })
      .lean();

    if (!mentorship) {
      throw new NotFoundException('Mentorship not found');
    }

    const studentUserIdStr = (mentorship.studentProfileId as any).userId?._id?.toString();
    const mentorUserIdStr = (mentorship.mentorProfileId as any).userId?._id?.toString();

    if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
      throw new ForbiddenException('Access denied. You do not participate in this mentorship.');
    }

    const goal = new this.goalModel({
      mentorshipId: new Types.ObjectId(mentorshipId),
      title: dto.title,
      description: dto.description,
      targetDate: new Date(dto.targetDate),
      status: GoalStatus.NOT_STARTED,
      progress: 0,
    });
    await goal.save();

    const goalIdStr = goal._id.toString();

    // Notify other party
    const receiverId = userId === studentUserIdStr ? mentorUserIdStr : studentUserIdStr;
    const creatorName = userId === studentUserIdStr
      ? `${(mentorship.studentProfileId as any).userId.firstName} ${(mentorship.studentProfileId as any).userId.lastName}`
      : `${(mentorship.mentorProfileId as any).userId.firstName} ${(mentorship.mentorProfileId as any).userId.lastName}`;

    await this.notifications.create(
      receiverId,
      'GOAL_CREATED',
      'New Mentorship Goal Added',
      `${creatorName} added a new goal: "${dto.title}"`,
      { goalId: goalIdStr, mentorshipId },
    );

    return {
      ...goal.toObject(),
      id: goalIdStr,
    };
  }

  async updateGoal(id: string, userId: string, dto: any): Promise<any> {
    const goal = await this.goalModel
      .findById(id)
      .populate({
        path: 'mentorshipId',
        populate: [
          { path: 'studentProfileId' },
          { path: 'mentorProfileId' },
        ],
      })
      .lean();

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const studentUserIdStr = (goal.mentorshipId as any).studentProfileId?.userId?.toString();
    const mentorUserIdStr = (goal.mentorshipId as any).mentorProfileId?.userId?.toString();

    if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const data: any = { ...dto };
    if (dto.status === GoalStatus.COMPLETED) {
      data.completedAt = new Date();
      data.progress = 100;
    } else if (dto.status && dto.status !== GoalStatus.COMPLETED) {
      data.completedAt = null;
    }

    if (dto.targetDate) {
      data.targetDate = new Date(dto.targetDate);
    }

    const updated = await this.goalModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean();

    return {
      ...updated,
      id: updated._id.toString(),
    };
  }

  async deleteGoal(id: string, userId: string): Promise<any> {
    const goal = await this.goalModel
      .findById(id)
      .populate({
        path: 'mentorshipId',
        populate: [
          { path: 'studentProfileId' },
          { path: 'mentorProfileId' },
        ],
      })
      .lean();

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const studentUserIdStr = (goal.mentorshipId as any).studentProfileId?.userId?.toString();
    const mentorUserIdStr = (goal.mentorshipId as any).mentorProfileId?.userId?.toString();

    if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.goalModel.findByIdAndDelete(id);

    return { success: true, message: 'Goal deleted successfully.' };
  }
}
