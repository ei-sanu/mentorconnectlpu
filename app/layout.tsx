import type {Metadata} from 'next';
import './globals.css';
import { MockAuthProvider } from '@/lib/mock-auth';
import { ScrollToTop } from '@/components/scroll-to-top';

export const metadata: Metadata = {
  title: 'LPU MentorConnect',
  description: 'Connect with verified LPU alumni for structured career mentorship.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ScrollToTop />
        <MockAuthProvider>
          {children}
        </MockAuthProvider>
      </body>
    </html>
  );
}
