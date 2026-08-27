'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn, useSignUp, useClerk } from '@clerk/nextjs';
import { useAuth } from '@/lib/mock-auth';
import { LpuLogo } from '@/components/ui/lpu-logo';
import { Button } from '@/components/ui/button';
import { Lock, User, Mail, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { isLoaded: authLoaded, user } = useAuth();
  const router = useRouter();

  const clerkObj = useClerk() as any;
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn() as any;
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp() as any;

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Custom Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'MENTOR'>('STUDENT');
  
  // Verification States
  const [verifying, setVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Error/Message States
  const [errorMsg, setErrorMsg] = useState('');
  const [authError, setAuthError] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return !!(params.get('error') || params.get('__clerk_status') === 'error' || window.location.hash.includes('error'));
    }
    return false;
  });
  const [loading, setLoading] = useState(false);

  // Catch cancelled or failed OAuth redirects and clean the URL
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => {
        setAuthError(false);
        router.replace('/login');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [authError, router]);

  // Redirect if already logged in
  useEffect(() => {
    if (authLoaded && user) {
      router.push(`/app/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, authLoaded, router]);

  const handleSocialLogin = async (provider: 'oauth_google' | 'oauth_github') => {
    setLoading(true);
    setErrorMsg('');
    try {
      // window.Clerk is set by Clerk's script as soon as it loads — most reliable source
      const wClerk = (window as any).Clerk;
      const isSignUp = activeTab === 'register';

      if (isSignUp) {
        if (wClerk?.client?.signUp?.authenticateWithRedirect) {
          await wClerk.client.signUp.authenticateWithRedirect({
            strategy: provider,
            redirectUrl: `${window.location.origin}/onboarding`,
            redirectUrlComplete: `${window.location.origin}/onboarding`,
          });
        } else if (signUp?.authenticateWithRedirect) {
          await signUp.authenticateWithRedirect({
            strategy: provider,
            redirectUrl: `${window.location.origin}/onboarding`,
            redirectUrlComplete: `${window.location.origin}/onboarding`,
          });
        } else {
          throw new Error('Google / GitHub registration is not available yet. Please refresh the page.');
        }
      } else {
        if (wClerk?.client?.signIn?.authenticateWithRedirect) {
          await wClerk.client.signIn.authenticateWithRedirect({
            strategy: provider,
            redirectUrl: `${window.location.origin}/onboarding`,
            redirectUrlComplete: `${window.location.origin}/onboarding`,
          });
        } else if (signIn?.authenticateWithRedirect) {
          await signIn.authenticateWithRedirect({
            strategy: provider,
            redirectUrl: `${window.location.origin}/onboarding`,
            redirectUrlComplete: `${window.location.origin}/onboarding`,
          });
        } else if (clerkObj?.redirectToSignIn) {
          // Fallback: Clerk's own redirect helper
          clerkObj.redirectToSignIn({ redirectUrl: `${window.location.origin}/onboarding` });
        } else {
          throw new Error('Google / GitHub sign-in is not available yet. Please refresh the page.');
        }
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Custom Mock Login Bypass for specific test account
    if (cleanEmail === 'someshranjanbiswal13678@gmail.com' && cleanPassword === 'Sanu@123') {
      try {
        localStorage.setItem('mock_user_token', 'mock_token_someshranjanbiswal13678@gmail.com_roleADMIN');
        localStorage.setItem('mock_user_email', 'someshranjanbiswal13678@gmail.com');
        localStorage.setItem('active_role', 'ADMIN');
        
        // Push directly to admin dashboard
        router.push('/app/admin/dashboard');
        setLoading(false);
        return;
      } catch (err: any) {
        console.error('Mock login failed:', err);
        setErrorMsg('Mock login failed. Please try again.');
        setLoading(false);
        return;
      }
    }

    if (!signInLoaded || !signIn) return;

    try {
      const result = await signIn.create({
        identifier: cleanEmail,
        password: cleanPassword,
      });

      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
        router.push('/onboarding');
      } else {
        setErrorMsg('Sign-in incomplete. Please verify your credentials.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp) return;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill out all fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        unsafeMetadata: {
          role,
        }
      });

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setVerifying(true);
      setLoading(false);
    } catch (err: any) {
      console.error('Sign-up error:', err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || 'Registration failed.');
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp) return;
    if (!otpCode.trim()) {
      setErrorMsg('Please enter the verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: otpCode.trim() });
      if (result.status === 'complete') {
        // Store user role in localstorage
        localStorage.setItem(`clerk_role_${result.createdUserId}`, role);
        await setSignUpActive({ session: result.createdSessionId });
        router.push('/onboarding');
      } else {
        setErrorMsg('Verification failed. Try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || 'Verification failed.');
      setLoading(false);
    }
  };

  if (!authLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lpu-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-lpu-orange border-t-transparent mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lpu-bg flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      
      {/* OAuth Fail Banner Overlay */}
      {authError && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 shadow-md animate-bounce">
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
            <div className="text-xs font-semibold">
              Authentication cancelled or failed. Redirecting back to login...
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 text-center">
        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
          <LpuLogo className="h-14 w-auto mx-auto" />
        </Link>
      </div>

      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-lpu-border shadow-sm flex flex-col items-center space-y-6">
        
        {!verifying ? (
          <>
            <h3 className="text-xl font-bold flex items-center gap-2 text-lpu-text-primary self-start">
              <Lock className="text-lpu-orange h-5 w-5" /> Account Access Portal
            </h3>

            {/* Navigation Tabs */}
            <div className="flex gap-2 w-full bg-lpu-bg p-1 rounded-xl border border-lpu-border">
              <button 
                onClick={() => { setActiveTab('login'); setErrorMsg(''); }} 
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'login' ? 'bg-lpu-orange text-white' : 'text-lpu-text-secondary hover:bg-gray-50'}`}
              >
                Log In
              </button>
              <button 
                onClick={() => { setActiveTab('register'); setErrorMsg(''); }} 
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'register' ? 'bg-lpu-orange text-white' : 'text-lpu-text-secondary hover:bg-gray-50'}`}
              >
                Register
              </button>
            </div>

            {/* Custom Google/GitHub OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => handleSocialLogin('oauth_google')}
                disabled={loading}
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-3 border border-lpu-border rounded-xl text-xs font-semibold text-lpu-text-primary hover:bg-lpu-bg disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z"/>
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.01 3.67-8.64z"/>
                    <path fill="#FBBC05" d="M5.24 14.56c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.39 7.21C.5 8.99 0 10.94 0 13s.5 4.01 1.39 5.79l3.85-3.23z"/>
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.5 1.18-4.2 1.18-3.34 0-5.86-1.81-6.76-4.51L1.39 17c1.98 3.89 5.96 6.56 10.61 6.56z"/>
                  </svg>
                )}
                Continue with Google
              </button>
              <button
                onClick={() => handleSocialLogin('oauth_github')}
                disabled={loading}
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-3 border border-lpu-border rounded-xl text-xs font-semibold text-lpu-text-primary hover:bg-lpu-bg disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                  </svg>
                )}
                Continue with GitHub
              </button>
            </div>


            <div className="flex items-center gap-3 w-full">
              <div className="h-[1px] bg-lpu-border flex-1" />
              <span className="text-[10px] font-bold text-lpu-text-secondary uppercase tracking-wider select-none">or use email</span>
              <div className="h-[1px] bg-lpu-border flex-1" />
            </div>

            {activeTab === 'login' ? (
              <form onSubmit={handleEmailSignIn} className="space-y-4 w-full">
                <div>
                  <label className="block text-xs font-bold text-lpu-text-secondary uppercase mb-1">Email Address</label>
                  <input 
                    type="email"
                    placeholder="e.g. yourname@lpu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-white border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-lpu-text-secondary uppercase mb-1">Password</label>
                  <input 
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-white border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                {errorMsg && <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>}
                <Button type="submit" disabled={loading} className="w-full rounded-xl h-11 font-bold bg-lpu-orange hover:bg-lpu-orange/95 text-white">
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleEmailSignUp} className="space-y-4 w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-lpu-text-secondary uppercase mb-1">First Name</label>
                    <input 
                      type="text"
                      placeholder="First"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-white border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-lpu-text-secondary uppercase mb-1">Last Name</label>
                    <input 
                      type="text"
                      placeholder="Last"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-white border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-lpu-text-secondary uppercase mb-1">Email Address</label>
                  <input 
                    type="email"
                    placeholder="e.g. name@lpu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-white border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-lpu-text-secondary uppercase mb-1">Password</label>
                  <input 
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-white border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-lpu-text-secondary uppercase mb-1">Choose Account Role</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'STUDENT' | 'MENTOR')}
                    className="w-full h-11 px-4 rounded-xl bg-white border border-lpu-border text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none cursor-pointer text-lpu-text-primary"
                  >
                    <option value="STUDENT">Student (I want a mentor)</option>
                    <option value="MENTOR">Alumni / Mentor (I want to guide)</option>
                  </select>
                </div>
                {errorMsg && <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>}
                <Button type="submit" disabled={loading} className="w-full rounded-xl h-11 font-bold bg-lpu-orange hover:bg-lpu-orange/95 text-white">
                  {loading ? 'Creating Account...' : 'Sign Up & Join'}
                </Button>
              </form>
            )}
          </>
        ) : (
          /* Custom OTP Verification Form */
          <form onSubmit={handleVerifyOTP} className="space-y-6 w-full flex flex-col items-center">
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-lpu-orange mb-2">
              <Mail className="h-6 w-6" />
            </div>
            
            <div className="text-center space-y-1">
              <h4 className="text-lg font-bold text-gray-900">Verify your Email</h4>
              <p className="text-xs text-lpu-text-secondary">
                We sent a verification code to <span className="font-semibold text-gray-900">{email}</span>.
              </p>
            </div>

            <div className="w-full space-y-1">
              <label className="block text-xs font-bold text-lpu-text-secondary uppercase mb-1 text-center">Enter Verification Code</label>
              <input 
                type="text"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full h-12 text-center text-lg font-bold tracking-widest rounded-xl bg-white border border-lpu-border focus:ring-2 focus:ring-lpu-orange focus:outline-none text-gray-900"
              />
            </div>

            {errorMsg && <p className="text-xs text-red-500 font-semibold text-center">{errorMsg}</p>}

            <div className="w-full space-y-3">
              <Button type="submit" disabled={loading} className="w-full rounded-xl h-11 font-bold bg-lpu-orange hover:bg-lpu-orange/95 text-white">
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <button 
                type="button" 
                onClick={() => setVerifying(false)}
                className="text-xs text-lpu-text-secondary hover:text-lpu-orange w-full text-center transition-colors"
              >
                Back to registration
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
