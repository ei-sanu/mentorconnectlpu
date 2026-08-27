'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  Video,
  Target,
  Users,
  Star,
  Briefcase,
  Globe2,
  MessageSquare,
  CalendarCheck,
  TrendingUp,
  Award,
  Quote,
  ChevronDown,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { LandingHeader } from '@/components/layout/landing-header';
import { LandingFooter } from '@/components/layout/landing-footer';

const STATS = [
  { icon: Users, value: '500+', label: 'Verified Alumni Mentors' },
  { icon: GraduationCap, value: '2,000+', label: 'Students Guided' },
  { icon: CalendarCheck, value: '8,000+', label: 'Sessions Completed' },
  { icon: Star, value: '4.9/5', label: 'Average Mentor Rating' },
];

const INDUSTRIES = [
  { icon: Briefcase, name: 'Software & IT', detail: 'SDE, Data Science, DevOps & Cloud' },
  { icon: TrendingUp, name: 'Finance & FinTech', detail: 'Investment Banking, Analytics & Audits' },
  { icon: Globe2, name: 'Consulting', detail: 'Strategy, Operations & Management' },
  { icon: Award, name: 'Core Engineering', detail: 'Mechanical, Civil, Electrical & Auto' },
  { icon: MessageSquare, name: 'Marketing & Media', detail: 'Digital Marketing, PR & Content' },
  { icon: BookOpen, name: 'Higher Studies', detail: 'MS, MBA, GRE/GMAT & Scholarships' },
];

const TESTIMONIALS = [
  {
    quote:
      'My mentor helped me restructure my resume and ran two mock interviews before my placement season. I landed an SDE offer at a product-based company in my very first attempt.',
    name: 'Priya Sharma',
    role: 'B.Tech CSE, 2025 Batch',
    highlight: 'Placed at a top product company',
  },
  {
    quote:
      'As an alumnus working abroad, MentorConnect makes it effortless to give back. The structured session framework means every call is focused and genuinely useful for the student.',
    name: 'Rahul Verma',
    role: 'Senior Software Engineer, LPU Alumnus',
    highlight: 'Mentoring 12+ students',
  },
  {
    quote:
      'The AI matching suggested a mentor from exactly the domain I wanted — fintech analytics. Within three sessions I had a clear roadmap for internships, projects, and certifications.',
    name: 'Ananya Gupta',
    role: 'B.Com Hons., 2026 Batch',
    highlight: 'Fintech internship secured',
  },
];

const FAQS = [
  {
    question: 'Is MentorConnect free for LPU students?',
    answer:
      'Yes. MentorConnect is completely free for currently enrolled LPU students. Simply sign up with your university credentials to start browsing and requesting mentorship sessions.',
  },
  {
    question: 'How are mentors verified?',
    answer:
      'Every mentor is a verified LPU alumnus. Our admin team reviews each mentor application — checking graduation records, professional profiles, and employment history — before they can accept mentee requests.',
  },
  {
    question: 'How do mentoring sessions happen?',
    answer:
      'Once a mentor accepts your request, you can chat directly on the platform and schedule 1:1 video sessions at times that work for both of you. All communication stays within the platform for your safety.',
  },
  {
    question: 'Can alumni also join as mentors?',
    answer:
      'Absolutely. We actively welcome LPU graduates from all batches and industries. Submit an onboarding request, complete verification, and start accepting mentees based on your availability.',
  },
  {
    question: 'What if a mentor is not a good fit?',
    answer:
      'No problem — you can end a mentorship anytime and request a different mentor. Our smart matching engine will use your feedback to suggest better-aligned mentors for your goals.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleGetStarted = () => {
    router.push('/login');
  };

  const fadeIn = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.5, delay },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-lpu-bg pt-24 pb-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-orange-100/60 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-orange-50 blur-3xl"
          />
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-lpu-orange mb-6"
              >
                <Sparkles className="h-4 w-4" />
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
                Get structured guidance, resume reviews, and career advice from alumni working at top global companies.
                Protected, professional, and purpose-built for LPU students.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-10 flex flex-col sm:flex-row gap-4"
              >
                <Button
                  size="lg"
                  className="h-14 rounded-xl px-8 text-base shadow-sm font-bold bg-lpu-orange hover:bg-lpu-orange/95 text-white"
                  onClick={handleGetStarted}
                >
                  Get Started as Student
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-xl px-8 text-base bg-white shadow-sm border-gray-200 font-bold"
                  onClick={handleGetStarted}
                >
                  Access Platform
                </Button>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="mt-4 flex items-center gap-1.5 text-sm text-lpu-text-muted"
              >
                <ShieldCheck className="h-4 w-4 text-lpu-orange" />
                Free for enrolled students · Mentors manually verified · Safe in-platform messaging
              </motion.p>
            </div>

            {/* Stats */}
            <motion.div
              {...fadeIn(0.15)}
              className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
            >
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm"
                >
                  <stat.icon className="mb-3 h-6 w-6 text-lpu-orange" />
                  <p className="text-3xl font-extrabold tracking-tight text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-lpu-text-secondary">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white py-24" id="how-it-works">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How MentorConnect Works
              </h2>
              <p className="mt-4 text-lg text-lpu-text-secondary">
                Three simple steps to accelerate your career growth with the help of experienced LPU alumni.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gray-100 -translate-y-1/2 z-0" />

              {[
                {
                  icon: Target,
                  step: '1. Find Your Match',
                  desc: 'Browse verified alumni by industry, role, or company. Our algorithm suggests the best mentors for your specific goals.',
                },
                {
                  icon: ArrowRight,
                  step: '2. Connect & Request',
                  desc: 'Send a personalized mentorship request. Once accepted, you can securely message your mentor directly on the platform.',
                },
                {
                  icon: Video,
                  step: '3. Grow Together',
                  desc: 'Schedule 1:1 sessions, get resume reviews, and track your progress through our structured mentorship framework.',
                },
              ].map((item, i) => (
                <motion.div key={item.step} {...fadeIn(i * 0.1)}>
                  <div className="relative z-10 flex h-full flex-col items-center text-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all">
                    <div className="h-16 w-16 bg-orange-50 text-lpu-orange rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-orange-100">
                      <item.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.step}</h3>
                    <p className="text-lpu-text-secondary">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries */}
        <section className="bg-lpu-bg py-24 border-t border-lpu-border" id="industries">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-lpu-orange mb-4">
                Explore Domains
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Find mentors across every career path
              </h2>
              <p className="mt-4 text-lg text-lpu-text-secondary">
                From product engineering to higher studies abroad — our alumni network spans industries, roles, and
                geographies.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {INDUSTRIES.map((industry, i) => (
                <motion.div key={industry.name} {...fadeIn(i * 0.07)}>
                  <div className="group flex h-full items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-orange-200 hover:shadow-md">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lpu-orange border border-orange-100 group-hover:bg-lpu-orange group-hover:text-white transition-colors">
                      <industry.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{industry.name}</h3>
                      <p className="mt-1 text-sm text-lpu-text-secondary leading-relaxed">{industry.detail}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits / Trust */}
        <section className="border-t border-lpu-border bg-white py-24" id="benefits">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Why choose MentorConnect?
              </h2>
              <p className="mt-4 text-lg text-lpu-text-secondary">
                Designed exclusively for the LPU community to foster meaningful professional relationships.
              </p>
            </div>
            <div className="grid gap-12 md:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Verified Alumni',
                  desc: 'Every mentor is a verified graduate of Lovely Professional University, ensuring authentic and safe interactions.',
                },
                {
                  icon: CheckCircle2,
                  title: 'AI-Powered Matches',
                  desc: 'Our smart matching engine connects you with mentors whose expertise perfectly aligns with your career trajectory.',
                },
                {
                  icon: GraduationCap,
                  title: 'Structured Growth',
                  desc: 'Manage sessions, set actionable milestones, and track your career progress in one unified workspace.',
                },
              ].map((benefit, i) => (
                <motion.div key={benefit.title} {...fadeIn(i * 0.1)} className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-lpu-bg shadow-sm border border-gray-100 text-lpu-orange">
                    <benefit.icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{benefit.title}</h3>
                  <p className="text-lpu-text-secondary">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-lpu-bg py-24 border-t border-lpu-border" id="testimonials">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-lpu-orange mb-4">
                Success Stories
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Loved by students and mentors alike
              </h2>
              <p className="mt-4 text-lg text-lpu-text-secondary">
                Real stories from the LPU community — placements secured, careers accelerated, and knowledge passed on.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <motion.figure key={t.name} {...fadeIn(i * 0.1)}>
                  <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                    <Quote className="h-8 w-8 text-orange-200 mb-4" fill="currentColor" />
                    <blockquote className="flex-1 text-lpu-text-secondary leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 border-t border-lpu-border pt-6">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-lpu-orange border border-orange-100">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{t.name}</p>
                        <p className="text-sm text-lpu-text-muted">{t.role}</p>
                      </div>
                    </figcaption>
                    <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-100">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {t.highlight}
                    </div>
                  </div>
                </motion.figure>
              ))}
            </div>
          </div>
        </section>

        {/* For Mentors */}
        <section className="border-t border-lpu-border bg-white py-24" id="for-mentors">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lpu-orange via-orange-600 to-orange-700 shadow-lg">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-black/10 blur-2xl"
              />
              <div className="relative grid items-center gap-10 p-10 md:p-16 lg:grid-cols-2">
                <div className="text-white">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur-sm mb-6">
                    <Users className="h-4 w-4" />
                    For LPU Alumni
                  </span>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
                    Give back. Guide the next generation of Chardi Kala professionals.
                  </h2>
                  <p className="mt-4 text-lg text-orange-50 leading-relaxed">
                    Share your industry experience with students walking the path you once did. Choose your own
                    availability, pick mentees who match your expertise, and make a measurable impact — just an hour a
                    week.
                  </p>
                  <ul className="mt-8 space-y-3">
                    {[
                      'Set your own availability and mentee capacity',
                      'Choose requests that match your expertise',
                      'Build your mentoring track record and profile',
                    ].map((point) => (
                      <li key={point} className="flex items-center gap-3 text-orange-50">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-center lg:items-end">
                  <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-lpu-orange border border-orange-100">
                      <Award className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold">Become a Verified Mentor</h3>
                    <p className="mt-2 text-sm text-lpu-text-secondary leading-relaxed">
                      Complete a quick verification of your LPU degree and professional profile. Most applications are
                      reviewed within 48 hours.
                    </p>
                    <Button
                      size="lg"
                      className="mt-6 h-12 w-full rounded-xl text-base font-bold bg-lpu-orange hover:bg-lpu-orange/95 text-white"
                      onClick={handleGetStarted}
                    >
                      Start Mentor Onboarding
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <p className="mt-3 text-xs text-lpu-text-muted">Free forever for alumni volunteers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-lpu-bg py-24 border-t border-lpu-border" id="faq">
          <div className="container mx-auto max-w-3xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-lg text-lpu-text-secondary">
                Everything you need to know about getting started with MentorConnect.
              </p>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <motion.div key={faq.question} {...fadeIn(i * 0.05)}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className={`w-full rounded-2xl border bg-white p-6 text-left shadow-sm transition-colors ${
                        isOpen ? 'border-orange-200' : 'border-gray-100 hover:border-orange-200'
                      }`}
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-bold text-gray-900">{faq.question}</h3>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-lpu-orange transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                      <div
                        className={`grid transition-all duration-200 ease-in-out ${
                          isOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="text-lpu-text-secondary leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-white py-24 border-t border-lpu-border">
          <div className="container mx-auto max-w-4xl px-4 text-center md:px-8">
            <motion.div {...fadeIn(0)}>
              <GraduationCap className="mx-auto mb-6 h-14 w-14 text-lpu-orange" />
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl leading-tight">
                Your career deserves a great mentor.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-lpu-text-secondary leading-relaxed">
                Join thousands of LPU students already accelerating their journeys with guidance from verified alumni.
                Sign up today — your first mentorship request takes less than two minutes.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="h-14 rounded-xl px-10 text-base shadow-sm font-bold bg-lpu-orange hover:bg-lpu-orange/95 text-white"
                  onClick={handleGetStarted}
                >
                  Get Started — It&apos;s Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <p className="mt-4 text-sm text-lpu-text-muted">
                No credit card required · Open to all LPU students and alumni
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
