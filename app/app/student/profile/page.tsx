'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, GraduationCap, Link as LinkIcon, Camera } from 'lucide-react';

export default function StudentProfilePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your public presence on MentorConnect.</p>
        </div>
        <Button>Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Basic Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="h-32 w-32 rounded-full bg-lpu-orange/10 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden text-4xl text-lpu-orange font-bold">
                    AS
                  </div>
                  <button className="absolute bottom-0 right-0 h-10 w-10 bg-white rounded-full border shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors">
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
                <h2 className="text-xl font-bold mt-4">Anjali Sharma</h2>
                <p className="text-gray-500">B.Tech Computer Science (3rd Year)</p>
                
                <div className="w-full mt-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>Jalandhar, Punjab</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    <span>Lovely Professional University</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <Input defaultValue="Anjali" className="bg-gray-50 border-0" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <Input defaultValue="Sharma" className="bg-gray-50 border-0" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <Input defaultValue="anjali.s@lpu.in" className="bg-gray-50 border-0" disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <Input placeholder="+91 XXXXX XXXXX" className="bg-gray-50 border-0" />
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-lpu-orange focus:outline-none resize-y"
                  defaultValue="Passionate about full-stack development and cloud computing. Looking for mentorship in system design and career planning for product-based companies."
                ></textarea>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Career Goals & Interests</CardTitle>
              <CardDescription>This helps us match you with the right mentors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Primary Career Goal</label>
                <Input defaultValue="Software Engineer (SDE-1)" className="bg-gray-50 border-0" />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Skills & Interests</label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="px-3 py-1">React</Badge>
                  <Badge variant="secondary" className="px-3 py-1">Node.js</Badge>
                  <Badge variant="secondary" className="px-3 py-1">AWS</Badge>
                  <Badge variant="secondary" className="px-3 py-1">Data Structures</Badge>
                  <Button variant="outline" size="sm" className="h-7 border-dashed border-gray-300 text-gray-500 rounded-full">
                    + Add Skill
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
