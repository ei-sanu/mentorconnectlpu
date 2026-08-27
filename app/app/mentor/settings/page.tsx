'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/lib/mock-auth';
import { userService, mentorService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Lock,
  UserCog,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Users,
} from 'lucide-react';

type Tab = 'account' | 'notifications' | 'privacy' | 'security';

const VERIFICATION_STYLES: Record<string, { cls: string; label: string }> = {
  VERIFIED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Verified' },
  PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending Review' },
  REJECTED: { cls: 'bg-red-50 text-red-700 border-red-200', label: 'Rejected' },
  EXPIRED: { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Expired' },
};

export default function MentorSettingsPage() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('account');
  const [loading, setLoading] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingAccepting, setSavingAccepting] = useState(false);
  const [meUser, setMeUser] = useState<any>(null);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [acceptingMentees, setAcceptingMentees] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState('PENDING');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Notification preferences (stored locally per user)
  const [notifyNewRequests, setNotifyNewRequests] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifySessions, setNotifySessions] = useState(false);

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
        setMeUser(me);
        if (profile) {
          if (typeof profile.profileVisibility === 'boolean') setProfileVisibility(profile.profileVisibility);
          if (typeof profile.acceptingMentees === 'boolean') setAcceptingMentees(profile.acceptingMentees);
          setVerificationStatus(profile.verificationStatus || 'PENDING');
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user && user.role === 'MENTOR') load();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const raw = localStorage.getItem(`settings_notify_${user.id}`);
      if (raw && !cancelled) {
        try {
          const parsed = JSON.parse(raw);
          setNotifyNewRequests(parsed.requests ?? true);
          setNotifyMessages(parsed.messages ?? true);
          setNotifySessions(parsed.sessions ?? false);
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const flash = (text: string) => {
    setSaveMsg(text);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleToggleVisibility = async () => {
    setSavingPrivacy(true);
    try {
      await mentorService.updateMyProfile({ profileVisibility: !profileVisibility });
      setProfileVisibility(!profileVisibility);
      flash('Privacy setting updated.');
    } catch (err: any) {
      flash(err.message || 'Failed to update privacy setting.');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleToggleAccepting = async () => {
    setSavingAccepting(true);
    try {
      await mentorService.updateMyProfile({ acceptingMentees: !acceptingMentees });
      setAcceptingMentees(!acceptingMentees);
      flash(!acceptingMentees ? 'You are now accepting new mentees.' : 'You are paused — new requests are hidden.');
    } catch (err: any) {
      flash(err.message || 'Failed to update availability.');
    } finally {
      setSavingAccepting(false);
    }
  };

  if (!user || user.role !== 'MENTOR' || loading) {
    return (
      <div className="max-w-4xl mx-auto pb-10 space-y-6">
        <div className="h-8 bg-gray-200 rounded-full w-40 animate-pulse" />
        <Card className="animate-pulse"><CardContent className="h-64" /></Card>
      </div>
    );
  }

  const phoneVerified = !!meUser?.phoneDetails?.verified;
  const verification = VERIFICATION_STYLES[verificationStatus] ?? VERIFICATION_STYLES.PENDING;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'account', label: 'Account', icon: UserCog },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'privacy', label: 'Privacy & Availability', icon: Users },
    { key: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="text-lpu-text-secondary mt-1">Manage your mentor account preferences.</p>
        </div>
        {saveMsg && <span className="text-xs font-semibold text-emerald-600">{saveMsg}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant="ghost"
              onClick={() => setTab(key)}
              className={`w-full justify-start ${tab === key ? 'text-lpu-orange bg-lpu-orange/10 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>

        <div className="md:col-span-3 space-y-6">
          {tab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Your core account details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">Email Address</h4>
                      <p className="text-sm text-lpu-text-secondary">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">Phone Number</h4>
                      <p className="text-sm text-lpu-text-secondary">
                        {phoneVerified ? meUser?.phoneDetails?.e164 || 'Verified' : 'Not verified'}
                      </p>
                    </div>
                  </div>
                  {phoneVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                      <ShieldAlert className="h-3.5 w-3.5" /> Unverified
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Alumni Verification</h4>
                    <p className="text-sm text-lpu-text-secondary">Required before students can request your mentorship.</p>
                  </div>
                  <Badge variant="outline" className={verification.cls}>{verification.label}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what updates you receive on this device.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100">
                {[
                  { label: 'New mentorship requests', desc: 'When a student sends you a mentorship request', value: notifyNewRequests, set: (v: boolean) => { setNotifyNewRequests(v); localStorage.setItem(`settings_notify_${user.id}`, JSON.stringify({ requests: v, messages: notifyMessages, sessions: notifySessions })); } },
                  { label: 'New messages', desc: 'Emails when a mentee sends you a message', value: notifyMessages, set: (v: boolean) => { setNotifyMessages(v); localStorage.setItem(`settings_notify_${user.id}`, JSON.stringify({ requests: notifyNewRequests, messages: v, sessions: notifySessions })); } },
                  { label: 'Session reminders', desc: 'Reminders before upcoming mentoring sessions', value: notifySessions, set: (v: boolean) => { setNotifySessions(v); localStorage.setItem(`settings_notify_${user.id}`, JSON.stringify({ requests: notifyNewRequests, messages: notifyMessages, sessions: v })); } },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.label}</h4>
                      <p className="text-sm text-lpu-text-secondary">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.value}
                      onClick={() => item.set(!item.value)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${item.value ? 'bg-lpu-orange' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${item.value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {tab === 'privacy' && (
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Availability</CardTitle>
                <CardDescription>Control your visibility and incoming requests.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100">
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-start gap-3">
                    {acceptingMentees ? <Users className="h-5 w-5 text-lpu-orange mt-0.5" /> : <Users className="h-5 w-5 text-gray-400 mt-0.5" />}
                    <div>
                      <h4 className="font-medium text-gray-900">Accepting new mentees</h4>
                      <p className="text-sm text-lpu-text-secondary max-w-sm">
                        When enabled, students can send you mentorship requests.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={acceptingMentees}
                    disabled={savingAccepting}
                    onClick={handleToggleAccepting}
                    className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${acceptingMentees ? 'bg-lpu-orange' : 'bg-gray-200'} ${savingAccepting ? 'opacity-60' : ''}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${acceptingMentees ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="flex items-start gap-3">
                    {profileVisibility ? <Eye className="h-5 w-5 text-lpu-orange mt-0.5" /> : <EyeOff className="h-5 w-5 text-gray-400 mt-0.5" />}
                    <div>
                      <h4 className="font-medium text-gray-900">Visible in search</h4>
                      <p className="text-sm text-lpu-text-secondary max-w-sm">
                        When enabled, students can discover your profile via search and AI recommendations.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={profileVisibility}
                    disabled={savingPrivacy}
                    onClick={handleToggleVisibility}
                    className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${profileVisibility ? 'bg-lpu-orange' : 'bg-gray-200'} ${savingPrivacy ? 'opacity-60' : ''}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${profileVisibility ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Configure security settings for your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                  <ShieldCheck className="h-5 w-5 text-lpu-orange shrink-0" />
                  <p className="text-sm text-lpu-text-secondary">
                    Your account is fully secured. Keep your account safe by signing out after session completion.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => { signOut(); router.push('/'); }}
                  className="rounded-xl border-lpu-border hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
