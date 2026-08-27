'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, ExternalLink, Eye, X } from 'lucide-react';
import { adminService } from '@/services/api';

interface VerificationRequest {
  id: string;
  userId: string;
  status: string;
  submittedAt: string;
  role?: string;
  user?: { firstName: string; lastName: string; email: string };
  documentUrl?: string;
  graduationYear?: number;
  programme?: string;
  phone?: string;
  registrationNumber?: string;
  lpuEmail?: string;
  school?: string;
  company?: string;
  designation?: string;
}

export default function VerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mentor' | 'student'>('mentor');
  const [selectedRequestForModal, setSelectedRequestForModal] = useState<VerificationRequest | null>(null);

  const loadVerifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getPendingVerifications();
      setRequests(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load pending verifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadVerifications();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadVerifications]);

  const handleApprove = async (id: string) => {
    setActionLoading(id + '-approve');
    try {
      await adminService.approveVerification(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      alert('Verification request approved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to approve verification.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please enter the reason for rejection:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Rejection reason is required.');
      return;
    }

    setActionLoading(id + '-reject');
    try {
      await adminService.rejectVerification(id, reason);
      setRequests(prev => prev.filter(r => r.id !== id));
      alert('Verification request rejected successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to reject verification.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestChanges = async (id: string) => {
    const explanation = prompt('Please enter the explanation/instructions for changes:');
    if (explanation === null) return;
    if (!explanation.trim()) {
      alert('Explanation reason is required.');
      return;
    }

    setActionLoading(id + '-changes');
    try {
      await adminService.requestChangesVerification(id, explanation);
      setRequests(prev => prev.filter(r => r.id !== id));
      alert('Change request submitted to the user successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit changes request.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (activeTab === 'mentor') {
      return request.role === 'MENTOR';
    } else {
      return request.role === 'STUDENT';
    }
  });

  const mentorPendingCount = requests.filter(request => request.role === 'MENTOR').length;
  const studentPendingCount = requests.filter(request => request.role === 'STUDENT').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-lpu-text-primary">
          Verification Portal
        </h1>
        <p className="text-lpu-text-secondary mt-1">
          Review university credentials and approve onboarding requests.
        </p>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-lpu-border">
        <button
          onClick={() => setActiveTab('mentor')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'mentor'
              ? 'border-lpu-orange text-lpu-orange font-bold'
              : 'border-transparent text-lpu-text-secondary hover:text-lpu-text-primary'
          }`}
        >
          <span>Mentor Verifications</span>
          {mentorPendingCount > 0 && (
            <Badge className="bg-lpu-orange hover:bg-lpu-orange text-white rounded-full px-2 py-0.5 text-xs font-bold border-none">
              {mentorPendingCount}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('student')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'student'
              ? 'border-lpu-orange text-lpu-orange font-bold'
              : 'border-transparent text-lpu-text-secondary hover:text-lpu-text-primary'
          }`}
        >
          <span>Student Verifications</span>
          {studentPendingCount > 0 && (
            <Badge className="bg-blue-600 hover:bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-bold border-none">
              {studentPendingCount}
            </Badge>
          )}
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'mentor' ? 'Pending Alumni Mentors' : 'Pending Student Sign-ups'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'mentor' 
              ? 'Verify graduating details and attachments uploaded by alumni mentors.' 
              : 'Review enrollment details submitted by LPU students.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-500 animate-pulse">Loading verification requests...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
              <h3 className="text-lg font-medium">All caught up!</h3>
              <p className="text-lpu-text-secondary text-sm">
                There are no pending {activeTab === 'mentor' ? 'mentor' : 'student'} verification requests.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-lpu-border">
              {filteredRequests.map((request) => (
                <div key={request.id} className="py-6 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-lpu-text-primary">
                        {request.user ? `${request.user.firstName} ${request.user.lastName}` : 'User'}
                      </h3>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <Clock className="w-3 h-3 mr-1 inline animate-spin-slow" /> Pending Review
                      </Badge>
                      <Badge variant="outline" className={request.role === 'STUDENT' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                        {request.role === 'STUDENT' ? 'Student' : 'Mentor (Alumni)'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-lpu-text-secondary">
                      Email: <span className="font-semibold text-lpu-text-primary">{request.user?.email || 'N/A'}</span>
                    </p>
                    <p className="text-sm text-lpu-text-secondary">
                      Programme: <span className="font-semibold text-lpu-text-primary">{request.programme || 'B.Tech IT'}</span>
                    </p>
                    <p className="text-sm text-lpu-text-secondary">
                      Graduation Year: <span className="font-semibold text-lpu-text-primary">{request.graduationYear || '2024'}</span>
                    </p>
                    {request.submittedAt && (
                      <p className="text-xs text-lpu-text-muted">
                        Submitted: {new Date(request.submittedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col justify-center gap-3 min-w-[220px]">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedRequestForModal(request)}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors w-full"
                    >
                      <Eye className="h-4 w-4 text-lpu-orange" /> View Details
                    </Button>
                    <div className="flex gap-2 w-full">
                      <Button 
                        onClick={() => handleApprove(request.id)}
                        disabled={actionLoading !== null}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleReject(request.id)}
                        disabled={actionLoading !== null}
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Credentials Detail Modal */}
      {selectedRequestForModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" 
          onClick={() => setSelectedRequestForModal(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Applicant Credentials</h2>
                <p className="text-xs text-gray-500 mt-1">Review university status and contact details.</p>
              </div>
              <button 
                onClick={() => setSelectedRequestForModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-lpu-orange/10 flex items-center justify-center text-lpu-orange font-bold text-xl border border-orange-100 shadow-sm">
                  {selectedRequestForModal.user?.firstName?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedRequestForModal.user?.firstName} {selectedRequestForModal.user?.lastName}
                  </h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className={selectedRequestForModal.role === 'STUDENT' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                      {selectedRequestForModal.role === 'STUDENT' ? 'Student' : 'Mentor (Alumni)'}
                    </Badge>
                    <Badge variant="outline" className="border-gray-200 text-gray-600 uppercase">
                      {selectedRequestForModal.status || 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">LPU Email</span>
                  <p className="text-sm text-gray-900 font-medium break-all">{selectedRequestForModal.lpuEmail || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Mobile Number</span>
                  <p className="text-sm text-gray-900 font-semibold">{selectedRequestForModal.phone || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Registration Number</span>
                  <p className="text-sm text-gray-900 font-bold">{selectedRequestForModal.registrationNumber || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Personal Email</span>
                  <p className="text-sm text-gray-900 font-medium break-all">{selectedRequestForModal.user?.email || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">School / Department</span>
                  <p className="text-sm text-gray-900 font-medium">{selectedRequestForModal.school || 'Lovely Professional University'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Degree / Programme</span>
                  <p className="text-sm text-gray-900 font-medium">{selectedRequestForModal.programme || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Graduation Year</span>
                  <p className="text-sm text-gray-900 font-medium">{selectedRequestForModal.graduationYear || 'N/A'}</p>
                </div>

                {selectedRequestForModal.role === 'MENTOR' && (
                  <>
                    <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Current Company</span>
                      <p className="text-sm text-gray-900 font-medium">{selectedRequestForModal.company || 'N/A'}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Current Designation</span>
                      <p className="text-sm text-gray-900 font-medium">{selectedRequestForModal.designation || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>

              {selectedRequestForModal.documentUrl && (
                <div className="pt-4 border-t border-gray-100">
                  <a 
                    href={selectedRequestForModal.documentUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-2xl border border-lpu-orange text-sm font-semibold text-lpu-orange bg-orange-50/50 hover:bg-orange-50 transition-colors w-full"
                  >
                    <ExternalLink className="h-4 w-4" /> View Verification Proof Document
                  </a>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <Button 
                  onClick={() => {
                    handleApprove(selectedRequestForModal.id);
                    setSelectedRequestForModal(null);
                  }}
                  disabled={actionLoading !== null}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2"
                >
                  Approve Application
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    handleReject(selectedRequestForModal.id);
                    setSelectedRequestForModal(null);
                  }}
                  disabled={actionLoading !== null}
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50 rounded-xl py-2"
                >
                  Reject
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    handleRequestChanges(selectedRequestForModal.id);
                    setSelectedRequestForModal(null);
                  }}
                  disabled={actionLoading !== null}
                  className="flex-1 text-amber-600 border-amber-200 hover:bg-amber-50 rounded-xl py-2"
                >
                  Request Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
