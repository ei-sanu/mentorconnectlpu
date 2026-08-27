"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const user_schema_1 = require("./schemas/user.schema");
const student_profile_schema_1 = require("./schemas/student-profile.schema");
const mentor_profile_schema_1 = require("./schemas/mentor-profile.schema");
const alumni_verification_schema_1 = require("./schemas/alumni-verification.schema");
const availability_schema_1 = require("./schemas/availability.schema");
const mentorship_request_schema_1 = require("./schemas/mentorship-request.schema");
const mentorship_schema_1 = require("./schemas/mentorship.schema");
const session_schema_1 = require("./schemas/session.schema");
const goal_schema_1 = require("./schemas/goal.schema");
const action_item_schema_1 = require("./schemas/action-item.schema");
const conversation_schema_1 = require("./schemas/conversation.schema");
const message_schema_1 = require("./schemas/message.schema");
const notification_schema_1 = require("./schemas/notification.schema");
const feedback_schema_1 = require("./schemas/feedback.schema");
const system_config_schema_1 = require("./schemas/system-config.schema");
const skill_schema_1 = require("./schemas/skill.schema");
const industry_schema_1 = require("./schemas/industry.schema");
const career_goal_schema_1 = require("./schemas/career-goal.schema");
const mentoring_area_schema_1 = require("./schemas/mentoring-area.schema");
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/mentorconnect';
async function seed() {
    console.log('Connecting to MongoDB...');
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('Connected successfully!');
    const User = mongoose_1.default.model('User', user_schema_1.UserSchema);
    const StudentProfile = mongoose_1.default.model('StudentProfile', student_profile_schema_1.StudentProfileSchema);
    const MentorProfile = mongoose_1.default.model('MentorProfile', mentor_profile_schema_1.MentorProfileSchema);
    const AlumniVerification = mongoose_1.default.model('AlumniVerification', alumni_verification_schema_1.AlumniVerificationSchema);
    const Availability = mongoose_1.default.model('Availability', availability_schema_1.AvailabilitySchema);
    const MentorshipRequest = mongoose_1.default.model('MentorshipRequest', mentorship_request_schema_1.MentorshipRequestSchema);
    const Mentorship = mongoose_1.default.model('Mentorship', mentorship_schema_1.MentorshipSchema);
    const Session = mongoose_1.default.model('Session', session_schema_1.SessionSchema);
    const Goal = mongoose_1.default.model('Goal', goal_schema_1.GoalSchema);
    const ActionItem = mongoose_1.default.model('ActionItem', action_item_schema_1.ActionItemSchema);
    const Conversation = mongoose_1.default.model('Conversation', conversation_schema_1.ConversationSchema);
    const Message = mongoose_1.default.model('Message', message_schema_1.MessageSchema);
    const Notification = mongoose_1.default.model('Notification', notification_schema_1.NotificationSchema);
    const Feedback = mongoose_1.default.model('Feedback', feedback_schema_1.FeedbackSchema);
    const SystemConfig = mongoose_1.default.model('SystemConfig', system_config_schema_1.SystemConfigSchema);
    const Skill = mongoose_1.default.model('Skill', skill_schema_1.SkillSchema);
    const Industry = mongoose_1.default.model('Industry', industry_schema_1.IndustrySchema);
    const CareerGoal = mongoose_1.default.model('CareerGoal', career_goal_schema_1.CareerGoalSchema);
    const MentoringArea = mongoose_1.default.model('MentoringArea', mentoring_area_schema_1.MentoringAreaSchema);
    const collections = Object.keys(mongoose_1.default.connection.collections);
    for (const name of collections) {
        console.log(`Clearing collection: ${name}`);
        await mongoose_1.default.connection.collections[name].deleteMany({});
    }
    console.log('Seeding taxonomic parameters...');
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
    const industries = await Industry.insertMany([
        { name: 'Software Engineering' },
        { name: 'Artificial Intelligence' },
        { name: 'Financial Technology' },
        { name: 'E-commerce' },
        { name: 'Cybersecurity' },
    ]);
    const careerGoals = await CareerGoal.insertMany([
        { name: 'SDE at FAANG' },
        { name: 'AI/ML Researcher' },
        { name: 'Full Stack Architect' },
        { name: 'Technical Product Manager' },
    ]);
    const mentoringAreas = await MentoringArea.insertMany([
        { name: 'Placement Preparation' },
        { name: 'Technical Mock Interviews' },
        { name: 'Resume Review & Branding' },
        { name: 'Career Path Transition' },
    ]);
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
    console.log('Seeding Admin User...');
    await User.create({
        clerkUserId: 'admin_somesh',
        email: 'someshranjanbiswal13678@gmail.com',
        firstName: 'Somesh Ranjan',
        lastName: 'Biswal',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        role: user_schema_1.Role.ADMIN,
        status: user_schema_1.UserStatus.ACTIVE,
    });
    console.log('Seeding completed successfully!');
    await mongoose_1.default.disconnect();
}
seed().catch((err) => {
    console.error('Seeding failed:', err);
    mongoose_1.default.disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map