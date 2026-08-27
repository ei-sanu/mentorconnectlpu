import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudentProfile, StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { MentorProfile, MentorProfileDocument, VerificationStatus, MentorStatus } from '../database/schemas/mentor-profile.schema';
import { MatchingService } from '../matching/matching.service';
import Redis from 'ioredis';

@Injectable()
export class RecommendationsService {
  private redis: Redis | null = null;

  constructor(
    @InjectModel(StudentProfile.name)
    private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(MentorProfile.name)
    private readonly mentorProfileModel: Model<MentorProfileDocument>,
    private readonly matchingService: MatchingService,
  ) {
    try {
      const redisOptions: any = {};
      if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://')) {
        redisOptions.tls = { rejectUnauthorized: false };
      }
      this.redis = process.env.REDIS_URL
        ? new Redis(process.env.REDIS_URL, { lazyConnect: true, ...redisOptions })
        : new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            lazyConnect: true,
          });
      this.redis.connect().catch((err) => {
        console.warn(`Redis connection failed for recommendations caching: ${err.message}`);
        this.redis = null;
      });
    } catch (err) {
      console.warn(`Failed to initialize Redis in RecommendationsService: ${err.message}`);
    }
  }

  async getRecommendedMentors(userId: string) {
    const studentProfile = await this.studentProfileModel.findOne({ userId: new Types.ObjectId(userId) }).lean();

    if (!studentProfile) {
      // Return default verified active mentors if student profile is not complete
      const mentors = await this.mentorProfileModel
        .find({
          verificationStatus: VerificationStatus.VERIFIED,
          status: MentorStatus.ACTIVE,
          acceptingMentees: true,
        })
        .populate('userId')
        .limit(5)
        .lean();

      return mentors.map((m: any) => {
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
          capacity: { max: m.maxCapacity, current: m.currentMenteesCount },
          acceptingMentees: m.acceptingMentees,
          matchScore: 80,
          matchReasons: ['Verified Mentor', 'Alumni of LPU'],
        };
      });
    }

    const studentProfileIdStr = studentProfile._id.toString();
    const cacheKey = `recommendations:student:${studentProfileIdStr}`;

    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        console.warn(`Failed to fetch cached recommendations: ${err.message}`);
      }
    }

    const recommendations = await this.matchingService.calculateRecommendation(studentProfileIdStr);

    if (this.redis) {
      try {
        await this.redis.setex(cacheKey, 3600, JSON.stringify(recommendations));
      } catch (err) {
        console.warn(`Failed to cache recommendations in Redis: ${err.message}`);
      }
    }

    return recommendations;
  }

  async getMentorMatchDetails(userId: string, mentorId: string) {
    const studentProfile = await this.studentProfileModel.findOne({ userId: new Types.ObjectId(userId) }).lean();

    if (!studentProfile) {
      throw new NotFoundException('Please complete your student career profile first');
    }

    const matches = await this.matchingService.calculateRecommendation(studentProfile._id.toString(), mentorId);
    if (matches.length === 0) {
      throw new NotFoundException('Mentor is not eligible or not found');
    }

    return matches[0];
  }

  async invalidateCacheForStudent(studentProfileId: string) {
    if (this.redis) {
      try {
        await this.redis.del(`recommendations:student:${studentProfileId}`);
      } catch (err) {
        console.warn(`Failed to invalidate cache for student ${studentProfileId}: ${err.message}`);
      }
    }
  }

  async invalidateAllCaches(): Promise<void> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys('recommendations:student:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (err) {
        console.warn(`Failed to invalidate all caches: ${err.message}`);
      }
    }
  }
}
