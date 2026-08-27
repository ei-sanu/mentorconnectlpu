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
  CheckSquare,
  User,
  Award,
  ShieldAlert,
  FileText,
  CheckCircle,
  Sparkles,
  Target,
  Sliders,
  BarChart3,
  ClipboardList,
  UserCheck,
  Activity,
  Clock
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
      { title: 'Settings', href: '/app/student/settings', icon: Settings },
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
      { title: 'Settings', href: '/app/mentor/settings', icon: Settings },
    ];
  } else if (user.role === 'ADMIN') {
    navItems = [
      { title: 'Dashboard', href: '/app/admin/dashboard', icon: LayoutDashboard },
      { title: 'Users', href: '/app/admin/users', icon: Users },
      { title: '  • All Users', href: '/app/admin/users', icon: Users },
      { title: '  • Students', href: '/app/admin/users?role=STUDENT', icon: GraduationCap },
      { title: '  • Alumni', href: '/app/admin/users?role=ALUMNI', icon: User },
      { title: '  • Mentors', href: '/app/admin/users?role=MENTOR', icon: Award },
      { title: 'Verification', href: '/app/admin/verification', icon: ShieldAlert },
      { title: 'Mentorship', href: '/app/admin/mentorships/requests', icon: FileText },
      { title: '  • Requests', href: '/app/admin/mentorships/requests', icon: FileText },
      { title: '  • Active', href: '/app/admin/mentorships/active', icon: CheckCircle },
      { title: '  • Completed', href: '/app/admin/mentorships/completed', icon: Sparkles },
      { title: 'AI Matching', href: '/app/admin/matching/overview', icon: Target },
      { title: '  • Overview', href: '/app/admin/matching/overview', icon: Target },
      { title: '  • Configuration', href: '/app/admin/matching/config', icon: Sliders },
      { title: 'Analytics', href: '/app/admin/analytics', icon: BarChart3 },
      { title: 'Notifications', href: '/app/admin/notifications', icon: Bell },
      { title: 'Audit Logs', href: '/app/admin/audit-logs', icon: ClipboardList },
      { title: 'System Settings', href: '/app/admin/settings', icon: Settings },
    ];
  } else if (user.role === 'ALUMNI_OFFICER') {
    navItems = [
      { title: 'Dashboard', href: '/app/alumni-officer/dashboard', icon: LayoutDashboard },
      { title: 'Alumni', href: '/app/alumni-officer/directory', icon: Users },
      { title: '  • Directory', href: '/app/alumni-officer/directory', icon: Users },
      { title: '  • Verification', href: '/app/alumni-officer/verification', icon: ShieldAlert },
      { title: '  • Analytics', href: '/app/alumni-officer/analytics', icon: BarChart3 },
      { title: 'Mentors', href: '/app/alumni-officer/mentors', icon: UserCheck },
      { title: '  • Applications', href: '/app/alumni-officer/mentor-applications', icon: FileText },
      { title: '  • Active Mentors', href: '/app/alumni-officer/mentors', icon: UserCheck },
      { title: '  • Performance', href: '/app/alumni-officer/mentor-performance', icon: Activity },
      { title: 'Mentorship', href: '/app/alumni-officer/mentorships/active', icon: CheckCircle },
      { title: '  • Active', href: '/app/alumni-officer/mentorships/active', icon: CheckCircle },
      { title: '  • Requests', href: '/app/alumni-officer/mentorships/requests', icon: Clock },
      { title: '  • Feedback', href: '/app/alumni-officer/mentorships/feedback', icon: MessageSquare },
      { title: 'Notifications', href: '/app/alumni-officer/notifications', icon: Bell },
    ];
  } else if (user.role === 'PLACEMENT_OFFICER') {
    navItems = [
      { title: 'Dashboard', href: '/app/placement-officer/dashboard', icon: LayoutDashboard },
      { title: 'Students', href: '/app/placement-officer/directory', icon: Users },
      { title: '  • Directory', href: '/app/placement-officer/directory', icon: Users },
      { title: '  • Career Readiness', href: '/app/placement-officer/readiness', icon: CheckSquare },
      { title: '  • Skill Gaps', href: '/app/placement-officer/skill-gaps', icon: ShieldAlert },
      { title: 'Opportunities', href: '/app/placement-officer/opportunities/active', icon: Briefcase },
      { title: '  • Active', href: '/app/placement-officer/opportunities/active', icon: Briefcase },
      { title: '  • Upcoming', href: '/app/placement-officer/opportunities/upcoming', icon: Clock },
      { title: '  • Applications', href: '/app/placement-officer/opportunities/applications', icon: FileText },
      { title: 'Placements', href: '/app/placement-officer/placements/applications', icon: FileText },
      { title: '  • Applications', href: '/app/placement-officer/placements/applications', icon: FileText },
      { title: '  • Interviews', href: '/app/placement-officer/placements/interviews', icon: Calendar },
      { title: '  • Outcomes', href: '/app/placement-officer/placements/outcomes', icon: CheckCircle },
      { title: 'AI Insights', href: '/app/placement-officer/ai-insights', icon: Sparkles },
      { title: 'Analytics', href: '/app/placement-officer/analytics', icon: BarChart3 },
      { title: 'Notifications', href: '/app/placement-officer/notifications', icon: Bell },
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
