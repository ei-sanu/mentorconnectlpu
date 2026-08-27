'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/mock-auth';
import { LpuLogo } from '@/components/ui/lpu-logo';

export function LandingHeader() {
  const { isSignedIn, user, isLoaded, signOut } = useAuth();
  const router = useRouter();

  const handleAuthRedirect = () => {
    router.push('/login');
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
          {isLoaded && user?.role === 'ADMIN' && (
            <Link href="/app/admin/dashboard" className="text-red-600 font-semibold hover:text-red-700 transition-colors">Admin Panel</Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {!isLoaded ? (
            <div className="h-10 w-28 animate-pulse bg-gray-100 rounded-xl" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-2">
              <Button onClick={() => router.push(`/app/${user?.role.toLowerCase()}/dashboard`)} className="rounded-xl px-6 bg-lpu-orange text-white hover:bg-lpu-orange/95 font-semibold">
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => { signOut(); router.push('/'); }} className="rounded-xl px-4 border-lpu-border hover:bg-red-50 hover:text-red-600 transition-colors font-semibold">
                Logout
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={handleAuthRedirect} className="rounded-xl px-6 border-lpu-border hover:bg-lpu-bg font-semibold">
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
