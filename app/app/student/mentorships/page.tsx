'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mentorshipService } from '@/services/api';
import { Mentorship } from '@/types';
import Link from 'next/link';
import { GraduationCap, ArrowRight } from 'lucide-react';

export default function StudentMentorships() {
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMentorships() {
      const data = await mentorshipService.getActiveMentorships();
      setMentorships(data);
      setLoading(false);
    }
    loadMentorships();
  }, []);

  return (
    <div className="space-y-8 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-lpu-text-primary">
            My Mentorships
          </h1>
          <p className="text-lpu-text-secondary mt-1">
            Access your active mentorship workspaces.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card className="animate-pulse bg-gray-50 h-64" />
        ) : mentorships.length > 0 ? (
          mentorships.map((mentorship) => (
            <Card key={mentorship.id} className="flex flex-col overflow-hidden">
              <div className="p-4 border-b border-lpu-border flex items-center justify-between bg-gray-50/50">
                <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {mentorship.status}
                </Badge>
                <span className="text-xs text-lpu-text-muted">
                  Started {new Date(mentorship.startDate).toLocaleDateString()}
                </span>
              </div>
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex flex-col items-center text-center space-y-3 mb-6">
                  {mentorship.mentor && (
                    <img 
                      src={mentorship.mentor.imageUrl} 
                      alt={mentorship.mentor.firstName} 
                      className="h-20 w-20 rounded-full object-cover border-2 border-gray-100" 
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{mentorship.mentor?.firstName} {mentorship.mentor?.lastName}</h3>
                    <p className="text-sm text-lpu-text-secondary">{mentorship.mentor?.title}</p>
                    <p className="text-xs text-lpu-text-muted mt-1">{mentorship.mentor?.company}</p>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <Link href={`/app/student/mentorships/${mentorship.id}`} className="w-full block">
                    <Button className="w-full flex items-center gap-2">
                      Open Workspace <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="flex flex-col items-center justify-center py-12 text-center col-span-full">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-lpu-orange mb-4">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium">No active mentorships</h3>
            <p className="text-lpu-text-secondary mt-1">Start by finding a mentor and sending a request.</p>
            <Link href="/app/student/mentors" className="mt-4">
              <Button>Find Mentors</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
