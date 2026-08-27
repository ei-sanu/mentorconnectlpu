'use client';

import { useEffect, useState } from 'react';
import {
  GraduationCap,
  Handshake,
  Target,
  CalendarClock,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  StatCard,
  ChartSkeleton,
  TableSkeleton,
  EmptyState,
  ErrorState,
  LastUpdatedBar,
  DashboardCardSkeleton,
} from './primitives';
import { useDashboardData } from '@/hooks/use-dashboard-data';

interface PlacementDashboard {
  overview: {
    totalStudents: number;
    onboardedStudents: number;
    avgProfileCompletion: number;
    activeMentorshipsCount: number;
    atRiskMentorshipsCount: number;
    pendingRequests: number;
    completedSessionsCount: number;
    upcomingSessionsThisWeek: number;
    goalsCompleted: number;
    goalsTotal: number;
    goalCompletionRate: number;
  };
  studentsByTargetIndustry: { industry: string; count: number }[];
  studentsByGraduationYear: { year: number; count: number }[];
  topSkills: { skill: string; count: number }[];
  monthlySeries: { month: string; requests: number; accepted: number }[];
  recentStudents: {
    id: string;
    name: string;
    createdAt: string;
    onboardingStatus: string;
    verificationStatus: string;
  }[];
  meta: { generatedAt: string };
}

interface StudentsPage {
  data: {
    id: string;
    studentName: string;
    programme: string;
    school: string;
    yearOfStudy: number;
    graduationYear: number;
    targetRole: string;
    targetIndustry: string;
    currentSkills: string[];
    profileCompletion: number;
    createdAt: string;
    onboardingStatus: string;
  }[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  industryFilters: { industry: string; count: number }[];
}

const ONBOARDING_BADGE: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  CHANGES_REQUESTED: 'bg-blue-50 text-blue-700 border-blue-200',
};

const LISTEN_FOR = [
  'MENTORSHIP_REQUEST_CREATED',
  'MENTORSHIP_REQUEST_ACCEPTED',
  'MENTORSHIP_REQUEST_DECLINED',
  'SESSION_BOOKED',
  'USER_REGISTERED',
];

export function PlacementOfficerView() {
  const dashboard = useDashboardData<PlacementDashboard>('/placement-officer/dashboard', {
    listenFor: LISTEN_FOR,
  });

  // Students table state (server-side search/filter/pagination)
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const students = useDashboardData<StudentsPage>(
    `/placement-officer/students?page=${page}&limit=8${industryFilter ? `&industry=${encodeURIComponent(industryFilter)}` : ''}${search ? `&q=${encodeURIComponent(search)}` : ''}`,
    { listenFor: LISTEN_FOR },
  );

  if (dashboard.loading && !dashboard.data) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-gray-100 rounded-full w-72 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCardSkeleton count={4} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-100 rounded-full w-1/3 animate-pulse" />
              </CardHeader>
              <ChartSkeleton />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (dashboard.error && !dashboard.data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ErrorState message={dashboard.error} onRetry={dashboard.refetch} />
        </CardContent>
      </Card>
    );
  }

  const d = dashboard.data!;
  const o = d.overview;
  const s = students.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-lpu-text-primary">Student Careers Dashboard</h1>
          <p className="text-lpu-text-secondary mt-1">
            Student career readiness and mentorship engagement — computed from real platform data.
          </p>
        </div>
        <LastUpdatedBar lastUpdated={dashboard.lastUpdated} onRefresh={() => { dashboard.refetch(); students.refetch(); }} refreshing={dashboard.loading || students.loading} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={o.totalStudents} icon={GraduationCap} sub={`${o.onboardedStudents} with career profiles`} />
        <StatCard title="Avg Profile Completion" value={`${o.avgProfileCompletion}%`} icon={TrendingUp} />
        <StatCard title="Active Mentorships" value={o.activeMentorshipsCount} icon={Handshake} sub={o.atRiskMentorshipsCount ? `${o.atRiskMentorshipsCount} at risk` : undefined} />
        <StatCard title="Pending Requests" value={o.pendingRequests} icon={Target} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Goals Completed" value={o.goalsCompleted} icon={Target} sub={`of ${o.goalsTotal} total (${o.goalCompletionRate}%)`} />
        <StatCard title="Sessions Completed" value={o.completedSessionsCount} icon={CalendarClock} />
        <StatCard title="Upcoming Sessions (7d)" value={o.upcomingSessionsThisWeek} icon={CalendarClock} />
        <StatCard title="At-Risk Mentorships" value={o.atRiskMentorshipsCount} icon={TrendingUp} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Student Career Targets by Industry</CardTitle>
            <CardDescription>Where our students want to build careers</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {d.studentsByTargetIndustry.length === 0 ? (
              <EmptyState message="No career targets set yet" hint="Data appears as students complete onboarding." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.studentsByTargetIndustry} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8A8A' }} />
                  <YAxis type="category" dataKey="industry" width={160} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#525252' }} />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5' }} />
                  <Bar dataKey="count" name="Students" fill="#F37F20" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mentorship Demand</CardTitle>
            <CardDescription>Requests vs acceptances per month</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {d.monthlySeries.every((m) => m.requests === 0 && m.accepted === 0) ? (
              <EmptyState message="No mentorship activity yet" hint="Charts populate as students request mentorship." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.monthlySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8A8A' }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8A8A' }} />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5' }} />
                  <Bar dataKey="requests" name="Requests" fill="#F3F4F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="accepted" name="Accepted" fill="#F37F20" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Common Student Skills</CardTitle>
            <CardDescription>Top skills listed across student profiles</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {d.topSkills.length === 0 ? (
              <EmptyState message="No skills data yet" hint="Skills appear as students complete their profiles." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.topSkills} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8A8A' }} />
                  <YAxis type="category" dataKey="skill" width={130} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#525252' }} />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5' }} />
                  <Bar dataKey="count" name="Students" fill="#F37F20" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students by Graduation Year</CardTitle>
            <CardDescription>Cohort distribution across the platform</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {d.studentsByGraduationYear.length === 0 ? (
              <EmptyState message="No student profiles yet" hint="Cohorts appear once students join." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.studentsByGraduationYear.map((g) => ({ ...g, year: String(g.year) }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8A8A' }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8A8A' }} />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5' }} />
                  <Bar dataKey="count" name="Students" fill="#F37F20" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Students table — real records, server-side search/filter/pagination */}
      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Student Career Profiles</CardTitle>
            <CardDescription>All student profiles from the database (contact details excluded)</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={industryFilter}
              onChange={(e) => { setIndustryFilter(e.target.value); setPage(1); }}
              className="h-10 pl-4 pr-8 rounded-xl border border-lpu-border bg-white text-sm cursor-pointer focus:ring-2 focus:ring-lpu-orange focus:outline-none"
            >
              <option value="">All industries</option>
              {(s?.industryFilters || []).map((f) => (
                <option key={f.industry} value={f.industry}>
                  {f.industry} ({f.count})
                </option>
              ))}
            </select>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search name, role or skill…"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {students.loading && !s ? (
            <TableSkeleton rows={6} />
          ) : students.error && !s ? (
            <ErrorState message={students.error!} onRetry={students.refetch} />
          ) : !s || s.data.length === 0 ? (
            <EmptyState
              message={search || industryFilter ? 'No matching student profiles' : 'No student profiles yet'}
              hint={search || industryFilter ? 'Try a different search or filter.' : 'Profiles appear after students complete onboarding.'}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-lpu-border text-left text-xs uppercase tracking-wider text-lpu-text-muted">
                      <th className="pb-3 pr-4 font-semibold">Student</th>
                      <th className="pb-3 pr-4 font-semibold">Programme</th>
                      <th className="pb-3 pr-4 font-semibold">Career Target</th>
                      <th className="pb-3 pr-4 font-semibold">Skills</th>
                      <th className="pb-3 pr-4 font-semibold">Completion</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {s.data.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-lpu-text-primary">{row.studentName || 'Unknown'}</p>
                          <p className="text-xs text-lpu-text-secondary">Class of {row.graduationYear}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <p>{row.programme || '—'}</p>
                          <p className="text-xs text-lpu-text-secondary">Year {row.yearOfStudy}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <p>{row.targetRole || '—'}</p>
                          <p className="text-xs text-lpu-text-secondary">{row.targetIndustry}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {(row.currentSkills || []).slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-[10px] px-2 py-0.5">{skill}</Badge>
                            ))}
                            {(row.currentSkills?.length ?? 0) > 3 && (
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">+{row.currentSkills.length - 3}</Badge>
                            )}
                            {!row.currentSkills?.length && <span className="text-xs text-gray-400">—</span>}
                          </div>
                        </td>
                        <td className="py-3 pr-4 w-32">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-lpu-orange rounded-full" style={{ width: `${row.profileCompletion}%` }} />
                            </div>
                            <span className="text-xs text-lpu-text-secondary w-8">{row.profileCompletion}%</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className={ONBOARDING_BADGE[row.onboardingStatus] || ''}>
                            {(row.onboardingStatus || 'UNKNOWN').replace('_', ' ')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                <span className="text-xs text-lpu-text-secondary">
                  Page {s.pagination.page} of {Math.max(1, s.pagination.totalPages)} · {s.pagination.total} student{s.pagination.total === 1 ? '' : 's'}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={s.pagination.page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg h-8">
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={s.pagination.page >= s.pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg h-8">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent registrations — real records only */}
      {d.recentStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Newest Student Registrations</CardTitle>
            <CardDescription>Latest students who joined the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {d.recentStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-lpu-orange font-bold text-sm">
                      {(student.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-lpu-text-primary">{student.name || 'Unknown student'}</p>
                      <p className="text-xs text-lpu-text-secondary">
                        Joined {new Date(student.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={(ONBOARDING_BADGE[student.onboardingStatus] || '') + ' bg-white'}>
                    {(student.onboardingStatus || 'UNKNOWN').replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
