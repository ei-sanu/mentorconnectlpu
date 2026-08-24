'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { requestService } from '@/services/api';
import { MentorshipRequest } from '@/types';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function StudentRequests() {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      const data = await requestService.getStudentRequests();
      setRequests(data);
      setLoading(false);
    }
    loadRequests();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-lpu-text-primary">
          My Requests
        </h1>
        <p className="text-lpu-text-secondary mt-1">
          Track the status of your mentorship applications.
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {loading ? (
           <Card className="animate-pulse bg-gray-50 h-40" />
        ) : requests.length > 0 ? (
          requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {request.mentor && (
                        <img 
                          src={request.mentor.imageUrl} 
                          alt={request.mentor.firstName} 
                          className="h-12 w-12 rounded-full object-cover border border-gray-100" 
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{request.mentor?.firstName} {request.mentor?.lastName}</h3>
                        <p className="text-sm text-lpu-text-secondary">{request.mentor?.title} at {request.mentor?.company}</p>
                      </div>
                    </div>
                    {request.status === 'PENDING' && <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</Badge>}
                    {request.status === 'ACCEPTED' && <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Accepted</Badge>}
                    {request.status === 'DECLINED' && <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3"/> Declined</Badge>}
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold text-lpu-text-muted uppercase tracking-wider mb-1">Goal Focus</h4>
                    <p className="text-sm font-medium">{request.goal}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold text-lpu-text-muted uppercase tracking-wider mb-1">Your Message</h4>
                    <p className="text-sm text-lpu-text-secondary bg-gray-50 p-3 rounded-md border border-gray-100">
                      &quot;{request.message}&quot;
                    </p>
                  </div>
                  
                  <div className="text-xs text-lpu-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Sent {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                {request.status === 'PENDING' && (
                  <div className="flex md:flex-col gap-2 justify-end">
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">Cancel Request</Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-medium">No pending requests</h3>
            <p className="text-lpu-text-secondary mt-1">You haven't sent any mentorship requests yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
