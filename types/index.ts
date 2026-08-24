export type Role = 'STUDENT' | 'MENTOR' | 'ALUMNI_OFFICER' | 'PLACEMENT_OFFICER' | 'ADMIN';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  role: Role;
}

export interface MentorPublicProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  title: string;
  company: string;
  experienceYears: number;
  expertise: string[];
  industry: string;
  graduationYear: string;
  programme: string;
  capacity: {
    max: number;
    current: number;
  };
  acceptingMentees: boolean;
}

export interface MentorMatch extends MentorPublicProfile {
  matchScore: number;
  matchReasons: string[];
}

export type MentorshipStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface MentorshipRequest {
  id: string;
  studentId: string;
  mentorId: string;
  status: MentorshipStatus;
  message: string;
  goal: string;
  createdAt: string;
  mentor?: MentorPublicProfile; // Included when fetching for student
}

export interface Mentorship {
  id: string;
  studentId: string;
  mentorId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'AT_RISK' | 'INACTIVE';
  startDate: string;
  mentor?: MentorPublicProfile;
}

export interface Session {
  id: string;
  mentorshipId: string;
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface Goal {
  id: string;
  mentorshipId: string;
  title: string;
  description: string;
  progress: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  targetDate: string;
}
