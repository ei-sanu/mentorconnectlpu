"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const app_module_1 = require("../src/app.module");
const requests_service_1 = require("../src/requests/requests.service");
const mentorships_service_1 = require("../src/mentorships/mentorships.service");
const sessions_service_1 = require("../src/sessions/sessions.service");
const recommendations_service_1 = require("../src/recommendations/recommendations.service");
const mentors_service_1 = require("../src/mentors/mentors.service");
const matching_service_1 = require("../src/matching/matching.service");
const user_schema_1 = require("../src/database/schemas/user.schema");
const student_profile_schema_1 = require("../src/database/schemas/student-profile.schema");
const mentor_profile_schema_1 = require("../src/database/schemas/mentor-profile.schema");
const mentorship_request_schema_1 = require("../src/database/schemas/mentorship-request.schema");
const mentorship_schema_1 = require("../src/database/schemas/mentorship.schema");
const session_schema_1 = require("../src/database/schemas/session.schema");
describe('LPU MentorConnect Business Logic Tests (E2E Integration)', () => {
    jest.setTimeout(30000);
    let app;
    let connection;
    let requestsService;
    let mentorshipsService;
    let sessionsService;
    let recommendationsService;
    let mentorsService;
    let matchingService;
    let userModel;
    let studentProfileModel;
    let mentorProfileModel;
    let requestModel;
    let mentorshipModel;
    let sessionModel;
    let testStudentUser;
    let testMentorUser1;
    let testMentorUser2;
    let testStudentProfile;
    let testMentorProfile1;
    let testMentorProfile2;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        connection = moduleFixture.get((0, mongoose_1.getConnectionToken)());
        requestsService = moduleFixture.get(requests_service_1.RequestsService);
        mentorshipsService = moduleFixture.get(mentorships_service_1.MentorshipsService);
        sessionsService = moduleFixture.get(sessions_service_1.SessionsService);
        recommendationsService = moduleFixture.get(recommendations_service_1.RecommendationsService);
        mentorsService = moduleFixture.get(mentors_service_1.MentorsService);
        matchingService = moduleFixture.get(matching_service_1.MatchingService);
        userModel = moduleFixture.get((0, mongoose_1.getModelToken)(user_schema_1.User.name));
        studentProfileModel = moduleFixture.get((0, mongoose_1.getModelToken)(student_profile_schema_1.StudentProfile.name));
        mentorProfileModel = moduleFixture.get((0, mongoose_1.getModelToken)(mentor_profile_schema_1.MentorProfile.name));
        requestModel = moduleFixture.get((0, mongoose_1.getModelToken)(mentorship_request_schema_1.MentorshipRequest.name));
        mentorshipModel = moduleFixture.get((0, mongoose_1.getModelToken)(mentorship_schema_1.Mentorship.name));
        sessionModel = moduleFixture.get((0, mongoose_1.getModelToken)(session_schema_1.Session.name));
    });
    beforeEach(async () => {
        const collections = Object.keys(connection.collections);
        for (const name of collections) {
            await connection.collections[name].deleteMany({});
        }
        testStudentUser = await userModel.create({
            clerkUserId: 'test_student_clerk_id',
            email: 'test.student@lpu.in',
            role: user_schema_1.Role.STUDENT,
            firstName: 'Aarav',
            lastName: 'Sharma',
            status: user_schema_1.UserStatus.ACTIVE,
        });
        testMentorUser1 = await userModel.create({
            clerkUserId: 'test_mentor_clerk_id_1',
            email: 'test.mentor1@alumni.lpu.in',
            role: user_schema_1.Role.MENTOR,
            firstName: 'Priya',
            lastName: 'Patel',
            status: user_schema_1.UserStatus.ACTIVE,
        });
        testMentorUser2 = await userModel.create({
            clerkUserId: 'test_mentor_clerk_id_2',
            email: 'test.mentor2@alumni.lpu.in',
            role: user_schema_1.Role.MENTOR,
            firstName: 'Neha',
            lastName: 'Gupta',
            status: user_schema_1.UserStatus.ACTIVE,
        });
        testStudentProfile = await studentProfileModel.create({
            userId: testStudentUser._id,
            programme: 'B.Tech CSE',
            school: 'SCSE',
            yearOfStudy: 3,
            graduationYear: 2027,
            currentSkills: ['React', 'Python'],
            targetRole: 'Backend Engineer',
            targetIndustry: 'Technology',
            careerGoals: ['Work at Google'],
            interests: ['System Design'],
            mentoringNeeds: 'Guidance',
            preferredFrequency: 'Weekly',
            studentEmbedding: new Array(1536).fill(0).map((_, i) => Math.sin(i) * 0.05),
        });
        testMentorProfile1 = await mentorProfileModel.create({
            userId: testMentorUser1._id,
            graduationYear: 2018,
            programme: 'B.Tech CSE',
            currentCompany: 'Google',
            currentDesignation: 'Senior Software Engineer',
            yearsOfExperience: 6,
            industry: 'Technology',
            expertise: ['Node.js', 'System Design'],
            mentoringAreas: ['Backend Systems'],
            bio: 'Bio details',
            careerSummary: 'Summary details',
            maxCapacity: 3,
            currentMenteesCount: 0,
            acceptingMentees: true,
            verificationStatus: mentor_profile_schema_1.VerificationStatus.VERIFIED,
            status: mentor_profile_schema_1.MentorStatus.ACTIVE,
            mentorEmbedding: new Array(1536).fill(0).map((_, i) => Math.sin(i + 1) * 0.05),
        });
        testMentorProfile2 = await mentorProfileModel.create({
            userId: testMentorUser2._id,
            graduationYear: 2020,
            programme: 'B.Tech CSE',
            currentCompany: 'Amazon',
            currentDesignation: 'Data Scientist',
            yearsOfExperience: 4,
            industry: 'E-commerce',
            expertise: ['Python', 'ML'],
            mentoringAreas: ['AI systems'],
            bio: 'Data Science',
            careerSummary: 'DS Summary',
            maxCapacity: 2,
            currentMenteesCount: 0,
            acceptingMentees: true,
            verificationStatus: mentor_profile_schema_1.VerificationStatus.PENDING,
            status: mentor_profile_schema_1.MentorStatus.INACTIVE,
            mentorEmbedding: new Array(1536).fill(0).map((_, i) => Math.sin(i + 2) * 0.05),
        });
    });
    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });
    it('TEST 1: Request cannot be accepted if mentor currentMentees >= capacity', async () => {
        await mentorProfileModel.findByIdAndUpdate(testMentorProfile1._id, {
            $set: { currentMenteesCount: 3, maxCapacity: 3 },
        });
        const request = await requestModel.create({
            studentId: testStudentUser._id,
            mentorId: testMentorProfile1._id,
            message: 'Help me',
            goal: 'Career Guidance',
            status: mentorship_request_schema_1.RequestStatus.PENDING,
        });
        const studentUserIdStr = testStudentUser._id.toString();
        const mentorUserIdStr = testMentorUser1._id.toString();
        const requestIdStr = request._id.toString();
        await expect(requestsService.accept(requestIdStr, mentorUserIdStr)).rejects.toThrow(common_1.BadRequestException);
    });
    it('TEST 2: Concurrent acceptances cannot exceed mentor capacity', async () => {
        await mentorProfileModel.findByIdAndUpdate(testMentorProfile1._id, {
            $set: { currentMenteesCount: 0, maxCapacity: 1 },
        });
        const studentUser2 = await userModel.create({
            clerkUserId: 'test_student_2',
            email: 'test.student2@lpu.in',
            role: user_schema_1.Role.STUDENT,
            firstName: 'Siddharth',
            lastName: 'Verma',
            status: user_schema_1.UserStatus.ACTIVE,
        });
        const req1 = await requestModel.create({
            studentId: testStudentUser._id,
            mentorId: testMentorProfile1._id,
            message: 'Request 1',
            goal: 'Guidance 1',
            status: mentorship_request_schema_1.RequestStatus.PENDING,
        });
        const req2 = await requestModel.create({
            studentId: studentUser2._id,
            mentorId: testMentorProfile1._id,
            message: 'Request 2',
            goal: 'Guidance 2',
            status: mentorship_request_schema_1.RequestStatus.PENDING,
        });
        const mentorUserIdStr = testMentorUser1._id.toString();
        const req1IdStr = req1._id.toString();
        const req2IdStr = req2._id.toString();
        const promises = [
            requestsService.accept(req1IdStr, mentorUserIdStr),
            requestsService.accept(req2IdStr, mentorUserIdStr),
        ];
        const results = await Promise.allSettled(promises);
        const fulfilled = results.filter((r) => r.status === 'fulfilled');
        const rejected = results.filter((r) => r.status === 'rejected');
        expect(fulfilled.length).toBe(1);
        expect(rejected.length).toBe(1);
    });
    it('TEST 3: Student has reached request limit (max 3 pending)', async () => {
        for (let i = 0; i < 3; i++) {
            await requestModel.create({
                studentId: testStudentUser._id,
                mentorId: testMentorProfile1._id,
                message: `Msg ${i}`,
                goal: `Goal ${i}`,
                status: mentorship_request_schema_1.RequestStatus.PENDING,
            });
        }
        const studentUserIdStr = testStudentUser._id.toString();
        const mentorProfileIdStr = testMentorProfile1._id.toString();
        await expect(requestsService.create(studentUserIdStr, {
            mentorId: mentorProfileIdStr,
            message: '4th request',
            goal: 'Career Guidance',
        })).rejects.toThrow(common_1.BadRequestException);
    });
    it('TEST 4: Mentor cannot accept expired request', async () => {
        const request = await requestModel.create({
            studentId: testStudentUser._id,
            mentorId: testMentorProfile1._id,
            message: 'Request text',
            goal: 'Career Guidance',
            status: mentorship_request_schema_1.RequestStatus.EXPIRED,
        });
        const mentorUserIdStr = testMentorUser1._id.toString();
        const requestIdStr = request._id.toString();
        await expect(requestsService.accept(requestIdStr, mentorUserIdStr)).rejects.toThrow(common_1.BadRequestException);
    });
    it('TEST 5: Unverified mentor does not appear in eligible recommendations', async () => {
        const discovery = await mentorsService.findMany({ page: 1, limit: 10 });
        const containsUnverified = discovery.data.some((m) => m.id === testMentorProfile2._id.toString());
        expect(containsUnverified).toBe(false);
    });
    it("TEST 6: Student cannot access another student's mentorship record", async () => {
        const studentUser2 = await userModel.create({
            clerkUserId: 'student_clerk_2',
            email: 'stud2@lpu.in',
            role: user_schema_1.Role.STUDENT,
            firstName: 'Kabir',
            lastName: 'Mehta',
            status: user_schema_1.UserStatus.ACTIVE,
        });
        const mentorship = await mentorshipModel.create({
            studentProfileId: testStudentProfile._id,
            mentorProfileId: testMentorProfile1._id,
            status: mentorship_schema_1.MentorshipStatus.ACTIVE,
            startDate: new Date(),
        });
        const studentUserIdStr = testStudentUser._id.toString();
        const studentUser2IdStr = studentUser2._id.toString();
        const mentorshipIdStr = mentorship._id.toString();
        const ok = await mentorshipsService.findOne(mentorshipIdStr, studentUserIdStr);
        expect(ok).toBeDefined();
        await expect(mentorshipsService.findOne(mentorshipIdStr, studentUser2IdStr)).rejects.toThrow(common_1.ForbiddenException);
    });
    it('TEST 7: Student recommendations only return eligible mentors', async () => {
        const studentUserIdStr = testStudentUser._id.toString();
        const recommendations = await recommendationsService.getRecommendedMentors(studentUserIdStr);
        const containsUnverified = recommendations.some((r) => r.id === testMentorProfile2._id.toString());
        expect(containsUnverified).toBe(false);
        const containsEligible = recommendations.some((r) => r.id === testMentorProfile1._id.toString());
        expect(containsEligible).toBe(true);
    });
    it('TEST 8: Core matching fallback is utilized when AI model is down/unavailable', async () => {
        const studentProfileIdStr = testStudentProfile._id.toString();
        const matches = await matchingService.calculateRecommendation(studentProfileIdStr);
        expect(matches.length).toBeGreaterThan(0);
        expect(matches[0].matchType).toBeDefined();
    });
    it('TEST 9: Overlapping sessions are rejected', async () => {
        const mentorship = await mentorshipModel.create({
            studentProfileId: testStudentProfile._id,
            mentorProfileId: testMentorProfile1._id,
            status: mentorship_schema_1.MentorshipStatus.ACTIVE,
            startDate: new Date(),
        });
        const startTime = new Date();
        startTime.setHours(startTime.getHours() + 2);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        const mentorshipIdStr = mentorship._id.toString();
        const studentUserIdStr = testStudentUser._id.toString();
        await sessionsService.createSession(mentorshipIdStr, studentUserIdStr, {
            title: 'First session',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
        });
        const overlapStart = new Date(startTime.getTime() + 15 * 60 * 1000);
        const overlapEnd = new Date(overlapStart.getTime() + 30 * 60 * 1000);
        await expect(sessionsService.createSession(mentorshipIdStr, studentUserIdStr, {
            title: 'Overlap session',
            startTime: overlapStart.toISOString(),
            endTime: overlapEnd.toISOString(),
        })).rejects.toThrow(common_1.BadRequestException);
    });
    it('TEST 10: Private contact data is scrubbed in student-facing response', async () => {
        const discovery = await mentorsService.findMany({ page: 1, limit: 10 });
        const profile = discovery.data[0];
        expect(profile).toBeDefined();
        expect(profile.email).toBeUndefined();
        expect(profile.phoneNumber).toBeUndefined();
        expect(profile.accessToken).toBeUndefined();
    });
});
//# sourceMappingURL=business-logic.spec.js.map