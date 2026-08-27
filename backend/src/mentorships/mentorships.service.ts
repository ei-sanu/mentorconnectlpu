import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Mentorship, MentorshipDocument, MentorshipStatus } from '../database/schemas/mentorship.schema';
import { MentorProfile, MentorProfileDocument } from '../database/schemas/mentor-profile.schema';
import { StudentProfile, StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { Role } from '../database/schemas/user.schema';
import { runTransactionSafely } from '../database/transaction.helper';

@Injectable()
export class MentorshipsService {
  constructor(
    @InjectModel(Mentorship.name)
    private readonly mentorshipModel: Model<MentorshipDocument>,
    @InjectModel(MentorProfile.name)
    private readonly mentorProfileModel: Model<MentorProfileDocument>,
    @InjectModel(StudentProfile.name)
    private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async findAll(userId: string, role: string) {
    if (role === Role.STUDENT) {
      const studentProfile = await this.studentProfileModel.findOne({ userId }).lean();
      if (!studentProfile) return [];

      const list = await this.mentorshipModel
        .find({ studentProfileId: studentProfile._id })
        .populate({
          path: 'mentorProfileId',
          populate: { path: 'userId' },
        })
        .lean();

      return list.map((m: any) => ({
        ...m,
        id: m._id.toString(),
        mentor: m.mentorProfileId
          ? {
              ...m.mentorProfileId,
              id: m.mentorProfileId._id?.toString(),
              user: m.mentorProfileId.userId
                ? {
                    ...m.mentorProfileId.userId,
                    id: m.mentorProfileId.userId._id?.toString(),
                  }
                : null,
            }
          : null,
      }));
    } else if (role === Role.MENTOR) {
      const mentorProfile = await this.mentorProfileModel.findOne({ userId }).lean();
      if (!mentorProfile) return [];

      const list = await this.mentorshipModel
        .find({ mentorProfileId: mentorProfile._id })
        .populate({
          path: 'studentProfileId',
          populate: { path: 'userId' },
        })
        .lean();

      return list.map((m: any) => ({
        ...m,
        id: m._id.toString(),
        student: m.studentProfileId
          ? {
              ...m.studentProfileId,
              id: m.studentProfileId._id?.toString(),
              user: m.studentProfileId.userId
                ? {
                    ...m.studentProfileId.userId,
                    id: m.studentProfileId.userId._id?.toString(),
                  }
                : null,
            }
          : null,
      }));
    }

    // Admin/Officer
    const list = await this.mentorshipModel
      .find()
      .populate({ path: 'studentProfileId', populate: { path: 'userId' } })
      .populate({ path: 'mentorProfileId', populate: { path: 'userId' } })
      .lean();

    return list.map((m: any) => ({
      ...m,
      id: m._id.toString(),
      student: m.studentProfileId ? { ...m.studentProfileId, id: m.studentProfileId._id?.toString() } : null,
      mentor: m.mentorProfileId ? { ...m.mentorProfileId, id: m.mentorProfileId._id?.toString() } : null,
    }));
  }

  async findOne(id: string, userId: string, isAdminOrOfficer = false): Promise<any> {
    const mentorship = await this.mentorshipModel
      .findById(id)
      .populate({ path: 'studentProfileId', populate: { path: 'userId' } })
      .populate({ path: 'mentorProfileId', populate: { path: 'userId' } })
      .lean();

    if (!mentorship) {
      throw new NotFoundException(`Mentorship with ID ${id} not found`);
    }

    const studentUserIdStr = (mentorship.studentProfileId as any).userId?._id?.toString() || (mentorship.studentProfileId as any).userId?.toString();
    const mentorUserIdStr = (mentorship.mentorProfileId as any).userId?._id?.toString() || (mentorship.mentorProfileId as any).userId?.toString();

    // TEST 6: Ownership verify
    if (
      !isAdminOrOfficer &&
      studentUserIdStr !== userId &&
      mentorUserIdStr !== userId
    ) {
      throw new ForbiddenException('Access Denied. You do not participate in this mentorship.');
    }

    return {
      ...mentorship,
      id: mentorship._id.toString(),
      studentProfile: mentorship.studentProfileId
        ? {
            ...(mentorship.studentProfileId as any),
            id: (mentorship.studentProfileId as any)._id?.toString(),
            user: (mentorship.studentProfileId as any).userId
              ? {
                  ...(mentorship.studentProfileId as any).userId,
                  id: studentUserIdStr,
                }
              : null,
          }
        : null,
      mentorProfile: mentorship.mentorProfileId
        ? {
            ...(mentorship.mentorProfileId as any),
            id: (mentorship.mentorProfileId as any)._id?.toString(),
            user: (mentorship.mentorProfileId as any).userId
              ? {
                  ...(mentorship.mentorProfileId as any).userId,
                  id: mentorUserIdStr,
                }
              : null,
          }
        : null,
    };
  }

  async updateStatus(id: string, userId: string, status: MentorshipStatus): Promise<any> {
    const mentorship = await this.findOne(id, userId);

    const validTransitions: Record<string, string[]> = {
      ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
      PAUSED: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowed = validTransitions[mentorship.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition mentorship from state ${mentorship.status} to ${status}`,
      );
    }

    const updated = await runTransactionSafely(this.connection, async (session) => {
      const u = await this.mentorshipModel.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, session },
      ).lean();

      if (status === MentorshipStatus.COMPLETED || status === MentorshipStatus.CANCELLED) {
        const mentorProfileId = new Types.ObjectId(mentorship.mentorProfile.id);
        const mentorProfile = await this.mentorProfileModel.findById(mentorProfileId).session(session).lean();

        if (mentorProfile && mentorProfile.currentMenteesCount > 0) {
          await this.mentorProfileModel.findByIdAndUpdate(
            mentorProfileId,
            { $inc: { currentMenteesCount: -1 } },
            { session },
          );
        }
      }

      return u;
    });

    return {
      ...updated,
      id: updated._id.toString(),
    };
  }
}
