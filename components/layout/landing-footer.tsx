import Link from 'next/link';
import { LpuLogo } from '@/components/ui/lpu-logo';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t border-lpu-border bg-white">
      <div className="container mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-1 space-y-6">
            <Link href="/" className="inline-block">
              <LpuLogo className="h-10 w-auto" />
            </Link>
            <p className="text-sm text-lpu-text-secondary leading-relaxed">
              The official alumni mentorship platform for Lovely Professional University. Connecting students with verified industry experts.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-lpu-text-muted hover:text-lpu-orange transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-lpu-text-muted hover:text-lpu-orange transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-lpu-text-muted hover:text-lpu-orange transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-lpu-text-muted hover:text-lpu-orange transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-lpu-text-primary">Platform</h4>
            <ul className="space-y-3">
              <li><Link href="/#how-it-works" className="text-sm text-lpu-text-secondary hover:text-lpu-orange transition-colors">How it works</Link></li>
              <li><Link href="/#benefits" className="text-sm text-lpu-text-secondary hover:text-lpu-orange transition-colors">Benefits</Link></li>
              <li><Link href="/#demo-login" className="text-sm text-lpu-text-secondary hover:text-lpu-orange transition-colors">Demo Login</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-lpu-text-primary">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-lpu-text-secondary hover:text-lpu-orange transition-colors">Help Center</a></li>
              <li><a href="#" className="text-sm text-lpu-text-secondary hover:text-lpu-orange transition-colors">Career Guides</a></li>
              <li><a href="#" className="text-sm text-lpu-text-secondary hover:text-lpu-orange transition-colors">Alumni Network</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-lpu-text-primary">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/terms" className="text-sm text-lpu-text-secondary hover:text-lpu-orange transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm text-lpu-text-secondary hover:text-lpu-orange transition-colors">Privacy Policy</Link></li>
              <li><a href="#" className="text-sm text-lpu-text-secondary hover:text-lpu-orange transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-lpu-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-lpu-text-muted text-center md:text-left">
            © {new Date().getFullYear()} Lovely Professional University. All rights reserved.
          </p>
          <p className="text-sm text-lpu-text-muted text-center md:text-right">
            Designed for the LPU Community.
          </p>
        </div>
      </div>
    </footer>
  );
}
