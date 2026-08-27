import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActionItem, ActionItemDocument, ActionItemStatus } from '../database/schemas/action-item.schema';
import { Mentorship, MentorshipDocument } from '../database/schemas/mentorship.schema';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ActionItemsService {
  constructor(
    @InjectModel(ActionItem.name)
    private readonly actionItemModel: Model<ActionItemDocument>,
    @InjectModel(Mentorship.name)
    private readonly mentorshipModel: Model<MentorshipDocument>,
    private readonly notifications: NotificationsService,
  ) {}

  async findActionItemsForMentorship(mentorshipId: string, userId: string): Promise<any[]> {
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

    const list = await this.actionItemModel
      .find({ mentorshipId: new Types.ObjectId(mentorshipId) })
      .sort({ dueDate: 1 })
      .lean();

    return list.map((a) => ({
      ...a,
      id: a._id.toString(),
    }));
  }

  async createActionItem(mentorshipId: string, userId: string, dto: CreateActionItemDto): Promise<any> {
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

    const item = new this.actionItemModel({
      mentorshipId: new Types.ObjectId(mentorshipId),
      goalId: dto.goalId ? new Types.ObjectId(dto.goalId) : undefined,
      task: dto.task,
      assignedToId: new Types.ObjectId(dto.assignedToId),
      createdById: new Types.ObjectId(userId),
      dueDate: new Date(dto.dueDate),
      status: ActionItemStatus.PENDING,
    });
    await item.save();

    const itemIdStr = item._id.toString();

    // Notify assignee
    const assignerName = userId === studentUserIdStr
      ? `${(mentorship.studentProfileId as any).userId.firstName} ${(mentorship.studentProfileId as any).userId.lastName}`
      : `${(mentorship.mentorProfileId as any).userId.firstName} ${(mentorship.mentorProfileId as any).userId.lastName}`;

    await this.notifications.create(
      dto.assignedToId,
      'ACTION_ITEM_ASSIGNED',
      'New Action Item Assigned',
      `${assignerName} assigned a task to you: "${dto.task}"`,
      { actionItemId: itemIdStr, mentorshipId },
    );

    return {
      ...item.toObject(),
      id: itemIdStr,
    };
  }

  async updateActionItem(id: string, userId: string, dto: any): Promise<any> {
    const item = await this.actionItemModel
      .findById(id)
      .populate({
        path: 'mentorshipId',
        populate: [
          { path: 'studentProfileId' },
          { path: 'mentorProfileId' },
        ],
      })
      .lean();

    if (!item) {
      throw new NotFoundException('Action item not found');
    }

    const studentUserIdStr = (item.mentorshipId as any).studentProfileId?.userId?.toString();
    const mentorUserIdStr = (item.mentorshipId as any).mentorProfileId?.userId?.toString();

    if (studentUserIdStr !== userId && mentorUserIdStr !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const data: any = { ...dto };
    if (dto.status === ActionItemStatus.COMPLETED) {
      data.completedAt = new Date();
    } else if (dto.status && dto.status !== ActionItemStatus.COMPLETED) {
      data.completedAt = null;
    }

    if (dto.dueDate) {
      data.dueDate = new Date(dto.dueDate);
    }

    const updated = await this.actionItemModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean();

    return {
      ...updated,
      id: updated._id.toString(),
    };
  }
}
