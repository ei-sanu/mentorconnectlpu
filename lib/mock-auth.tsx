'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '@/types';

// Mock users for demonstration
export const MOCK_USERS: User[] = [
  {
    id: 'student_1',
    firstName: 'Aarav',
    lastName: 'Sharma',
    email: 'aarav.sharma@lpu.in',
    imageUrl: 'https://picsum.photos/seed/aarav/200/200',
    role: 'STUDENT',
  },
  {
    id: 'mentor_1',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@alumni.lpu.in',
    imageUrl: 'https://picsum.photos/seed/priya/200/200',
    role: 'MENTOR',
  },
  {
    id: 'admin_1',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    email: 'rajesh.kumar@lpu.co.in',
    imageUrl: 'https://picsum.photos/seed/rajesh/200/200',
    role: 'ADMIN',
  },
];

interface MockAuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: User | null;
  signIn: (userId: string) => void;
  signOut: () => void;
}

const MockAuthContext = createContext<MockAuthContextType>({
  isLoaded: false,
  isSignedIn: false,
  user: null,
  signIn: () => {},
  signOut: () => {},
});

export const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Simulate initial load and check local storage
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('mock_auth_user') : null;
    if (storedUserId) {
      const foundUser = MOCK_USERS.find(u => u.id === storedUserId);
      if (foundUser) {
        setTimeout(() => setUser(foundUser), 0);
      }
    }
    setTimeout(() => setIsLoaded(true), 0);
  }, []);

  const signIn = (userId: string) => {
    const foundUser = MOCK_USERS.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('mock_auth_user', userId);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('mock_auth_user');
  };

  return (
    <MockAuthContext.Provider value={{ isLoaded, isSignedIn: !!user, user, signIn, signOut }}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(MockAuthContext);
  return { isLoaded: context.isLoaded, isSignedIn: context.isSignedIn, user: context.user };
};

export const useAuth = () => {
  const context = useContext(MockAuthContext);
  return { isLoaded: context.isLoaded, isSignedIn: context.isSignedIn, signOut: context.signOut, signIn: context.signIn };
};

export const SignedIn = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useUser();
  return isSignedIn ? <>{children}</> : null;
};

export const SignedOut = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useUser();
  return !isSignedIn ? <>{children}</> : null;
};
