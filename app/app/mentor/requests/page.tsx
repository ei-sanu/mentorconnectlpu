'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

// Mock data directly for prototype speed, ideally this uses service layer
const mockRequests = [
  {
    id: 'req_1',
    studentName: 'Aarav Sharma',
    studentImage: 'https://picsum.photos/seed/aarav/200/200',
    programme: 'B.Tech CSE',
    year: '3rd Year',
    goal: 'Backend Engineering & System Design',
    message: 'I would love to learn more about backend engineering and system design from your experience at Google. I have been practicing Node.js and want to know what it takes to crack top product companies.',
    status: 'PENDING',
    date: '2 hours ago'
  },
  {
    id: 'req_2',
    studentName: 'Sneha Verma',
    studentImage: 'https://picsum.photos/seed/sneha/200/200',
    programme: 'B.Tech IT',
    year: '4th Year',
    goal: 'Career Transition',
    message: 'I am looking for guidance on transitioning into a Product Management role. Your profile inspired me.',
    status: 'ACCEPTED',
    date: '3 days ago'
  }
];

export default function MentorRequests() {
  const [requests, setRequests] = useState(mockRequests);

  const handleAction = (id: string, action: 'ACCEPTED' | 'DECLINED') => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: action } : r));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-lpu-text-primary">
          Mentorship Requests
        </h1>
        <p className="text-lpu-text-secondary mt-1">
          Review and manage requests from students.
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {requests.map((request) => (
          <Card key={request.id} className="overflow-hidden">
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <img 
                      src={request.studentImage} 
                      alt={request.studentName} 
                      className="h-12 w-12 rounded-full object-cover border border-gray-100" 
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{request.studentName}</h3>
                      <p className="text-sm text-lpu-text-secondary">{request.programme} • {request.year}</p>
                    </div>
                  </div>
                  {request.status === 'PENDING' && <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</Badge>}
                  {request.status === 'ACCEPTED' && <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Accepted</Badge>}
                  {request.status === 'DECLINED' && <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3"/> Declined</Badge>}
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
                  Received {request.date}
                </div>
              </div>
              
              {request.status === 'PENDING' && (
                <div className="flex md:flex-col gap-2 justify-end">
                  <Button size="sm" onClick={() => handleAction(request.id, 'ACCEPTED')}>
                    Accept Request
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAction(request.id, 'DECLINED')}>
                    Decline
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
