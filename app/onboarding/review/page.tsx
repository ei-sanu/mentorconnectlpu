'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/mock-auth';

export default function OnboardingReviewPage() {
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
          // Redirect if already approved or under review
          if (fresh.onboardingStatus === 'APPROVED') {
            router.push(`/app/${fresh.role.toLowerCase()}/dashboard`);
          } else if (fresh.onboardingStatus === 'UNDER_REVIEW') {
            router.push('/onboarding/status');
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

  const isRejected = userState?.onboardingStatus === 'REJECTED';

  return (
    <div className="min-h-screen bg-lpu-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full rounded-3xl shadow-sm border border-lpu-border overflow-hidden bg-white">
        <CardHeader className="bg-lpu-surface border-b border-lpu-border text-center p-8">
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-red-100">
            {isRejected ? <ShieldAlert className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8 text-amber-500" />}
          </div>
          <CardTitle className="text-2xl font-bold">{isRejected ? 'Application Rejected' : 'Changes Required'}</CardTitle>
          <CardDescription className="text-sm mt-1">
            {isRejected 
              ? 'Your identity verification application was rejected by the administration.' 
              : 'The administrative team has requested some updates before approving your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6 text-sm">
          
          <div className="p-5 bg-red-50/50 rounded-2xl border border-red-100 text-red-950">
            <h4 className="font-bold mb-2 flex items-center gap-1.5">
              Reason / Feedback:
            </h4>
            <p className="text-xs leading-relaxed italic">
              &ldquo;{userState?.rejectionReason || userState?.changeRequestReason || 'No specific explanation provided. Please review and update your fields.'}&rdquo;
            </p>
          </div>

          <div className="text-center text-xs text-lpu-text-secondary leading-relaxed">
            Please click below to unlock your information fields, correct the flagged details, and resubmit for verification.
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
            <Button onClick={() => router.push('/onboarding')} className="w-full rounded-xl h-11 bg-lpu-orange hover:bg-lpu-orange/95 flex items-center justify-center gap-2">
              Update Profile & Resubmit <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => {
                signOut();
                router.push('/');
              }} 
              variant="ghost" 
              className="w-full rounded-xl h-11 text-lpu-text-secondary hover:bg-gray-100"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
