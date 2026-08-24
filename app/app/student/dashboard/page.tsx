'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/mock-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, CheckSquare, Clock, ArrowRight, Star } from 'lucide-react';
import { mentorService, mentorshipService, requestService } from '@/services/api';
import { MentorMatch, Mentorship, Session, Goal } from '@/types';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user } = useUser();
  const [mentors, setMentors] = useState<MentorMatch[]>([]);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [recommended, activeMentorships] = await Promise.all([
        mentorService.getRecommendedMentors(),
        mentorshipService.getActiveMentorships(),
      ]);
      setMentors(recommended);
      setMentorships(activeMentorships);
      setLoading(false);
    }
    loadData();
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-lpu-text-primary">
          Good morning, {user.firstName}
        </h1>
        <p className="text-lpu-text-secondary mt-1">
          Continue building your career with guidance from the LPU alumni network.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mentorships</CardTitle>
            <GraduationCap className="h-4 w-4 text-lpu-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mentorships.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-lpu-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals in Progress</CardTitle>
            <CheckSquare className="h-4 w-4 text-lpu-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-lpu-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">AI Recommended Mentors</h2>
            <Link href="/app/student/mentors">
              <Button variant="ghost" size="sm" className="text-lpu-orange">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Card key={i} className="animate-pulse bg-gray-50">
                  <CardContent className="h-40" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {mentors.slice(0, 2).map((mentor) => (
                <Card key={mentor.id} className="overflow-hidden">
                  <div className="bg-blue-50/50 p-4 border-b border-lpu-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-lpu-orange fill-lpu-orange" />
                      <span className="font-semibold text-lpu-orange text-sm">{mentor.matchScore}% Match</span>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {mentor.capacity.max - mentor.capacity.current} slots left
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <img src={mentor.imageUrl} alt={mentor.firstName} className="h-16 w-16 rounded-full object-cover border border-gray-100" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{mentor.firstName} {mentor.lastName}</h3>
                        <p className="text-lpu-text-secondary text-sm">{mentor.title} at {mentor.company}</p>
                        <p className="text-lpu-text-muted text-xs mt-1">{mentor.programme} • Class of {mentor.graduationYear}</p>
                        
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-lpu-text-muted">Why this mentor?</p>
                          <ul className="text-sm space-y-1 text-lpu-text-secondary">
                            {mentor.matchReasons.slice(0, 3).map((reason, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="mt-6 flex items-center gap-3">
                          <Button className="w-full sm:w-auto">Request Mentorship</Button>
                          <Button variant="outline" className="w-full sm:w-auto">View Profile</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Active Mentorship</h2>
          {loading ? (
             <Card className="animate-pulse bg-gray-50">
               <CardContent className="h-64" />
             </Card>
          ) : mentorships.length > 0 ? (
            <Card>
              <CardHeader className="bg-gray-50/50 border-b border-lpu-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mentorship with {mentorships[0].mentor?.firstName}</CardTitle>
                    <CardDescription>Started {new Date(mentorships[0].startDate).toLocaleDateString()}</CardDescription>
                  </div>
                  <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Next Session</h4>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-lpu-border bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-white border border-gray-200 flex flex-col items-center justify-center">
                        <span className="text-xs text-lpu-text-muted uppercase">Aug</span>
                        <span className="font-bold text-sm leading-none">26</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Resume Review</p>
                        <p className="text-xs text-lpu-text-secondary">11:00 AM • 30 mins</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Join</Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Current Goal Focus</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-lpu-text-secondary">Build Backend API Portfolio</span>
                      <span className="text-lpu-text-muted">50%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-lpu-orange rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" className="w-full text-lpu-orange">Go to Workspace</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-lpu-orange mb-4">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">No active mentorships</h3>
              <p className="text-lpu-text-secondary mt-1 max-w-xs mb-6">
                Send a request to a recommended mentor to start your journey.
              </p>
              <Button>Find Mentors</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Ensure CheckCircle2 is imported if missing
import { CheckCircle2 } from 'lucide-react';
