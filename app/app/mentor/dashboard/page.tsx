'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/mock-auth';

export default function MentorDashboard() {
  const { user } = useUser();

  if (!user) return null;

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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Mentees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 <span className="text-sm font-normal text-lpu-text-muted">/ 3 capacity</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mentorship Requests</CardTitle>
            <CardDescription>Students requesting your guidance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-lpu-border rounded-lg bg-gray-50/50">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <img src="https://picsum.photos/seed/aarav/200/200" alt="Aarav" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-semibold text-sm">Aarav Sharma</p>
                      <p className="text-xs text-lpu-text-secondary">B.Tech CSE • 3rd Year</p>
                    </div>
                  </div>
                  <span className="text-xs text-lpu-text-muted">2 hours ago</span>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-lpu-text-secondary bg-white p-3 rounded border border-gray-100">
                    &quot;I would love to learn more about backend engineering and system design from your experience at Google.&quot;
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm">Accept Request</Button>
                  <Button size="sm" variant="outline">Decline</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
