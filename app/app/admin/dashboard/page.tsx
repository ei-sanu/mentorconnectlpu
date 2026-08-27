'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/mock-auth';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/dashboard/primitives';
import { AdminView } from '@/components/dashboard/admin-view';
import { AlumniOfficerView } from '@/components/dashboard/alumni-officer-view';
import { PlacementOfficerView } from '@/components/dashboard/placement-officer-view';

/**
 * Role-aware dashboard entry point.
 * The view rendered is determined by the authenticated backend role
 * (RBAC for the underlying APIs is enforced server-side regardless).
 */
export default function AdminDashboardPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !['ADMIN', 'ALUMNI_OFFICER', 'PLACEMENT_OFFICER'].includes(user.role)) {
      router.replace(`/app/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, router]);

  if (!user || !['ADMIN', 'ALUMNI_OFFICER', 'PLACEMENT_OFFICER'].includes(user.role)) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ErrorState message="Loading your dashboard…" />
        </CardContent>
      </Card>
    );
  }

  switch (user.role) {
    case 'ALUMNI_OFFICER':
      return <AlumniOfficerView />;
    case 'PLACEMENT_OFFICER':
      return <PlacementOfficerView />;
    case 'ADMIN':
    default:
      return <AdminView />;
  }
}
