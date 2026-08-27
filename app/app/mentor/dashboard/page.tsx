'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/lib/mock-auth';
import { requestService, mentorshipService, mentorService } from '@/services/api';
import { MentorshipRequest, Mentorship } from '@/types';
import Link from 'next/link';
import { ArrowRight, Users, Clock, Calendar, CheckCircle2 } from 'lucide-react';

export default function MentorDashboard() {
  const { user } = useUser();
  const [pendingRequests, setPendingRequests] = useState<MentorshipRequest[]>([]);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [mentorProfile, setMentorProfile] = useState<{ capacity: { max: number; current: number } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function loadDashboard() {
      try {
        const [requests, activeMentorships, profile] = await Promise.all([
          requestService.getMentorRequests(),
          mentorshipService.getActiveMentorships(),
          mentorService.getMyProfile(),
        ]);
        setPendingRequests(requests.filter(r => r.status === 'PENDING'));
        setMentorships(activeMentorships);
        setMentorProfile(profile as any);
      } catch (err) {
        console.error('Failed to load mentor dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user]);

  const handleAccept = async (id: string) => {
    try {
      await requestService.acceptRequest(id);
      setPendingRequests(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to accept request');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await requestService.declineRequest(id);
      setPendingRequests(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to decline request');
    }
  };

  if (!user) return null;

  const capacity = mentorProfile?.capacity;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-lpu-text-primary">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-lpu-text-secondary mt-1">
          Manage your mentees and mentorship requests.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active Mentees</CardTitle>
            <Users className="h-4 w-4 text-lpu-text-muted" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold">
                {mentorships.length}{' '}
                {capacity && (
                  <span className="text-sm font-normal text-lpu-text-muted">/ {capacity.max} capacity</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-lpu-text-muted" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Mentorships</CardTitle>
            <Calendar className="h-4 w-4 text-lpu-text-muted" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold">{mentorships.length}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Pending Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Pending Requests</h2>
            <Link href="/app/mentor/requests">
              <Button variant="ghost" size="sm" className="text-lpu-orange">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <Card className="animate-pulse bg-gray-50 h-48" />
          ) : pendingRequests.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-lpu-text-secondary text-sm">No pending requests</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((req) => (
                <Card key={req.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">
                          {(req as any).studentName || `Student ${req.studentId?.slice(0, 6)}`}
                        </p>
                        <p className="text-xs text-lpu-text-secondary">
                          {(req as any).studentProgramme || 'LPU Student'}
                        </p>
                      </div>
                      <Badge variant="warning" className="text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </Badge>
                    </div>
                    <p className="text-xs text-lpu-text-secondary bg-gray-50 p-2 rounded mb-3 line-clamp-2">
                      &quot;{req.message}&quot;
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => handleAccept(req.id)}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDecline(req.id)}>
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Active Mentorships */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Active Mentorships</h2>
            <Link href="/app/mentor/mentees">
              <Button variant="ghost" size="sm" className="text-lpu-orange">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <Card className="animate-pulse bg-gray-50 h-48" />
          ) : mentorships.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-lpu-text-secondary text-sm">No active mentorships yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {mentorships.slice(0, 3).map((mentorship) => (
                <Card key={mentorship.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        Mentorship #{mentorship.id.slice(-6)}
                      </CardTitle>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                        Active
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Started {new Date(mentorship.startDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
