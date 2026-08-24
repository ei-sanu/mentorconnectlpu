'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  MessageSquare, 
  Bell, 
  Settings, 
  UserCircle,
  GraduationCap,
  Calendar,
  CheckSquare
} from 'lucide-react';
import { useUser } from '@/lib/mock-auth';
import { LpuLogo } from '@/components/ui/lpu-logo';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  if (!user) return null;

  let navItems: NavItem[] = [];

  if (user.role === 'STUDENT') {
    navItems = [
      { title: 'Dashboard', href: '/app/student/dashboard', icon: LayoutDashboard },
      { title: 'Find Mentors', href: '/app/student/mentors', icon: Users },
      { title: 'My Requests', href: '/app/student/requests', icon: Briefcase },
      { title: 'My Mentorships', href: '/app/student/mentorships', icon: GraduationCap },
      { title: 'Messages', href: '/app/student/messages', icon: MessageSquare },
      { title: 'Profile', href: '/app/student/profile', icon: UserCircle },
    ];
  } else if (user.role === 'MENTOR') {
    navItems = [
      { title: 'Dashboard', href: '/app/mentor/dashboard', icon: LayoutDashboard },
      { title: 'Requests', href: '/app/mentor/requests', icon: Briefcase },
      { title: 'My Mentees', href: '/app/mentor/mentees', icon: Users },
      { title: 'Availability', href: '/app/mentor/availability', icon: Calendar },
      { title: 'Capacity', href: '/app/mentor/capacity', icon: CheckSquare },
      { title: 'Messages', href: '/app/mentor/messages', icon: MessageSquare },
      { title: 'Profile', href: '/app/mentor/profile', icon: UserCircle },
    ];
  } else if (user.role === 'ADMIN') {
    navItems = [
      { title: 'Dashboard', href: '/app/admin/dashboard', icon: LayoutDashboard },
      { title: 'Verification', href: '/app/admin/verification', icon: CheckSquare },
      { title: 'Users', href: '/app/admin/users', icon: Users },
      { title: 'Settings', href: '/app/admin/settings', icon: Settings },
    ];
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-lpu-border bg-lpu-surface">
      <div className="flex h-16 items-center px-6 border-b border-lpu-border">
        <Link href="/" className="flex items-center gap-2">
          <LpuLogo className="h-8 w-auto" />
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-50 text-lpu-orange" 
                    : "text-lpu-text-secondary hover:bg-gray-100 hover:text-lpu-text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  );
}
