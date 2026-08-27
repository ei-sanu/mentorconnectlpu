'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '@/lib/mock-auth';

export default function OnboardingStatusPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userState, setUserState] = useState<any>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const fresh = await userService.getMe();
        if (fresh) {
          setUserState(fresh);
          // If approved, redirect to dashboard
          if (fresh.onboardingStatus === 'APPROVED') {
            router.push(`/app/${fresh.role.toLowerCase()}/dashboard`);
          } else if (fresh.onboardingStatus === 'REJECTED' || fresh.onboardingStatus === 'CHANGES_REQUESTED') {
            router.push('/onboarding/review');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lpu-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-lpu-orange border-t-transparent mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lpu-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full rounded-3xl shadow-sm border border-lpu-border overflow-hidden bg-white">
        <CardHeader className="bg-lpu-surface border-b border-lpu-border text-center p-8">
          <div className="h-16 w-16 bg-orange-50 text-lpu-orange rounded-2xl flex items-center justify-center mb-4 mx-auto border border-orange-100 animate-pulse">
            <Clock className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Application Under Review</CardTitle>
          <CardDescription className="text-sm mt-1">Your LPU identity and profile details are currently under review by our administrative team.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6 text-sm">
          <div className="space-y-3 bg-lpu-bg p-5 rounded-2xl border border-lpu-border text-lpu-text-primary font-medium">
            <div className="flex justify-between">
              <span className="text-lpu-text-secondary">Submitted By:</span>
              <span>{userState?.firstName} {userState?.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-lpu-text-secondary">Account Role:</span>
              <span className="text-lpu-orange font-semibold uppercase">{userState?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-lpu-text-secondary">Submission Date:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-lpu-text-secondary">Status:</span>
              <span className="text-yellow-600 font-bold uppercase">{userState?.onboardingStatus}</span>
            </div>
          </div>

          <div className="text-center text-xs text-lpu-text-secondary space-y-2 leading-relaxed">
            <p>Verification requests are typically processed within 24-48 business hours.</p>
            <p>Once approved, you will receive full platform credentials and access.</p>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
            <Button onClick={() => router.push('/')} variant="outline" className="w-full rounded-xl h-11 bg-white">
              Back to Home
            </Button>
            <Button 
              onClick={() => {
                signOut();
                router.push('/');
              }} 
              variant="ghost" 
              className="w-full rounded-xl h-11 text-red-500 hover:bg-red-50"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
