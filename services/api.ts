import { MentorPublicProfile, MentorMatch, MentorshipRequest, Mentorship, Session, Goal } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Wait up to `maxMs` for window.Clerk.session to be ready, then return a JWT.
 * Clerk sets window.Clerk synchronously when its script loads, but session
 * is populated asynchronously after the OAuth redirect completes.
 */
async function getClerkToken(maxMs = 3000): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // Intercept and return mock token with active role if logged in via mock account
  const mockEmail = localStorage.getItem('mock_user_email');
  if (mockEmail) {
    const activeRole = localStorage.getItem('active_role') || 'ADMIN';
    return `mock_token_${mockEmail}_role${activeRole}`;
  }

  const poll = async (elapsed = 0): Promise<string | null> => {
    const clerk = (window as any).Clerk;
    if (clerk?.session) {
      try {
        const token = await clerk.session.getToken();
        if (token) return token;
      } catch {
        // session exists but token not ready yet — fall through to retry
      }
    }
    if (elapsed >= maxMs) return null;
    await new Promise(r => setTimeout(r, 150));
    return poll(elapsed + 150);
  };

  return poll();
}

// API Fetch helper
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };

  // Always try to attach the Clerk JWT — wait briefly for session on first load
  const token = await getClerkToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error?.message || json?.message || `HTTP error! status: ${response.status}`);
  }

  // Handle standard response wrapper { success: true, data: T }
  return (json.data ?? json) as T;
}


// ─────────────────────────────────────────────────
// MENTOR SERVICE
// ─────────────────────────────────────────────────
export const mentorService = {
  getRecommendedMentors: async (): Promise<MentorMatch[]> => {
    return apiFetch<MentorMatch[]>('/recommendations/mentors');
  },

  searchMentors: async (query: string): Promise<MentorPublicProfile[]> => {
    return apiFetch<MentorPublicProfile[]>(`/mentors?search=${encodeURIComponent(query)}`);
  },

  getMentorById: async (id: string): Promise<MentorPublicProfile | null> => {
    try {
      return await apiFetch<MentorPublicProfile>(`/mentors/${id}`);
    } catch {
      return null;
    }
  },

  // Get mentor's own profile
  getMyProfile: async (): Promise<any | null> => {
    try {
      return await apiFetch<any>('/mentors/me');
    } catch {
      return null;
    }
  },

  updateMyProfile: async (data: Record<string, any>): Promise<any> => {
    return apiFetch('/mentors/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// ─────────────────────────────────────────────────
// REQUEST SERVICE
// ─────────────────────────────────────────────────
export const requestService = {
  createRequest: async (mentorId: string, message: string, goal: string): Promise<MentorshipRequest> => {
    return apiFetch<MentorshipRequest>('/requests', {
      method: 'POST',
      body: JSON.stringify({ mentorId, message, goal }),
    });
  },

  getStudentRequests: async (): Promise<MentorshipRequest[]> => {
    return apiFetch<MentorshipRequest[]>('/requests');
  },

  // Mentor: get incoming requests
  getMentorRequests: async (): Promise<MentorshipRequest[]> => {
    return apiFetch<MentorshipRequest[]>('/requests');
  },

  acceptRequest: async (id: string): Promise<void> => {
    await apiFetch(`/requests/${id}/accept`, { method: 'POST' });
  },

  declineRequest: async (id: string): Promise<void> => {
    await apiFetch(`/requests/${id}/decline`, { method: 'POST' });
  },

  cancelRequest: async (id: string): Promise<void> => {
    await apiFetch(`/requests/${id}/cancel`, { method: 'POST' });
  },
};

// ─────────────────────────────────────────────────
// MENTORSHIP SERVICE
// ─────────────────────────────────────────────────
export const mentorshipService = {
  getActiveMentorships: async (): Promise<Mentorship[]> => {
    return apiFetch<Mentorship[]>('/mentorships');
  },

  getMentorshipById: async (id: string): Promise<Mentorship | null> => {
    try {
      return await apiFetch<Mentorship>(`/mentorships/${id}`);
    } catch {
      return null;
    }
  },

  getSessions: async (mentorshipId: string): Promise<Session[]> => {
    return apiFetch<Session[]>(`/mentorships/${mentorshipId}/sessions`);
  },

  getGoals: async (mentorshipId: string): Promise<Goal[]> => {
    return apiFetch<Goal[]>(`/mentorships/${mentorshipId}/goals`);
  },

  updateStatus: async (id: string, status: string): Promise<Mentorship> => {
    return apiFetch<Mentorship>(`/mentorships/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// ─────────────────────────────────────────────────
// STUDENT SERVICE
// ─────────────────────────────────────────────────
export const studentService = {
  getMyProfile: async (): Promise<any | null> => {
    try {
      return await apiFetch<any>('/students/me');
    } catch {
      return null;
    }
  },

  updateProfile: async (data: Record<string, any>): Promise<any> => {
    return apiFetch('/students/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  updateCareer: async (data: Record<string, any>): Promise<any> => {
    return apiFetch('/students/me/career', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// ─────────────────────────────────────────────────
// USER SERVICE
// ─────────────────────────────────────────────────
export const userService = {
  getMe: async (): Promise<any> => {
    try {
      return await apiFetch('/me');
    } catch {
      return null;
    }
  },

  updateMe: async (data: Record<string, any>): Promise<any> => {
    return apiFetch('/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  submitOnboarding: async (data: Record<string, any>): Promise<any> => {
    return await apiFetch('/me/onboard', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ─────────────────────────────────────────────────
// NOTIFICATION SERVICE
// ─────────────────────────────────────────────────
export const notificationService = {
  getNotifications: async (): Promise<{
    id: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
  }[]> => {
    return apiFetch('/notifications');
  },

  markRead: async (id: string): Promise<void> => {
    await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  markAllRead: async (): Promise<void> => {
    await apiFetch('/notifications/read-all', { method: 'POST' });
  },
};

// ─────────────────────────────────────────────────
// ANALYTICS / ADMIN SERVICE
// ─────────────────────────────────────────────────
export const adminService = {
  getDashboardMetrics: async (): Promise<{
    totalStudents: number;
    totalMentors: number;
    activeMentorships: number;
    acceptanceRate: number;
    pendingVerifications: number;
    recentRequests: MentorshipRequest[];
  }> => {
    return apiFetch('/analytics/dashboard');
  },

  getUsers: async (): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
  }[]> => {
    return apiFetch('/admin/users');
  },

  getPendingVerifications: async (): Promise<{
    id: string;
    userId: string;
    status: string;
    submittedAt: string;
    user?: { firstName: string; lastName: string; email: string };
  }[]> => {
    return apiFetch('/verification');
  },

  approveVerification: async (id: string): Promise<void> => {
    await apiFetch(`/verification/${id}/approve`, { method: 'PATCH' });
  },

  rejectVerification: async (id: string, reason: string): Promise<void> => {
    await apiFetch(`/verification/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectionReason: reason }),
    });
  },

  requestChangesVerification: async (id: string, explanation: string): Promise<void> => {
    await apiFetch(`/verification/${id}/request-changes`, {
      method: 'PATCH',
      body: JSON.stringify({ explanation }),
    });
  },

  getAdminDashboard: async (): Promise<any> => {
    return apiFetch('/admin/dashboard');
  },

  getUserGrowth: async (days: number): Promise<any> => {
    return apiFetch(`/admin/user-growth?days=${days}`);
  },

  getVerificationOverview: async (): Promise<any> => {
    return apiFetch('/admin/verification-overview');
  },

  getMentorshipOverview: async (): Promise<any> => {
    return apiFetch('/admin/mentorship-overview');
  },

  getMentorUtilization: async (): Promise<any> => {
    return apiFetch('/admin/mentor-utilization');
  },

  getMatchingOverview: async (): Promise<any> => {
    return apiFetch('/admin/matching-overview');
  },

  getTopSkills: async (): Promise<any> => {
    return apiFetch('/admin/top-skills');
  },

  getTopIndustries: async (): Promise<any> => {
    return apiFetch('/admin/top-industries');
  },

  getAuditLogs: async (limit = 50): Promise<any> => {
    return apiFetch(`/admin/audit-logs?limit=${limit}`);
  },

  getSystemHealth: async (): Promise<any> => {
    // Hits the existing structural health endpoint
    return apiFetch('/health');
  },
};

// ─────────────────────────────────────────────────
// ALUMNI OFFICER SERVICE
// ─────────────────────────────────────────────────
export const alumniOfficerService = {
  getDashboard: async (): Promise<any> => {
    return apiFetch('/alumni-officer/dashboard');
  },

  getVerifications: async (
    page = 1,
    limit = 10,
    status?: string,
    q?: string
  ): Promise<any> => {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status ? { status } : {}),
      ...(q ? { q } : {}),
    });
    return apiFetch(`/alumni-officer/verifications?${query.toString()}`);
  },

  getMentors: async (
    page = 1,
    limit = 10,
    q?: string
  ): Promise<any> => {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(q ? { q } : {}),
    });
    return apiFetch(`/alumni-officer/mentors?${query.toString()}`);
  },

  getVerificationById: async (id: string): Promise<any> => {
    return apiFetch(`/verification/${id}`);
  },

  approveVerification: async (id: string): Promise<any> => {
    return apiFetch(`/verification/${id}/approve`, { method: 'PATCH' });
  },

  rejectVerification: async (id: string, reason: string): Promise<any> => {
    return apiFetch(`/verification/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectionReason: reason }),
    });
  },

  requestChangesVerification: async (id: string, explanation: string): Promise<any> => {
    return apiFetch(`/verification/${id}/request-changes`, {
      method: 'PATCH',
      body: JSON.stringify({ explanation }),
    });
  },
};

// ─────────────────────────────────────────────────
// PLACEMENT OFFICER SERVICE
// ─────────────────────────────────────────────────
export const placementOfficerService = {
  getDashboard: async (): Promise<any> => {
    return apiFetch('/placement-officer/dashboard');
  },

  getStudents: async (
    page = 1,
    limit = 10,
    q?: string,
    industry?: string
  ): Promise<any> => {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(q ? { q } : {}),
      ...(industry ? { industry } : {}),
    });
    return apiFetch(`/placement-officer/students?${query.toString()}`);
  },

  getStudentById: async (id: string): Promise<any> => {
    return apiFetch(`/placement-officer/students/${id}`);
  },

  getOpportunities: async (
    page = 1,
    limit = 10,
    status?: string
  ): Promise<any> => {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status ? { status } : {}),
    });
    return apiFetch(`/placement-officer/opportunities?${query.toString()}`);
  },

  createOpportunity: async (body: any): Promise<any> => {
    return apiFetch('/placement-officer/opportunities', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getApplications: async (
    page = 1,
    limit = 10
  ): Promise<any> => {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return apiFetch(`/placement-officer/applications?${query.toString()}`);
  },

  updateApplicationStatus: async (id: string, body: any): Promise<any> => {
    return apiFetch(`/placement-officer/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
};
