import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { AlumniVerification, AlumniVerificationDocument } from '../database/schemas/alumni-verification.schema';
import { MentorProfile, MentorProfileDocument, VerificationStatus, MentorStatus } from '../database/schemas/mentor-profile.schema';
import { StudentProfile, StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { User, UserDocument, Role } from '../database/schemas/user.schema';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { runTransactionSafely } from '../database/transaction.helper';
import Redis from 'ioredis';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { Msg91Service } from '../integrations/msg91/msg91.service';
import { globalEventBus } from '../common/event-bus';

@Injectable()
export class VerificationService {
  private redis: Redis | null = null;
  private readonly cooldownSeconds: number;
  private readonly maxSendsPerHour: number;
  private readonly maxAttempts: number;

  constructor(
    @InjectModel(AlumniVerification.name)
    private readonly verificationModel: Model<AlumniVerificationDocument>,
    @InjectModel(MentorProfile.name)
    private readonly mentorProfileModel: Model<MentorProfileDocument>,
    @InjectModel(StudentProfile.name)
    private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    @InjectConnection() private readonly connection: Connection,
    private readonly msg91Service: Msg91Service,
  ) {
    this.cooldownSeconds = parseInt(process.env.MSG91_OTP_RESEND_COOLDOWN_SECONDS || '30', 10);
    this.maxSendsPerHour = parseInt(process.env.MSG91_OTP_MAX_SENDS_PER_HOUR || '5', 10);
    this.maxAttempts = parseInt(process.env.MSG91_OTP_MAX_ATTEMPTS || '5', 10);

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
            ...redisOptions
          });
    } catch (err) {
      console.error('Failed to initialize Redis inside VerificationService:', err);
    }
  }

  async submit(userId: string, dto: SubmitVerificationDto): Promise<any> {
    // Check if user has mentor profile, if not create one
    let mentorProfile = await this.mentorProfileModel.findOne({ userId }).lean();

    if (!mentorProfile) {
      const created = new this.mentorProfileModel({
        userId: new Types.ObjectId(userId),
        graduationYear: dto.graduationYear,
        programme: dto.degree,
        currentCompany: '',
        currentDesignation: '',
        yearsOfExperience: 0,
        industry: '',
        expertise: [],
        mentoringAreas: [],
        bio: '',
        careerSummary: '',
      });
      const saved = await created.save();
      mentorProfile = saved.toObject();
    }

    // Check if there is already a pending verification
    const existingPending = await this.verificationModel.findOne({
      mentorProfileId: mentorProfile._id,
      status: VerificationStatus.PENDING,
    });

    if (existingPending) {
      throw new BadRequestException('You already have a pending verification request');
    }

    const verification = new this.verificationModel({
      mentorProfileId: mentorProfile._id,
      status: VerificationStatus.PENDING,
      submittedData: dto,
    });
    await verification.save();

    await this.mentorProfileModel.findByIdAndUpdate(mentorProfile._id, {
      $set: { verificationStatus: VerificationStatus.PENDING },
    });

    await this.audit.log(
      userId,
      'SUBMIT_VERIFICATION',
      'AlumniVerification',
      verification._id.toString(),
      { rollNumber: dto.rollNumber },
    );

    globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_SUBMITTED' });

    return {
      ...verification.toObject(),
      id: verification._id.toString(),
    };
  }

  async findAll(): Promise<any[]> {
    // 1. Fetch mentor verifications
    const list = await this.verificationModel
      .find()
      .populate({
        path: 'mentorProfileId',
        populate: { path: 'userId' },
      })
      .sort({ createdAt: -1 })
      .lean();

    const mentorRequests = list.map((v: any) => ({
      ...v,
      id: v._id.toString(),
      role: 'MENTOR',
      mentorProfile: v.mentorProfileId
        ? {
            ...v.mentorProfileId,
            id: v.mentorProfileId._id?.toString(),
            user: v.mentorProfileId.userId
              ? {
                  ...v.mentorProfileId.userId,
                  id: v.mentorProfileId.userId._id?.toString(),
                }
              : null,
          }
        : null,
      user: v.mentorProfileId?.userId
        ? {
            firstName: v.mentorProfileId.userId.firstName,
            lastName: v.mentorProfileId.userId.lastName,
            email: v.mentorProfileId.userId.email,
          }
        : null,
      graduationYear: v.submittedData?.graduationYear || v.mentorProfileId?.graduationYear,
      programme: v.submittedData?.programme || v.mentorProfileId?.programme,
      documentUrl: v.submittedData?.proofDocumentUrl || '',
      submittedAt: (v as any).createdAt || new Date(),
      phone: v.mentorProfileId?.userId?.phone || '',
      registrationNumber: v.submittedData?.registrationNumber || v.mentorProfileId?.userId?.lpuRegistrationNumber || '',
      lpuEmail: v.submittedData?.lpuEmail || v.mentorProfileId?.userId?.lpuEmail || '',
      school: v.submittedData?.school || v.mentorProfileId?.school || '',
      company: v.mentorProfileId?.currentCompany || '',
      designation: v.mentorProfileId?.currentDesignation || '',
    }));

    // 2. Fetch student verifications (users with role STUDENT and onboardingStatus UNDER_REVIEW)
    const pendingStudents = await this.userModel.find({
      role: Role.STUDENT,
      onboardingStatus: 'UNDER_REVIEW',
    }).lean();

    const studentUserIds = pendingStudents.map(s => s._id);
    const studentProfiles = await this.studentProfileModel.find({
      userId: { $in: studentUserIds },
    }).lean();

    const studentProfileMap = new Map(studentProfiles.map(p => [p.userId.toString(), p]));

    const studentRequests = pendingStudents.map((student: any) => {
      const profile: any = studentProfileMap.get(student._id.toString());
      return {
        id: student._id.toString(),
        userId: student._id.toString(),
        status: VerificationStatus.PENDING,
        role: 'STUDENT',
        submittedAt: (student as any).updatedAt || (student as any).createdAt || new Date(),
        user: {
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
        },
        documentUrl: (student as any).proofDocumentUrl || '',
        graduationYear: profile?.graduationYear || 2026,
        programme: profile?.programme || 'B.Tech STUDENT',
        phone: student.phone || '',
        registrationNumber: student.lpuRegistrationNumber || '',
        lpuEmail: student.lpuEmail || '',
        school: profile?.school || '',
        company: '',
        designation: '',
      };
    });

    // 3. Combine and sort by submittedAt descending
    return [...mentorRequests, ...studentRequests].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  async findOne(id: string): Promise<any> {
    // Check if it is a student user verification first
    const studentUser = await this.userModel.findOne({ _id: id, role: Role.STUDENT }).lean();
    if (studentUser) {
      const profile = await this.studentProfileModel.findOne({ userId: id }).lean();
      return {
        id,
        userId: id,
        status: studentUser.onboardingStatus === 'UNDER_REVIEW' ? VerificationStatus.PENDING : studentUser.onboardingStatus,
        role: 'STUDENT',
        submittedAt: (studentUser as any).updatedAt || (studentUser as any).createdAt || new Date(),
        user: {
          firstName: studentUser.firstName,
          lastName: studentUser.lastName,
          email: studentUser.email,
        },
        documentUrl: (studentUser as any).proofDocumentUrl || '',
        graduationYear: profile?.graduationYear || 2026,
        programme: profile?.programme || 'B.Tech STUDENT',
        phone: studentUser.phone || '',
        registrationNumber: studentUser.lpuRegistrationNumber || '',
        lpuEmail: studentUser.lpuEmail || '',
        school: profile?.school || '',
        company: '',
        designation: '',
      };
    }

    const verification = await this.verificationModel
      .findById(id)
      .populate({
        path: 'mentorProfileId',
        populate: { path: 'userId' },
      })
      .lean();

    if (!verification) {
      throw new NotFoundException(`Verification request with ID ${id} not found`);
    }

    return {
      ...verification,
      id: verification._id.toString(),
      role: 'MENTOR',
      mentorProfile: verification.mentorProfileId
        ? {
            ...verification.mentorProfileId,
            id: (verification.mentorProfileId as any)._id?.toString(),
            user: (verification.mentorProfileId as any).userId
              ? {
                  ...(verification.mentorProfileId as any).userId,
                  id: (verification.mentorProfileId as any).userId._id?.toString(),
                }
              : null,
          }
        : null,
      user: (verification.mentorProfileId as any)?.userId
        ? {
            firstName: (verification.mentorProfileId as any).userId.firstName,
            lastName: (verification.mentorProfileId as any).userId.lastName,
            email: (verification.mentorProfileId as any).userId.email,
          }
        : null,
      graduationYear: verification.submittedData?.graduationYear || (verification.mentorProfileId as any)?.graduationYear,
      programme: verification.submittedData?.programme || (verification.mentorProfileId as any)?.programme,
      documentUrl: verification.submittedData?.proofDocumentUrl || '',
      submittedAt: (verification as any).createdAt || new Date(),
      phone: (verification.mentorProfileId as any)?.userId?.phone || '',
      registrationNumber: verification.submittedData?.registrationNumber || (verification.mentorProfileId as any)?.userId?.lpuRegistrationNumber || '',
      lpuEmail: verification.submittedData?.lpuEmail || (verification.mentorProfileId as any)?.userId?.lpuEmail || '',
      school: verification.submittedData?.school || (verification.mentorProfileId as any)?.school || '',
      company: (verification.mentorProfileId as any)?.currentCompany || '',
      designation: (verification.mentorProfileId as any)?.currentDesignation || '',
    };
  }

  async approve(id: string, reviewerId: string): Promise<any> {
    const studentUser = await this.userModel.findOne({ _id: id, role: Role.STUDENT });
    if (studentUser) {
      await this.userModel.updateOne(
        { _id: id },
        { $set: { onboardingStatus: 'APPROVED', verificationStatus: 'VERIFIED' } }
      );
      
      await this.studentProfileModel.updateOne(
        { userId: id },
        { $set: { onboardingStatus: true } }
      );

      await this.notifications.create(
        id,
        'VERIFICATION_APPROVED',
        'Account Onboarding Approved!',
        'Your student onboarding details have been approved. Welcome to LPU MentorConnect!',
        { onboardingStatus: 'APPROVED' },
      );

      await this.audit.log(
        reviewerId,
        'APPROVE_STUDENT_ONBOARDING',
        'User',
        id,
        { studentUserId: id },
      );

      globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_APPROVED', scope: 'STUDENT' });

      return {
        id,
        status: VerificationStatus.VERIFIED,
      };
    }

    const verification = await this.verificationModel.findById(id).lean();
    if (!verification) {
      throw new NotFoundException(`Verification with ID ${id} not found`);
    }
    if (verification.status !== VerificationStatus.PENDING) {
      throw new BadRequestException('Verification is already processed');
    }

    const result = await runTransactionSafely(this.connection, async (session) => {
      const updated = await this.verificationModel.findByIdAndUpdate(
        id,
        {
          $set: {
            status: VerificationStatus.VERIFIED,
            reviewerId: new Types.ObjectId(reviewerId),
            reviewedAt: new Date(),
          },
        },
        { new: true, session },
      ).lean();

      const mentorProfile = await this.mentorProfileModel.findByIdAndUpdate(
        verification.mentorProfileId,
        {
          $set: {
            verificationStatus: VerificationStatus.VERIFIED,
            status: MentorStatus.ACTIVE,
          },
        },
        { new: true, session },
      ).lean();

      // Update user role to MENTOR, onboardingStatus to APPROVED, verificationStatus to VERIFIED
      await this.userModel.findByIdAndUpdate(
        mentorProfile.userId,
        { 
          $set: { 
            role: Role.MENTOR,
            onboardingStatus: 'APPROVED',
            verificationStatus: 'VERIFIED'
          } 
        },
        { session },
      );

      return { updated, mentorProfile };
    });

    const mentorUserIdStr = result.mentorProfile.userId.toString();

    // Notify Mentor
    await this.notifications.create(
      mentorUserIdStr,
      'VERIFICATION_APPROVED',
      'Alumni Verification Approved!',
      'Your LPU alumni status has been verified. You can now accept student mentorship requests.',
      { verificationId: id },
    );

    await this.audit.log(
      reviewerId,
      'APPROVE_VERIFICATION',
      'AlumniVerification',
      id,
      { mentorUserId: mentorUserIdStr },
    );

    globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_APPROVED', scope: 'MENTOR' });

    return {
      ...result.updated,
      id: result.updated._id.toString(),
    };
  }

  async reject(id: string, reviewerId: string, rejectionReason: string): Promise<any> {
    const studentUser = await this.userModel.findOne({ _id: id, role: Role.STUDENT });
    if (studentUser) {
      await this.userModel.updateOne(
        { _id: id },
        {
          $set: {
            onboardingStatus: 'REJECTED',
            verificationStatus: 'REJECTED',
            rejectionReason,
          }
        }
      );

      await this.notifications.create(
        id,
        'VERIFICATION_REJECTED',
        'Onboarding Verification Rejected',
        `Your onboarding verification request was rejected. Reason: ${rejectionReason}`,
        { onboardingStatus: 'REJECTED', rejectionReason },
      );

      await this.audit.log(
        reviewerId,
        'REJECT_STUDENT_ONBOARDING',
        'User',
        id,
        { studentUserId: id, reason: rejectionReason },
      );

      globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_REJECTED' });

      return {
        id,
        status: VerificationStatus.REJECTED,
      };
    }

    const verification = await this.verificationModel.findById(id).lean();
    if (!verification) {
      throw new NotFoundException(`Verification with ID ${id} not found`);
    }
    if (verification.status !== VerificationStatus.PENDING) {
      throw new BadRequestException('Verification is already processed');
    }

    const mentorProfileObj = await this.mentorProfileModel.findById(verification.mentorProfileId).lean();
    if (!mentorProfileObj) {
      throw new NotFoundException('Mentor profile not found');
    }

    const updated = await runTransactionSafely(this.connection, async (session) => {
      const u = await this.verificationModel.findByIdAndUpdate(
        id,
        {
          $set: {
            status: VerificationStatus.REJECTED,
            reviewerId: new Types.ObjectId(reviewerId),
            reviewedAt: new Date(),
            rejectionReason,
          },
        },
        { new: true, session },
      ).lean();

      await this.mentorProfileModel.findByIdAndUpdate(
        verification.mentorProfileId,
        {
          $set: {
            verificationStatus: VerificationStatus.REJECTED,
            status: MentorStatus.INACTIVE,
          },
        },
        { session },
      );

      // Update user document states
      await this.userModel.findByIdAndUpdate(
        mentorProfileObj.userId,
        {
          $set: {
            onboardingStatus: 'REJECTED',
            verificationStatus: 'REJECTED',
            rejectionReason,
          }
        },
        { session }
      );

      return u;
    });

    const mentorUserIdStr = mentorProfileObj.userId.toString();

    // Create notification
    await this.notifications.create(
      mentorUserIdStr,
      'VERIFICATION_REJECTED',
      'Alumni Verification Rejected',
      `Your verification request was rejected. Reason: ${rejectionReason}`,
      { verificationId: id, rejectionReason },
    );

    await this.audit.log(
      reviewerId,
      'REJECT_VERIFICATION',
      'AlumniVerification',
      id,
      { mentorUserId: mentorUserIdStr, reason: rejectionReason },
    );

    globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_REJECTED' });

    return {
      ...updated,
      id: updated._id.toString(),
    };
  }

  async requestChanges(id: string, reviewerId: string, explanation: string): Promise<any> {
    const studentUser = await this.userModel.findOne({ _id: id, role: Role.STUDENT });
    if (studentUser) {
      await this.userModel.updateOne(
        { _id: id },
        {
          $set: {
            onboardingStatus: 'CHANGES_REQUESTED',
            verificationStatus: 'CHANGES_REQUESTED',
            changeRequestReason: explanation,
          }
        }
      );

      await this.notifications.create(
        id,
        'VERIFICATION_CHANGES_REQUESTED',
        'Onboarding Details Update Requested',
        `Your student onboarding details require correction: ${explanation}`,
        { onboardingStatus: 'CHANGES_REQUESTED', explanation },
      );

      await this.audit.log(
        reviewerId,
        'REQUEST_CHANGES_STUDENT_ONBOARDING',
        'User',
        id,
        { studentUserId: id, reason: explanation },
      );

      globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_CHANGES_REQUESTED' });

      return {
        id,
        status: 'CHANGES_REQUESTED',
      };
    }

    const verification = await this.verificationModel.findById(id).lean();
    if (!verification) {
      throw new NotFoundException(`Verification with ID ${id} not found`);
    }
    if (verification.status !== VerificationStatus.PENDING) {
      throw new BadRequestException('Verification is already processed');
    }

    const mentorProfileObj = await this.mentorProfileModel.findById(verification.mentorProfileId).lean();
    if (!mentorProfileObj) {
      throw new NotFoundException('Mentor profile not found');
    }

    const updated = await runTransactionSafely(this.connection, async (session) => {
      const u = await this.verificationModel.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'CHANGES_REQUESTED' as any,
            reviewerId: new Types.ObjectId(reviewerId),
            reviewedAt: new Date(),
          },
        },
        { new: true, session },
      ).lean();

      // Update user document states
      await this.userModel.findByIdAndUpdate(
        mentorProfileObj.userId,
        {
          $set: {
            onboardingStatus: 'CHANGES_REQUESTED',
            verificationStatus: 'CHANGES_REQUESTED',
            changeRequestReason: explanation,
          }
        },
        { session }
      );

      return u;
    });

    const mentorUserIdStr = mentorProfileObj.userId.toString();

    // Create notification
    await this.notifications.create(
      mentorUserIdStr,
      'VERIFICATION_CHANGES_REQUESTED',
      'Alumni Verification Details Update Requested',
      `Your verification request requires corrections: ${explanation}`,
      { verificationId: id, explanation },
    );

    await this.audit.log(
      reviewerId,
      'REQUEST_CHANGES_VERIFICATION',
      'AlumniVerification',
      id,
      { mentorUserId: mentorUserIdStr, reason: explanation },
    );

    globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_CHANGES_REQUESTED' });

    return {
      ...updated,
      id: updated._id.toString(),
    };
  }

  private hashIdentifier(val: string): string {
    return require('crypto').createHash('sha256').update(val).digest('hex');
  }

  private maskPhoneNumber(phone: string): string {
    if (!phone) return '';
    if (phone.length <= 7) return phone;
    const visibleStart = phone.substring(0, 3);
    const visibleEnd = phone.substring(phone.length - 4);
    const masked = '*'.repeat(phone.length - 7);
    return `${visibleStart} ${masked}${visibleEnd}`;
  }

  private normalizePhone(countryCode: string, nationalNumber: string) {
    const cleanCC = countryCode.replace(/\+/g, '').trim();
    let cleanNum = nationalNumber.replace(/[\s\-\+\(\)]/g, '').trim();
    
    // Auto-strip country code prefix if typed inside the number input field
    if (cleanNum.startsWith(cleanCC)) {
      cleanNum = cleanNum.substring(cleanCC.length);
    }
    
    // Auto-strip leading zero for Indian mobile numbers
    if (cleanCC === '91' && cleanNum.length === 11 && cleanNum.startsWith('0')) {
      cleanNum = cleanNum.substring(1);
    }

    const fullNumber = `+${cleanCC}${cleanNum}`;
    const parsed = parsePhoneNumberFromString(fullNumber);
    if (!parsed || !parsed.isValid()) {
      throw new BadRequestException('Invalid phone number format.');
    }
    return {
      countryCode: `+${parsed.countryCallingCode}`,
      nationalNumber: parsed.nationalNumber,
      e164: parsed.format('E.164'),
    };
  }

  async sendOtp(userId: string, countryCode: string, nationalNumber: string, ipAddress?: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.phoneDetails?.verified) {
      throw new BadRequestException('Phone number is already verified.');
    }

    const normalized = this.normalizePhone(countryCode, nationalNumber);

    // Rate Limiting Check
    if (this.redis) {
      const cooldown = await this.redis.ttl(`otp:cooldown:user:${userId}`);
      if (cooldown > 0) {
        throw new BadRequestException(`Please wait ${cooldown} seconds before requesting a new OTP.`);
      }
    }

    // Call send count increment & rate limits check
    await this.incrementSendCount(userId, normalized.e164, ipAddress);

    // Call MSG91
    let sendResult: any;
    try {
      sendResult = await this.msg91Service.sendOtp(normalized.e164);
    } catch (err: any) {
      throw new InternalServerErrorException(err.message || 'We couldn\'t send a verification code right now. Please try again.');
    }

    // Save reqId in Redis if available
    const reqId = this.msg91Service.extractReqId(sendResult);
    if (this.redis) {
      if (reqId) {
        await this.redis.set(`otp:reqId:user:${userId}`, reqId, 'EX', 600); // 10 minutes expiry
      }
      // Reset attempts since a new OTP is successfully requested
      await this.redis.del(`otp:attempts:user:${userId}`);
    }

    // Update pending states
    await this.userModel.updateOne({ _id: userId }, {
      $set: {
        phoneDetails: {
          countryCode: normalized.countryCode,
          nationalNumber: normalized.nationalNumber,
          e164: normalized.e164,
          verified: false,
        },
        phoneVerification: {
          status: 'PENDING',
          attempts: 0,
          lastSentAt: new Date(),
        }
      }
    });

    await this.audit.log(
      userId,
      'PHONE_OTP_REQUESTED',
      'User',
      userId,
      { phone: this.maskPhoneNumber(normalized.e164) }
    );

    return {
      phone: this.maskPhoneNumber(normalized.e164),
      otpSent: true,
      resendAvailableIn: this.cooldownSeconds,
    };
  }

  async resendOtp(userId: string, ipAddress?: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.phoneDetails || !user.phoneDetails.e164) {
      throw new BadRequestException('No pending verification found. Please enter your phone number first.');
    }

    if (user.phoneDetails?.verified) {
      throw new BadRequestException('Phone number is already verified.');
    }

    // Rate Limiting Check
    if (this.redis) {
      const cooldown = await this.redis.ttl(`otp:cooldown:user:${userId}`);
      if (cooldown > 0) {
        throw new BadRequestException(`Please wait ${cooldown} seconds before requesting a new OTP.`);
      }
    }

    await this.incrementSendCount(userId, user.phoneDetails.e164, ipAddress);

    // Call MSG91
    let sendResult: any;
    try {
      const storedReqId = this.redis ? await this.redis.get(`otp:reqId:user:${userId}`) : undefined;
      sendResult = await this.msg91Service.resendOtp(user.phoneDetails.e164, storedReqId);
    } catch (err: any) {
      throw new InternalServerErrorException(err.message || 'We couldn\'t send a verification code right now. Please try again.');
    }

    // Save new reqId if MSG91 returned a fresh one (though retry API might just use the old one)
    const newReqId = this.msg91Service.extractReqId(sendResult);
    if (this.redis) {
      if (newReqId) {
        await this.redis.set(`otp:reqId:user:${userId}`, newReqId, 'EX', 600);
      }
      // Reset attempts since a new OTP is successfully requested/resent
      await this.redis.del(`otp:attempts:user:${userId}`);
    }

    await this.userModel.updateOne({ _id: userId }, {
      $set: {
        'phoneVerification.lastSentAt': new Date(),
      }
    });

    await this.audit.log(
      userId,
      'PHONE_OTP_RESENT',
      'User',
      userId,
      { phone: this.maskPhoneNumber(user.phoneDetails.e164) }
    );

    return {
      phone: this.maskPhoneNumber(user.phoneDetails.e164),
      otpSent: true,
      resendAvailableIn: this.cooldownSeconds,
    };
  }

  async verifyOtp(userId: string, otp: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.phoneDetails || !user.phoneDetails.e164) {
      throw new BadRequestException('No pending verification found.');
    }

    if (user.phoneDetails?.verified) {
      throw new BadRequestException('Phone number is already verified.');
    }

    if (this.redis) {
      const attempts = await this.redis.get(`otp:attempts:user:${userId}`);
      if (attempts && parseInt(attempts, 10) >= this.maxAttempts) {
        throw new BadRequestException('Too many verification attempts. Please request a new OTP.');
      }
    }

    const storedReqId = this.redis ? await this.redis.get(`otp:reqId:user:${userId}`) : undefined;
    console.log(`[verifyOtp] userId=${userId} storedReqId=${storedReqId ?? 'NULL'}`);

    // Widget API requires the reqId from sendOtp; without it MSG91 always rejects.
    if (this.msg91Service.isWidgetMode && !storedReqId) {
      throw new BadRequestException('Your verification session has expired. Please request a new code.');
    }

    const isVerified = await this.msg91Service.verifyOtp(user.phoneDetails.e164, otp, storedReqId);

    if (!isVerified) {
      let attemptsCount = 1;
      if (this.redis) {
        attemptsCount = await this.redis.incr(`otp:attempts:user:${userId}`);
        if (attemptsCount === 1) {
          await this.redis.expire(`otp:attempts:user:${userId}`, 3600);
        }
      }

      await this.audit.log(
        userId,
        'PHONE_VERIFICATION_FAILED',
        'User',
        userId,
        { phone: this.maskPhoneNumber(user.phoneDetails.e164), attempts: attemptsCount }
      );

      if (attemptsCount >= this.maxAttempts) {
        await this.userModel.updateOne({ _id: userId }, {
          $set: {
            'phoneVerification.status': 'LOCKED',
          }
        });

        await this.audit.log(
          userId,
          'PHONE_VERIFICATION_LOCKED',
          'User',
          userId,
          { phone: this.maskPhoneNumber(user.phoneDetails.e164) }
        );

        throw new BadRequestException('Too many verification attempts. Please request a new OTP.');
      }

      throw new BadRequestException('The OTP is incorrect. Please try again.');
    }

    // Success
    if (this.redis) {
      await this.redis.del(`otp:attempts:user:${userId}`);
      await this.redis.del(`otp:cooldown:user:${userId}`);
      await this.redis.del(`otp:reqId:user:${userId}`);
    }

    await this.userModel.updateOne({ _id: userId }, {
      $set: {
        phone: user.phoneDetails.e164,
        'phoneDetails.verified': true,
        'phoneDetails.verifiedAt': new Date(),
        'phoneVerification.status': 'VERIFIED',
        'phoneVerification.verifiedAt': new Date(),
      }
    });

    await this.notifications.create(
      userId,
      'PHONE_VERIFIED',
      'Phone Number Verified',
      'Your phone number has been verified successfully.',
      {}
    );

    await this.audit.log(
      userId,
      'PHONE_VERIFIED',
      'User',
      userId,
      { phone: this.maskPhoneNumber(user.phoneDetails.e164) }
    );

    return {
      verified: true,
      phone: this.maskPhoneNumber(user.phoneDetails.e164),
    };
  }

  async getPhoneVerificationStatus(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).lean();
    if (!user || !user.phoneDetails) {
      return { phoneProvided: false, verified: false };
    }
    return {
      phoneProvided: true,
      verified: user.phoneDetails.verified,
      phone: this.maskPhoneNumber(user.phoneDetails.e164),
    };
  }

  private async incrementSendCount(userId: string, phoneE164: string, ipAddress?: string): Promise<void> {
    if (!this.redis) return;
    const userKey = `otp:send:user:${userId}`;
    const phoneKey = `otp:send:phone:${this.hashIdentifier(phoneE164)}`;
    
    const userSends = await this.redis.incr(userKey);
    if (userSends === 1) {
      await this.redis.expire(userKey, 3600);
    }
    if (userSends > this.maxSendsPerHour) {
      throw new BadRequestException('Too many verification OTP requests this hour. Please try again later.');
    }

    const phoneSends = await this.redis.incr(phoneKey);
    if (phoneSends === 1) {
      await this.redis.expire(phoneKey, 3600);
    }
    if (phoneSends > this.maxSendsPerHour) {
      throw new BadRequestException('Too many verification OTP requests for this phone number this hour.');
    }

    if (ipAddress) {
      const ipKey = `otp:send:ip:${this.hashIdentifier(ipAddress)}`;
      const ipSends = await this.redis.incr(ipKey);
      if (ipSends === 1) {
        await this.redis.expire(ipKey, 3600);
      }
      if (ipSends > this.maxSendsPerHour * 2) {
        throw new BadRequestException('Rate limit exceeded for this network.');
      }
    }

    // Set cooldown
    await this.redis.set(`otp:cooldown:user:${userId}`, '1', 'EX', this.cooldownSeconds);
  }

  /**
   * Verify the clientId token returned by MSG91's browser widget (otp-provider.js).
   * Calls MSG91's verifyToken API, extracts the verified mobile, then stores it in MongoDB.
   */
  async verifyWidgetToken(userId: string, clientId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found.');

    // Already verified — idempotent
    if ((user as any).phoneDetails?.verified) {
      return {
        phone: this.maskPhoneNumber((user as any).phoneDetails.e164),
        alreadyVerified: true,
      };
    }

    // Verify token with MSG91 (or dev simulation)
    const { mobile } = await this.msg91Service.verifyWidgetToken(clientId);

    // Parse into countryCode + nationalNumber
    const { parsePhoneNumberFromString } = await import('libphonenumber-js');
    const parsed = parsePhoneNumberFromString(mobile);
    const e164 = parsed?.format('E.164') || mobile;
    const countryCode = `+${parsed?.countryCallingCode || '91'}`;
    const nationalNumber = parsed?.nationalNumber || mobile.replace(/^\+\d+/, '');

    // Persist to DB
    const now = new Date();
    (user as any).phoneDetails = {
      countryCode,
      nationalNumber,
      e164,
      verified: true,
      verifiedAt: now,
    };
    (user as any).phoneVerification = {
      status: 'VERIFIED',
      attempts: 0,
      lastSentAt: now,
      verifiedAt: now,
    };
    await user.save();

    // Audit trail
    try {
      await this.audit.log(userId, 'PHONE_VERIFIED', 'User', userId, {
        method: 'msg91_widget',
        maskedPhone: this.maskPhoneNumber(e164),
      });
    } catch (_) { /* audit failures must never break verification */ }

    return {
      phone: this.maskPhoneNumber(e164),
      verifiedAt: now.toISOString(),
    };
  }
}
