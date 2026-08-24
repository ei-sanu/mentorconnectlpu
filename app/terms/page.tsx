'use client';

import { LandingHeader } from '@/components/layout/landing-header';
import { LandingFooter } from '@/components/layout/landing-footer';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingHeader />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-16 md:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-8">Terms and Conditions</h1>
        
        <div className="prose prose-orange max-w-none text-lpu-text-secondary">
          <p className="lead text-lg mb-8">
            Welcome to LPU MentorConnect. By accessing or using our platform, you agree to be bound by these Terms and Conditions. Please read them carefully.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-6">
            By creating an account, accessing, or using the LPU MentorConnect platform, you acknowledge that you have read, understood, and agree to be bound by these terms. If you do not agree to these terms, please do not use our services.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">2. Eligibility and Registration</h2>
          <p className="mb-6">
            The platform is exclusively available to current students, verified alumni, and faculty of Lovely Professional University (LPU). You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">3. User Conduct</h2>
          <p className="mb-4">While using the platform, you agree to:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Maintain professional decorum in all communications.</li>
            <li>Respect the time and boundaries of mentors and mentees.</li>
            <li>Not use the platform for commercial solicitation or spam.</li>
            <li>Not share sensitive personal or financial information.</li>
            <li>Abide by all applicable university policies and guidelines.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">4. Mentorship Interactions</h2>
          <p className="mb-6">
            Mentorship provided through this platform is for guidance and educational purposes only. Mentors volunteer their time and do not guarantee employment, financial success, or specific career outcomes. All advice should be evaluated independently.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">5. Privacy and Data Usage</h2>
          <p className="mb-6">
            Your privacy is important to us. Our collection and use of personal data are governed by our Privacy Policy. By using the platform, you consent to the processing of your data as described therein.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">6. Modification of Terms</h2>
          <p className="mb-6">
            We reserve the right to modify these terms at any time. We will notify users of significant changes. Continued use of the platform after changes constitutes acceptance of the modified terms.
          </p>

          <div className="mt-16 p-6 bg-lpu-bg rounded-2xl border border-orange-100">
            <p className="text-sm font-medium text-gray-900">Last Updated: August 2026</p>
            <p className="text-sm mt-2">If you have any questions about these Terms, please contact the LPU Alumni Office.</p>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
