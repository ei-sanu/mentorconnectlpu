import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { UserSchema, Role, UserStatus } from './schemas/user.schema';
import { StudentProfileSchema } from './schemas/student-profile.schema';
import { MentorProfileSchema, VerificationStatus, MentorStatus } from './schemas/mentor-profile.schema';
import { AlumniVerificationSchema } from './schemas/alumni-verification.schema';
import { AvailabilitySchema } from './schemas/availability.schema';
import { MentorshipRequestSchema, RequestStatus } from './schemas/mentorship-request.schema';
import { MentorshipSchema, MentorshipStatus } from './schemas/mentorship.schema';
import { SessionSchema, SessionStatus, CalendarSyncStatus } from './schemas/session.schema';
import { GoalSchema, GoalStatus } from './schemas/goal.schema';
import { ActionItemSchema, ActionItemStatus } from './schemas/action-item.schema';
import { ConversationSchema } from './schemas/conversation.schema';
import { MessageSchema } from './schemas/message.schema';
import { NotificationSchema } from './schemas/notification.schema';
import { FeedbackSchema } from './schemas/feedback.schema';
import { SystemConfigSchema } from './schemas/system-config.schema';
import { SkillSchema } from './schemas/skill.schema';
import { IndustrySchema } from './schemas/industry.schema';
import { CareerGoalSchema } from './schemas/career-goal.schema';
import { MentoringAreaSchema } from './schemas/mentoring-area.schema';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/mentorconnect';

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  // Define Mongoose Models
  const User = mongoose.model('User', UserSchema);
  const StudentProfile = mongoose.model('StudentProfile', StudentProfileSchema);
  const MentorProfile = mongoose.model('MentorProfile', MentorProfileSchema);
  const AlumniVerification = mongoose.model('AlumniVerification', AlumniVerificationSchema);
  const Availability = mongoose.model('Availability', AvailabilitySchema);
  const MentorshipRequest = mongoose.model('MentorshipRequest', MentorshipRequestSchema);
  const Mentorship = mongoose.model('Mentorship', MentorshipSchema);
  const Session = mongoose.model('Session', SessionSchema);
  const Goal = mongoose.model('Goal', GoalSchema);
  const ActionItem = mongoose.model('ActionItem', ActionItemSchema);
  const Conversation = mongoose.model('Conversation', ConversationSchema);
  const Message = mongoose.model('Message', MessageSchema);
  const Notification = mongoose.model('Notification', NotificationSchema);
  const Feedback = mongoose.model('Feedback', FeedbackSchema);
  const SystemConfig = mongoose.model('SystemConfig', SystemConfigSchema);
  const Skill = mongoose.model('Skill', SkillSchema);
  const Industry = mongoose.model('Industry', IndustrySchema);
  const CareerGoal = mongoose.model('CareerGoal', CareerGoalSchema);
  const MentoringArea = mongoose.model('MentoringArea', MentoringAreaSchema);

  // 1. Clear existing database collections
  const collections = Object.keys(mongoose.connection.collections);
  for (const name of collections) {
    console.log(`Clearing collection: ${name}`);
    await mongoose.connection.collections[name].deleteMany({});
  }

  console.log('Seeding taxonomic parameters...');
  // 2. Seed Skills
  const skills = await Skill.insertMany([
    { name: 'NestJS' },
    { name: 'TypeScript' },
    { name: 'Node.js' },
    { name: 'React' },
    { name: 'MongoDB' },
    { name: 'System Design' },
    { name: 'Data Structures' },
    { name: 'Machine Learning' },
    { name: 'Cloud Computing' },
  ]);

  // 3. Seed Industries
  const industries = await Industry.insertMany([
    { name: 'Software Engineering' },
    { name: 'Artificial Intelligence' },
    { name: 'Financial Technology' },
    { name: 'E-commerce' },
    { name: 'Cybersecurity' },
  ]);

  // 4. Seed Career Goals
  const careerGoals = await CareerGoal.insertMany([
    { name: 'SDE at FAANG' },
    { name: 'AI/ML Researcher' },
    { name: 'Full Stack Architect' },
    { name: 'Technical Product Manager' },
  ]);

  // 5. Seed Mentoring Areas
  const mentoringAreas = await MentoringArea.insertMany([
    { name: 'Placement Preparation' },
    { name: 'Technical Mock Interviews' },
    { name: 'Resume Review & Branding' },
    { name: 'Career Path Transition' },
  ]);

  // 6. Seed Central System Weight Configurations
  console.log('Seeding System Configurations...');
  await SystemConfig.create({
    key: 'MATCHING_WEIGHTS',
    value: {
      semanticSimilarity: 35,
      careerGoal: 20,
      expertise: 15,
      industry: 10,
      targetRole: 10,
      availability: 10,
    },
  });

  // 7. Seed Admin User
  console.log('Seeding Admin User...');
  await User.create({
    clerkUserId: 'admin_somesh',
    email: 'someshranjanbiswal13678@gmail.com',
    firstName: 'Somesh Ranjan',
    lastName: 'Biswal',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
  });

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
