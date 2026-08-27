import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../database/schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(userId: string, type: string, title: string, message: string, metadata?: any): Promise<any> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      type,
      title,
      message,
      read: false,
      metadata,
    });
    await notification.save();

    return {
      ...notification.toObject(),
      id: notification._id.toString(),
    };
  }

  async findAll(userId: string): Promise<any[]> {
    const list = await this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    return list.map((n) => ({
      ...n,
      id: n._id.toString(),
    }));
  }

  async markAsRead(id: string, userId: string): Promise<any> {
    const updated = await this.notificationModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
        { $set: { read: true } },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException(`Notification not found or access denied.`);
    }

    return {
      ...updated,
      id: updated._id.toString(),
    };
  }

  async markAllAsRead(userId: string): Promise<any> {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { $set: { read: true } },
    );
    return { success: true };
  }
}
