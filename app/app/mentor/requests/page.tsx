'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { requestService } from '@/services/api';
import { MentorshipRequest } from '@/types';

export default function MentorRequests() {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      setError(null);
      const data = await requestService.getMentorRequests();
      setRequests(data);
    } catch (err) {
      setError('Failed to load requests. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAccept = async (id: string) => {
    setActionLoading(id + '-accept');
    try {
      await requestService.acceptRequest(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'ACCEPTED' as const } : r));
    } catch (err: any) {
      alert(err.message || 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id + '-decline');
    try {
      await requestService.declineRequest(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'DECLINED' as const } : r));
    } catch (err: any) {
      alert(err.message || 'Failed to decline request');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-lpu-text-primary">
          Mentorship Requests
        </h1>
        <p className="text-lpu-text-secondary mt-1">
          Review and manage requests from students.
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-lpu-orange text-white">
              {pendingCount} pending
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse bg-gray-50 h-48" />
          ))
        ) : error ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadRequests} variant="outline">Retry</Button>
          </Card>
        ) : requests.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-lpu-orange" />
            </div>
            <h3 className="text-lg font-medium">No requests yet</h3>
            <p className="text-lpu-text-secondary mt-1">When students send mentorship requests, they&apos;ll appear here.</p>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {request.mentor?.imageUrl ? (
                        <img
                          src={request.mentor.imageUrl}
                          alt={request.mentor.firstName}
                          className="h-12 w-12 rounded-full object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">
                          {/* For mentor view, studentId is shown as a reference; populated student name when backend returns it */}
                          {(request as any).studentName || `Student ${request.studentId?.slice(0, 6)}`}
                        </h3>
                        <p className="text-sm text-lpu-text-secondary">
                          {(request as any).studentProgramme || 'LPU Student'}
                        </p>
                      </div>
                    </div>
                    {request.status === 'PENDING' && (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </Badge>
                    )}
                    {request.status === 'ACCEPTED' && (
                      <Badge variant="success" className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Accepted
                      </Badge>
                    )}
                    {request.status === 'DECLINED' && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Declined
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-lpu-text-muted uppercase tracking-wider mb-1">Target Goal</h4>
                    <p className="text-sm font-medium">{request.goal}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-lpu-text-muted uppercase tracking-wider mb-1">Message</h4>
                    <p className="text-sm text-lpu-text-secondary bg-gray-50 p-3 rounded-md border border-gray-100">
                      &quot;{request.message}&quot;
                    </p>
                  </div>

                  <div className="text-xs text-lpu-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Received {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {request.status === 'PENDING' && (
                  <div className="flex md:flex-col gap-2 justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(request.id)}
                      disabled={actionLoading === request.id + '-accept'}
                    >
                      {actionLoading === request.id + '-accept' ? 'Accepting...' : 'Accept Request'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecline(request.id)}
                      disabled={actionLoading === request.id + '-decline'}
                    >
                      {actionLoading === request.id + '-decline' ? 'Declining...' : 'Decline'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
