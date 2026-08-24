'use client';

import { LandingHeader } from '@/components/layout/landing-header';
import { LandingFooter } from '@/components/layout/landing-footer';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingHeader />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-16 md:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-orange max-w-none text-lpu-text-secondary">
          <p className="lead text-lg mb-8">
            At LPU MentorConnect, we are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">1. Information We Collect</h2>
          <p className="mb-4">We collect personal information that you voluntarily provide to us when you register on the platform, including:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Identity Data:</strong> Name, university ID, graduation year, and degree program.</li>
            <li><strong>Contact Data:</strong> Email address and phone number.</li>
            <li><strong>Professional Data:</strong> Current job title, company, skills, and LinkedIn profile (for mentors).</li>
            <li><strong>Interaction Data:</strong> Mentorship requests, messages exchanged on the platform, and session feedback.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use the collected information for the following purposes:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>To facilitate the matching process between students and mentors.</li>
            <li>To create and manage your account.</li>
            <li>To enable communication between users via our internal messaging system.</li>
            <li>To analyze platform usage and improve our services.</li>
            <li>To send administrative information, updates, and notifications.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">3. Data Sharing and Disclosure</h2>
          <p className="mb-6">
            We do not sell your personal data to third parties. Information is shared internally within the LPU network to facilitate mentorship. Your public profile information will be visible to other verified users of the platform based on your role (e.g., mentors can see student profiles who request their guidance).
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">4. Data Security</h2>
          <p className="mb-6">
            We implement appropriate technical and organizational security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, please note that no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">5. Your Privacy Rights</h2>
          <p className="mb-6">
            You have the right to access, correct, or delete your personal data. You can manage your profile information directly through your account settings. If you wish to deactivate your account or request data deletion, please contact platform support.
          </p>

          <div className="mt-16 p-6 bg-lpu-bg rounded-2xl border border-orange-100">
            <p className="text-sm font-medium text-gray-900">Last Updated: August 2026</p>
            <p className="text-sm mt-2">For any privacy-related inquiries, please contact privacy@lpu.in</p>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
