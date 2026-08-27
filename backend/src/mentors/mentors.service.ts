import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MentorProfile, MentorProfileDocument, VerificationStatus, MentorStatus } from '../database/schemas/mentor-profile.schema';
import { Availability, AvailabilityDocument } from '../database/schemas/availability.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { MentorQueryDto } from './dto/mentor-query.dto';
import { UpdateMentorProfileDto } from './dto/update-mentor-profile.dto';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class MentorsService {
  constructor(
    @InjectModel(MentorProfile.name)
    private readonly mentorProfileModel: Model<MentorProfileDocument>,
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(forwardRef(() => JobsService))
    private readonly jobsService: JobsService,
  ) {}

  async findMany(query: MentorQueryDto, isAdminOrOfficer = false): Promise<any> {
    const {
      search,
      skills,
      industry,
      role,
      experienceMin,
      experienceMax,
      availability,
      acceptingMentees,
      page = 1,
      limit = 10,
      sort,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      profileVisibility: true,
    };

    if (!isAdminOrOfficer) {
      where.verificationStatus = VerificationStatus.VERIFIED;
      where.status = MentorStatus.ACTIVE;
      where.acceptingMentees = true;
      where.$expr = { $lt: ['$currentMenteesCount', '$maxCapacity'] };
    } else {
      if (acceptingMentees !== undefined) {
        where.acceptingMentees = acceptingMentees;
      }
    }

    if (industry) {
      where.industry = { $regex: `^${industry}$`, $options: 'i' };
    }

    if (role) {
      where.currentDesignation = { $regex: role, $options: 'i' };
    }

    if (experienceMin !== undefined || experienceMax !== undefined) {
      where.yearsOfExperience = {};
      if (experienceMin !== undefined) where.yearsOfExperience.$gte = experienceMin;
      if (experienceMax !== undefined) where.yearsOfExperience.$lte = experienceMax;
    }

    if (skills) {
      const skillsList = skills.split(',').map((s) => s.trim());
      where.expertise = { $in: skillsList };
    }

    if (availability) {
      const dayMapping: { [key: string]: number } = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };
      const targetDay = dayMapping[availability.toLowerCase()];
      if (targetDay !== undefined) {
        const availMentors = await this.availabilityModel
          .find({ dayOfWeek: targetDay })
          .distinct('mentorProfileId');

        where._id = { $in: availMentors };
      }
    }

    if (search) {
      const matchingUsers = await this.userModel
        .find({
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
          ],
        })
        .distinct('_id');

      const searchConditions: any[] = [
        { currentCompany: { $regex: search, $options: 'i' } },
        { currentDesignation: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { expertise: { $in: [search] } },
      ];

      if (matchingUsers.length > 0) {
        searchConditions.push({ userId: { $in: matchingUsers } });
      }

      if (where.$or) {
        where.$and = [{ $or: where.$or }, { $or: searchConditions }];
        delete where.$or;
      } else {
        where.$or = searchConditions;
      }
    }

    let sortObj: any = { createdAt: -1 };
    if (sort) {
      const [field, direction] = sort.split('_');
      const dirValue = direction === 'asc' ? 1 : -1;
      if (field === 'experienceYears') {
        sortObj = { yearsOfExperience: dirValue };
      }
    }

    const total = await this.mentorProfileModel.countDocuments(where);
    const mentors = await this.mentorProfileModel
      .find(where)
      .populate('userId')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    const mapped = mentors.map((m) => this.mapToPublicProfile(m));

    return {
      success: true,
      data: mapped,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<any> {
    const mentor = await this.mentorProfileModel
      .findById(id)
      .populate('userId')
      .lean();

    if (!mentor) {
      throw new NotFoundException(`Mentor with ID ${id} not found`);
    }

    return this.mapToPublicProfile(mentor);
  }

  async getAvailability(id: string): Promise<any> {
    return this.availabilityModel.find({ mentorProfileId: new Types.ObjectId(id) }).lean();
  }

  async getProfileByUserId(userId: string): Promise<any> {
    const profile = await this.mentorProfileModel
      .findOne({ userId })
      .populate('userId')
      .lean();

    if (!profile) {
      throw new NotFoundException(`Mentor profile not found for user ${userId}`);
    }

    const availabilities = await this.availabilityModel
      .find({ mentorProfileId: profile._id })
      .lean();

    return {
      ...profile,
      id: profile._id.toString(),
      availabilities: availabilities.map((a) => ({ ...a, id: a._id.toString() })),
    };
  }

  async updateProfile(userId: string, dto: UpdateMentorProfileDto): Promise<any> {
    const existing = await this.mentorProfileModel.findOne({ userId }).lean();

    let profile;
    if (existing) {
      profile = await this.mentorProfileModel
        .findOneAndUpdate({ userId }, { $set: dto }, { new: true })
        .lean();
    } else {
      const created = new this.mentorProfileModel({
        userId,
        graduationYear: dto.graduationYear || new Date().getFullYear() - 5,
        programme: dto.programme || '',
        currentCompany: dto.currentCompany || '',
        currentDesignation: dto.currentDesignation || '',
        yearsOfExperience: dto.yearsOfExperience || 0,
        industry: dto.industry || '',
        expertise: dto.expertise || [],
        mentoringAreas: dto.mentoringAreas || [],
        bio: dto.bio || '',
        careerSummary: dto.careerSummary || '',
        maxCapacity: dto.maxCapacity || 3,
      });
      const saved = await created.save();
      profile = saved.toObject();
    }

    const profileIdStr = profile._id.toString();
    await this.jobsService.queueMentorEmbedding(profileIdStr);

    return {
      ...profile,
      id: profileIdStr,
    };
  }

  mapToPublicProfile(m: any) {
    const user = m.userId || {};
    return {
      id: m._id.toString(),
      userId: user._id?.toString() || m.userId?.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      imageUrl: user.avatar || `https://picsum.photos/seed/${m._id}/200/200`,
      title: m.currentDesignation,
      company: m.currentCompany,
      experienceYears: m.yearsOfExperience,
      expertise: m.expertise,
      industry: m.industry,
      graduationYear: m.graduationYear.toString(),
      programme: m.programme,
      capacity: {
        max: m.maxCapacity,
        current: m.currentMenteesCount,
      },
      acceptingMentees: m.acceptingMentees && m.currentMenteesCount < m.maxCapacity,
    };
  }
}
