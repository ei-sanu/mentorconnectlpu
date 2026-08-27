'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/mock-auth';
import { userService, mentorService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Award,
  Building2,
  GraduationCap,
  X,
  Users,
} from 'lucide-react';

interface MeUser {
  firstName: string;
  lastName: string;
  email: string;
  lpuRegistrationNumber?: string;
  phoneDetails?: { verified?: boolean; e164?: string };
}

interface MentorProfileData {
  programme: string;
  graduationYear: number;
  currentCompany: string;
  currentDesignation: string;
  yearsOfExperience: number;
  industry: string;
  expertise: string[];
  mentoringAreas: string[];
  bio: string;
  careerSummary: string;
  maxCapacity: number;
  currentMenteesCount: number;
  acceptingMentees: boolean;
  verificationStatus: string;
}

const VERIFICATION_STYLES: Record<string, { cls: string; label: string }> = {
  VERIFIED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Verified Alumni' },
  PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Verification Pending' },
  REJECTED: { cls: 'bg-red-50 text-red-700 border-red-200', label: 'Verification Rejected' },
  EXPIRED: { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Verification Expired' },
};

export default function MentorProfilePage() {
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [meUser, setMeUser] = useState<MeUser | null>(null);

  const [programme, setProgramme] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentDesignation, setCurrentDesignation] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [industry, setIndustry] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [mentoringAreas, setMentoringAreas] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [careerSummary, setCareerSummary] = useState('');

  const [maxCapacity, setMaxCapacity] = useState('3');
  const [verificationStatus, setVerificationStatus] = useState('PENDING');

  // Role guard
  useEffect(() => {
    if (user && user.role !== 'MENTOR') {
      router.replace(`/app/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, router]);

  useEffect(() => {
    async function load() {
      try {
        const [me, profile] = await Promise.all([userService.getMe(), mentorService.getMyProfile()]);
        if (me) {
          setMeUser(me);
          setFirstName(me.firstName || '');
          setLastName(me.lastName || '');
        }
        if (profile) {
          setProgramme(profile.programme || '');
          setGraduationYear(profile.graduationYear ? String(profile.graduationYear) : '');
          setCurrentCompany(profile.currentCompany || '');
          setCurrentDesignation(profile.currentDesignation || '');
          setYearsOfExperience(profile.yearsOfExperience != null ? String(profile.yearsOfExperience) : '');
          setIndustry(profile.industry || '');
          setExpertise(Array.isArray(profile.expertise) ? profile.expertise : []);
          setMentoringAreas(Array.isArray(profile.mentoringAreas) ? profile.mentoringAreas : []);
          setBio(profile.bio || '');
          setCareerSummary(profile.careerSummary || '');
          setMaxCapacity(profile.maxCapacity != null ? String(profile.maxCapacity) : '3');
          setVerificationStatus(profile.verificationStatus || 'PENDING');
        }
      } catch (err) {
        console.error('Failed to load mentor profile:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user && user.role === 'MENTOR') load();
  }, [user]);

  const flash = (type: 'success' | 'error', text: string) => {
    setSaveMsg({ type, text });
    setTimeout(() => setSaveMsg(null), 3500);
  };

  const handleSavePersonal = async () => {
    setSavingSection('personal');
    try {
      await userService.updateMe({ firstName: firstName.trim(), lastName: lastName.trim() });
      flash('success', 'Personal information updated.');
    } catch (err: any) {
      flash('error', err.message || 'Failed to update personal information.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveProfessional = async () => {
    setSavingSection('professional');
    try {
      await mentorService.updateMyProfile({
        programme: programme.trim(),
        graduationYear: parseInt(graduationYear, 10) || new Date().getFullYear() - 3,
        currentCompany: currentCompany.trim(),
        currentDesignation: currentDesignation.trim(),
        yearsOfExperience: parseInt(yearsOfExperience, 10) || 0,
        industry: industry.trim(),
        bio: bio.trim(),
        careerSummary: careerSummary.trim(),
        expertise,
        mentoringAreas,
      });
      flash('success', 'Professional profile updated.');
    } catch (err: any) {
      flash('error', err.message || 'Failed to update professional profile.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveCapacity = async () => {
    setSavingSection('capacity');
    try {
      await mentorService.updateMyProfile({ maxCapacity: parseInt(maxCapacity, 10) || 1 });
      flash('success', 'Mentee capacity updated.');
    } catch (err: any) {
      flash('error', err.message || 'Failed to update capacity.');
    } finally {
      setSavingSection(null);
    }
  };

  const addTag = () => {
    const v = expertiseInput.trim();
    if (v && !expertise.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setExpertise([...expertise, v]);
    }
    setExpertiseInput('');
  };

  if (!user || user.role !== 'MENTOR' || loading) {
    return (
      <div className="max-w-5xl mx-auto pb-10 space-y-6">
        <div className="h-8 bg-gray-200 rounded-full w-48 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="animate-pulse"><CardContent className="h-80" /></Card>
          <Card className="animate-pulse lg:col-span-2"><CardContent className="h-80" /></Card>
        </div>
      </div>
    );
  }

  const initials = `${(firstName || user.firstName || '?')[0]}${(lastName || user.lastName || '')[0]}`.toUpperCase();
  const phoneVerified = !!meUser?.phoneDetails?.verified;
  const verification = VERIFICATION_STYLES[verificationStatus] ?? VERIFICATION_STYLES.PENDING;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mentor Profile</h1>
          <p className="text-lpu-text-secondary mt-1">This is how students see you on MentorConnect.</p>
        </div>
        <Badge variant="outline" className={verification.cls}>
          <ShieldCheck className="h-3.5 w-3.5 mr-1" /> {verification.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Identity card */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="h-28 w-28 rounded-full bg-orange-50 border-4 border-white shadow-sm flex items-center justify-center text-3xl text-lpu-orange font-bold">
                  {initials}
                </div>
                <h2 className="text-xl font-bold mt-4">{firstName} {lastName}</h2>
                <p className="text-lpu-text-secondary text-sm text-center">
                  {currentDesignation || 'Alumni'}{currentCompany ? ` @ ${currentCompany}` : ''}
                </p>

                <div className="w-full mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>{phoneVerified ? meUser?.phoneDetails?.e164 || 'Verified' : 'Not verified'}</span>
                    {phoneVerified ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>{industry || 'Industry not set'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>Mentoring up to {maxCapacity} students</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity quick card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mentee Capacity</CardTitle>
              <CardDescription>Max students you can guide at once.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="number"
                min={1}
                max={20}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
              />
              <Button onClick={handleSaveCapacity} disabled={savingSection === 'capacity'} variant="outline" className="w-full rounded-xl">
                {savingSection === 'capacity' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Capacity'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your name as shown to mentees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <input value={user.email} disabled className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm bg-gray-50 text-gray-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">LPU Registration</label>
                  <input
                    value={meUser?.lpuRegistrationNumber ? `${meUser.lpuRegistrationNumber.slice(0, 3)}XXXXX` : '—'}
                    disabled
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
              <div className="pt-2 text-right">
                <Button onClick={handleSavePersonal} disabled={savingSection === 'personal'} className="bg-lpu-orange hover:bg-lpu-orange/95 text-white rounded-xl">
                  {savingSection === 'personal' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Personal Info'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-lpu-orange" /> Professional Details</CardTitle>
              <CardDescription>Your industry experience and background.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Current Company</label>
                  <input
                    placeholder="e.g. Google"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Current Designation</label>
                  <input
                    placeholder="e.g. Senior Software Engineer"
                    value={currentDesignation}
                    onChange={(e) => setCurrentDesignation(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Years of Experience</label>
                  <input
                    type="number"
                    min={0}
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Industry</label>
                  <input
                    placeholder="e.g. Software & Technology"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Degree at LPU</label>
                  <input
                    placeholder="e.g. B.Tech CSE"
                    value={programme}
                    onChange={(e) => setProgramme(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Graduation Year</label>
                  <input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium text-gray-700">About You (Bio)</label>
                <textarea
                  rows={3}
                  placeholder="A short introduction shown on your public profile…"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full min-h-[90px] p-3 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none resize-y"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Career Summary</label>
                <textarea
                  rows={3}
                  placeholder="Your professional journey so far…"
                  value={careerSummary}
                  onChange={(e) => setCareerSummary(e.target.value)}
                  className="w-full min-h-[90px] p-3 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none resize-y"
                />
              </div>
            </CardContent>
          </Card>

          {/* Expertise & Mentoring Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Award className="h-4 w-4 text-lpu-orange" /> Expertise & Mentoring Areas</CardTitle>
              <CardDescription>Used by our matching engine to connect you with the right students.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Expertise</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {expertise.map((item) => (
                    <Badge key={item} variant="secondary" className="px-3 py-1 gap-1">
                      {item}
                      <button type="button" onClick={() => setExpertise(expertise.filter((s) => s !== item))} aria-label={`Remove ${item}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {expertise.length === 0 && <span className="text-xs text-gray-400">No expertise tags yet.</span>}
                </div>
                <input
                  placeholder="Type an expertise and press Enter…"
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Mentoring Areas</label>
                <div className="flex flex-wrap gap-2">
                  {['Software Development', 'System Design', 'AI/ML & Data Science', 'Product Management', 'UI/UX Design', 'Resume Review', 'Interview Prep', 'Career Transition', 'Higher Studies', 'Competitive Programming'].map((area) => {
                    const selected = mentoringAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() =>
                          setMentoringAreas(selected ? mentoringAreas.filter((a) => a !== area) : [...mentoringAreas, area])
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          selected
                            ? 'bg-lpu-orange text-white border-lpu-orange'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-lpu-orange hover:text-lpu-orange'
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 text-right">
                <Button onClick={handleSaveProfessional} disabled={savingSection === 'professional'} className="bg-lpu-orange hover:bg-lpu-orange/95 text-white rounded-xl">
                  {savingSection === 'professional' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Professional Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
