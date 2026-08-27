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
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const alumni_verification_schema_1 = require("../database/schemas/alumni-verification.schema");
const mentor_profile_schema_1 = require("../database/schemas/mentor-profile.schema");
const student_profile_schema_1 = require("../database/schemas/student-profile.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const audit_service_1 = require("../audit/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
const transaction_helper_1 = require("../database/transaction.helper");
const ioredis_1 = require("ioredis");
const libphonenumber_js_1 = require("libphonenumber-js");
const msg91_service_1 = require("../integrations/msg91/msg91.service");
const event_bus_1 = require("../common/event-bus");
let VerificationService = class VerificationService {
    constructor(verificationModel, mentorProfileModel, studentProfileModel, userModel, audit, notifications, connection, msg91Service) {
        this.verificationModel = verificationModel;
        this.mentorProfileModel = mentorProfileModel;
        this.studentProfileModel = studentProfileModel;
        this.userModel = userModel;
        this.audit = audit;
        this.notifications = notifications;
        this.connection = connection;
        this.msg91Service = msg91Service;
        this.redis = null;
        this.cooldownSeconds = parseInt(process.env.MSG91_OTP_RESEND_COOLDOWN_SECONDS || '30', 10);
        this.maxSendsPerHour = parseInt(process.env.MSG91_OTP_MAX_SENDS_PER_HOUR || '5', 10);
        this.maxAttempts = parseInt(process.env.MSG91_OTP_MAX_ATTEMPTS || '5', 10);
        try {
            const redisOptions = {};
            if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://')) {
                redisOptions.tls = { rejectUnauthorized: false };
            }
            this.redis = process.env.REDIS_URL
                ? new ioredis_1.default(process.env.REDIS_URL, { lazyConnect: true, ...redisOptions })
                : new ioredis_1.default({
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379', 10),
                    lazyConnect: true,
                    ...redisOptions
                });
        }
        catch (err) {
            console.error('Failed to initialize Redis inside VerificationService:', err);
        }
    }
    async submit(userId, dto) {
        let mentorProfile = await this.mentorProfileModel.findOne({ userId }).lean();
        if (!mentorProfile) {
            const created = new this.mentorProfileModel({
                userId: new mongoose_2.Types.ObjectId(userId),
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
        const existingPending = await this.verificationModel.findOne({
            mentorProfileId: mentorProfile._id,
            status: mentor_profile_schema_1.VerificationStatus.PENDING,
        });
        if (existingPending) {
            throw new common_1.BadRequestException('You already have a pending verification request');
        }
        const verification = new this.verificationModel({
            mentorProfileId: mentorProfile._id,
            status: mentor_profile_schema_1.VerificationStatus.PENDING,
            submittedData: dto,
        });
        await verification.save();
        await this.mentorProfileModel.findByIdAndUpdate(mentorProfile._id, {
            $set: { verificationStatus: mentor_profile_schema_1.VerificationStatus.PENDING },
        });
        await this.audit.log(userId, 'SUBMIT_VERIFICATION', 'AlumniVerification', verification._id.toString(), { rollNumber: dto.rollNumber });
        event_bus_1.globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_SUBMITTED' });
        return {
            ...verification.toObject(),
            id: verification._id.toString(),
        };
    }
    async findAll() {
        const list = await this.verificationModel
            .find()
            .populate({
            path: 'mentorProfileId',
            populate: { path: 'userId' },
        })
            .sort({ createdAt: -1 })
            .lean();
        const mentorRequests = list.map((v) => ({
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
            submittedAt: v.createdAt || new Date(),
            phone: v.mentorProfileId?.userId?.phone || '',
            registrationNumber: v.submittedData?.registrationNumber || v.mentorProfileId?.userId?.lpuRegistrationNumber || '',
            lpuEmail: v.submittedData?.lpuEmail || v.mentorProfileId?.userId?.lpuEmail || '',
            school: v.submittedData?.school || v.mentorProfileId?.school || '',
            company: v.mentorProfileId?.currentCompany || '',
            designation: v.mentorProfileId?.currentDesignation || '',
        }));
        const pendingStudents = await this.userModel.find({
            role: user_schema_1.Role.STUDENT,
            onboardingStatus: 'UNDER_REVIEW',
        }).lean();
        const studentUserIds = pendingStudents.map(s => s._id);
        const studentProfiles = await this.studentProfileModel.find({
            userId: { $in: studentUserIds },
        }).lean();
        const studentProfileMap = new Map(studentProfiles.map(p => [p.userId.toString(), p]));
        const studentRequests = pendingStudents.map((student) => {
            const profile = studentProfileMap.get(student._id.toString());
            return {
                id: student._id.toString(),
                userId: student._id.toString(),
                status: mentor_profile_schema_1.VerificationStatus.PENDING,
                role: 'STUDENT',
                submittedAt: student.updatedAt || student.createdAt || new Date(),
                user: {
                    firstName: student.firstName,
                    lastName: student.lastName,
                    email: student.email,
                },
                documentUrl: student.proofDocumentUrl || '',
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
        return [...mentorRequests, ...studentRequests].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }
    async findOne(id) {
        const studentUser = await this.userModel.findOne({ _id: id, role: user_schema_1.Role.STUDENT }).lean();
        if (studentUser) {
            const profile = await this.studentProfileModel.findOne({ userId: id }).lean();
            return {
                id,
                userId: id,
                status: studentUser.onboardingStatus === 'UNDER_REVIEW' ? mentor_profile_schema_1.VerificationStatus.PENDING : studentUser.onboardingStatus,
                role: 'STUDENT',
                submittedAt: studentUser.updatedAt || studentUser.createdAt || new Date(),
                user: {
                    firstName: studentUser.firstName,
                    lastName: studentUser.lastName,
                    email: studentUser.email,
                },
                documentUrl: studentUser.proofDocumentUrl || '',
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
            throw new common_1.NotFoundException(`Verification request with ID ${id} not found`);
        }
        return {
            ...verification,
            id: verification._id.toString(),
            role: 'MENTOR',
            mentorProfile: verification.mentorProfileId
                ? {
                    ...verification.mentorProfileId,
                    id: verification.mentorProfileId._id?.toString(),
                    user: verification.mentorProfileId.userId
                        ? {
                            ...verification.mentorProfileId.userId,
                            id: verification.mentorProfileId.userId._id?.toString(),
                        }
                        : null,
                }
                : null,
            user: verification.mentorProfileId?.userId
                ? {
                    firstName: verification.mentorProfileId.userId.firstName,
                    lastName: verification.mentorProfileId.userId.lastName,
                    email: verification.mentorProfileId.userId.email,
                }
                : null,
            graduationYear: verification.submittedData?.graduationYear || verification.mentorProfileId?.graduationYear,
            programme: verification.submittedData?.programme || verification.mentorProfileId?.programme,
            documentUrl: verification.submittedData?.proofDocumentUrl || '',
            submittedAt: verification.createdAt || new Date(),
            phone: verification.mentorProfileId?.userId?.phone || '',
            registrationNumber: verification.submittedData?.registrationNumber || verification.mentorProfileId?.userId?.lpuRegistrationNumber || '',
            lpuEmail: verification.submittedData?.lpuEmail || verification.mentorProfileId?.userId?.lpuEmail || '',
            school: verification.submittedData?.school || verification.mentorProfileId?.school || '',
            company: verification.mentorProfileId?.currentCompany || '',
            designation: verification.mentorProfileId?.currentDesignation || '',
        };
    }
    async approve(id, reviewerId) {
        const studentUser = await this.userModel.findOne({ _id: id, role: user_schema_1.Role.STUDENT });
        if (studentUser) {
            await this.userModel.updateOne({ _id: id }, { $set: { onboardingStatus: 'APPROVED', verificationStatus: 'VERIFIED' } });
            await this.studentProfileModel.updateOne({ userId: id }, { $set: { onboardingStatus: true } });
            await this.notifications.create(id, 'VERIFICATION_APPROVED', 'Account Onboarding Approved!', 'Your student onboarding details have been approved. Welcome to LPU MentorConnect!', { onboardingStatus: 'APPROVED' });
            await this.audit.log(reviewerId, 'APPROVE_STUDENT_ONBOARDING', 'User', id, { studentUserId: id });
            event_bus_1.globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_APPROVED', scope: 'STUDENT' });
            return {
                id,
                status: mentor_profile_schema_1.VerificationStatus.VERIFIED,
            };
        }
        const verification = await this.verificationModel.findById(id).lean();
        if (!verification) {
            throw new common_1.NotFoundException(`Verification with ID ${id} not found`);
        }
        if (verification.status !== mentor_profile_schema_1.VerificationStatus.PENDING) {
            throw new common_1.BadRequestException('Verification is already processed');
        }
        const result = await (0, transaction_helper_1.runTransactionSafely)(this.connection, async (session) => {
            const updated = await this.verificationModel.findByIdAndUpdate(id, {
                $set: {
                    status: mentor_profile_schema_1.VerificationStatus.VERIFIED,
                    reviewerId: new mongoose_2.Types.ObjectId(reviewerId),
                    reviewedAt: new Date(),
                },
            }, { new: true, session }).lean();
            const mentorProfile = await this.mentorProfileModel.findByIdAndUpdate(verification.mentorProfileId, {
                $set: {
                    verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED,
                    status: mentor_profile_schema_1.MentorStatus.ACTIVE,
                },
            }, { new: true, session }).lean();
            await this.userModel.findByIdAndUpdate(mentorProfile.userId, {
                $set: {
                    role: user_schema_1.Role.MENTOR,
                    onboardingStatus: 'APPROVED',
                    verificationStatus: 'VERIFIED'
                }
            }, { session });
            return { updated, mentorProfile };
        });
        const mentorUserIdStr = result.mentorProfile.userId.toString();
        await this.notifications.create(mentorUserIdStr, 'VERIFICATION_APPROVED', 'Alumni Verification Approved!', 'Your LPU alumni status has been verified. You can now accept student mentorship requests.', { verificationId: id });
        await this.audit.log(reviewerId, 'APPROVE_VERIFICATION', 'AlumniVerification', id, { mentorUserId: mentorUserIdStr });
        event_bus_1.globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_APPROVED', scope: 'MENTOR' });
        return {
            ...result.updated,
            id: result.updated._id.toString(),
        };
    }
    async reject(id, reviewerId, rejectionReason) {
        const studentUser = await this.userModel.findOne({ _id: id, role: user_schema_1.Role.STUDENT });
        if (studentUser) {
            await this.userModel.updateOne({ _id: id }, {
                $set: {
                    onboardingStatus: 'REJECTED',
                    verificationStatus: 'REJECTED',
                    rejectionReason,
                }
            });
            await this.notifications.create(id, 'VERIFICATION_REJECTED', 'Onboarding Verification Rejected', `Your onboarding verification request was rejected. Reason: ${rejectionReason}`, { onboardingStatus: 'REJECTED', rejectionReason });
            await this.audit.log(reviewerId, 'REJECT_STUDENT_ONBOARDING', 'User', id, { studentUserId: id, reason: rejectionReason });
            event_bus_1.globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_REJECTED' });
            return {
                id,
                status: mentor_profile_schema_1.VerificationStatus.REJECTED,
            };
        }
        const verification = await this.verificationModel.findById(id).lean();
        if (!verification) {
            throw new common_1.NotFoundException(`Verification with ID ${id} not found`);
        }
        if (verification.status !== mentor_profile_schema_1.VerificationStatus.PENDING) {
            throw new common_1.BadRequestException('Verification is already processed');
        }
        const mentorProfileObj = await this.mentorProfileModel.findById(verification.mentorProfileId).lean();
        if (!mentorProfileObj) {
            throw new common_1.NotFoundException('Mentor profile not found');
        }
        const updated = await (0, transaction_helper_1.runTransactionSafely)(this.connection, async (session) => {
            const u = await this.verificationModel.findByIdAndUpdate(id, {
                $set: {
                    status: mentor_profile_schema_1.VerificationStatus.REJECTED,
                    reviewerId: new mongoose_2.Types.ObjectId(reviewerId),
                    reviewedAt: new Date(),
                    rejectionReason,
                },
            }, { new: true, session }).lean();
            await this.mentorProfileModel.findByIdAndUpdate(verification.mentorProfileId, {
                $set: {
                    verificationStatus: mentor_profile_schema_1.VerificationStatus.REJECTED,
                    status: mentor_profile_schema_1.MentorStatus.INACTIVE,
                },
            }, { session });
            await this.userModel.findByIdAndUpdate(mentorProfileObj.userId, {
                $set: {
                    onboardingStatus: 'REJECTED',
                    verificationStatus: 'REJECTED',
                    rejectionReason,
                }
            }, { session });
            return u;
        });
        const mentorUserIdStr = mentorProfileObj.userId.toString();
        await this.notifications.create(mentorUserIdStr, 'VERIFICATION_REJECTED', 'Alumni Verification Rejected', `Your verification request was rejected. Reason: ${rejectionReason}`, { verificationId: id, rejectionReason });
        await this.audit.log(reviewerId, 'REJECT_VERIFICATION', 'AlumniVerification', id, { mentorUserId: mentorUserIdStr, reason: rejectionReason });
        event_bus_1.globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_REJECTED' });
        return {
            ...updated,
            id: updated._id.toString(),
        };
    }
    async requestChanges(id, reviewerId, explanation) {
        const studentUser = await this.userModel.findOne({ _id: id, role: user_schema_1.Role.STUDENT });
        if (studentUser) {
            await this.userModel.updateOne({ _id: id }, {
                $set: {
                    onboardingStatus: 'CHANGES_REQUESTED',
                    verificationStatus: 'CHANGES_REQUESTED',
                    changeRequestReason: explanation,
                }
            });
            await this.notifications.create(id, 'VERIFICATION_CHANGES_REQUESTED', 'Onboarding Details Update Requested', `Your student onboarding details require correction: ${explanation}`, { onboardingStatus: 'CHANGES_REQUESTED', explanation });
            await this.audit.log(reviewerId, 'REQUEST_CHANGES_STUDENT_ONBOARDING', 'User', id, { studentUserId: id, reason: explanation });
            event_bus_1.globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_CHANGES_REQUESTED' });
            return {
                id,
                status: 'CHANGES_REQUESTED',
            };
        }
        const verification = await this.verificationModel.findById(id).lean();
        if (!verification) {
            throw new common_1.NotFoundException(`Verification with ID ${id} not found`);
        }
        if (verification.status !== mentor_profile_schema_1.VerificationStatus.PENDING) {
            throw new common_1.BadRequestException('Verification is already processed');
        }
        const mentorProfileObj = await this.mentorProfileModel.findById(verification.mentorProfileId).lean();
        if (!mentorProfileObj) {
            throw new common_1.NotFoundException('Mentor profile not found');
        }
        const updated = await (0, transaction_helper_1.runTransactionSafely)(this.connection, async (session) => {
            const u = await this.verificationModel.findByIdAndUpdate(id, {
                $set: {
                    status: 'CHANGES_REQUESTED',
                    reviewerId: new mongoose_2.Types.ObjectId(reviewerId),
                    reviewedAt: new Date(),
                },
            }, { new: true, session }).lean();
            await this.userModel.findByIdAndUpdate(mentorProfileObj.userId, {
                $set: {
                    onboardingStatus: 'CHANGES_REQUESTED',
                    verificationStatus: 'CHANGES_REQUESTED',
                    changeRequestReason: explanation,
                }
            }, { session });
            return u;
        });
        const mentorUserIdStr = mentorProfileObj.userId.toString();
        await this.notifications.create(mentorUserIdStr, 'VERIFICATION_CHANGES_REQUESTED', 'Alumni Verification Details Update Requested', `Your verification request requires corrections: ${explanation}`, { verificationId: id, explanation });
        await this.audit.log(reviewerId, 'REQUEST_CHANGES_VERIFICATION', 'AlumniVerification', id, { mentorUserId: mentorUserIdStr, reason: explanation });
        event_bus_1.globalEventBus.emit('dashboard_update', { type: 'VERIFICATION_CHANGES_REQUESTED' });
        return {
            ...updated,
            id: updated._id.toString(),
        };
    }
    hashIdentifier(val) {
        return require('crypto').createHash('sha256').update(val).digest('hex');
    }
    maskPhoneNumber(phone) {
        if (!phone)
            return '';
        if (phone.length <= 7)
            return phone;
        const visibleStart = phone.substring(0, 3);
        const visibleEnd = phone.substring(phone.length - 4);
        const masked = '*'.repeat(phone.length - 7);
        return `${visibleStart} ${masked}${visibleEnd}`;
    }
    normalizePhone(countryCode, nationalNumber) {
        const cleanCC = countryCode.replace(/\+/g, '').trim();
        let cleanNum = nationalNumber.replace(/[\s\-\+\(\)]/g, '').trim();
        if (cleanNum.startsWith(cleanCC)) {
            cleanNum = cleanNum.substring(cleanCC.length);
        }
        if (cleanCC === '91' && cleanNum.length === 11 && cleanNum.startsWith('0')) {
            cleanNum = cleanNum.substring(1);
        }
        const fullNumber = `+${cleanCC}${cleanNum}`;
        const parsed = (0, libphonenumber_js_1.parsePhoneNumberFromString)(fullNumber);
        if (!parsed || !parsed.isValid()) {
            throw new common_1.BadRequestException('Invalid phone number format.');
        }
        return {
            countryCode: `+${parsed.countryCallingCode}`,
            nationalNumber: parsed.nationalNumber,
            e164: parsed.format('E.164'),
        };
    }
    async sendOtp(userId, countryCode, nationalNumber, ipAddress) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.phoneDetails?.verified) {
            throw new common_1.BadRequestException('Phone number is already verified.');
        }
        const normalized = this.normalizePhone(countryCode, nationalNumber);
        if (this.redis) {
            const cooldown = await this.redis.ttl(`otp:cooldown:user:${userId}`);
            if (cooldown > 0) {
                throw new common_1.BadRequestException(`Please wait ${cooldown} seconds before requesting a new OTP.`);
            }
        }
        await this.incrementSendCount(userId, normalized.e164, ipAddress);
        let sendResult;
        try {
            sendResult = await this.msg91Service.sendOtp(normalized.e164);
        }
        catch (err) {
            throw new common_1.InternalServerErrorException(err.message || 'We couldn\'t send a verification code right now. Please try again.');
        }
        const reqId = this.msg91Service.extractReqId(sendResult);
        if (this.redis) {
            if (reqId) {
                await this.redis.set(`otp:reqId:user:${userId}`, reqId, 'EX', 600);
            }
            await this.redis.del(`otp:attempts:user:${userId}`);
        }
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
        await this.audit.log(userId, 'PHONE_OTP_REQUESTED', 'User', userId, { phone: this.maskPhoneNumber(normalized.e164) });
        return {
            phone: this.maskPhoneNumber(normalized.e164),
            otpSent: true,
            resendAvailableIn: this.cooldownSeconds,
        };
    }
    async resendOtp(userId, ipAddress) {
        const user = await this.userModel.findById(userId);
        if (!user || !user.phoneDetails || !user.phoneDetails.e164) {
            throw new common_1.BadRequestException('No pending verification found. Please enter your phone number first.');
        }
        if (user.phoneDetails?.verified) {
            throw new common_1.BadRequestException('Phone number is already verified.');
        }
        if (this.redis) {
            const cooldown = await this.redis.ttl(`otp:cooldown:user:${userId}`);
            if (cooldown > 0) {
                throw new common_1.BadRequestException(`Please wait ${cooldown} seconds before requesting a new OTP.`);
            }
        }
        await this.incrementSendCount(userId, user.phoneDetails.e164, ipAddress);
        let sendResult;
        try {
            const storedReqId = this.redis ? await this.redis.get(`otp:reqId:user:${userId}`) : undefined;
            sendResult = await this.msg91Service.resendOtp(user.phoneDetails.e164, storedReqId);
        }
        catch (err) {
            throw new common_1.InternalServerErrorException(err.message || 'We couldn\'t send a verification code right now. Please try again.');
        }
        const newReqId = this.msg91Service.extractReqId(sendResult);
        if (this.redis) {
            if (newReqId) {
                await this.redis.set(`otp:reqId:user:${userId}`, newReqId, 'EX', 600);
            }
            await this.redis.del(`otp:attempts:user:${userId}`);
        }
        await this.userModel.updateOne({ _id: userId }, {
            $set: {
                'phoneVerification.lastSentAt': new Date(),
            }
        });
        await this.audit.log(userId, 'PHONE_OTP_RESENT', 'User', userId, { phone: this.maskPhoneNumber(user.phoneDetails.e164) });
        return {
            phone: this.maskPhoneNumber(user.phoneDetails.e164),
            otpSent: true,
            resendAvailableIn: this.cooldownSeconds,
        };
    }
    async verifyOtp(userId, otp) {
        const user = await this.userModel.findById(userId);
        if (!user || !user.phoneDetails || !user.phoneDetails.e164) {
            throw new common_1.BadRequestException('No pending verification found.');
        }
        if (user.phoneDetails?.verified) {
            throw new common_1.BadRequestException('Phone number is already verified.');
        }
        if (this.redis) {
            const attempts = await this.redis.get(`otp:attempts:user:${userId}`);
            if (attempts && parseInt(attempts, 10) >= this.maxAttempts) {
                throw new common_1.BadRequestException('Too many verification attempts. Please request a new OTP.');
            }
        }
        const storedReqId = this.redis ? await this.redis.get(`otp:reqId:user:${userId}`) : undefined;
        console.log(`[verifyOtp] userId=${userId} storedReqId=${storedReqId ?? 'NULL'}`);
        if (this.msg91Service.isWidgetMode && !storedReqId) {
            throw new common_1.BadRequestException('Your verification session has expired. Please request a new code.');
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
            await this.audit.log(userId, 'PHONE_VERIFICATION_FAILED', 'User', userId, { phone: this.maskPhoneNumber(user.phoneDetails.e164), attempts: attemptsCount });
            if (attemptsCount >= this.maxAttempts) {
                await this.userModel.updateOne({ _id: userId }, {
                    $set: {
                        'phoneVerification.status': 'LOCKED',
                    }
                });
                await this.audit.log(userId, 'PHONE_VERIFICATION_LOCKED', 'User', userId, { phone: this.maskPhoneNumber(user.phoneDetails.e164) });
                throw new common_1.BadRequestException('Too many verification attempts. Please request a new OTP.');
            }
            throw new common_1.BadRequestException('The OTP is incorrect. Please try again.');
        }
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
        await this.notifications.create(userId, 'PHONE_VERIFIED', 'Phone Number Verified', 'Your phone number has been verified successfully.', {});
        await this.audit.log(userId, 'PHONE_VERIFIED', 'User', userId, { phone: this.maskPhoneNumber(user.phoneDetails.e164) });
        return {
            verified: true,
            phone: this.maskPhoneNumber(user.phoneDetails.e164),
        };
    }
    async getPhoneVerificationStatus(userId) {
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
    async incrementSendCount(userId, phoneE164, ipAddress) {
        if (!this.redis)
            return;
        const userKey = `otp:send:user:${userId}`;
        const phoneKey = `otp:send:phone:${this.hashIdentifier(phoneE164)}`;
        const userSends = await this.redis.incr(userKey);
        if (userSends === 1) {
            await this.redis.expire(userKey, 3600);
        }
        if (userSends > this.maxSendsPerHour) {
            throw new common_1.BadRequestException('Too many verification OTP requests this hour. Please try again later.');
        }
        const phoneSends = await this.redis.incr(phoneKey);
        if (phoneSends === 1) {
            await this.redis.expire(phoneKey, 3600);
        }
        if (phoneSends > this.maxSendsPerHour) {
            throw new common_1.BadRequestException('Too many verification OTP requests for this phone number this hour.');
        }
        if (ipAddress) {
            const ipKey = `otp:send:ip:${this.hashIdentifier(ipAddress)}`;
            const ipSends = await this.redis.incr(ipKey);
            if (ipSends === 1) {
                await this.redis.expire(ipKey, 3600);
            }
            if (ipSends > this.maxSendsPerHour * 2) {
                throw new common_1.BadRequestException('Rate limit exceeded for this network.');
            }
        }
        await this.redis.set(`otp:cooldown:user:${userId}`, '1', 'EX', this.cooldownSeconds);
    }
    async verifyWidgetToken(userId, clientId) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.BadRequestException('User not found.');
        if (user.phoneDetails?.verified) {
            return {
                phone: this.maskPhoneNumber(user.phoneDetails.e164),
                alreadyVerified: true,
            };
        }
        const { mobile } = await this.msg91Service.verifyWidgetToken(clientId);
        const { parsePhoneNumberFromString } = await Promise.resolve().then(() => require('libphonenumber-js'));
        const parsed = parsePhoneNumberFromString(mobile);
        const e164 = parsed?.format('E.164') || mobile;
        const countryCode = `+${parsed?.countryCallingCode || '91'}`;
        const nationalNumber = parsed?.nationalNumber || mobile.replace(/^\+\d+/, '');
        const now = new Date();
        user.phoneDetails = {
            countryCode,
            nationalNumber,
            e164,
            verified: true,
            verifiedAt: now,
        };
        user.phoneVerification = {
            status: 'VERIFIED',
            attempts: 0,
            lastSentAt: now,
            verifiedAt: now,
        };
        await user.save();
        try {
            await this.audit.log(userId, 'PHONE_VERIFIED', 'User', userId, {
                method: 'msg91_widget',
                maskedPhone: this.maskPhoneNumber(e164),
            });
        }
        catch (_) { }
        return {
            phone: this.maskPhoneNumber(e164),
            verifiedAt: now.toISOString(),
        };
    }
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(alumni_verification_schema_1.AlumniVerification.name)),
    __param(1, (0, mongoose_1.InjectModel)(mentor_profile_schema_1.MentorProfile.name)),
    __param(2, (0, mongoose_1.InjectModel)(student_profile_schema_1.StudentProfile.name)),
    __param(3, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(6, (0, mongoose_1.InjectConnection)()),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService,
        mongoose_2.Connection,
        msg91_service_1.Msg91Service])
], VerificationService);
//# sourceMappingURL=verification.service.js.map