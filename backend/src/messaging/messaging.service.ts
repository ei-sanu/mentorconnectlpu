import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema';
import { Message, MessageDocument } from '../database/schemas/message.schema';
import { User, UserDocument } from '../database/schemas/user.schema';

@Injectable()
export class MessagingService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getConversations(userId: string) {
    const userIdObj = new Types.ObjectId(userId);
    const conversations = await this.conversationModel
      .find({ participants: userIdObj })
      .populate('participants')
      .lean();

    const mapped = [];
    for (const c of conversations) {
      const otherParticipant: any = c.participants.find(
        (p: any) => p._id.toString() !== userId,
      );

      const lastMessage = await this.messageModel
        .findOne({ conversationId: c._id })
        .sort({ createdAt: -1 })
        .lean();

      mapped.push({
        id: c._id.toString(),
        mentorshipId: c.mentorshipId.toString(),
        updatedAt: (c as any).updatedAt,
        otherUser: otherParticipant
          ? {
              id: otherParticipant._id.toString(),
              firstName: otherParticipant.firstName,
              lastName: otherParticipant.lastName,
              avatar: otherParticipant.avatar,
              role: otherParticipant.role,
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage._id.toString(),
              content: lastMessage.content,
              senderId: lastMessage.senderId.toString(),
              createdAt: (lastMessage as any).createdAt,
            }
          : null,
      });
    }

    return mapped;
  }

  async getMessages(conversationId: string, userId: string, limit = 20, before?: string) {
    const conversationIdObj = new Types.ObjectId(conversationId);
    const userIdObj = new Types.ObjectId(userId);

    // Verify participant
    const conversation = await this.conversationModel.findOne({
      _id: conversationIdObj,
      participants: userIdObj,
    });

    if (!conversation) {
      throw new ForbiddenException('Access denied. You do not participate in this conversation.');
    }

    const query: any = { conversationId: conversationIdObj };
    if (before) {
      const beforeMessage = await this.messageModel.findById(before).lean();
      if (beforeMessage) {
        query.createdAt = { $lt: (beforeMessage as any).createdAt };
      }
    }

    const messages = await this.messageModel
      .find(query)
      .populate('senderId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return messages.reverse().map((m: any) => ({
      id: m._id.toString(),
      content: m.content,
      senderId: m.senderId._id?.toString() || m.senderId?.toString(),
      senderName: m.senderId ? `${m.senderId.firstName} ${m.senderId.lastName}` : 'System',
      createdAt: m.createdAt,
    }));
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conversationIdObj = new Types.ObjectId(conversationId);
    const senderIdObj = new Types.ObjectId(senderId);

    const conversation = await this.conversationModel.findOne({
      _id: conversationIdObj,
      participants: senderIdObj,
    });

    if (!conversation) {
      throw new ForbiddenException('Access denied. You are not a participant in this conversation.');
    }

    const message = new this.messageModel({
      conversationId: conversationIdObj,
      senderId: senderIdObj,
      content,
    });
    await message.save();

    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { updatedAt: new Date() },
    });

    const populated = await this.messageModel.findById(message._id).populate('senderId').lean();

    return {
      id: message._id.toString(),
      conversationId,
      content: message.content,
      senderId: message.senderId.toString(),
      senderName: `${(populated.senderId as any).firstName} ${(populated.senderId as any).lastName}`,
      createdAt: (populated as any).createdAt,
    };
  }
}
