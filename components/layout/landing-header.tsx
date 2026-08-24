'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/lib/mock-auth';
import { LpuLogo } from '@/components/ui/lpu-logo';

export function LandingHeader() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleDemoScroll = () => {
    const el = document.getElementById('demo-login');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/#demo-login');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-lpu-border bg-white/90 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
          <LpuLogo className="h-12 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-lpu-text-secondary">
          <Link href="/#how-it-works" className="hover:text-lpu-orange transition-colors">How it works</Link>
          <Link href="/#benefits" className="hover:text-lpu-orange transition-colors">Benefits</Link>
        </nav>
        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <Button onClick={() => router.push(`/app/${user?.role.toLowerCase()}/dashboard`)} className="rounded-xl px-6">
              Go to Dashboard
            </Button>
          ) : (
            <Button variant="outline" onClick={handleDemoScroll} className="rounded-xl px-6 border-lpu-border hover:bg-lpu-bg">
              Demo Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
