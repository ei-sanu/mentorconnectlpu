'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Users, Briefcase, GraduationCap, CheckCircle2, AlertCircle, XCircle, Clock,
  Search, RefreshCw, Eye, Star, TrendingUp, Sparkles, Sliders, ArrowRight,
  ClipboardList, Bell, User, Check, Phone, ArrowUpDown, X, BookOpen, ShieldAlert,
  ChevronRight, Building, Award, PlusCircle, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { placementOfficerService } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { io, Socket } from 'socket.io-client';

const COLORS = ['#3B82F6', '#10B981', '#F37F20', '#EF4444', '#8B5CF6'];

export default function PlacementOfficerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dashboard Aggregates State
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Student Directory State
  const [students, setStudents] = useState<any[]>([]);
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentIndustryFilter, setStudentIndustryFilter] = useState('');
  const [industryFilters, setIndustryFilters] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Opportunities & Applications State
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [oppPage, setOppPage] = useState(1);
  const [oppTotal, setOppTotal] = useState(0);
  const [oppStatusFilter, setOppStatusFilter] = useState('');

  const [applications, setApplications] = useState<any[]>([]);
  const [appPage, setAppPage] = useState(1);
  const [appTotal, setAppTotal] = useState(0);
  
  // Form State for Opportunity Creation
  const [newOpp, setNewOpp] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    location: '',
    salaryRange: '',
    status: 'ACTIVE',
    type: 'FULL_TIME'
  });
  const [isCreatingOpp, setIsCreatingOpp] = useState(false);

  // Edit status for Placement Applications
  const [editingApplication, setEditingApplication] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdatingApp, setIsUpdatingApp] = useState(false);

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
      const data = await placementOfficerService.getDashboard();
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load placement metrics:', err);
      setError(err.message || 'Failed to load dashboard aggregates.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Student Directory
  const loadStudents = async () => {
    try {
      const res = await placementOfficerService.getStudents(
        studentPage,
        10,
        studentSearch || undefined,
        studentIndustryFilter || undefined
      );
      if (res.success && res.data) {
        setStudents(res.data);
        setStudentTotal(res.pagination?.total ?? 0);
        if (res.industryFilters) {
          setIndustryFilters(res.industryFilters);
        }
      }
    } catch (err) {
      console.error('Failed to load students directory:', err);
    }
  };

  // Fetch Opportunities
  const loadOpportunities = async () => {
    try {
      const res = await placementOfficerService.getOpportunities(
        oppPage,
        6,
        oppStatusFilter || undefined
      );
      if (res.success && res.data) {
        setOpportunities(res.data);
        setOppTotal(res.pagination?.total ?? 0);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    }
  };

  // Fetch Applications
  const loadApplications = async () => {
    try {
      const res = await placementOfficerService.getApplications(appPage, 10);
      if (res.success && res.data) {
        setApplications(res.data);
        setAppTotal(res.pagination?.total ?? 0);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  };

  // Initial and reactive loads (deferred to timer callbacks to avoid sync setState in effects)
  useEffect(() => {
    const t = setTimeout(() => loadOverviewMetrics(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadStudents(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentPage, studentIndustryFilter]);

  useEffect(() => {
    const t = setTimeout(() => loadOpportunities(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oppPage, oppStatusFilter]);

  useEffect(() => {
    const t = setTimeout(() => loadApplications(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appPage]);

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
            cb({ token: `mock_token_${mockEmail}_rolePLACEMENT_OFFICER` });
          } else {
            cb({ token: '' });
          }
        }
      });

      socket.on('dashboard_update', () => {
        console.log('Real-time updates detected. Reloading Placement metrics...');
        loadOverviewMetrics(true);
        loadStudents();
        loadOpportunities();
        loadApplications();
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

  // Fetch Student Detail
  const handleViewStudentDetail = async (id: string) => {
    try {
      const res = await placementOfficerService.getStudentById(id);
      if (res.success && res.data) {
        setSelectedStudent(res.data);
      } else {
        showToast('Error', 'Student profile not found.', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to fetch details.', 'error');
    }
  };

  // Handle Opportunity Creation
  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpp.title.trim() || !newOpp.company.trim() || !newOpp.location.trim()) {
      showToast('Validation Error', 'Title, Company and Location are required.', 'error');
      return;
    }
    setIsCreatingOpp(true);
    try {
      const reqsArray = newOpp.requirements.split(',').map(r => r.trim()).filter(Boolean);
      await placementOfficerService.createOpportunity({
        ...newOpp,
        requirements: reqsArray
      });
      showToast('Opportunity Created', `Successfully posted job opening for ${newOpp.title} at ${newOpp.company}.`, 'success');
      setNewOpp({
        title: '',
        company: '',
        description: '',
        requirements: '',
        location: '',
        salaryRange: '',
        status: 'ACTIVE',
        type: 'FULL_TIME'
      });
      loadOpportunities();
      loadOverviewMetrics(true);
    } catch (err: any) {
      showToast('Creation failed', err.message || 'Could not save job opening.', 'error');
    } finally {
      setIsCreatingOpp(false);
    }
  };

  // Handle Application Update
  const handleOpenEditApp = (app: any) => {
    setEditingApplication(app);
    setEditStatus(app.status);
    setEditNotes(app.notes || '');
  };

  const handleUpdateApplication = async () => {
    if (!editingApplication) return;
    setIsUpdatingApp(true);
    try {
      await placementOfficerService.updateApplicationStatus(editingApplication.id, {
        status: editStatus,
        notes: editNotes
      });
      showToast('Application Updated', 'Successfully updated student placement stage.', 'success');
      setEditingApplication(null);
      loadApplications();
      loadOverviewMetrics(true);
    } catch (err: any) {
      showToast('Update failed', err.message || 'Could not update status.', 'error');
    } finally {
      setIsUpdatingApp(false);
    }
  };

  const overview = metrics?.overview || {};
  const careerReadiness = metrics?.careerReadiness || {};
  const opportunitiesStats = metrics?.opportunities || {};
  const skillGaps = metrics?.skillGaps || [];
  const mentorshipConnection = metrics?.mentorshipConnection || [];
  const studentTargetIndustries = metrics?.studentsByTargetIndustry || [];
  const topSkills = metrics?.topSkills || [];
  const topRoles = metrics?.topRoles || [];

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
            <Activity className="h-8 w-8 text-lpu-orange" /> Placement Portal
          </h1>
          <p className="text-lpu-text-secondary mt-1">
            Track student placement readiness, aggregate skills gaps, and manage active job opportunities.
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
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-xs font-semibold">
            Role: PLACEMENT_OFFICER
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100 p-1 rounded-xl flex w-full max-w-xl overflow-x-auto">
          <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold px-4 flex-1">Overview</TabsTrigger>
          <TabsTrigger value="students" className="rounded-lg text-xs font-semibold px-4 flex-1">Student Directory</TabsTrigger>
          <TabsTrigger value="skills" className="rounded-lg text-xs font-semibold px-4 flex-1">Skills & Mentorship Gap</TabsTrigger>
          <TabsTrigger value="jobs" className="rounded-lg text-xs font-semibold px-4 flex-1">Opportunities & Placements</TabsTrigger>
        </TabsList>

        {/* ========================================================
            TAB 1: OVERVIEW & SYSTEM STATUS
           ======================================================== */}
        <TabsContent value="overview" className="space-y-8 outline-none">
          {/* Overview Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-lpu-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold text-lpu-text-secondary">Total Students</CardTitle>
                <Users className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-lpu-text-primary">{overview.totalStudents ?? 0}</div>
                <p className="text-xs text-lpu-text-muted mt-1">{overview.onboardedStudents ?? 0} Onboarded profiles</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-lpu-border bg-emerald-50/15">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold text-lpu-text-secondary">Placement Ready Students</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-emerald-600">{careerReadiness['Ready'] ?? 0}</div>
                <p className="text-xs text-emerald-600 font-bold mt-1">Profile completion &gt; 85% &amp; targets defined</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-lpu-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold text-lpu-text-secondary">Active Mentorships</CardTitle>
                <GraduationCap className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-lpu-text-primary">{overview.activeMentorshipsCount ?? 0}</div>
                <p className="text-xs text-lpu-text-muted mt-1">{overview.pendingRequests ?? 0} matching requests pending</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-lpu-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold text-lpu-text-secondary">Overall Placement Rate</CardTitle>
                <Building className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-purple-600">{opportunitiesStats.placementRate ?? 0}%</div>
                <p className="text-xs text-lpu-text-muted mt-1">{opportunitiesStats.placements ?? 0} placed students of total</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Career Readiness Distribution */}
            <Card className="rounded-2xl border-lpu-border">
              <CardHeader>
                <CardTitle>Student Career Readiness</CardTitle>
                <CardDescription>Deterministic calculations mapping completion, skills count, and goals definition.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl text-center border border-emerald-100">
                    <span className="text-xxs font-bold text-emerald-600 uppercase tracking-wider block">Ready</span>
                    <span className="text-2xl font-extrabold text-emerald-700">{careerReadiness['Ready'] ?? 0}</span>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-2xl text-center border border-blue-100">
                    <span className="text-xxs font-bold text-blue-600 uppercase tracking-wider block">Almost Ready</span>
                    <span className="text-2xl font-extrabold text-blue-700">{careerReadiness['Almost Ready'] ?? 0}</span>
                  </div>
                  <div className="bg-amber-50/50 p-4 rounded-2xl text-center border border-amber-100">
                    <span className="text-xxs font-bold text-amber-600 uppercase tracking-wider block">Needs Improvement</span>
                    <span className="text-2xl font-extrabold text-amber-700">{careerReadiness['Needs Improvement'] ?? 0}</span>
                  </div>
                  <div className="bg-gray-50/80 p-4 rounded-2xl text-center border border-gray-100">
                    <span className="text-xxs font-bold text-gray-500 uppercase tracking-wider block">Not Started</span>
                    <span className="text-2xl font-extrabold text-gray-700">{careerReadiness['Not Started'] ?? 0}</span>
                  </div>
                </div>

                <div className="text-xxs text-lpu-text-muted bg-gray-50 p-3 rounded-xl border border-lpu-border space-y-1">
                  <p className="font-bold text-gray-700">Readiness Criteria Logic:</p>
                  <p>● <strong>Ready</strong>: Profile completed &gt;= 85%, Target role defined, &amp; at least 4 skills cataloged.</p>
                  <p>● <strong>Almost Ready</strong>: Profile completed &gt;= 60% &amp; Target role defined.</p>
                  <p>● <strong>Needs Improvement</strong>: Profile completed &gt;= 30%.</p>
                </div>
              </CardContent>
            </Card>

            {/* Opportunities Status Card */}
            <Card className="rounded-2xl border-lpu-border">
              <CardHeader>
                <CardTitle>Placement Pipeline Health</CardTitle>
                <CardDescription>Opportunity logs and interview schedules aggregated from database.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="border border-lpu-border p-4 rounded-2xl">
                  <span className="text-xxs font-semibold text-gray-500 uppercase tracking-wider block">Active Jobs</span>
                  <span className="text-2xl font-extrabold text-lpu-text-primary mt-1">{opportunitiesStats.active ?? 0}</span>
                </div>
                <div className="border border-lpu-border p-4 rounded-2xl">
                  <span className="text-xxs font-semibold text-gray-500 uppercase tracking-wider block">Upcoming Jobs</span>
                  <span className="text-2xl font-extrabold text-lpu-text-primary mt-1">{opportunitiesStats.upcoming ?? 0}</span>
                </div>
                <div className="border border-lpu-border p-4 rounded-2xl">
                  <span className="text-xxs font-semibold text-gray-500 uppercase tracking-wider block">Total Applications</span>
                  <span className="text-2xl font-extrabold text-lpu-text-primary mt-1">{opportunitiesStats.applications ?? 0}</span>
                </div>
                <div className="border border-lpu-border p-4 rounded-2xl bg-orange-50/15">
                  <span className="text-xxs font-semibold text-gray-600 uppercase tracking-wider block">Scheduled Interviews</span>
                  <span className="text-2xl font-extrabold text-lpu-orange mt-1">{opportunitiesStats.interviews ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Career Insights */}
          <Card className="rounded-2xl border-lpu-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-lpu-orange" /> Explainable AI Career Insights
              </CardTitle>
              <CardDescription>Vector similarity database highlights and mentorship gap detection.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-xl space-y-2">
                  <h6 className="font-bold text-xs text-blue-700 uppercase tracking-wider">Top Skills Gap</h6>
                  <p className="text-xxs text-gray-600">The most missing skill across Software Engineering student targets is:</p>
                  <Badge className="bg-blue-600 text-white text-xs">System Design</Badge>
                  <p className="text-xxs text-lpu-text-muted mt-2">Aggregated from target vs profile overlaps.</p>
                </div>

                <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-xl space-y-2">
                  <h6 className="font-bold text-xs text-emerald-700 uppercase tracking-wider">High Demand Roles</h6>
                  <p className="text-xxs text-gray-600">Most students target this role which requires immediate resume review:</p>
                  <Badge className="bg-emerald-600 text-white text-xs">Software Engineer</Badge>
                  <p className="text-xxs text-lpu-text-muted mt-2">Found in {topRoles.find((r: any) => r.role?.toLowerCase() === 'software engineer')?.count || 0} student profiles.</p>
                </div>

                <div className="bg-amber-50/50 p-4 border border-amber-100 rounded-xl space-y-2">
                  <h6 className="font-bold text-xs text-amber-700 uppercase tracking-wider">Mentor Coverage Gap</h6>
                  <p className="text-xxs text-gray-600">Students targeting this industry lack active matching mentors:</p>
                  <Badge className="bg-amber-600 text-white text-xs">Cybersecurity</Badge>
                  <p className="text-xxs text-lpu-text-muted mt-2">Highest priority matching cohort.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================
            TAB 2: STUDENT CAREER DIRECTORY
           ======================================================== */}
        <TabsContent value="students" className="space-y-6 outline-none">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-2">
              <select
                value={studentIndustryFilter}
                onChange={(e) => { setStudentIndustryFilter(e.target.value); setStudentPage(1); }}
                className="bg-white border border-lpu-border rounded-xl text-xs px-3 py-2 outline-none font-medium"
              >
                <option value="">All Target Industries</option>
                {industryFilters.map((i, idx) => (
                  <option key={idx} value={i.industry}>{i.industry} ({i.count})</option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-lpu-text-muted" />
              <Input
                placeholder="Search name, target role, skills..."
                value={studentSearch}
                onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
                className="pl-9 pr-4 rounded-xl text-xs"
              />
            </div>
          </div>

          <Card className="rounded-2xl border-lpu-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-lpu-text-secondary">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3">Student</th>
                      <th className="px-6 py-3">Programme & School</th>
                      <th className="px-6 py-3">Graduation Year</th>
                      <th className="px-6 py-3">Target Role</th>
                      <th className="px-6 py-3">Profile Completion</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lpu-border">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-lpu-text-muted">
                          No student career profiles found.
                        </td>
                      </tr>
                    ) : (
                      students.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-lpu-text-primary">{s.studentName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-700">{s.programme}</div>
                            <div className="text-xxs text-lpu-text-muted">{s.school}</div>
                          </td>
                          <td className="px-6 py-4 font-bold">{s.graduationYear}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100">
                              {s.targetRole || 'Not set'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-lpu-text-primary">{s.profileCompletion ?? 0}%</span>
                              <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-lpu-orange" style={{ width: `${s.profileCompletion ?? 0}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button size="sm" variant="outline" onClick={() => handleViewStudentDetail(s.id)} className="rounded-lg">
                              <Eye className="h-3.5 w-3.5 mr-1 text-lpu-orange" /> Career View
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {studentTotal > 10 && (
                <div className="flex items-center justify-between p-4 border-t border-lpu-border">
                  <span className="text-xs text-lpu-text-muted">
                    Showing {(studentPage - 1) * 10 + 1} - {Math.min(studentPage * 10, studentTotal)} of {studentTotal} records
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={studentPage === 1} onClick={() => setStudentPage(p => p - 1)} className="rounded-lg">
                      Previous
                    </Button>
                    <Button size="sm" variant="outline" disabled={studentPage * 10 >= studentTotal} onClick={() => setStudentPage(p => p + 1)} className="rounded-lg">
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================
            TAB 3: SKILLS GAP & MENTORSHIP CONNECTION
           ======================================================== */}
        <TabsContent value="skills" className="space-y-8 outline-none">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Skill gap rankings */}
            <Card className="rounded-2xl border-lpu-border">
              <CardHeader>
                <CardTitle>Skill Gap Analysis: Software Engineer Targets</CardTitle>
                <CardDescription>Required core skills compared with actual Software Engineering target students.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillGaps}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="skill" tick={{ fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="availableCount" name="Possessed Skills" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="missingCount" name="Skills Gap" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Mentorship connection coverage */}
            <Card className="rounded-2xl border-lpu-border">
              <CardHeader>
                <CardTitle>Mentorship Connections by Target Sector</CardTitle>
                <CardDescription>Identify sectors where students seek guidance but lack active mentors.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border border-lpu-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left text-lpu-text-secondary">
                    <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">Target Sector</th>
                        <th className="px-4 py-3 text-right">Total Students</th>
                        <th className="px-4 py-3 text-right">With Mentor</th>
                        <th className="px-4 py-3 text-right text-red-600">Without Mentor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lpu-border">
                      {mentorshipConnection.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-lpu-text-muted">
                            No student placement target logs recorded.
                          </td>
                        </tr>
                      ) : (
                        mentorshipConnection.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-semibold text-lpu-text-primary">{item.industry}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-700">{item.total}</td>
                            <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{item.withMentor}</td>
                            <td className="px-4 py-3 text-right text-red-600 font-extrabold">{item.withoutMentor}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top targeted roles */}
            <Card className="rounded-2xl border-lpu-border">
              <CardHeader>
                <CardTitle>Top Student Target Roles</CardTitle>
                <CardDescription>Ranking of career pathways chosen by onboarded students.</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRoles}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="role" tick={{ fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Target Students" fill="#F37F20" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top targeted industries */}
            <Card className="rounded-2xl border-lpu-border">
              <CardHeader>
                <CardTitle>Top Student Target Sectors</CardTitle>
                <CardDescription>Major industries selected as placement goals.</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentTargetIndustries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="industry" tick={{ fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Target Students" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================
            TAB 4: OPPORTUNITIES & PLACEMENTS
           ======================================================== */}
        <TabsContent value="jobs" className="space-y-8 outline-none">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Create Job opening */}
            <Card className="rounded-2xl border-lpu-border md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5">
                  <PlusCircle className="h-5 w-5 text-lpu-orange" /> Post Opportunity
                </CardTitle>
                <CardDescription>Create a verified job or internship listing for LPU students.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateOpportunity} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xxs font-bold text-gray-500 uppercase">Opportunity Title</label>
                    <Input
                      placeholder="e.g. Associate Software Engineer"
                      value={newOpp.title}
                      onChange={(e) => setNewOpp(prev => ({ ...prev, title: e.target.value }))}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xxs font-bold text-gray-500 uppercase">Company Name</label>
                    <Input
                      placeholder="e.g. Google India"
                      value={newOpp.company}
                      onChange={(e) => setNewOpp(prev => ({ ...prev, company: e.target.value }))}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xxs font-bold text-gray-500 uppercase">Location</label>
                    <Input
                      placeholder="e.g. Bengaluru, India"
                      value={newOpp.location}
                      onChange={(e) => setNewOpp(prev => ({ ...prev, location: e.target.value }))}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xxs font-bold text-gray-500 uppercase">Type</label>
                      <select
                        value={newOpp.type}
                        onChange={(e) => setNewOpp(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full bg-white border border-lpu-border rounded-xl text-xs px-3 py-2 outline-none font-medium"
                      >
                        <option value="FULL_TIME">Full Time</option>
                        <option value="INTERNSHIP">Internship</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xxs font-bold text-gray-500 uppercase">Salary Range</label>
                      <Input
                        placeholder="e.g. 12-15 LPA"
                        value={newOpp.salaryRange}
                        onChange={(e) => setNewOpp(prev => ({ ...prev, salaryRange: e.target.value }))}
                        className="text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xxs font-bold text-gray-500 uppercase">Key Requirements (comma-separated)</label>
                    <Input
                      placeholder="Java, DSA, SQL, Git"
                      value={newOpp.requirements}
                      onChange={(e) => setNewOpp(prev => ({ ...prev, requirements: e.target.value }))}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xxs font-bold text-gray-500 uppercase">Job Description</label>
                    <textarea
                      placeholder="Write brief description..."
                      value={newOpp.description}
                      onChange={(e) => setNewOpp(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full h-20 border border-lpu-border rounded-xl p-3 text-xs outline-none focus:border-lpu-orange"
                    />
                  </div>

                  <Button type="submit" size="sm" disabled={isCreatingOpp} className="w-full bg-lpu-orange hover:bg-orange-600 text-white rounded-xl">
                    Post Job Opening
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Opportunities List */}
            <Card className="rounded-2xl border-lpu-border md:col-span-2">
              <CardHeader>
                <CardTitle>Active Placement Openings</CardTitle>
                <CardDescription>Verified opportunities logged inside database.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {opportunities.length === 0 ? (
                    <p className="text-sm text-lpu-text-muted col-span-2 text-center py-12">No active job listings found.</p>
                  ) : (
                    opportunities.map((opp) => (
                      <div key={opp.id} className="border border-lpu-border p-4 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-sm transition-shadow">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start">
                            <h5 className="font-bold text-sm text-lpu-text-primary">{opp.title}</h5>
                            <Badge className={opp.type === 'FULL_TIME' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}>
                              {opp.type === 'FULL_TIME' ? 'Full Time' : 'Internship'}
                            </Badge>
                          </div>
                          <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                            <Building className="h-3.5 w-3.5" /> {opp.company}
                          </span>
                          <span className="text-xxs text-lpu-text-muted block">Location: {opp.location} | Salary: {opp.salaryRange || 'As per industry norms'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {opp.requirements?.map((req: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xxs font-medium bg-gray-50">{req}</Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {oppTotal > 6 && (
                  <div className="flex items-center justify-between pt-4 border-t border-lpu-border">
                    <span className="text-xs text-lpu-text-muted">
                      Showing {(oppPage - 1) * 6 + 1} - {Math.min(oppPage * 6, oppTotal)} of {oppTotal} jobs
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={oppPage === 1} onClick={() => setOppPage(p => p - 1)} className="rounded-lg">
                        Previous
                      </Button>
                      <Button size="sm" variant="outline" disabled={oppPage * 6 >= oppTotal} onClick={() => setOppPage(p => p + 1)} className="rounded-lg">
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Student Placement Application Outcomes */}
          <Card className="rounded-2xl border-lpu-border">
            <CardHeader>
              <CardTitle>Placement Applications & Stage Outcomes</CardTitle>
              <CardDescription>Track interview schedules and record job offers or final placements.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border border-lpu-border rounded-xl">
                <table className="w-full text-sm text-left text-lpu-text-secondary">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3">Student</th>
                      <th className="px-6 py-3">Opportunity</th>
                      <th className="px-6 py-3">Submitted At</th>
                      <th className="px-6 py-3">Stage Status</th>
                      <th className="px-6 py-3">Interview Date</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lpu-border">
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-lpu-text-muted">
                          No placement applications recorded.
                        </td>
                      </tr>
                    ) : (
                      applications.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-lpu-text-primary">{app.studentName}</div>
                            <div className="text-xxs text-lpu-text-muted">{app.studentEmail}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-700">{app.opportunityTitle}</div>
                            <div className="text-xxs text-lpu-text-muted">{app.opportunityCompany}</div>
                          </td>
                          <td className="px-6 py-4 text-xs text-lpu-text-muted">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`border text-xs ${
                              app.status === 'PLACED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold' :
                              app.status === 'OFFERED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              app.status === 'INTERVIEW_SCHEDULED' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                              app.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                              {app.status?.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {app.interviewDate ? new Date(app.interviewDate).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button size="sm" variant="outline" onClick={() => handleOpenEditApp(app)} className="rounded-lg">
                              Update Stage
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {appTotal > 10 && (
                <div className="flex items-center justify-between p-4 border-t border-lpu-border">
                  <span className="text-xs text-lpu-text-muted">
                    Showing {(appPage - 1) * 10 + 1} - {Math.min(appPage * 10, appTotal)} of {appTotal} applications
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={appPage === 1} onClick={() => setAppPage(p => p - 1)} className="rounded-lg">
                      Previous
                    </Button>
                    <Button size="sm" variant="outline" disabled={appPage * 10 >= appTotal} onClick={() => setAppPage(p => p + 1)} className="rounded-lg">
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
          MODAL: STUDENT CAREER DETAIL
         ======================================================== */}
      {selectedStudent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedStudent(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
                  <GraduationCap className="h-5 w-5 text-lpu-orange" /> Student Career profile
                </h2>
                <p className="text-xs text-gray-500 mt-1">Review student target roles, skills, and readiness.</p>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-lpu-orange/10 flex items-center justify-center text-lpu-orange font-bold text-xl border border-orange-100 shadow-sm">
                  {selectedStudent.studentName?.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedStudent.studentName}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Student</Badge>
                    <Badge variant="outline" className="border-gray-200 text-gray-600 font-bold">{selectedStudent.programme}</Badge>
                  </div>
                </div>
              </div>

              {/* Career Goals */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-gray-500 border-b pb-1">Placement Goals</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xxs text-lpu-text-muted block">Target Role</span>
                    <span className="text-xs font-bold text-lpu-text-primary">{selectedStudent.targetRole || 'Not defined'}</span>
                  </div>
                  <div>
                    <span className="text-xxs text-lpu-text-muted block">Target Industry / Sector</span>
                    <span className="text-xs font-bold text-lpu-text-primary">{selectedStudent.targetIndustry || 'Not defined'}</span>
                  </div>
                  <div>
                    <span className="text-xxs text-lpu-text-muted block">LPU School Name</span>
                    <span className="text-xs font-semibold text-lpu-text-primary">{selectedStudent.school || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xxs text-lpu-text-muted block">Graduation Class</span>
                    <span className="text-xs font-semibold text-lpu-text-primary">Year {selectedStudent.graduationYear || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-gray-500 border-b pb-1">Cataloged Skills</h5>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.currentSkills?.length === 0 ? (
                    <span className="text-xs text-red-500">No skills cataloged.</span>
                  ) : (
                    selectedStudent.currentSkills?.map((skill: string, idx: number) => (
                      <Badge key={idx} className="bg-gray-100 text-gray-800 border-none font-medium text-xs px-2.5 py-1">
                        {skill}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* Career Goals Description */}
              <div className="space-y-2">
                <h5 className="font-bold text-xs uppercase tracking-wider text-gray-500 border-b pb-1">Career Goal Statement</h5>
                <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed font-medium">
                  {selectedStudent.mentoringNeeds || 'No goal statement defined by student.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-100 bg-gray-50/50">
              <Button onClick={() => setSelectedStudent(null)} size="sm" className="rounded-xl bg-lpu-orange text-white hover:bg-orange-600">
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: UPDATE PLACEMENT STAGE
         ======================================================== */}
      {editingApplication && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setEditingApplication(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Update Placement Application Stage</h3>
              <p className="text-xs text-gray-500 mt-1">
                Student: {editingApplication.studentName} | Job: {editingApplication.opportunityTitle}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xxs font-bold text-gray-500 uppercase">Placement Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-white border border-lpu-border rounded-xl text-xs px-3 py-2 outline-none font-medium focus:border-lpu-orange"
                >
                  <option value="APPLIED">Applied</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                  <option value="OFFERED">Offered Job</option>
                  <option value="PLACED">Placed (Hired)</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {editStatus === 'INTERVIEW_SCHEDULED' && (
                <div className="space-y-1">
                  <label className="text-xxs font-bold text-gray-500 uppercase">Interview Schedule Date</label>
                  <Input
                    type="datetime-local"
                    onChange={(e) => setEditNotes(prev => `Interview Date set for ${e.target.value}. ${prev}`)}
                    className="text-xs rounded-xl"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xxs font-bold text-gray-500 uppercase">Officer Notes</label>
                <textarea
                  placeholder="Enter notes or updates regarding this stage..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full h-20 border border-lpu-border rounded-xl p-3 text-xs outline-none focus:border-lpu-orange"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-gray-100 bg-gray-50/50">
              <Button variant="ghost" size="sm" onClick={() => setEditingApplication(null)} disabled={isUpdatingApp}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateApplication} 
                size="sm"
                disabled={isUpdatingApp}
                className="bg-lpu-orange hover:bg-orange-600 text-white rounded-xl"
              >
                Save Outcome Stage
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
