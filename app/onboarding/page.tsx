'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/mock-auth';
import { userService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ShieldCheck, Mail, Phone, BookOpen, Briefcase, Award, GraduationCap, Clock, Loader2, ArrowRight } from 'lucide-react';
import PhoneVerificationStep from '@/components/onboarding/PhoneVerificationStep';

export default function OnboardingPage() {
  const { signIn, signUp, user, users } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'STUDENT' | 'MENTOR'>('STUDENT');
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Clerk mock auth states
  const [clerkTab, setClerkTab] = useState<'signin' | 'signup'>('signin');
  const [clerkEmail, setClerkEmail] = useState('');
  const [clerkPassword, setClerkPassword] = useState('');
  const [clerkFirst, setClerkFirst] = useState('');
  const [clerkLast, setClerkLast] = useState('');
  const [clerkRole, setClerkRole] = useState<'STUDENT' | 'MENTOR'>('STUDENT');
  const [clerkError, setClerkError] = useState('');

  // Form inputs
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');

  // PIN code auto-fetch (India Post API)
  const [pinCode, setPinCode] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  
  // Phone OTP verification (Mock flow)
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState('');

  // LPU Identity & Academics
  const [regNum, setRegNum] = useState('');
  const [lpuEmail, setLpuEmail] = useState('');
  const [programme, setProgramme] = useState('');
  const [school, setSchool] = useState('');
  const [campus, setCampus] = useState('Main Campus, Phagwara');
  const [admissionYear, setAdmissionYear] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  
  // Career / Professional details
  const [skills, setSkills] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [careerGoals, setCareerGoals] = useState('');
  
  // Alumni Career (Mentor specific)
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentDesignation, setCurrentDesignation] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [mentoringAreas, setMentoringAreas] = useState<string[]>([]);
  const [maxMentees, setMaxMentees] = useState('3');
  
  // Preferences & Verification
  const [preferredFrequency, setPreferredFrequency] = useState('Weekly');
  const [mentoringNeeds, setMentoringNeeds] = useState('');
  const [proofDocumentUrl, setProofDocumentUrl] = useState('');
  
  // Consent checkboxes
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [confirmBelongs, setConfirmBelongs] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Location Selector Cascading Logic
  const [countriesAndStates, setCountriesAndStates] = useState<any[]>([]);
  const [statesList, setStatesList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch countries and states on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingLocations(true);
      try {
        const res = await fetch('https://countriesnow.space/api/v0.1/countries/states');
        const json = await res.json();
        if (!json.error && json.data) {
          setCountriesAndStates(json.data);
        }
      } catch (err) {
        console.error('Failed to load countries and states:', err);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchCountries();
  }, []);

  // When Country changes
  const handleCountryChange = (selectedCountry: string) => {
    setCountry(selectedCountry);
    setState('');
    setCity('');
    setStatesList([]);
    setCitiesList([]);

    const foundCountry = countriesAndStates.find(c => c.name === selectedCountry);
    if (foundCountry?.states) {
      setStatesList(foundCountry.states);
    }
  };

  // When State changes
  const handleStateChange = async (selectedState: string) => {
    setState(selectedState);
    setCity('');
    setCitiesList([]);

    if (!selectedState || !country) return;

    setLoadingCities(true);
    try {
      const res = await fetch(`https://countriesnow.space/api/v0.1/countries/state/cities/q?country=${encodeURIComponent(country)}&state=${encodeURIComponent(selectedState)}`);
      const json = await res.json();
      if (!json.error && json.data) {
        setCitiesList(json.data);
      }
    } catch (err) {
      console.error('Failed to load cities:', err);
    } finally {
      setLoadingCities(false);
    }
  };


  const refreshAuth = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await userService.getMe();
      if (fresh) {
        setIsAuthenticated(true);
        if (fresh.onboardingStatus === 'APPROVED') {
          router.push(`/app/${fresh.role.toLowerCase()}/dashboard`);
        } else if (fresh.onboardingStatus === 'UNDER_REVIEW' || fresh.onboardingStatus === 'SUBMITTED') {
          router.push('/onboarding/status');
        } else if (fresh.onboardingStatus === 'REJECTED' || fresh.onboardingStatus === 'CHANGES_REQUESTED') {
          router.push('/onboarding/review');
        }
        // Determine the explicitly-chosen role (from registration form or a previous selection).
        const localRole = typeof window !== 'undefined' && user?.id
          ? localStorage.getItem(`clerk_role_${user.id}`)
          : null;
        const wClerkUser = typeof window !== 'undefined' ? (window as any).Clerk?.user : null;
        const metaRole = (wClerkUser?.unsafeMetadata?.role ?? '') as string;
        const explicitRole = localRole || metaRole;

        if (explicitRole === 'MENTOR' || explicitRole === 'STUDENT') {
          setRole(explicitRole);
          setNeedsRoleSelection(false);
        } else if (fresh.onboardingStatus) {
          // Onboarding already progressed — trust the backend role.
          setRole(fresh.role === 'MENTOR' ? 'MENTOR' : 'STUDENT');
        } else {
          // Brand-new user with no role choice (e.g. OAuth sign-in) — ask them.
          setNeedsRoleSelection(true);
        }
        setFirstName(fresh.firstName || '');
        setLastName(fresh.lastName || '');
        setLpuEmail(fresh.lpuEmail || fresh.email || '');
      } else {
        // Not authenticated — redirect to login
        router.push('/login');
      }
    } catch (err) {
      console.error(err);
      // Any error (401, network) → send to login
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshAuth();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshAuth]);

  const handleRoleSelect = async (selected: 'STUDENT' | 'MENTOR') => {
    setRole(selected);
    try {
      if (user?.id) {
        localStorage.setItem(`clerk_role_${user.id}`, selected);
      }
      // Persist to Clerk so the choice survives new devices / sessions
      const wClerkUser = typeof window !== 'undefined' ? (window as any).Clerk?.user : null;
      if (wClerkUser?.update) {
        await wClerkUser.update({
          unsafeMetadata: { ...(wClerkUser.unsafeMetadata || {}), role: selected },
        });
      }
    } catch (err) {
      console.error('Failed to persist role selection:', err);
    }
    setNeedsRoleSelection(false);
  };

  // Auto-fetch Country / State / City from PIN code (debounced) and sync cascading dropdowns
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!/^\d{6}$/.test(pinCode)) {
        setPinError('');
        return;
      }
      setPinLoading(true);
      setPinError('');

      // Local dictionary lookup for common university PIN codes to bypass slow/unreliable public APIs
      const localPincodes: Record<string, { state: string, city: string }> = {
        '144411': { state: 'Punjab', city: 'Phagwara' },
        '144001': { state: 'Punjab', city: 'Jalandhar' },
        '144002': { state: 'Punjab', city: 'Jalandhar' },
        '144008': { state: 'Punjab', city: 'Jalandhar' },
      };

      if (localPincodes[pinCode]) {
        const localData = localPincodes[pinCode];
        
        // 1) Match country (India)
        const foundCountry = countriesAndStates.find(
          (c: any) => c.name?.toLowerCase() === 'india'
        );
        const states = foundCountry?.states ?? [];
        setCountry(foundCountry?.name ?? 'India');
        setStatesList(states);

        // 2) Match state (Punjab)
        const matchedState = states.find(
          (s: any) => s.name?.toLowerCase() === localData.state.toLowerCase()
        );
        const selectedStateName = matchedState?.name ?? localData.state;
        setState(selectedStateName);

        // 3) Match city (Phagwara / Jalandhar)
        setLoadingCities(true);
        try {
          const citiesRes = await fetch(
            `https://countriesnow.space/api/v0.1/countries/state/cities/q?country=India&state=${encodeURIComponent(selectedStateName)}`
          );
          const citiesJson = await citiesRes.json();
          let cities: string[] = !citiesJson.error && Array.isArray(citiesJson.data) ? citiesJson.data : [];
          if (!cities.some(c => c.toLowerCase() === localData.city.toLowerCase())) {
            cities = [localData.city, ...cities];
          }
          setCitiesList(cities);
        } catch {
          setCitiesList([localData.city]);
        } finally {
          setLoadingCities(false);
        }
        setCity(localData.city);
        setPinLoading(false);
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

        const res = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await res.json();
        const office = data?.[0]?.PostOffice?.[0];
        if (!office) {
          setPinError('No location found for this PIN code. Please fill details manually.');
          return;
        }

        const pinStateName: string = office.State || '';
        const pinCityName: string = office.Block || office.District || '';

        // 1) Match country (postal API serves Indian pincodes)
        const foundCountry = countriesAndStates.find(
          (c: any) => c.name?.toLowerCase() === 'india'
        );
        const states: any[] = foundCountry?.states ?? [];
        setCountry(foundCountry?.name ?? 'India');
        setStatesList(states);

        // 2) Match state within India's states
        const matchedState = states.find(
          (s: any) => s.name?.toLowerCase() === pinStateName.toLowerCase()
        );
        const selectedStateName = matchedState?.name ?? pinStateName;
        setState(selectedStateName);

        // 3) Load cities for that state, then match city (fall back to Block/District)
        setCitiesList([]);
        let finalCity = pinCityName;
        setLoadingCities(true);
        try {
          const citiesRes = await fetch(
            `https://countriesnow.space/api/v0.1/countries/state/cities/q?country=${encodeURIComponent(
              foundCountry?.name ?? 'India'
            )}&state=${encodeURIComponent(selectedStateName)}`
          );
          const citiesJson = await citiesRes.json();
          let cities: string[] = !citiesJson.error && Array.isArray(citiesJson.data) ? citiesJson.data : [];
          const matchedCity = cities.find(
            (c: string) => c.toLowerCase() === pinCityName.toLowerCase()
          );
          if (matchedCity) {
            finalCity = matchedCity;
          } else if (pinCityName) {
            cities = [pinCityName, ...cities];
          }
          setCitiesList(cities);
        } catch {
          setCitiesList(pinCityName ? [pinCityName] : []);
        } finally {
          setLoadingCities(false);
        }
        setCity(finalCity);
      } catch {
        setPinError('Could not fetch location details. Please fill them manually.');
      } finally {
        setPinLoading(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [pinCode, countriesAndStates]);

  const sendMockOtp = () => {
    if (!phoneNumber) {
      alert('Please enter your phone number first.');
      return;
    }
    setOtpSent(true);
    setOtpError('');
    alert('Dev Mode: Verification code sent! Enter code "123456" to verify.');
  };

  const verifyMockOtp = () => {
    if (otpCode === '123456') {
      setPhoneVerified(true);
      setOtpSent(false);
      setOtpError('');
    } else {
      setOtpError('Invalid verification code. Use "123456".');
    }
  };

  const handleNext = () => {
    if (step === 1 && !phoneVerified) {
      alert('Please complete phone verification before proceeding.');
      return;
    }
    if (step === 2 && (!regNum || !lpuEmail)) {
      alert('LPU Registration number and email are required.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    setSubmitError('');
    if (!confirmAccurate || !confirmBelongs) {
      setSubmitError('Please verify and check the confirmation statements.');
      return;
    }

    const payload = {
      role,
      firstName,
      lastName,
      phone: `${phoneCode}${phoneNumber}`,
      city,
      state,
      country,
      pinCode,
      lpuRegistrationNumber: regNum,
      lpuEmail,
      programme,
      school,
      campus,
      admissionYear,
      graduationYear,
      semester: currentSemester,
      year: currentYear,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      targetRole: targetRole || currentDesignation,
      targetIndustry: targetIndustry || currentCompany,
      careerGoals: careerGoals ? [careerGoals] : [],
      currentCompany,
      currentDesignation,
      yearsOfExperience: parseInt(yearsOfExperience, 10) || 0,
      linkedinUrl,
      expertise: mentoringAreas,
      mentoringAreas,
      maxMentees: parseInt(maxMentees, 10) || 3,
      preferredFrequency,
      mentoringNeeds: mentoringNeeds || 'General guidance',
      proofDocumentUrl,
    };

    try {
      setLoading(true);
      const res = await userService.submitOnboarding(payload);
      if (res && res.onboardingStatus === 'UNDER_REVIEW') {
        router.push('/onboarding/status');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit onboarding request.');
      setLoading(false);
    }
  };

  const toggleMentoringArea = (area: string) => {
    if (mentoringAreas.includes(area)) {
      setMentoringAreas(prev => prev.filter(a => a !== area));
    } else {
      setMentoringAreas(prev => [...prev, area]);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-lpu-bg py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
          {/* Header Skeleton */}
          <div className="text-center space-y-3">
            <div className="h-8 bg-gray-200 rounded-full w-2/3 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded-full w-1/2 mx-auto"></div>
          </div>

          {/* Steps Indicators Skeleton */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-lpu-border shadow-xs">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                <div className="h-3 bg-gray-200 rounded-full w-12 hidden md:block"></div>
                {i < 5 && <div className="h-0.5 w-8 bg-gray-100 hidden md:block" />}
              </div>
            ))}
          </div>

          {/* Form Body Card Skeleton */}
          <div className="bg-white rounded-3xl border border-lpu-border overflow-hidden shadow-sm">
            <div className="bg-lpu-surface border-b border-lpu-border p-8 space-y-3">
              <div className="h-6 bg-gray-200 rounded-full w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded-full w-2/3"></div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded-full w-1/4"></div>
                  <div className="h-11 bg-gray-100 rounded-xl"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded-full w-1/4"></div>
                  <div className="h-11 bg-gray-100 rounded-xl"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded-full w-1/6"></div>
                <div className="h-11 bg-gray-100 rounded-xl"></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded-full w-1/3"></div>
                    <div className="h-11 bg-gray-100 rounded-xl"></div>
                  </div>
                ))}
              </div>
              <div className="h-11 bg-gray-200 rounded-xl w-full mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  {/* Role Selection Gate — shown when the user hasn't explicitly chosen Student or Mentor */}
  if (needsRoleSelection) {
    const roleOptions = [
      {
        value: 'STUDENT' as const,
        icon: <GraduationCap className="h-8 w-8" />,
        title: 'I am a Student',
        tagline: 'Get mentored by LPU alumni',
        points: ['Find verified alumni mentors', 'Get resume & interview help', 'Build a career roadmap'],
      },
      {
        value: 'MENTOR' as const,
        icon: <Briefcase className="h-8 w-8" />,
        title: 'I am an Alumni Mentor',
        tagline: 'Guide students, give back',
        points: ['Share industry experience', 'Review resumes & conduct mock interviews', 'Set your own availability'],
      },
    ];

    return (
      <div className="min-h-screen bg-lpu-bg py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">How will you use MentorConnect?</h1>
          <p className="mt-2 text-sm text-lpu-text-secondary">
            Choose your account type to continue. This personalizes your onboarding experience.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 mt-10">
            {roleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleRoleSelect(option.value)}
                className="group flex flex-col items-center text-left bg-white p-8 rounded-3xl border border-lpu-border shadow-sm hover:border-lpu-orange hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-lpu-orange"
              >
                <div className="h-16 w-16 rounded-2xl bg-orange-50 border border-orange-100 text-lpu-orange flex items-center justify-center mb-5 group-hover:bg-lpu-orange group-hover:text-white group-hover:border-lpu-orange transition-colors">
                  {option.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{option.title}</h3>
                <p className="text-sm text-lpu-orange font-semibold mt-1">{option.tagline}</p>
                <ul className="mt-4 space-y-2 w-full">
                  {option.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs text-lpu-text-secondary">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      {point}
                    </li>
                  ))}
                </ul>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-lpu-orange">
                  Continue as {option.value === 'STUDENT' ? 'Student' : 'Mentor'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            ))}
          </div>

          <p className="mt-8 text-xs text-lpu-text-muted">
            You can complete verification for your chosen role in the next steps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lpu-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Onboarding Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Onboarding & Verification Portal</h1>
          <p className="mt-2 text-sm text-lpu-text-secondary">Complete your profile to gain platform credentials as a verified LPU member.</p>
        </div>

        {/* Steps Indicators */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-lpu-border shadow-xs">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === i ? 'bg-lpu-orange text-white' : step > i ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step > i ? <Check className="w-4 h-4" /> : i}
              </div>
              <span className={`text-xs font-semibold hidden md:inline ${step === i ? 'text-gray-950' : 'text-gray-400'}`}>
                {i === 1 ? 'Personal' : i === 2 ? 'Identity' : i === 3 ? 'Professional' : i === 4 ? 'Preferences' : 'Verification'}
              </span>
              {i < 5 && <div className="h-0.5 w-8 bg-gray-100 hidden md:block" />}
            </div>
          ))}
        </div>

        <Card className="rounded-3xl shadow-sm border border-lpu-border overflow-hidden">
          <CardHeader className="bg-lpu-surface border-b border-lpu-border px-8 py-6">
            <CardTitle className="text-xl">Step {step}: {
              step === 1 ? 'Personal Details' :
              step === 2 ? 'LPU Identity Verification' :
              step === 3 ? (role === 'STUDENT' ? 'Career Portfolio' : 'Alumni Professional Experience') :
              step === 4 ? (role === 'STUDENT' ? 'Mentorship Intentions' : 'Mentoring Profile') :
              'Review and Declare'
            }</CardTitle>
            <CardDescription>All fields marked with * are required to submit verification.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">

            {/* STEP 1: Personal info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">First Name *</label>
                    <input 
                      type="text" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Last Name *</label>
                    <input 
                      type="text" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)} 
                      className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange"
                    />
                  </div>
                </div>

                {/* PIN Code — auto-fills Country, State & City */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">PIN Code *</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 144411"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-11 px-4 pr-10 rounded-xl border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange"
                    />
                    {pinLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-lpu-orange" />
                    )}
                  </div>
                  {pinError ? (
                    <p className="text-[11px] text-red-500 mt-1">{pinError}</p>
                  ) : (
                    <p className="text-[11px] text-lpu-text-secondary mt-1">Country, State and City are auto-filled from your PIN code.</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Country Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Country *</label>
                    {countriesAndStates.length > 0 ? (
                      <select
                        value={country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lpu-orange"
                      >
                        <option value="">Select Country</option>
                        {countriesAndStates.map((c, idx) => (
                          <option key={`${c.name}-${idx}`} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        value={country} 
                        onChange={(e) => setCountry(e.target.value)} 
                        placeholder={loadingLocations ? "Loading Countries..." : "Enter Country"}
                        className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange"
                      />
                    )}
                  </div>

                  {/* State Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">State *</label>
                    {statesList.length > 0 ? (
                      <select
                        value={state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        disabled={!country}
                        className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lpu-orange disabled:opacity-50"
                      >
                        <option value="">Select State</option>
                        {statesList.map((s, idx) => (
                          <option key={`${s.name || s.state_code}-${idx}`} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        value={state} 
                        onChange={(e) => setState(e.target.value)} 
                        placeholder={!country ? "Select Country First" : "Enter State"}
                        disabled={!country}
                        className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange disabled:opacity-50"
                      />
                    )}
                  </div>

                  {/* City Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City *</label>
                    {citiesList.length > 0 ? (
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={!state}
                        className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lpu-orange disabled:opacity-50"
                      >
                        <option value="">Select City</option>
                        {citiesList.map((cName, idx) => (
                          <option key={`${cName}-${idx}`} value={cName}>
                            {cName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)} 
                        placeholder={loadingCities ? "Loading Cities..." : !state ? "Select State First" : "Enter City"}
                        disabled={!state}
                        className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange disabled:opacity-50"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-lpu-orange" />
                    <label className="text-xs font-bold text-gray-700 uppercase">Phone Number Verification *</label>
                  </div>
                  {phoneVerified ? (
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                      <Check className="w-5 h-5 bg-emerald-100 rounded-full p-0.5" /> Phone number verified successfully!
                    </div>
                  ) : (
                    <PhoneVerificationStep
                      onVerified={() => setPhoneVerified(true)}
                    />
                  )}
                </div>
              </div>
            )}



            {/* STEP 2: Identity */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">LPU Registration Number *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 12204567"
                    value={regNum} 
                    onChange={(e) => setRegNum(e.target.value)} 
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange"
                  />
                  <p className="text-[11px] text-lpu-text-secondary mt-1">This registration number will be securely masked on public platform screens (e.g. 122XXXXX).</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">LPU Email *</label>
                  <input 
                    type="email" 
                    placeholder="e.g. yourname@lpu.in"
                    value={lpuEmail} 
                    onChange={(e) => setLpuEmail(e.target.value)} 
                    className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Degree Programme</label>
                    <input 
                      type="text" 
                      value={programme} 
                      onChange={(e) => setProgramme(e.target.value)} 
                      className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">School / Faculty</label>
                    <input 
                      type="text" 
                      value={school} 
                      onChange={(e) => setSchool(e.target.value)} 
                      className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Campus</label>
                    <input 
                      type="text" 
                      value={campus} 
                      disabled 
                      className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Admission Year</label>
                    <input 
                      type="number" 
                      value={admissionYear} 
                      onChange={(e) => setAdmissionYear(e.target.value)} 
                      className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Graduation Year</label>
                    <input 
                      type="number" 
                      value={graduationYear} 
                      onChange={(e) => setGraduationYear(e.target.value)} 
                      className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Career/Profession */}
            {step === 3 && (
              <div className="space-y-6">
                {role === 'STUDENT' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Skills (Comma-separated) *</label>
                      <input 
                        type="text" 
                        placeholder="React, TypeScript, Node.js, Python"
                        value={skills} 
                        onChange={(e) => setSkills(e.target.value)} 
                        className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Professional Role</label>
                        <input 
                          type="text" 
                          placeholder="e.g. SDE-1"
                          value={targetRole} 
                          onChange={(e) => setTargetRole(e.target.value)} 
                          className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Industry</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Software & Tech"
                          value={targetIndustry} 
                          onChange={(e) => setTargetIndustry(e.target.value)} 
                          className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Career Goal Statement</label>
                      <textarea 
                        rows={3}
                        placeholder="Detail your career target or specific company objectives..."
                        value={careerGoals} 
                        onChange={(e) => setCareerGoals(e.target.value)} 
                        className="w-full p-4 rounded-xl border border-lpu-border text-sm focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Current Company *</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Google"
                          value={currentCompany} 
                          onChange={(e) => setCurrentCompany(e.target.value)} 
                          className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Current Designation *</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Senior Software Architect"
                          value={currentDesignation} 
                          onChange={(e) => setCurrentDesignation(e.target.value)} 
                          className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Years of Industry Experience *</label>
                        <input 
                          type="number" 
                          value={yearsOfExperience} 
                          onChange={(e) => setYearsOfExperience(e.target.value)} 
                          className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">LinkedIn Profile Link</label>
                        <input 
                          type="url" 
                          placeholder="https://linkedin.com/in/username"
                          value={linkedinUrl} 
                          onChange={(e) => setLinkedinUrl(e.target.value)} 
                          className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Skills (Comma-separated)</label>
                      <input 
                        type="text" 
                        placeholder="Node.js, AWS, Kubernetes, System Design"
                        value={skills} 
                        onChange={(e) => setSkills(e.target.value)} 
                        className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 4: Preferences */}
            {step === 4 && (
              <div className="space-y-6">
                {role === 'STUDENT' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Preferred Mentoring Frequency</label>
                      <select 
                        value={preferredFrequency} 
                        onChange={(e) => setPreferredFrequency(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm bg-white cursor-pointer focus:outline-none"
                      >
                        <option value="Weekly">Weekly (1 session per week)</option>
                        <option value="Bi-Weekly">Bi-Weekly (Every 2 weeks)</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Specific Area Where Mentorship is Needed *</label>
                      <textarea 
                        rows={4}
                        placeholder="Describe what guidance or goals you would like your alumni mentor to help you with..."
                        value={mentoringNeeds} 
                        onChange={(e) => setMentoringNeeds(e.target.value)} 
                        className="w-full p-4 rounded-xl border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Areas of Mentoring Expertise (Select multiple)</label>
                      <div className="flex flex-wrap gap-2">
                        {['Software Development', 'System Design', 'AI/ML & Data Science', 'Product Management', 'UI/UX Design', 'Resume Review', 'Interview Prep', 'Career Transition', 'Competitive Programming'].map((area) => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleMentoringArea(area)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${mentoringAreas.includes(area) ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-200'}`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Max Capacity (Students) *</label>
                        <input 
                          type="number" 
                          value={maxMentees} 
                          onChange={(e) => setMaxMentees(e.target.value)} 
                          className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Verification Document Link (Degree/Alumni Card URL) *</label>
                        <input 
                          type="text" 
                          placeholder="Enter link to verification proof"
                          value={proofDocumentUrl} 
                          onChange={(e) => setProofDocumentUrl(e.target.value)} 
                          className="w-full h-11 px-4 rounded-xl border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 5: Review & Submit */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="p-6 bg-lpu-bg rounded-2xl border border-lpu-border space-y-4 text-sm text-lpu-text-primary">
                  <h4 className="font-bold border-b border-lpu-border pb-2 text-base">Summary Review</h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <p className="text-lpu-text-secondary">Name:</p>
                    <p className="font-semibold">{firstName} {lastName}</p>
                    
                    <p className="text-lpu-text-secondary">LPU Registration:</p>
                    <p className="font-semibold">{regNum ? `${regNum.substring(0, 3)}XXXXXX` : 'N/A'}</p>
                    
                    <p className="text-lpu-text-secondary">Verified Phone:</p>
                    <p className="font-semibold">{phoneCode} {phoneNumber}</p>
                    
                    <p className="text-lpu-text-secondary">Selected Role:</p>
                    <p className="font-semibold text-lpu-orange">{role}</p>

                    <p className="text-lpu-text-secondary">LPU Email:</p>
                    <p className="font-semibold">{lpuEmail}</p>

                    <p className="text-lpu-text-secondary">Degree & School:</p>
                    <p className="font-semibold">{programme} - {school}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox"
                      id="confirmAccurate"
                      checked={confirmAccurate}
                      onChange={(e) => setConfirmAccurate(e.target.checked)}
                      className="rounded border-gray-300 text-lpu-orange focus:ring-lpu-orange mt-1 cursor-pointer"
                    />
                    <label htmlFor="confirmAccurate" className="text-xs text-lpu-text-secondary select-none cursor-pointer">
                      I confirm that the information provided is accurate and all graduation/registration fields are correct.
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox"
                      id="confirmBelongs"
                      checked={confirmBelongs}
                      onChange={(e) => setConfirmBelongs(e.target.checked)}
                      className="rounded border-gray-300 text-lpu-orange focus:ring-lpu-orange mt-1 cursor-pointer"
                    />
                    <label htmlFor="confirmBelongs" className="text-xs text-lpu-text-secondary select-none cursor-pointer">
                      I confirm that the LPU registration number provided belongs to me.
                    </label>
                  </div>
                </div>

                {submitError && <p className="text-xs text-red-500 font-semibold">{submitError}</p>}
              </div>
            )}

          </CardContent>
          <div className="bg-lpu-bg border-t border-lpu-border px-8 py-5 flex justify-between gap-4">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(prev => prev - 1)} className="rounded-xl h-11 px-6 bg-white">
                Back
              </Button>
            ) : <div />}
            
            {step < 5 ? (
              <Button onClick={handleNext} className="rounded-xl h-11 px-8">
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="rounded-xl h-11 px-8 bg-lpu-orange hover:bg-lpu-orange/95">
                Submit for Verification
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
