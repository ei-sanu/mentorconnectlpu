'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Star, CheckCircle2 } from 'lucide-react';
import { mentorService } from '@/services/api';
import { MentorMatch, MentorPublicProfile } from '@/types';
import Link from 'next/link';

export default function MentorDiscovery() {
  const [mentors, setMentors] = useState<MentorMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadMentors() {
      const data = await mentorService.getRecommendedMentors();
      setMentors(data);
      setLoading(false);
    }
    loadMentors();
  }, []);

  return (
    <div className="space-y-8 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-lpu-text-primary">
            Find Mentors
          </h1>
          <p className="text-lpu-text-secondary mt-1">
            Connect with alumni who have walked your path.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-lpu-text-muted" />
            <input 
              type="text" 
              placeholder="Search by role, company..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 pr-4 rounded-md border border-lpu-border text-sm focus:outline-none focus:ring-2 focus:ring-lpu-orange w-full sm:w-64"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse bg-gray-50 h-80" />
            ))
          ) : (
            mentors.filter(m => m.company.toLowerCase().includes(searchQuery.toLowerCase()) || m.title.toLowerCase().includes(searchQuery.toLowerCase())).map((mentor) => (
              <Card key={mentor.id} className="flex flex-col h-full overflow-hidden">
                <div className="bg-blue-50/50 p-3 border-b border-lpu-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-lpu-orange fill-lpu-orange" />
                    <span className="font-semibold text-lpu-orange text-sm">{mentor.matchScore}% Match</span>
                  </div>
                  <Badge variant="outline" className="bg-white text-xs">
                    {mentor.capacity.max - mentor.capacity.current} slots left
                  </Badge>
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <img src={mentor.imageUrl} alt={mentor.firstName} className="h-14 w-14 rounded-full object-cover border border-gray-100" />
                    <div>
                      <h3 className="font-semibold text-base">{mentor.firstName} {mentor.lastName}</h3>
                      <p className="text-lpu-text-secondary text-sm line-clamp-1">{mentor.title} at {mentor.company}</p>
                      <p className="text-lpu-text-muted text-xs mt-0.5">{mentor.experienceYears}y exp • Class of {mentor.graduationYear}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {mentor.expertise.slice(0, 3).map((exp, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {exp}
                        </Badge>
                      ))}
                      {mentor.expertise.length > 3 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          +{mentor.expertise.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-3 mb-4 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-lpu-text-muted mb-2">Why this mentor?</p>
                    <ul className="text-xs space-y-1.5 text-lpu-text-secondary">
                      {mentor.matchReasons.slice(0, 2).map((reason, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-px" />
                          <span className="line-clamp-2">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-auto">
                    <Button className="w-full">View & Request</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
