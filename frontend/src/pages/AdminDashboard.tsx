import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import type { User } from '../store/auth.store';
import { Trash2, AlertTriangle, ShieldAlert, Lock, ScanFace, X, Loader2 } from 'lucide-react';
import FaceScanner from '../components/FaceScanner';
import { encryptBiometricPayload } from '../utils/faceCrypto';

export const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Verification Modal State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string, username: string} | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [useFaceVerification, setUseFaceVerification] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const promptDeleteUser = (userId: string, username: string) => {
    setUserToDelete({ id: userId, username });
    setAdminPassword('');
    setUseFaceVerification(false);
    setError('');
    setVerifyModalOpen(true);
  };

  const handleVerifyAndDelete = async (faceDescriptor: Float32Array | null = null) => {
    if (!userToDelete) return;
    
    if (!useFaceVerification && !adminPassword) {
      setError('Please enter your admin password.');
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      
      let inTransitEncryptedFaceDescriptor = undefined;
      if (useFaceVerification && faceDescriptor) {
        inTransitEncryptedFaceDescriptor = await encryptBiometricPayload(faceDescriptor);
      }

      await api.post(`/admin/users/${userToDelete.id}/delete`, {
        password: useFaceVerification ? undefined : adminPassword,
        inTransitEncryptedFaceDescriptor
      });
      
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setVerifyModalOpen(false);
      setUserToDelete(null);
      // alert(`User @${userToDelete.username} has been permanently deleted.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Could not delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-text-secondary animate-pulse">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-app text-text-primary p-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-text-secondary">Manage and delete user accounts.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <div className="bg-bg-panel rounded-2xl border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-app">
                <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">User</th>
                <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</th>
                <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-bg-panel-hover transition-colors">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                        {user.fullName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-xs text-text-secondary">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-text-secondary whitespace-nowrap">
                    {user.email}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <button
                      onClick={() => promptDeleteUser(user.id, user.username)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-text-secondary">
                    No other users found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sudo Mode Verification Modal */}
      {verifyModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl shadow-2xl relative">
            <button 
              onClick={() => setVerifyModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary hover:bg-bg-panel rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 text-red-500">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold">Admin Verification Required</h2>
              <p className="text-sm text-text-secondary mt-2">
                You are about to permanently wipe the account of <strong className="text-red-400">@{userToDelete.username}</strong>. Prove your identity to continue.
              </p>
            </div>

            <div className="flex gap-2 mb-6 p-1 bg-bg-app rounded-lg border border-border-subtle">
              <button 
                onClick={() => setUseFaceVerification(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!useFaceVerification ? 'bg-bg-panel text-brand-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Password
              </button>
              <button 
                onClick={() => setUseFaceVerification(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${useFaceVerification ? 'bg-bg-panel text-brand-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Face Scan
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            {!useFaceVerification ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-1">Admin Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-text-secondary" />
                  </div>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-bg-app border border-border-subtle rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                    placeholder="Enter your password"
                  />
                </div>
                <button 
                  onClick={() => handleVerifyAndDelete()}
                  disabled={isDeleting || !adminPassword}
                  className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Delete Account'}
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <FaceScanner 
                  onCapture={(desc) => handleVerifyAndDelete(desc)} 
                  actionText="Scan Face to Delete"
                />
                {isDeleting && (
                  <div className="mt-4 flex justify-center text-red-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
