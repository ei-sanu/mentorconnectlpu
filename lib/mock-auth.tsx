'use client';

import React from 'react';
import { ClerkProvider, useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/nextjs';
import { User, Role } from '@/types';

export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
};

export const useUser = () => {
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn, user: clerkUser } = useClerkUser();

  // If mock login bypass is active
  if (typeof window !== 'undefined' && localStorage.getItem('mock_user_token')) {
    const mockEmail = localStorage.getItem('mock_user_email') || 'someshranjanbiswal13678@gmail.com';
    const activeRole = (localStorage.getItem('active_role') as Role) || 'ADMIN';
    const user: User = {
      id: 'mock_user_someshranjanbiswal13678_gmail_com',
      firstName: 'Somesh Ranjan',
      lastName: 'Biswal',
      email: mockEmail,
      imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      role: activeRole,
    };
    return {
      isLoaded: true,
      isSignedIn: true,
      user,
      explicitRole: activeRole,
    };
  }

  let user: User | null = null;
  let explicitRole: Role | null = null;
  if (clerkUser) {
    const storedRole = typeof window !== 'undefined' ? localStorage.getItem(`clerk_role_${clerkUser.id}`) : null;
    const metaRole = clerkUser.unsafeMetadata?.role as Role | undefined;
    explicitRole = (storedRole as Role) || metaRole || null;
    user = {
      id: clerkUser.id,
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      imageUrl: clerkUser.imageUrl,
      role: explicitRole || 'STUDENT',
    };
  }

  return {
    isLoaded: clerkLoaded,
    isSignedIn: !!clerkSignedIn,
    user,
    explicitRole,
  };
};

export const useAuth = () => {
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn, signOut: clerkSignOut } = useClerkAuth();
  const { user, explicitRole } = useUser();

  const isMock = typeof window !== 'undefined' && !!localStorage.getItem('mock_user_token');

  const handleSignOut = async () => {
    if (isMock) {
      localStorage.removeItem('mock_user_token');
      localStorage.removeItem('mock_user_email');
      localStorage.removeItem('active_role');
      window.location.href = '/login';
    } else {
      await clerkSignOut();
    }
  };

  return {
    isLoaded: isMock ? true : clerkLoaded,
    isSignedIn: isMock ? true : !!clerkSignedIn,
    user,
    explicitRole,
    signOut: handleSignOut,
    signIn: (email: string) => true,
    signUp: (email: string, firstName: string, lastName: string, role: Role) => {},
    users: [],
  };
};

export const SignedIn = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useUser();
  return isSignedIn ? <>{children}</> : null;
};

export const SignedOut = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useUser();
  return !isSignedIn ? <>{children}</> : null;
};
