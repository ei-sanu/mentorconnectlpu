'use client';

import {
  Users,
  GraduationCap,
  UserCheck,
  ShieldAlert,
  Handshake,
  CalendarClock,
  AlertTriangle,
  Target,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  StatCard,
  ChartSkeleton,
  ActivitySkeleton,
  EmptyState,
  ErrorState,
  LastUpdatedBar,
  DashboardCardSkeleton,
} from './primitives';
import { useDashboardData } from '@/hooks/use-dashboard-data';

interface AdminMetrics {
  overview: {
    totalUsers: number;
    usersByRole: { role: string; count: number }[];
    totalStudents: number;
    totalVerifiedMentors: number;
    totalMentorProfiles: number;
    totalPendingVerifications: number;
    activeMentorshipsCount: number;
    atRiskMentorshipsCount: number;
    pendingRequests: number;
    sessionsThisWeek: number;
  };
  requests: {
    totalRequests: number;
    acceptanceRate: number;
    rejectionRate: number;
  };
  engagement: {
    completedSessionsCount: number;
    sessionCompletionRate: number;
    sessionsThisWeek: number;
    completedGoalsCount: number;
    mentorUtilization: number;
    averageSatisfaction: number;
  };
  monthlySeries: { month: string; requests: number; accepted: number }[];
  industries: { industry: string; count: number }[];
  recentActivity: { type: string; title: string; detail: string; createdAt: string }[];
  meta: { generatedAt: string };
}

const ACTIVITY_ICON_STYLES: Record<string, string> = {
  VERIFICATION: 'bg-orange-50 text-lpu-orange',
  REQUEST: 'bg-blue-50 text-blue-600',
  USER_JOINED: 'bg-emerald-50 text-emerald-600',
};

const LISTEN_FOR = [
  'VERIFICATION_SUBMITTED',
  'VERIFICATION_APPROVED',
  'VERIFICATION_REJECTED',
  'VERIFICATION_CHANGES_REQUESTED',
  'MENTORSHIP_REQUEST_CREATED',
  'MENTORSHIP_REQUEST_ACCEPTED',
  'MENTORSHIP_REQUEST_DECLINED',
  'SESSION_BOOKED',
  'USER_REGISTERED',
];

export function AdminView() {
  const { data, loading, error, lastUpdated, refetch } = useDashboardData<AdminMetrics>(
    '/analytics/dashboard',
    { listenFor: LISTEN_FOR },
  );

  if (loading && !data) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-gray-100 rounded-full w-64 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCardSkeleton count={4} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-100 rounded-full w-1/2 animate-pulse" />
              </CardHeader>
              <ChartSkeleton />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ErrorState message={error} onRetry={refetch} />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const o = data.overview;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-lpu-text-primary">Platform Analytics</h1>
          <p className="text-lpu-text-secondary mt-1">
            Live mentorship network health across LPU — computed from real platform data.
          </p>
        </div>
        <LastUpdatedBar lastUpdated={lastUpdated} onRefresh={refetch} refreshing={loading} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={o.totalUsers} icon={Users} />
        <StatCard title="Active Students" value={o.totalStudents} icon={GraduationCap} />
        <StatCard title="Verified Mentors" value={o.totalVerifiedMentors} icon={UserCheck} sub={`${o.totalMentorProfiles} profiles total`} />
        <StatCard title="Pending Verifications" value={o.totalPendingVerifications} icon={ShieldAlert} />
        <StatCard title="Active Mentorships" value={o.activeMentorshipsCount} icon={Handshake} />
        <StatCard title="At-Risk Mentorships" value={o.atRiskMentorshipsCount} icon={AlertTriangle} />
        <StatCard title="Pending Requests" value={o.pendingRequests} icon={Target} />
        <StatCard title="Sessions This Week" value={o.sessionsThisWeek} icon={CalendarClock} />
      </div>

      {/* Real time-series chart */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mentorship Requests vs Acceptances</CardTitle>
            <CardDescription>Monthly volume over the last {data.monthlySeries.length} months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {data.monthlySeries.every((m) => m.requests === 0 && m.accepted === 0) ? (
              <EmptyState message="No mentorship activity yet" hint="Charts will populate as requests come in." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8A8A' }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8A8A' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#F9FAFB' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="requests" name="Total Requests" fill="#F3F4F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="accepted" name="Accepted" fill="#F37F20" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Industry distribution — from real mentor profiles */}
        <Card>
          <CardHeader>
            <CardTitle>Verified Mentors by Industry</CardTitle>
            <CardDescription>Where our alumni mentors work</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {data.industries.length === 0 ? (
              <EmptyState message="No verified mentors yet" hint="Industries appear once mentors are verified." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.industries} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8A8A' }} />
                  <YAxis type="category" dataKey="industry" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#525252' }} />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5' }} />
                  <Bar dataKey="count" name="Mentors" fill="#F37F20" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement + activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Engagement</CardTitle>
            <CardDescription>Real engagement metrics from the database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: 'Session completion rate', value: `${data.engagement.sessionCompletionRate}%`, pct: data.engagement.sessionCompletionRate },
              { label: 'Request acceptance rate', value: `${data.requests.acceptanceRate}%`, pct: data.requests.acceptanceRate },
              { label: 'Mentor capacity utilization', value: `${data.engagement.mentorUtilization}%`, pct: data.engagement.mentorUtilization },
              { label: 'Average satisfaction', value: `${data.engagement.averageSatisfaction || '—'}${data.engagement.averageSatisfaction ? ' / 5' : ''}`, pct: (data.engagement.averageSatisfaction / 5) * 100 },
              { label: 'Goals completed', value: String(data.engagement.completedGoalsCount), pct: null },
              { label: 'Sessions completed', value: String(data.engagement.completedSessionsCount), pct: null },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-lpu-text-secondary">{row.label}</span>
                  <span className="font-semibold text-lpu-text-primary">{row.value}</span>
                </div>
                {row.pct !== null && (
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-lpu-orange rounded-full transition-all" style={{ width: `${Math.min(100, row.pct)}%` }} />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Platform Activity</CardTitle>
            <CardDescription>Latest events recorded in the database</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[340px] overflow-auto">
            {data.recentActivity.length === 0 ? (
              <EmptyState message="No recent activity" hint="Activity appears as users join and interact." />
            ) : (
              <div className="space-y-4">
                {data.recentActivity.map((item, i) => (
                  <div key={`${item.type}-${i}`} className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${ACTIVITY_ICON_STYLES[item.type] || 'bg-gray-50 text-gray-500'}`}>
                      <span className="text-xs font-bold">{item.type[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-lpu-text-primary truncate">{item.title}</p>
                      <p className="text-xs text-lpu-text-secondary truncate">{item.detail}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px] bg-white">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
