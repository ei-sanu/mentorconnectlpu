'use client';

import { Bell } from 'lucide-react';
import { useUser, useAuth } from '@/lib/mock-auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const showRoleSwitcher = user.email === 'someshranjanbiswal13678@gmail.com';

  const handleRoleChange = (newRole: string) => {
    localStorage.setItem('active_role', newRole);
    window.location.reload();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-lpu-border bg-lpu-surface px-6">
      <div className="flex items-center">
        <h2 className="text-lg font-medium">
          {/* Breadcrumbs or Page Title could go here */}
        </h2>
      </div>
      
      <div className="flex items-center gap-4">
        {showRoleSwitcher && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 border-lpu-orange text-lpu-orange hover:bg-orange-50">
                <span className="font-semibold text-xs">Active Role: {user.role.replace('_', ' ')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuLabel className="text-xs text-gray-500">Switch Active Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleRoleChange('ADMIN')} className={user.role === 'ADMIN' ? 'font-bold text-lpu-orange' : ''}>
                Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleChange('ALUMNI_OFFICER')} className={user.role === 'ALUMNI_OFFICER' ? 'font-bold text-lpu-orange' : ''}>
                Alumni Officer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleChange('PLACEMENT_OFFICER')} className={user.role === 'PLACEMENT_OFFICER' ? 'font-bold text-lpu-orange' : ''}>
                Placement Officer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button variant="ghost" size="icon" className="relative text-lpu-text-secondary">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-lpu-orange ring-2 ring-white" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <img 
                src={user.imageUrl} 
                alt={user.firstName} 
                className="h-8 w-8 rounded-full object-cover"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                <p className="text-xs leading-none text-lpu-text-muted">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/app/${user.role.toLowerCase()}/profile`)}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/app/${user.role.toLowerCase()}/settings`)}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              signOut();
              router.push('/');
            }}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
