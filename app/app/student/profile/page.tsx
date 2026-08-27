'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/mock-auth';
import { userService, studentService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Target,
  BookOpen,
  X,
} from 'lucide-react';

interface MeUser {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  lpuEmail?: string;
  lpuRegistrationNumber?: string;
  role: string;
  phoneDetails?: { verified?: boolean; e164?: string };
}

interface StudentProfileData {
  programme: string;
  school: string;
  yearOfStudy: number;
  graduationYear: number;
  currentSkills: string[];
  targetRole: string;
  targetIndustry: string;
  careerGoals: string[];
  interests: string[];
  mentoringNeeds: string;
  preferredFrequency: string;
  profileCompletion: number;
}

export default function StudentProfilePage() {
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User-level fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [meUser, setMeUser] = useState<MeUser | null>(null);

  // Academic fields
  const [programme, setProgramme] = useState('');
  const [school, setSchool] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  // Career fields
  const [targetRole, setTargetRole] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [mentoringNeeds, setMentoringNeeds] = useState('');
  const [preferredFrequency, setPreferredFrequency] = useState('Weekly');

  const [profileCompletion, setProfileCompletion] = useState(0);

  // Role guard
  useEffect(() => {
    if (user && user.role !== 'STUDENT') {
      router.replace(`/app/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, router]);

  useEffect(() => {
    async function load() {
      try {
        const [me, profile] = await Promise.all([userService.getMe(), studentService.getMyProfile()]);
        if (me) {
          setMeUser(me);
          setFirstName(me.firstName || '');
          setLastName(me.lastName || '');
        }
        if (profile) {
          setProgramme(profile.programme || '');
          setSchool(profile.school || '');
          setYearOfStudy(profile.yearOfStudy ? String(profile.yearOfStudy) : '');
          setGraduationYear(profile.graduationYear ? String(profile.graduationYear) : '');
          setTargetRole(profile.targetRole || '');
          setTargetIndustry(profile.targetIndustry || '');
          setSkills(Array.isArray(profile.currentSkills) ? profile.currentSkills : []);
          setInterests(Array.isArray(profile.interests) ? profile.interests : []);
          setMentoringNeeds(profile.mentoringNeeds || '');
          setPreferredFrequency(profile.preferredFrequency || 'Weekly');
          setProfileCompletion(profile.profileCompletion || 0);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user && user.role === 'STUDENT') load();
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

  const handleSaveAcademic = async () => {
    setSavingSection('academic');
    try {
      const updated = await studentService.updateProfile({
        programme: programme.trim(),
        school: school.trim(),
        yearOfStudy: parseInt(yearOfStudy, 10) || 1,
        graduationYear: parseInt(graduationYear, 10) || new Date().getFullYear() + 3,
        mentoringNeeds: mentoringNeeds.trim(),
        preferredFrequency,
        interests,
      });
      setProfileCompletion(updated?.profileCompletion ?? profileCompletion);
      flash('success', 'Academic details updated.');
    } catch (err: any) {
      flash('error', err.message || 'Failed to update academic details.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveCareer = async () => {
    setSavingSection('career');
    try {
      const updated = await studentService.updateCareer({
        targetRole: targetRole.trim(),
        targetIndustry: targetIndustry.trim(),
        currentSkills: skills,
        careerGoals: [],
      });
      setProfileCompletion(updated?.profileCompletion ?? profileCompletion);
      flash('success', 'Career goals updated.');
    } catch (err: any) {
      flash('error', err.message || 'Failed to update career details.');
    } finally {
      setSavingSection(null);
    }
  };

  const addTag = (list: string[], value: string, setter: (v: string[]) => void, inputSetter: (v: string) => void) => {
    const v = value.trim();
    if (v && !list.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setter([...list, v]);
    }
    inputSetter('');
  };

  const removeTag = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.filter((s) => s !== value));
  };

  if (!user || user.role !== 'STUDENT' || loading) {
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Profile</h1>
          <p className="text-lpu-text-secondary mt-1">Manage your presence as a student on MentorConnect.</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-xs font-semibold flex items-center gap-1 ${saveMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
              {saveMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              {saveMsg.text}
            </span>
          )}
          <Badge variant="outline" className="bg-white">
            Profile {profileCompletion}% complete
          </Badge>
        </div>
      </div>

      {/* Completion bar */}
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-lpu-orange rounded-full transition-all" style={{ width: `${profileCompletion}%` }} />
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
                <p className="text-lpu-text-secondary text-sm">{programme || 'Student'}{school ? ` • ${school}` : ''}</p>

                <div className="w-full mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>{phoneVerified ? (meUser?.phoneDetails?.e164 || meUser?.phone || 'Verified') : 'Not verified'}</span>
                    {phoneVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        <ShieldAlert className="h-3 w-3" /> Unverified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <GraduationCap className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>LPU Reg: {meUser?.lpuRegistrationNumber ? `${meUser.lpuRegistrationNumber.slice(0, 3)}XXXXX` : '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>Lovely Professional University</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your name is shown to mentors you connect with.</CardDescription>
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
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    value={phoneVerified ? meUser?.phoneDetails?.e164 || '' : ''}
                    placeholder={phoneVerified ? '' : 'Complete phone verification in onboarding'}
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

          {/* Academic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-lpu-orange" /> Academic Details</CardTitle>
              <CardDescription>Your programme and study details at LPU.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Degree Programme</label>
                  <input
                    placeholder="e.g. B.Tech CSE"
                    value={programme}
                    onChange={(e) => setProgramme(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">School / Faculty</label>
                  <input
                    placeholder="e.g. School of Computer Science"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Year of Study</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Preferred Mentoring Frequency</label>
                  <select
                    value={preferredFrequency}
                    onChange={(e) => setPreferredFrequency(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm bg-white cursor-pointer focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">What do you need help with?</label>
                  <input
                    placeholder="e.g. System design & placement prep"
                    value={mentoringNeeds}
                    onChange={(e) => setMentoringNeeds(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
              </div>
              <div className="pt-2 text-right">
                <Button onClick={handleSaveAcademic} disabled={savingSection === 'academic'} className="bg-lpu-orange hover:bg-lpu-orange/95 text-white rounded-xl">
                  {savingSection === 'academic' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Academic Details'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Career Goals & Interests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-lpu-orange" /> Career Goals & Interests</CardTitle>
              <CardDescription>This helps our AI match you with the right alumni mentors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Target Role</label>
                  <input
                    placeholder="e.g. Software Engineer (SDE-1)"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Target Industry</label>
                  <input
                    placeholder="e.g. Software & Technology"
                    value={targetIndustry}
                    onChange={(e) => setTargetIndustry(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1 gap-1">
                      {skill}
                      <button type="button" onClick={() => removeTag(skills, skill, setSkills)} aria-label={`Remove ${skill}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {skills.length === 0 && <span className="text-xs text-gray-400">No skills added yet.</span>}
                </div>
                <input
                  placeholder="Type a skill and press Enter…"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(skills, skillInput, setSkills, setSkillInput);
                    }
                  }}
                  className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Interests</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {interests.map((item) => (
                    <Badge key={item} variant="secondary" className="px-3 py-1 gap-1">
                      {item}
                      <button type="button" onClick={() => removeTag(interests, item, setInterests)} aria-label={`Remove ${item}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {interests.length === 0 && <span className="text-xs text-gray-400">No interests added yet.</span>}
                </div>
                <input
                  placeholder="Type an interest and press Enter…"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(interests, interestInput, setInterests, setInterestInput);
                    }
                  }}
                  className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                />
              </div>

              <div className="pt-2 text-right">
                <Button onClick={handleSaveCareer} disabled={savingSection === 'career'} className="bg-lpu-orange hover:bg-lpu-orange/95 text-white rounded-xl">
                  {savingSection === 'career' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Career Details'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
