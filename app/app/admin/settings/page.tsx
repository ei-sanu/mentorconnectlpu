'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/lib/mock-auth';
import { userService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Lock,
  UserCog,
  ShieldCheck,
  LogOut,
  Mail,
} from 'lucide-react';

type Tab = 'account' | 'notifications' | 'security';

export default function AdminSettingsPage() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('account');
  const [loading, setLoading] = useState(true);
  const [meUser, setMeUser] = useState<any>(null);

  // Admin notification preferences (stored locally per user)
  const [notifyNewVerifications, setNotifyNewVerifications] = useState(true);
  const [notifyNewUsers, setNotifyNewUsers] = useState(false);
  const [notifyReports, setNotifyReports] = useState(true);

  // Role guard — only ADMIN (and officers) may view this page
  useEffect(() => {
    if (user && !['ADMIN', 'ALUMNI_OFFICER', 'PLACEMENT_OFFICER'].includes(user.role)) {
      router.replace(`/app/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, router]);

  useEffect(() => {
    async function load() {
      try {
        const me = await userService.getMe();
        setMeUser(me);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const raw = localStorage.getItem(`settings_notify_${user.id}`);
      if (raw && !cancelled) {
        try {
          const parsed = JSON.parse(raw);
          setNotifyNewVerifications(parsed.verifications ?? true);
          setNotifyNewUsers(parsed.users ?? false);
          setNotifyReports(parsed.reports ?? true);
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!user || !['ADMIN', 'ALUMNI_OFFICER', 'PLACEMENT_OFFICER'].includes(user.role) || loading) {
    return (
      <div className="max-w-4xl mx-auto pb-10 space-y-6">
        <div className="h-8 bg-gray-200 rounded-full w-40 animate-pulse" />
        <Card className="animate-pulse"><CardContent className="h-64" /></Card>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'account', label: 'Account', icon: UserCog },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Settings</h1>
        <p className="text-lpu-text-secondary mt-1">Manage your administrator account preferences.</p>
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
                <CardTitle>Administrator Account</CardTitle>
                <CardDescription>Your platform administration identity.</CardDescription>
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
                  <div>
                    <h4 className="font-medium text-gray-900">Platform Role</h4>
                    <p className="text-sm text-lpu-text-secondary">{meUser?.role ? meUser.role.replace('_', ' ') : user.role.replace('_', ' ')}</p>
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 font-bold">
                    {user.role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Onboarding Status</h4>
                    <p className="text-sm text-lpu-text-secondary">{meUser?.onboardingStatus || 'APPROVED'}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Active
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose which administrative alerts you receive on this device.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100">
                {[
                  { label: 'New verification requests', desc: 'Alerts when alumni submit verification documents', value: notifyNewVerifications, key: 'verifications' },
                  { label: 'New user registrations', desc: 'Alerts when students or mentors join the platform', value: notifyNewUsers, key: 'users' },
                  { label: 'Reported content', desc: 'Alerts about flagged messages or sessions', value: notifyReports, key: 'reports' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.label}</h4>
                      <p className="text-sm text-lpu-text-secondary">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.value}
                      onClick={() => {
                        const next = { verifications: notifyNewVerifications, users: notifyNewUsers, reports: notifyReports, [item.key]: !item.value };
                        localStorage.setItem(`settings_notify_${user.id}`, JSON.stringify(next));
                        if (item.key === 'verifications') setNotifyNewVerifications(!item.value);
                        if (item.key === 'users') setNotifyNewUsers(!item.value);
                        if (item.key === 'reports') setNotifyReports(!item.value);
                      }}
                      className={`relative h-6 w-11 rounded-full transition-colors ${item.value ? 'bg-lpu-orange' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${item.value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
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
                    Administrator access is fully secured. Keep your account safe by signing out after session completion.
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
