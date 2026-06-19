import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import type { User } from '../store/auth.store';
import { Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';

export const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`WARNING: Are you absolutely sure you want to permanently delete user @${username}?\n\nThis will instantly wipe all of their chat history and destroy their account. This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      alert(`User @${username} has been permanently deleted.`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
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
                      onClick={() => handleDeleteUser(user.id, user.username)}
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
    </div>
  );
};
