'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { mentorshipService } from '@/services/api';
import { Mentorship, Session, Goal } from '@/types';
import { Calendar, Target, CheckCircle2, MessageSquare, Video, FileText } from 'lucide-react';

export default function MentorshipWorkspace() {
  const params = useParams();
  const id = typeof params.mentorshipId === 'string' ? params.mentorshipId : '';
  
  const [mentorship, setMentorship] = useState<Mentorship | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      const [allMentorships, sess, g] = await Promise.all([
        mentorshipService.getActiveMentorships(),
        mentorshipService.getSessions(id),
        mentorshipService.getGoals(id)
      ]);
      const found = allMentorships.find(m => m.id === id) || allMentorships[0];
      setMentorship(found);
      setSessions(sess);
      setGoals(g);
      setLoading(false);
    }
    loadData();
  }, [id]);

  if (loading || !mentorship) {
    return <div className="animate-pulse space-y-8">
      <div className="h-32 bg-gray-50 rounded-xl" />
      <div className="h-64 bg-gray-50 rounded-xl" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white border border-lpu-border rounded-xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-sm">
        {mentorship.mentor && (
          <img 
            src={mentorship.mentor.imageUrl} 
            alt={mentorship.mentor.firstName} 
            className="w-24 h-24 rounded-full object-cover border-4 border-blue-50"
          />
        )}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-lpu-text-primary">
                {mentorship.mentor?.firstName} {mentorship.mentor?.lastName}
              </h1>
              <p className="text-lpu-text-secondary">{mentorship.mentor?.title} at {mentorship.mentor?.company}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2">
                <MessageSquare className="w-4 h-4" /> Message
              </Button>
              <Button size="sm" className="gap-2">
                <Calendar className="w-4 h-4" /> Schedule
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-lpu-text-muted">
            <span className="flex items-center gap-1.5">
              <Badge variant="success" className="bg-emerald-50 text-emerald-700">Active</Badge>
            </span>
            <span>Started {new Date(mentorship.startDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="w-5 h-5 text-lpu-orange" /> Next Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.filter(s => s.status === 'SCHEDULED').length > 0 ? (
                  <div className="space-y-4">
                    {sessions.filter(s => s.status === 'SCHEDULED').slice(0,1).map(session => (
                      <div key={session.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">{session.title}</p>
                          <p className="text-xs text-lpu-text-secondary mt-1">
                            {new Date(session.date).toLocaleDateString()} at {session.time}
                          </p>
                        </div>
                        <Button size="sm">Join Call</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-lpu-text-muted">No upcoming sessions.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-lpu-orange" /> Current Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                 {goals.filter(g => g.status === 'IN_PROGRESS').length > 0 ? (
                  <div className="space-y-4">
                    {goals.filter(g => g.status === 'IN_PROGRESS').slice(0,1).map(goal => (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex justify-between">
                          <p className="font-medium text-sm">{goal.title}</p>
                          <span className="text-xs font-semibold text-lpu-orange">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                        <p className="text-xs text-lpu-text-secondary mt-2">{goal.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-lpu-text-muted">No goals in progress.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Session History</h3>
            <Button size="sm">Schedule New</Button>
          </div>
          <div className="grid gap-4">
            {sessions.map(session => (
              <Card key={session.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded bg-blue-50 text-lpu-orange flex flex-col items-center justify-center">
                      <span className="text-xs uppercase font-semibold">
                        {new Date(session.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="font-bold leading-none">
                        {new Date(session.date).getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{session.title}</p>
                      <p className="text-sm text-lpu-text-secondary">
                        {session.time} • {session.durationMinutes} mins
                      </p>
                    </div>
                  </div>
                  <div>
                    {session.status === 'COMPLETED' ? (
                      <Badge variant="success" className="bg-emerald-50 text-emerald-700">Completed</Badge>
                    ) : (
                      <Button size="sm" variant="outline">Reschedule</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-6 space-y-4">
           <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Action Plan</h3>
            <Button size="sm">Add Goal</Button>
          </div>
          <div className="grid gap-4">
            {goals.map(goal => (
              <Card key={goal.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{goal.title}</p>
                      <p className="text-sm text-lpu-text-secondary mt-1">{goal.description}</p>
                    </div>
                    {goal.status === 'COMPLETED' ? (
                      <Badge variant="success" className="bg-emerald-50 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1"/> Done</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-blue-50 text-lpu-orange">In Progress</Badge>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-lpu-text-muted">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="mt-6 text-center py-12">
           <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
             <FileText className="w-6 h-6 text-lpu-text-muted" />
           </div>
           <h3 className="text-lg font-medium">Session Feedback</h3>
           <p className="text-sm text-lpu-text-secondary mt-2">Feedback records will appear here after sessions are completed.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
