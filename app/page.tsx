'use client';

import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, GraduationCap, ArrowRight, Video, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, MOCK_USERS } from '@/lib/mock-auth';
import { motion } from 'motion/react';
import { LandingHeader } from '@/components/layout/landing-header';
import { LandingFooter } from '@/components/layout/landing-footer';

export default function LandingPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const handleDemoLogin = (userId: string) => {
    signIn(userId);
    const selectedUser = MOCK_USERS.find(u => u.id === userId);
    if (selectedUser) {
      router.push(`/app/${selectedUser.role.toLowerCase()}/dashboard`);
    }
  };

  const handleDemoScroll = () => {
    const el = document.getElementById('demo-login');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-lpu-bg pt-24 pb-32">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="flex flex-col items-center text-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-lpu-orange mb-6"
              >
                Official LPU Alumni Network
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="max-w-4xl text-5xl font-extrabold leading-tight tracking-tighter text-gray-900 md:text-6xl lg:text-7xl"
              >
                Connect with verified LPU alumni. <br className="hidden md:block" />
                Build your career.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 max-w-2xl text-lg text-lpu-text-secondary md:text-xl leading-relaxed"
              >
                Get structured guidance, resume reviews, and career advice from alumni working at top global companies. Protected, professional, and purpose-built for LPU students.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-10 flex flex-col sm:flex-row gap-4"
              >
                <Button size="lg" className="h-14 rounded-xl px-8 text-base shadow-sm" onClick={handleDemoScroll}>
                  Join as Student
                </Button>
                <Button size="lg" variant="outline" className="h-14 rounded-xl px-8 text-base bg-white shadow-sm border-gray-200" onClick={handleDemoScroll}>
                  Become a Mentor
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white py-24" id="how-it-works">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">How MentorConnect Works</h2>
              <p className="mt-4 text-lg text-lpu-text-secondary">Three simple steps to accelerate your career growth with the help of experienced LPU alumni.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
              
              <div className="relative z-10 flex flex-col items-center text-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="h-16 w-16 bg-orange-50 text-lpu-orange rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-orange-100">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">1. Find Your Match</h3>
                <p className="text-lpu-text-secondary">Browse verified alumni by industry, role, or company. Our algorithm suggests the best mentors for your specific goals.</p>
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="h-16 w-16 bg-orange-50 text-lpu-orange rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-orange-100">
                  <ArrowRight className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">2. Connect & Request</h3>
                <p className="text-lpu-text-secondary">Send a personalized mentorship request. Once accepted, you can securely message your mentor directly on the platform.</p>
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="h-16 w-16 bg-orange-50 text-lpu-orange rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-orange-100">
                  <Video className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">3. Grow Together</h3>
                <p className="text-lpu-text-secondary">Schedule 1:1 sessions, get resume reviews, and track your progress through our structured mentorship framework.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits / Trust */}
        <section className="border-t border-lpu-border bg-lpu-bg py-24" id="benefits">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Why choose MentorConnect?</h2>
              <p className="mt-4 text-lg text-lpu-text-secondary">Designed exclusively for the LPU community to foster meaningful professional relationships.</p>
            </div>
            <div className="grid gap-12 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 text-lpu-orange">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Verified Alumni</h3>
                <p className="text-lpu-text-secondary">Every mentor is a verified graduate of Lovely Professional University, ensuring authentic and safe interactions.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 text-lpu-orange">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold">AI-Powered Matches</h3>
                <p className="text-lpu-text-secondary">Our smart matching engine connects you with mentors whose expertise perfectly aligns with your career trajectory.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 text-lpu-orange">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Structured Growth</h3>
                <p className="text-lpu-text-secondary">Manage sessions, set actionable milestones, and track your career progress in one unified workspace.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Login Section */}
        <section className="bg-white py-24 border-t border-lpu-border" id="demo-login">
          <div className="container mx-auto max-w-5xl px-4 md:px-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Interactive Demo Login</h2>
            <p className="mb-12 text-lpu-text-secondary max-w-2xl mx-auto">
              Select a role below to explore the platform. This simulates authentication for preview purposes.
            </p>
            <div className="grid gap-8 md:grid-cols-3">
              {MOCK_USERS.map((demoUser) => (
                <div key={demoUser.id} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-md flex flex-col items-center">
                  <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-orange-100 rounded-full blur-md opacity-50" />
                    <img src={demoUser.imageUrl} alt={demoUser.firstName} className="relative h-20 w-20 rounded-full object-cover border-4 border-white shadow-sm" />
                  </div>
                  <h3 className="mb-1 text-xl font-bold">{demoUser.firstName} {demoUser.lastName}</h3>
                  <p className="mb-8 text-sm font-semibold text-lpu-orange uppercase tracking-wider">{demoUser.role}</p>
                  <Button className="w-full rounded-xl h-11" onClick={() => handleDemoLogin(demoUser.id)}>
                    Login as {demoUser.role.toLowerCase()}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <LandingFooter />
    </div>
  );
}
