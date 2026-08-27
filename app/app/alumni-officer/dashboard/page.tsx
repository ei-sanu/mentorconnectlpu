'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Users, UserCheck, ShieldAlert, FileText, CheckCircle2, XCircle, 
  AlertCircle, Activity, Search, RefreshCw, Eye, Calendar, BookOpen, 
  Building, Award, Star, TrendingUp, Sparkles, Sliders, ArrowRight,
  ClipboardList, Bell, User, Clock, Check, Phone, ArrowUpDown, X, GraduationCap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import { alumniOfficerService } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { io, Socket } from 'socket.io-client';

export default function AlumniOfficerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dashboard Aggregates State
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification Queue State
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verifPage, setVerifPage] = useState(1);
  const [verifTotal, setVerifTotal] = useState(0);
  const [verifStatus, setVerifStatus] = useState<string>('PENDING');
  const [verifSearch, setVerifSearch] = useState('');
  
  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionType, setActionType] = useState<'reject' | 'changes' | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Directories State
  const [alumniDir, setAlumniDir] = useState<any[]>([]);
  const [alumniPage, setAlumniPage] = useState(1);
  const [alumniTotal, setAlumniTotal] = useState(0);
  const [alumniSearch, setAlumniSearch] = useState('');

  const [mentorDir, setMentorDir] = useState<any[]>([]);
  const [mentorPage, setMentorPage] = useState(1);
  const [mentorTotal, setMentorTotal] = useState(0);
  const [mentorSearch, setMentorSearch] = useState('');

  // Sorting
  const [verifSortDir, setVerifSortDir] = useState<'asc' | 'desc'>('desc');

  // Custom Toast State
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'error' | 'info' } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Show Toast helper
  const showToast = (title: string, desc: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch Dashboard Aggregates
  const loadOverviewMetrics = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await alumniOfficerService.getDashboard();
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load alumni metrics:', err);
      setError(err.message || 'Failed to load dashboard aggregates.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Verification Queue
  const loadVerifications = async () => {
    try {
      const res = await alumniOfficerService.getVerifications(
        verifPage,
        10,
        verifStatus || undefined,
        verifSearch || undefined
      );
      if (res.success && res.data) {
        let items = res.data;
        if (verifSortDir === 'asc') {
          items = [...items].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else {
          items = [...items].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        setVerifications(items);
        setVerifTotal(res.pagination?.total ?? 0);
      }
    } catch (err) {
      console.error('Failed to load verifications queue:', err);
    }
  };

  // Fetch Directories
  const loadAlumniDirectory = async () => {
    try {
      const res = await alumniOfficerService.getMentors(alumniPage, 10, alumniSearch || undefined);
      if (res.success && res.data) {
        const list = res.data.filter((m: any) => m.verificationStatus === 'VERIFIED');
        setAlumniDir(list);
        setAlumniTotal(res.pagination?.total ?? 0);
      }
    } catch (err) {
      console.error('Failed to load alumni directory:', err);
    }
  };

  const loadMentorDirectory = async () => {
    try {
      const res = await alumniOfficerService.getMentors(mentorPage, 10, mentorSearch || undefined);
      if (res.success && res.data) {
        const list = res.data.filter((m: any) => m.verificationStatus === 'VERIFIED');
        setMentorDir(list);
        setMentorTotal(res.pagination?.total ?? 0);
      }
    } catch (err) {
      console.error('Failed to load mentor directory:', err);
    }
  };

  // Initial and reactive queries (deferred to timer callbacks to avoid sync setState in effects)
  useEffect(() => {
    const t = setTimeout(() => loadOverviewMetrics(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadVerifications(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifPage, verifStatus, verifSortDir]);

  useEffect(() => {
    const t = setTimeout(() => loadAlumniDirectory(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumniPage]);

  useEffect(() => {
    const t = setTimeout(() => loadMentorDirectory(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentorPage]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    try {
      const socketUrl = process.env.NEXT_PUBLIC_API_URL 
        ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') 
        : 'http://localhost:3001';
      
      const socket = io(`${socketUrl}/chat`, {
        transports: ['websocket'],
        auth: async (cb) => {
          const mockEmail = localStorage.getItem('mock_user_email');
          if (mockEmail) {
            cb({ token: `mock_token_${mockEmail}_roleALUMNI_OFFICER` });
          } else {
            cb({ token: '' });
          }
        }
      });

      socket.on('connect', () => {
        console.log('Alumni Officer connected to real-time events gateway');
      });

      socket.on('dashboard_update', () => {
        console.log('Real-time updates detected. Reloading Alumni metrics...');
        loadOverviewMetrics(true);
        loadVerifications();
        loadAlumniDirectory();
        loadMentorDirectory();
      });

      socketRef.current = socket;
    } catch (err) {
      console.warn('Real-time events disabled:', err);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleReviewRequest = async (id: string) => {
    try {
      const detail = await alumniOfficerService.getVerificationById(id);
      setSelectedRequest(detail);
      setActionReason('');
      setActionType(null);
    } catch (err: any) {
      showToast('Error', err.message || 'Could not load submission info.', 'error');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsSubmittingAction(true);
    try {
      await alumniOfficerService.approveVerification(selectedRequest.id);
      showToast('Success', `${selectedRequest.user?.firstName || 'Alumni'} has been approved and activated.`, 'success');
      setSelectedRequest(null);
      loadVerifications();
      loadOverviewMetrics(true);
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to approve application.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const submitActionWithReason = async () => {
    if (!selectedRequest || !actionType || !actionReason.trim()) return;
    setIsSubmittingAction(true);
    try {
      if (actionType === 'reject') {
        await alumniOfficerService.rejectVerification(selectedRequest.id, actionReason);
        showToast('Application Rejected', 'The verification request has been rejected.', 'error');
      } else {
        await alumniOfficerService.requestChangesVerification(selectedRequest.id, actionReason);
        showToast('Changes Requested', 'The user has been notified of required corrections.', 'info');
      }
      setSelectedRequest(null);
      loadVerifications();
      loadOverviewMetrics(true);
    } catch (err: any) {
      showToast('Action failed', err.message || 'Failed to process request.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-10 w-10 border-4 border-lpu-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-lpu-text-secondary">Analyzing database metrics & running aggregations...</p>
      </div>
    );
  }

  const alumniByYear = metrics?.signupSeries || [];
  const topCompanies = metrics?.topCompanies || [];
  const industryDistribution = metrics?.mentorsByIndustry || [];

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 z-[99] max-w-sm rounded-xl p-4 shadow-lg border flex gap-3 items-start animate-slide-in bg-white ${
          toastMessage.type === 'success' ? 'border-emerald-200 text-emerald-800' :
          toastMessage.type === 'error' ? 'border-red-200 text-red-800' :
          'border-blue-200 text-blue-800'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
          {toastMessage.type === 'error' && <XCircle className="h-5 w-5 shrink-0 text-red-600" />}
          {toastMessage.type === 'info' && <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />}
          <div>
            <h5 className="font-bold text-sm">{toastMessage.title}</h5>
            <p className="text-xs text-gray-500 mt-1">{toastMessage.desc}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-lpu-text-primary flex items-center gap-2">
            <Activity className="h-8 w-8 text-lpu-orange" /> Alumni Officer Panel
          </h1>
          <p className="text-lpu-text-secondary mt-1">
            Review alumni qualifications, manage verified mentors, and monitor engagement rates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => loadOverviewMetrics(true)}
            disabled={refreshing}
            className="rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge className="bg-orange-50 text-orange-700 border-orange-200 border text-xs">
            Role: ALUMNI_OFFICER
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100 p-1 rounded-xl flex w-full max-w-lg overflow-x-auto">
          <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold px-4 flex-1">Overview</TabsTrigger>
          <TabsTrigger value="verification" className="rounded-lg text-xs font-semibold px-4 flex-1">Verification Queue</TabsTrigger>
          <TabsTrigger value="alumni-dir" className="rounded-lg text-xs font-semibold px-4 flex-1">Alumni Directory</TabsTrigger>
          <TabsTrigger value="mentor-dir" className="rounded-lg text-xs font-semibold px-4 flex-1">Mentor Profiles</TabsTrigger>
        </TabsList>

        {/* ========================================================
            TAB 1: OVERVIEW & ANALYTICS
           ======================================================== */}
        <TabsContent value="overview" className="space-y-8 outline-none">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-lpu-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold text-lpu-text-secondary">Total Alumni Profiles</CardTitle>
                <Users className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-lpu-text-primary">{metrics?.overview?.totalAlumniMentors ?? 0}</div>
                <p className="text-xs text-lpu-text-muted mt-1">Registered accounts</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-lpu-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold text-lpu-text-secondary">Verified Alumni</CardTitle>
                <UserCheck className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-lpu-text-primary">{metrics?.overview?.verifiedMentors ?? 0}</div>
                <p className="text-xs text-emerald-600 font-bold mt-1">Credential review approved</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-lpu-border bg-orange-50/15">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold text-lpu-text-secondary">Pending Verifications</CardTitle>
                <ShieldAlert className="h-5 w-5 text-lpu-orange" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-lpu-orange">{metrics?.overview?.pendingVerifications ?? 0}</div>
                <p className="text-xs text-lpu-text-muted mt-1">Requires immediate review</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-lpu-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold text-lpu-text-secondary">Active Mentorships</CardTitle>
                <GraduationCap className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-lpu-text-primary">{metrics?.overview?.activeMentees ?? 0}</div>
                <p className="text-xs text-lpu-text-muted mt-1">{metrics?.overview?.completedSessionsCount ?? 0} Sessions completed</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-lpu-border">
            <CardHeader>
              <CardTitle>Mentor Performance Diagnostics</CardTitle>
              <CardDescription>Aggregation of mentoring statistics and feedback scores.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-gray-50 p-4 rounded-xl space-y-1">
                <span className="text-xxs font-bold text-gray-500 uppercase tracking-wider block">Average Rating</span>
                <div className="flex items-center gap-1.5">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span className="text-2xl font-extrabold text-lpu-text-primary">
                    {metrics?.averageSatisfaction ? metrics.averageSatisfaction : '4.6'}
                  </span>
                  <span className="text-xs text-lpu-text-muted">/ 5.0</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-1">
                <span className="text-xxs font-bold text-gray-500 uppercase tracking-wider block">Mentees Per Mentor</span>
                <span className="text-2xl font-extrabold text-lpu-text-primary">
                  {metrics?.overview?.verifiedMentors > 0 
                    ? (metrics?.overview?.activeMentees / metrics?.overview?.verifiedMentors).toFixed(1) 
                    : '1.2'}
                </span>
                <span className="text-xs text-lpu-text-muted block">Current active load ratio</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-1">
                <span className="text-xxs font-bold text-gray-500 uppercase tracking-wider block">Acceptance Status</span>
                <span className="text-2xl font-extrabold text-emerald-600">
                  {metrics?.overview?.acceptingMentors ?? 0}
                </span>
                <span className="text-xs text-lpu-text-muted block">Mentors accepting requests</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-1">
                <span className="text-xxs font-bold text-gray-500 uppercase tracking-wider block">Inactive Mentors</span>
                <span className="text-2xl font-extrabold text-red-600">
                  {metrics?.overview?.inactiveMentors ?? 0}
                </span>
                <span className="text-xs text-lpu-text-muted block">Capacity paused or inactive</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-2xl border-lpu-border">
              <CardHeader>
                <CardTitle>Alumni Registration Growth</CardTitle>
                <CardDescription>Cumulative count over the last 6 months.</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={alumniByYear}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="signups" name="Registered Alumni" stroke="#F37F20" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-lpu-border">
              <CardHeader>
                <CardTitle>Industry Focus Areas</CardTitle>
                <CardDescription>Focus sectors selected by verified alumni.</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={industryDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="industry" tick={{ fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Verified Alumni" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-2xl border-lpu-border">
              <CardHeader>
                <CardTitle>Top Alumni Employers</CardTitle>
                <CardDescription>Primary companies of registered LPU alumni.</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCompanies} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} />
                    <YAxis type="category" dataKey="company" tick={{ fontSize: 10 }} axisLine={false} width={80} />
                    <Tooltip />
                    <Bar dataKey="mentors" name="Alumni Mentors" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-lpu-border">
              <CardHeader>
                <CardTitle>Recent Verified Logs</CardTitle>
                <CardDescription>Recent onboarding applications pending review.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics?.recentVerifications?.length === 0 ? (
                  <p className="text-sm text-lpu-text-muted text-center py-6">No verifications pending review.</p>
                ) : (
                  metrics?.recentVerifications?.slice(0, 4).map((v: any) => (
                    <div key={v.id} className="flex justify-between items-center p-3 border border-lpu-border rounded-xl">
                      <div>
                        <h6 className="text-xs font-bold text-lpu-text-primary">{v.mentorName}</h6>
                        <span className="text-xxs text-lpu-text-muted">{v.programme} • Class of {v.graduationYear}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => { setActiveTab('verification'); handleReviewRequest(v.id); }} className="rounded-lg text-xs text-lpu-orange">
                        Review <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================
            TAB 2: ALUMNI VERIFICATION QUEUE
           ======================================================== */}
        <TabsContent value="verification" className="space-y-6 outline-none">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {['PENDING', 'VERIFIED', 'REJECTED', 'CHANGES_REQUESTED'].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={verifStatus === status ? 'default' : 'outline'}
                  onClick={() => { setVerifStatus(status); setVerifPage(1); }}
                  className="rounded-lg text-xs"
                >
                  {status === 'CHANGES_REQUESTED' ? 'Changes Requested' : status.charAt(0) + status.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-lpu-text-muted" />
                <Input
                  placeholder="Search name, email, company..."
                  value={verifSearch}
                  onChange={(e) => { setVerifSearch(e.target.value); setVerifPage(1); }}
                  className="pl-9 pr-4 rounded-xl text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVerifSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="rounded-xl"
              >
                <ArrowUpDown className="h-4 w-4 mr-1" /> Sort
              </Button>
            </div>
          </div>

          <Card className="rounded-2xl border-lpu-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-lpu-text-secondary">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3">Alumni</th>
                      <th className="px-6 py-3">Programme</th>
                      <th className="px-6 py-3">Graduation Year</th>
                      <th className="px-6 py-3">Company</th>
                      <th className="px-6 py-3">Submitted At</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lpu-border">
                    {verifications.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-lpu-text-muted">
                          No verification requests found matching the selection.
                        </td>
                      </tr>
                    ) : (
                      verifications.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-lpu-text-primary">{v.mentorName}</div>
                              <div className="text-xxs text-lpu-text-muted">{v.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">{v.programme}</td>
                          <td className="px-6 py-4 font-bold">{v.graduationYear}</td>
                          <td className="px-6 py-4">{v.company}</td>
                          <td className="px-6 py-4 text-xs text-lpu-text-muted">
                            {new Date(v.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`border text-xs ${
                              v.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              v.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              v.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                              {v.status === 'CHANGES_REQUESTED' ? 'Changes Requested' : v.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button size="sm" variant="outline" onClick={() => handleReviewRequest(v.id)} className="rounded-lg">
                              <Eye className="h-3.5 w-3.5 mr-1 text-lpu-orange" /> Review
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {verifTotal > 10 && (
                <div className="flex items-center justify-between p-4 border-t border-lpu-border">
                  <span className="text-xs text-lpu-text-muted">
                    Showing {(verifPage - 1) * 10 + 1} - {Math.min(verifPage * 10, verifTotal)} of {verifTotal} requests
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={verifPage === 1} onClick={() => setVerifPage(p => p - 1)} className="rounded-lg">
                      Previous
                    </Button>
                    <Button size="sm" variant="outline" disabled={verifPage * 10 >= verifTotal} onClick={() => setVerifPage(p => p + 1)} className="rounded-lg">
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================
            TAB 3: ALUMNI DIRECTORY
           ======================================================== */}
        <TabsContent value="alumni-dir" className="space-y-6 outline-none">
          <div className="flex gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-lpu-text-muted" />
              <Input
                placeholder="Search alumni by name, school, company..."
                value={alumniSearch}
                onChange={(e) => { setAlumniSearch(e.target.value); setAlumniPage(1); }}
                className="pl-9 pr-4 rounded-xl text-xs"
              />
            </div>
            <Button size="sm" onClick={loadAlumniDirectory} className="rounded-xl">
              Search
            </Button>
          </div>

          <Card className="rounded-2xl border-lpu-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-lpu-text-secondary">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3">Alumni Name</th>
                      <th className="px-6 py-3">Programme</th>
                      <th className="px-6 py-3">Graduation Year</th>
                      <th className="px-6 py-3">Current Company</th>
                      <th className="px-6 py-3">Designation</th>
                      <th className="px-6 py-3">Industry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lpu-border">
                    {alumniDir.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-lpu-text-muted">
                          No verified alumni profiles found.
                        </td>
                      </tr>
                    ) : (
                      alumniDir.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-lpu-text-primary">{a.mentorName}</td>
                          <td className="px-6 py-4">{a.programme}</td>
                          <td className="px-6 py-4 font-bold">{a.graduationYear}</td>
                          <td className="px-6 py-4">{a.currentCompany || '—'}</td>
                          <td className="px-6 py-4">{a.currentDesignation || '—'}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline">{a.industry || 'General'}</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {alumniTotal > 10 && (
                <div className="flex items-center justify-between p-4 border-t border-lpu-border">
                  <span className="text-xs text-lpu-text-muted">
                    Showing {(alumniPage - 1) * 10 + 1} - {Math.min(alumniPage * 10, alumniTotal)} of {alumniTotal} records
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={alumniPage === 1} onClick={() => setAlumniPage(p => p - 1)} className="rounded-lg">
                      Previous
                    </Button>
                    <Button size="sm" variant="outline" disabled={alumniPage * 10 >= alumniTotal} onClick={() => setAlumniPage(p => p + 1)} className="rounded-lg">
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================
            TAB 4: MENTOR DIRECTORY
           ======================================================== */}
        <TabsContent value="mentor-dir" className="space-y-6 outline-none">
          <div className="flex gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-lpu-text-muted" />
              <Input
                placeholder="Search mentors by name, designation, industry..."
                value={mentorSearch}
                onChange={(e) => { setMentorSearch(e.target.value); setMentorPage(1); }}
                className="pl-9 pr-4 rounded-xl text-xs"
              />
            </div>
            <Button size="sm" onClick={loadMentorDirectory} className="rounded-xl">
              Search
            </Button>
          </div>

          <Card className="rounded-2xl border-lpu-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-lpu-text-secondary">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3">Mentor Name</th>
                      <th className="px-6 py-3">Company & Role</th>
                      <th className="px-6 py-3">Experience</th>
                      <th className="px-6 py-3">Active Mentees</th>
                      <th className="px-6 py-3">Max Capacity</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lpu-border">
                    {mentorDir.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-lpu-text-muted">
                          No verified mentor records found.
                        </td>
                      </tr>
                    ) : (
                      mentorDir.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-lpu-text-primary">{m.mentorName}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-700">{m.currentDesignation}</div>
                            <div className="text-xxs text-lpu-text-muted">{m.currentCompany}</div>
                          </td>
                          <td className="px-6 py-4 font-bold">{m.yearsOfExperience} Years</td>
                          <td className="px-6 py-4 font-semibold text-lpu-text-primary">{m.currentMenteesCount ?? 0}</td>
                          <td className="px-6 py-4">{m.maxCapacity ?? 3}</td>
                          <td className="px-6 py-4">
                            <Badge className={m.acceptingMentees ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                              {m.acceptingMentees ? 'Accepting' : 'Full'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {mentorTotal > 10 && (
                <div className="flex items-center justify-between p-4 border-t border-lpu-border">
                  <span className="text-xs text-lpu-text-muted">
                    Showing {(mentorPage - 1) * 10 + 1} - {Math.min(mentorPage * 10, mentorTotal)} of {mentorTotal} records
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={mentorPage === 1} onClick={() => setMentorPage(p => p - 1)} className="rounded-lg">
                      Previous
                    </Button>
                    <Button size="sm" variant="outline" disabled={mentorPage * 10 >= mentorTotal} onClick={() => setMentorPage(p => p + 1)} className="rounded-lg">
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================================
          MODAL: VERIFICATION REVIEW DETAILS (LIGHTWEIGHT COMPONENT)
         ======================================================== */}
      {selectedRequest && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedRequest(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-lpu-orange" /> Onboarding Application Review
                </h2>
                <p className="text-xs text-gray-500 mt-1">Review credentials details and uploaded proofs.</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <span className="text-xxs text-lpu-text-muted uppercase block font-semibold">Applicant Name</span>
                  <span className="text-sm font-bold text-lpu-text-primary">
                    {selectedRequest.user ? `${selectedRequest.user.firstName} ${selectedRequest.user.lastName}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xxs text-lpu-text-muted uppercase block font-semibold">Verification Role</span>
                  <Badge variant="outline" className="mt-1 bg-orange-50 text-orange-700">Alumni Mentor</Badge>
                </div>
              </div>

              {/* LPU Credentials */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-gray-500 border-b pb-1">University Credentials</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xxs text-lpu-text-muted block">LPU Registration Number</span>
                    <span className="text-xs font-mono font-bold text-lpu-text-primary">{selectedRequest.registrationNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xxs text-lpu-text-muted block">LPU Verification Email</span>
                    <span className="text-xs font-semibold text-lpu-text-primary">{selectedRequest.lpuEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xxs text-lpu-text-muted block">Programme / Degree</span>
                    <span className="text-xs font-semibold text-lpu-text-primary">{selectedRequest.programme || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xxs text-lpu-text-muted block">Class of Graduation</span>
                    <span className="text-xs font-bold text-lpu-text-primary">{selectedRequest.graduationYear || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xxs text-lpu-text-muted block">School</span>
                    <span className="text-xs font-semibold text-lpu-text-primary">{selectedRequest.school || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xxs text-lpu-text-muted block">Specialization / Branch</span>
                    <span className="text-xs font-semibold text-lpu-text-primary">{selectedRequest.submittedData?.specialization || 'General'}</span>
                  </div>
                </div>
              </div>

              {/* Professional */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-gray-500 border-b pb-1">Professional & Mentoring Areas</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xxs text-lpu-text-muted block">Current Workplace</span>
                    <span className="text-xs font-semibold text-lpu-text-primary">{selectedRequest.company || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xxs text-lpu-text-muted block">Current Job Title</span>
                    <span className="text-xs font-semibold text-lpu-text-primary">{selectedRequest.designation || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-gray-500 border-b pb-1">Submitted Proof Documents</h5>
                {selectedRequest.documentUrl ? (
                  <div className="border border-lpu-border p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-lpu-orange" />
                      <div className="text-xs">
                        <div className="font-semibold text-gray-800">Verification_Certificate.pdf</div>
                        <span className="text-xxs text-lpu-text-muted">LPU Alumni Credential Proof</span>
                      </div>
                    </div>
                    <a 
                      href={selectedRequest.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-lpu-orange hover:underline"
                    >
                      View Document
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">No proof documents attached.</p>
                )}
              </div>

              {/* Action Inputs */}
              {actionType && (
                <div className="space-y-2 border-t pt-4">
                  <span className="text-xs font-bold text-gray-700 block capitalize">
                    Provide reason for {actionType === 'reject' ? 'Rejection' : 'Changes Request'}:
                  </span>
                  <Input
                    placeholder="Enter notes or explanation for the user..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-gray-100 bg-gray-50/50">
              {actionType ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setActionType(null)} disabled={isSubmittingAction}>
                    Back
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={submitActionWithReason} 
                    disabled={isSubmittingAction || !actionReason.trim()}
                  >
                    Confirm {actionType === 'reject' ? 'Rejection' : 'Changes'}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActionType('changes')} 
                    disabled={isSubmittingAction}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50 rounded-xl"
                  >
                    Request Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActionType('reject')} 
                    disabled={isSubmittingAction}
                    className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                  >
                    Reject
                  </Button>
                  <Button 
                    onClick={handleApprove} 
                    size="sm"
                    disabled={isSubmittingAction}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                  >
                    Approve & Activate
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
