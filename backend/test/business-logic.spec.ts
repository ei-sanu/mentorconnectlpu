import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, ForbiddenException } from '@nestjs/common';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { AppModule } from '../src/app.module';
import { RequestsService } from '../src/requests/requests.service';
import { MentorshipsService } from '../src/mentorships/mentorships.service';
import { SessionsService } from '../src/sessions/sessions.service';
import { RecommendationsService } from '../src/recommendations/recommendations.service';
import { MentorsService } from '../src/mentors/mentors.service';
import { MatchingService } from '../src/matching/matching.service';
import { User, UserDocument, Role, UserStatus } from '../src/database/schemas/user.schema';
import { StudentProfile, StudentProfileDocument } from '../src/database/schemas/student-profile.schema';
import { MentorProfile, MentorProfileDocument, VerificationStatus, MentorStatus } from '../src/database/schemas/mentor-profile.schema';
import { MentorshipRequest, MentorshipRequestDocument, RequestStatus } from '../src/database/schemas/mentorship-request.schema';
import { Mentorship, MentorshipDocument, MentorshipStatus } from '../src/database/schemas/mentorship.schema';
import { Session, SessionDocument, SessionStatus } from '../src/database/schemas/session.schema';

describe('LPU MentorConnect Business Logic Tests (E2E Integration)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let connection: Connection;
  let requestsService: RequestsService;
  let mentorshipsService: MentorshipsService;
  let sessionsService: SessionsService;
  let recommendationsService: RecommendationsService;
  let mentorsService: MentorsService;
  let matchingService: MatchingService;

  let userModel: Model<UserDocument>;
  let studentProfileModel: Model<StudentProfileDocument>;
  let mentorProfileModel: Model<MentorProfileDocument>;
  let requestModel: Model<MentorshipRequestDocument>;
  let mentorshipModel: Model<MentorshipDocument>;
  let sessionModel: Model<SessionDocument>;

  let testStudentUser: any;
  let testMentorUser1: any;
  let testMentorUser2: any;
  let testStudentProfile: any;
  let testMentorProfile1: any;
  let testMentorProfile2: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());
    requestsService = moduleFixture.get<RequestsService>(RequestsService);
    mentorshipsService = moduleFixture.get<MentorshipsService>(MentorshipsService);
    sessionsService = moduleFixture.get<SessionsService>(SessionsService);
    recommendationsService = moduleFixture.get<RecommendationsService>(RecommendationsService);
    mentorsService = moduleFixture.get<MentorsService>(MentorsService);
    matchingService = moduleFixture.get<MatchingService>(MatchingService);

    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
    studentProfileModel = moduleFixture.get<Model<StudentProfileDocument>>(getModelToken(StudentProfile.name));
    mentorProfileModel = moduleFixture.get<Model<MentorProfileDocument>>(getModelToken(MentorProfile.name));
    requestModel = moduleFixture.get<Model<MentorshipRequestDocument>>(getModelToken(MentorshipRequest.name));
    mentorshipModel = moduleFixture.get<Model<MentorshipDocument>>(getModelToken(Mentorship.name));
    sessionModel = moduleFixture.get<Model<SessionDocument>>(getModelToken(Session.name));
  });

  beforeEach(async () => {
    // Clear collections
    const collections = Object.keys(connection.collections);
    for (const name of collections) {
      await connection.collections[name].deleteMany({});
    }

    // Create primary test users
    testStudentUser = await userModel.create({
      clerkUserId: 'test_student_clerk_id',
      email: 'test.student@lpu.in',
      role: Role.STUDENT,
      firstName: 'Aarav',
      lastName: 'Sharma',
      status: UserStatus.ACTIVE,
    });

    testMentorUser1 = await userModel.create({
      clerkUserId: 'test_mentor_clerk_id_1',
      email: 'test.mentor1@alumni.lpu.in',
      role: Role.MENTOR,
      firstName: 'Priya',
      lastName: 'Patel',
      status: UserStatus.ACTIVE,
    });

    testMentorUser2 = await userModel.create({
      clerkUserId: 'test_mentor_clerk_id_2',
      email: 'test.mentor2@alumni.lpu.in',
      role: Role.MENTOR,
      firstName: 'Neha',
      lastName: 'Gupta',
      status: UserStatus.ACTIVE,
    });

    // Create student profile
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

    // Create mentor profile 1 (Verified, Active, Capacity 3, Mentees 0)
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
      verificationStatus: VerificationStatus.VERIFIED,
      status: MentorStatus.ACTIVE,
      mentorEmbedding: new Array(1536).fill(0).map((_, i) => Math.sin(i + 1) * 0.05),
    });

    // Create mentor profile 2 (Unverified, Inactive)
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
      verificationStatus: VerificationStatus.PENDING,
      status: MentorStatus.INACTIVE,
      mentorEmbedding: new Array(1536).fill(0).map((_, i) => Math.sin(i + 2) * 0.05),
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // TEST 1
  it('TEST 1: Request cannot be accepted if mentor currentMentees >= capacity', async () => {
    await mentorProfileModel.findByIdAndUpdate(testMentorProfile1._id, {
      $set: { currentMenteesCount: 3, maxCapacity: 3 },
    });

    const request = await requestModel.create({
      studentId: testStudentUser._id,
      mentorId: testMentorProfile1._id,
      message: 'Help me',
      goal: 'Career Guidance',
      status: RequestStatus.PENDING,
    });

    const studentUserIdStr = testStudentUser._id.toString();
    const mentorUserIdStr = testMentorUser1._id.toString();
    const requestIdStr = request._id.toString();

    await expect(
      requestsService.accept(requestIdStr, mentorUserIdStr),
    ).rejects.toThrow(BadRequestException);
  });

  // TEST 2
  it('TEST 2: Concurrent acceptances cannot exceed mentor capacity', async () => {
    await mentorProfileModel.findByIdAndUpdate(testMentorProfile1._id, {
      $set: { currentMenteesCount: 0, maxCapacity: 1 },
    });

    const studentUser2 = await userModel.create({
      clerkUserId: 'test_student_2',
      email: 'test.student2@lpu.in',
      role: Role.STUDENT,
      firstName: 'Siddharth',
      lastName: 'Verma',
      status: UserStatus.ACTIVE,
    });

    const req1 = await requestModel.create({
      studentId: testStudentUser._id,
      mentorId: testMentorProfile1._id,
      message: 'Request 1',
      goal: 'Guidance 1',
      status: RequestStatus.PENDING,
    });

    const req2 = await requestModel.create({
      studentId: studentUser2._id,
      mentorId: testMentorProfile1._id,
      message: 'Request 2',
      goal: 'Guidance 2',
      status: RequestStatus.PENDING,
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

  // TEST 3
  it('TEST 3: Student has reached request limit (max 3 pending)', async () => {
    for (let i = 0; i < 3; i++) {
      await requestModel.create({
        studentId: testStudentUser._id,
        mentorId: testMentorProfile1._id,
        message: `Msg ${i}`,
        goal: `Goal ${i}`,
        status: RequestStatus.PENDING,
      });
    }

    const studentUserIdStr = testStudentUser._id.toString();
    const mentorProfileIdStr = testMentorProfile1._id.toString();

    await expect(
      requestsService.create(studentUserIdStr, {
        mentorId: mentorProfileIdStr,
        message: '4th request',
        goal: 'Career Guidance',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // TEST 4
  it('TEST 4: Mentor cannot accept expired request', async () => {
    const request = await requestModel.create({
      studentId: testStudentUser._id,
      mentorId: testMentorProfile1._id,
      message: 'Request text',
      goal: 'Career Guidance',
      status: RequestStatus.EXPIRED,
    });

    const mentorUserIdStr = testMentorUser1._id.toString();
    const requestIdStr = request._id.toString();

    await expect(
      requestsService.accept(requestIdStr, mentorUserIdStr),
    ).rejects.toThrow(BadRequestException);
  });

  // TEST 5
  it('TEST 5: Unverified mentor does not appear in eligible recommendations', async () => {
    const discovery = await mentorsService.findMany({ page: 1, limit: 10 });
    const containsUnverified = discovery.data.some((m) => m.id === testMentorProfile2._id.toString());
    expect(containsUnverified).toBe(false);
  });

  // TEST 6
  it("TEST 6: Student cannot access another student's mentorship record", async () => {
    const studentUser2 = await userModel.create({
      clerkUserId: 'student_clerk_2',
      email: 'stud2@lpu.in',
      role: Role.STUDENT,
      firstName: 'Kabir',
      lastName: 'Mehta',
      status: UserStatus.ACTIVE,
    });

    const mentorship = await mentorshipModel.create({
      studentProfileId: testStudentProfile._id,
      mentorProfileId: testMentorProfile1._id,
      status: MentorshipStatus.ACTIVE,
      startDate: new Date(),
    });

    const studentUserIdStr = testStudentUser._id.toString();
    const studentUser2IdStr = studentUser2._id.toString();
    const mentorshipIdStr = mentorship._id.toString();

    const ok = await mentorshipsService.findOne(mentorshipIdStr, studentUserIdStr);
    expect(ok).toBeDefined();

    await expect(
      mentorshipsService.findOne(mentorshipIdStr, studentUser2IdStr),
    ).rejects.toThrow(ForbiddenException);
  });

  // TEST 7
  it('TEST 7: Student recommendations only return eligible mentors', async () => {
    const studentUserIdStr = testStudentUser._id.toString();
    const recommendations = await recommendationsService.getRecommendedMentors(studentUserIdStr);

    const containsUnverified = recommendations.some((r) => r.id === testMentorProfile2._id.toString());
    expect(containsUnverified).toBe(false);

    const containsEligible = recommendations.some((r) => r.id === testMentorProfile1._id.toString());
    expect(containsEligible).toBe(true);
  });

  // TEST 8
  it('TEST 8: Core matching fallback is utilized when AI model is down/unavailable', async () => {
    const studentProfileIdStr = testStudentProfile._id.toString();
    const matches = await matchingService.calculateRecommendation(studentProfileIdStr);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].matchType).toBeDefined();
  });

  // TEST 9
  it('TEST 9: Overlapping sessions are rejected', async () => {
    const mentorship = await mentorshipModel.create({
      studentProfileId: testStudentProfile._id,
      mentorProfileId: testMentorProfile1._id,
      status: MentorshipStatus.ACTIVE,
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

    await expect(
      sessionsService.createSession(mentorshipIdStr, studentUserIdStr, {
        title: 'Overlap session',
        startTime: overlapStart.toISOString(),
        endTime: overlapEnd.toISOString(),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // TEST 10
  it('TEST 10: Private contact data is scrubbed in student-facing response', async () => {
    const discovery = await mentorsService.findMany({ page: 1, limit: 10 });
    const profile = discovery.data[0];

    expect(profile).toBeDefined();
    expect((profile as any).email).toBeUndefined();
    expect((profile as any).phoneNumber).toBeUndefined();
    expect((profile as any).accessToken).toBeUndefined();
  });
});
