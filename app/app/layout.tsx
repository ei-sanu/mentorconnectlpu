'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { userService } from '@/services/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserOnboarding() {
      try {
        const fresh = await userService.getMe();
        if (fresh) {
          if (fresh.onboardingStatus === 'NOT_STARTED' || fresh.onboardingStatus === 'IN_PROGRESS') {
            router.push('/onboarding');
          } else if (fresh.onboardingStatus === 'UNDER_REVIEW' || fresh.onboardingStatus === 'SUBMITTED') {
            router.push('/onboarding/status');
          } else if (fresh.onboardingStatus === 'REJECTED' || fresh.onboardingStatus === 'CHANGES_REQUESTED') {
            router.push('/onboarding/review');
          } else {
            setLoading(false);
          }
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error(err);
        router.push('/');
      }
    }
    checkUserOnboarding();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lpu-bg">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-lpu-orange border-t-transparent mx-auto"></div>
          <p className="text-lpu-text-secondary font-medium">Checking authorization status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-lpu-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
