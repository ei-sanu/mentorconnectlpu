import { MentorPublicProfile, MentorMatch, MentorshipRequest, Mentorship, Session, Goal } from '@/types';

// Mock Data
export const MOCK_MENTORS: MentorPublicProfile[] = [
  {
    id: 'm1',
    userId: 'mentor_1',
    firstName: 'Priya',
    lastName: 'Patel',
    title: 'Senior Software Engineer',
    company: 'Google',
    experienceYears: 6,
    expertise: ['Backend Engineering', 'System Design', 'Node.js', 'Distributed Systems'],
    industry: 'Technology',
    graduationYear: '2019',
    programme: 'B.Tech CSE',
    imageUrl: 'https://picsum.photos/seed/priya/200/200',
    capacity: { max: 3, current: 1 },
    acceptingMentees: true,
  },
  {
    id: 'm2',
    userId: 'mentor_2',
    firstName: 'Vikram',
    lastName: 'Singh',
    title: 'Product Manager',
    company: 'Microsoft',
    experienceYears: 8,
    expertise: ['Product Strategy', 'Agile', 'UI/UX', 'Career Transition'],
    industry: 'Technology',
    graduationYear: '2017',
    programme: 'MBA',
    imageUrl: 'https://picsum.photos/seed/vikram/200/200',
    capacity: { max: 2, current: 2 },
    acceptingMentees: false,
  },
  {
    id: 'm3',
    userId: 'mentor_3',
    firstName: 'Neha',
    lastName: 'Gupta',
    title: 'Data Scientist',
    company: 'Amazon',
    experienceYears: 4,
    expertise: ['Machine Learning', 'Python', 'Data Analytics', 'Interview Prep'],
    industry: 'E-commerce',
    graduationYear: '2021',
    programme: 'B.Tech CSE',
    imageUrl: 'https://picsum.photos/seed/neha/200/200',
    capacity: { max: 4, current: 1 },
    acceptingMentees: true,
  },
];

// Service Layer Abstractions
export const mentorService = {
  getRecommendedMentors: async (): Promise<MentorMatch[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return MOCK_MENTORS.filter(m => m.acceptingMentees).map(m => ({
      ...m,
      matchScore: m.id === 'm1' ? 94 : 85,
      matchReasons: m.id === 'm1' 
        ? ['Strong backend engineering experience', 'Node.js expertise', 'System design experience', 'Matches your target role', 'Currently accepting mentees']
        : ['Python expertise', 'Data analytics experience', 'Recent graduate perspective'],
    }));
  },
  
  searchMentors: async (query: string): Promise<MentorPublicProfile[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!query) return MOCK_MENTORS;
    const lowerQuery = query.toLowerCase();
    return MOCK_MENTORS.filter(m => 
      m.firstName.toLowerCase().includes(lowerQuery) || 
      m.lastName.toLowerCase().includes(lowerQuery) ||
      m.company.toLowerCase().includes(lowerQuery) ||
      m.expertise.some(e => e.toLowerCase().includes(lowerQuery))
    );
  },

  getMentorById: async (id: string): Promise<MentorPublicProfile | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_MENTORS.find(m => m.id === id) || null;
  }
};

export const requestService = {
  createRequest: async (mentorId: string, message: string, goal: string): Promise<MentorshipRequest> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      id: `req_${Date.now()}`,
      studentId: 'student_1', // mocked
      mentorId,
      status: 'PENDING',
      message,
      goal,
      createdAt: new Date().toISOString(),
    };
  },
  
  getStudentRequests: async (): Promise<MentorshipRequest[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return [
      {
        id: 'req_1',
        studentId: 'student_1',
        mentorId: 'm3',
        status: 'PENDING',
        message: 'I would love to learn more about data science.',
        goal: 'Career Guidance',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        mentor: MOCK_MENTORS.find(m => m.id === 'm3')
      }
    ];
  }
};

export const mentorshipService = {
  getActiveMentorships: async (): Promise<Mentorship[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return [
      {
        id: 'ms_1',
        studentId: 'student_1',
        mentorId: 'm1',
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 86400000 * 14).toISOString(),
        mentor: MOCK_MENTORS.find(m => m.id === 'm1')
      }
    ];
  },
  getSessions: async (mentorshipId: string): Promise<Session[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      {
        id: 'sess_1',
        mentorshipId,
        title: 'Initial Career Chat',
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        time: '10:00 AM',
        durationMinutes: 45,
        status: 'COMPLETED'
      },
      {
        id: 'sess_2',
        mentorshipId,
        title: 'Resume Review',
        date: new Date(Date.now() + 86400000 * 2).toISOString(),
        time: '11:00 AM',
        durationMinutes: 30,
        status: 'SCHEDULED'
      }
    ];
  },
  getGoals: async (mentorshipId: string): Promise<Goal[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      {
        id: 'goal_1',
        mentorshipId,
        title: 'Build Backend API Portfolio',
        description: 'Create 2 robust Node.js APIs to showcase in resume.',
        progress: 50,
        status: 'IN_PROGRESS',
        targetDate: new Date(Date.now() + 86400000 * 30).toISOString()
      },
      {
        id: 'goal_2',
        mentorshipId,
        title: 'System Design Interview Prep',
        description: 'Understand scalable architectures.',
        progress: 0,
        status: 'NOT_STARTED',
        targetDate: new Date(Date.now() + 86400000 * 60).toISOString()
      }
    ];
  }
}
