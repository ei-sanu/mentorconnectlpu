'use client';

import { useEffect, useState } from 'react';
import { Users, ShieldCheck, ShieldAlert, Handshake, Star, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
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

interface AlumniDashboard {
  overview: {
    totalAlumniMentors: number;
    verifiedMentors: number;
    pendingVerifications: number;
    rejectedVerifications: number;
    inactiveMentors: number;
    acceptingMentors: number;
    activeMentees: number;
    completedSessionsCount: number;
  };
  averageSatisfaction: number;
  mentorsByIndustry: { industry: string; count: number }[];
  topCompanies: { company: string; mentors: number; mentees: number }[];
  signupSeries: { month: string; signups: number }[];
  recentVerifications: {
    id: string;
    status: string;
    createdAt: string;
    mentorName: string;
    company: string;
    designation: string;
    programme: string;
    graduationYear: number | null;
  }[];
  meta: { generatedAt: string };
}

interface VerificationsPage {
  data: {
    id: string;
    status: string;
    createdAt: string;
    mentorName: string;
    email: string | null;
    company: string;
    designation: string;
    programme: string;
    graduationYear: number | null;
  }[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  statusCounts: Record<string, number>;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  EXPIRED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const LISTEN_FOR = [
  'VERIFICATION_SUBMITTED',
  'VERIFICATION_APPROVED',
  'VERIFICATION_REJECTED',
  'VERIFICATION_CHANGES_REQUESTED',
  'USER_REGISTERED',
];

export function AlumniOfficerView() {
  const dashboard = useDashboardData<AlumniDashboard>('/alumni-officer/dashboard', { listenFor: LISTEN_FOR });

  // Verifications table state (server-side search/filter/pagination)
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  // Debounce server-side search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const verifications = useDashboardData<VerificationsPage>(
    `/alumni-officer/verifications?page=${page}&limit=8${statusFilter ? `&status=${statusFilter}` : ''}${search ? `&q=${encodeURIComponent(search)}` : ''}`,
    { listenFor: LISTEN_FOR },
  );

  const loading = dashboard.loading || !dashboard.data;

  if (loading && !dashboard.data) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-gray-100 rounded-full w-72 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCardSkeleton count={4} />
        </div>
        <Card>
          <CardHeader>
            <div className="h-4 bg-gray-100 rounded-full w-1/3 animate-pulse" />
          </CardHeader>
          <ChartSkeleton />
        </Card>
        <Card>
          <CardHeader>
            <div className="h-4 bg-gray-100 rounded-full w-1/3 animate-pulse" />
          </CardHeader>
          <TableSkeleton rows={6} />
        </Card>
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
  const v = verifications.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-lpu-text-primary">Alumni Network Dashboard</h1>
          <p className="text-lpu-text-secondary mt-1">
            Alumni engagement and verification health — computed from real platform data.
          </p>
        </div>
        <LastUpdatedBar lastUpdated={dashboard.lastUpdated} onRefresh={() => { dashboard.refetch(); verifications.refetch(); }} refreshing={dashboard.loading || verifications.loading} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Alumni Mentors" value={o.totalAlumniMentors} icon={Users} />
        <StatCard title="Verified Mentors" value={o.verifiedMentors} icon={ShieldCheck} sub={`${o.inactiveMentors} inactive`} />
        <StatCard title="Pending Verifications" value={o.pendingVerifications} icon={ShieldAlert} sub={`${o.rejectedVerifications} rejected all-time`} />
        <StatCard
          title="Average Satisfaction"
          value={dashboard.data?.averageSatisfaction ? `${dashboard.data.averageSatisfaction} / 5` : '—'}
          icon={Star}
          sub={dashboard.data?.averageSatisfaction ? undefined : 'No feedback submitted yet'}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Mentees" value={o.activeMentees} icon={Handshake} />
        <StatCard title="Accepting New Mentees" value={o.acceptingMentors} icon={Users} />
        <StatCard title="Sessions Completed" value={o.completedSessionsCount} icon={ShieldCheck} />
        <StatCard title="Rejected Verifications" value={o.rejectedVerifications} icon={ShieldAlert} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alumni Signups</CardTitle>
            <CardDescription>New mentor accounts per month</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {d.signupSeries.every((m) => m.signups === 0) ? (
              <EmptyState message="No alumni signups yet" hint="Signups will appear as mentors join." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.signupSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8A8A' }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A8A8A' }} />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5' }} />
                  <Bar dataKey="signups" name="Signups" fill="#F37F20" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mentors by Industry</CardTitle>
            <CardDescription>Verified mentors across industries</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {d.mentorsByIndustry.length === 0 ? (
              <EmptyState message="No verified mentors yet" hint="Industry data appears after verification." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.mentorsByIndustry} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
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

      {/* Top companies */}
      <Card>
        <CardHeader>
          <CardTitle>Top Companies of Verified Alumni</CardTitle>
          <CardDescription>Where our mentoring alumni currently work</CardDescription>
        </CardHeader>
        <CardContent>
          {d.topCompanies.length === 0 ? (
            <EmptyState message="No company data yet" hint="Companies appear as mentors complete their profiles." />
          ) : (
            <div className="flex flex-wrap gap-3">
              {d.topCompanies.map((c) => (
                <Badge key={c.company} variant="outline" className="px-3 py-1.5 text-sm bg-white">
                  {c.company}
                  <span className="ml-2 text-lpu-orange font-bold">{c.mentors}</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verifications table — real records, server-side search/filter/pagination */}
      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Verification Requests</CardTitle>
            <CardDescription>All alumni verification records from the database</CardDescription>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search by name, email or company…"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
            />
          </div>
          {/* Status filter tabs driven by real counts */}
          <div className="flex flex-wrap gap-2">
            {[{ key: '', label: 'All' }, ...Object.keys(v?.statusCounts || {}).map((s) => ({ key: s, label: s }))].map(({ key, label }) => {
              const count = key === '' ? Object.values(v?.statusCounts || {}).reduce((a, b) => a + b, 0) : (v?.statusCounts[key] ?? 0);
              const active = statusFilter === key;
              return (
                <button
                  key={label}
                  onClick={() => { setStatusFilter(key); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-lpu-orange text-white border-lpu-orange' : 'bg-white text-gray-600 border-gray-200 hover:border-lpu-orange hover:text-lpu-orange'}`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          {verifications.loading && !v ? (
            <TableSkeleton rows={6} />
          ) : verifications.error && !v ? (
            <ErrorState message={verifications.error!} onRetry={verifications.refetch} />
          ) : !v || v.data.length === 0 ? (
            <EmptyState
              message={search || statusFilter ? 'No matching verification records' : 'No verification requests yet'}
              hint={search || statusFilter ? 'Try a different search or filter.' : 'Requests appear when alumni submit onboarding.'}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-lpu-border text-left text-xs uppercase tracking-wider text-lpu-text-muted">
                      <th className="pb-3 pr-4 font-semibold">Alumni</th>
                      <th className="pb-3 pr-4 font-semibold">Company / Role</th>
                      <th className="pb-3 pr-4 font-semibold">Programme</th>
                      <th className="pb-3 pr-4 font-semibold">Submitted</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {v.data.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-lpu-text-primary">{row.mentorName || 'Unknown'}</p>
                          <p className="text-xs text-lpu-text-secondary">{row.email}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <p>{row.company}</p>
                          <p className="text-xs text-lpu-text-secondary">{row.designation}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <p>{row.programme}{row.graduationYear ? ` • ${row.graduationYear}` : ''}</p>
                        </td>
                        <td className="py-3 pr-4 text-xs text-lpu-text-secondary">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className={STATUS_BADGE[row.status] || ''}>{row.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                <span className="text-xs text-lpu-text-secondary">
                  Page {v.pagination.page} of {Math.max(1, v.pagination.totalPages)} · {v.pagination.total} record{v.pagination.total === 1 ? '' : 's'}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={v.pagination.page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg h-8">
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={v.pagination.page >= v.pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg h-8">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
