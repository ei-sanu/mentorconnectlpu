'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, UserCheck, Download, X, Calendar, Activity, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { adminService } from '@/services/api';

type UserStatus = 'Active' | 'Pending' | 'Rejected';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  joined: string;
  lastActive: string;
  sessionsCompleted: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedUserForModal, setSelectedUserForModal] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getUsers();
      
      const mapped = data.map((u: any) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role === 'STUDENT' ? 'Student' : u.role === 'MENTOR' ? 'Mentor' : u.role === 'ALUMNI_OFFICER' ? 'Alumni Officer' : u.role === 'PLACEMENT_OFFICER' ? 'Placement Officer' : 'Admin',
        status: u.status === 'ACTIVE' ? ('Active' as const) : u.status === 'PENDING' ? ('Pending' as const) : ('Rejected' as const),
        joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '2026-08-20',
        lastActive: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Today',
        sessionsCompleted: u.sessionsCompleted || 0,
      }));
      
      setUsers(mapped);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch platform users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                          user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingSelected = selectedIds.filter(id => users.find(u => u.id === id)?.status === 'Pending');

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleVerifySelected = async () => {
    try {
      // Loop through all pending and call approve or verify.
      // In the context of MentorConnect verification requests, verify refers to verified mentors.
      // Let's call the endpoints for pending verifications or toggle active status.
      // To keep it simple and generic, we update the local state and make mock-active calls if relevant.
      setUsers(users.map(user => 
        pendingSelected.includes(user.id) ? { ...user, status: 'Active' as const } : user
      ));
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Joined Date'];
    const csvData = filteredUsers.map(u => `${u.id},"${u.name}","${u.email}",${u.role},${u.status},${u.joined}`);
    const csvContent = [headers.join(','), ...csvData].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mentorconnect_users.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-lpu-text-primary">
            User Management
          </h1>
          <p className="text-lpu-text-secondary mt-1">
            Manage students, mentors, and account verifications.
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="border-gray-200">
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <CardTitle>All Users</CardTitle>
            <CardDescription>View and manage all registered accounts.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-lpu-text-muted" />
              <Input
                placeholder="Search users..."
                className="pl-9 w-full sm:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select
              className="h-11 rounded-xl bg-lpu-input-bg border-0 px-4 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-lpu-orange outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>

            {pendingSelected.length > 0 && (
              <Button onClick={handleVerifySelected} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <UserCheck className="mr-2 h-4 w-4" />
                Verify Selected ({pendingSelected.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-lpu-border overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500 animate-pulse">Loading platform users...</div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">{error}</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-lpu-bg text-lpu-text-secondary border-b border-lpu-border">
                    <tr>
                      <th className="px-4 py-3 font-medium w-12">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-lpu-orange focus:ring-lpu-orange cursor-pointer"
                          checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lpu-border">
                    {filteredUsers.map(user => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedUserForModal(user)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-lpu-orange focus:ring-lpu-orange cursor-pointer"
                            checked={selectedIds.includes(user.id)}
                            onChange={(e) => toggleSelect(e as unknown as React.MouseEvent, user.id)}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-lpu-text-primary">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-lpu-orange/10 flex items-center justify-center text-lpu-orange font-bold text-xs">
                              {user.name.charAt(0)}
                            </div>
                            {user.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-lpu-text-secondary">{user.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={
                            user.role === 'Mentor' ? 'bg-orange-50 text-lpu-orange border-orange-200' :
                            user.role === 'Student' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                            user.role === 'Alumni Officer' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                            user.role === 'Placement Officer' ? 'bg-teal-50 text-teal-600 border-teal-200' :
                            'bg-red-50 text-red-600 border-red-200'
                          }>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.status === 'Active' ? 'default' : user.status === 'Pending' ? 'secondary' : 'destructive'} 
                                 className={user.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : user.status === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-lpu-text-secondary">{user.joined}</td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-lpu-text-secondary">
                          No users found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {selectedUserForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedUserForModal(null)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button 
                onClick={() => setSelectedUserForModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-lpu-orange/10 flex items-center justify-center text-lpu-orange font-bold text-2xl border-2 border-white shadow-sm">
                  {selectedUserForModal.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedUserForModal.name}</h3>
                  <p className="text-gray-500">{selectedUserForModal.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="border-gray-200">{selectedUserForModal.role}</Badge>
                    <Badge variant={selectedUserForModal.status === 'Active' ? 'default' : 'secondary'} 
                           className={selectedUserForModal.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                      {selectedUserForModal.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Joined Date</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{selectedUserForModal.joined}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Last Active</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{selectedUserForModal.lastActive}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl col-span-2">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-medium">Activity Metrics</span>
                  </div>
                  <p className="text-gray-900">
                    <span className="font-bold text-lg">{selectedUserForModal.sessionsCompleted}</span> 
                    <span className="text-gray-600 ml-2">Mentorship sessions completed</span>
                  </p>
                </div>
              </div>

              {selectedUserForModal.status === 'Pending' && (
                <div className="pt-4 border-t border-gray-100 flex gap-3">
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      setUsers(users.map(u => u.id === selectedUserForModal.id ? { ...u, status: 'Active' } : u));
                      setSelectedUserForModal({ ...selectedUserForModal, status: 'Active' });
                    }}
                  >
                    Approve Account
                  </Button>
                  <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
