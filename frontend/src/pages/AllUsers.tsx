import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Check, X, Clock, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/auth.store';

interface UserResult {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  publicKey: string;
}

interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  senderId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

const AllUsers = () => {
  const currentUser = useAuthStore(state => state.user);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserResult[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, friendsRes] = await Promise.all([
        api.get(`/users?q=${search}`),
        api.get('/friends')
      ]);
      setUsers(usersRes.data);
      setFriendships(friendsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSendRequest = async (targetUserId: string) => {
    try {
      await api.post('/friends/requests/send', { targetUserId });
      fetchData(); // refresh list
    } catch (error) {
      console.error('Failed to send request', error);
    }
  };

  const getRelationshipStatus = (userId: string) => {
    const rel = friendships.find(f => 
      (f.user1Id === userId && f.user2Id === currentUser?.id) || 
      (f.user2Id === userId && f.user1Id === currentUser?.id)
    );
    return rel;
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Users</h1>
        <p className="text-text-secondary">Find friends and start secure conversations.</p>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-secondary" />
        </div>
        <input
          type="text"
          className="w-full bg-bg-panel border border-border-subtle rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors text-lg"
          placeholder="Search by name or @username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(user => {
            const rel = getRelationshipStatus(user.id);
            
            return (
              <div key={user.id} className="glass-panel p-5 rounded-xl flex flex-col items-center text-center transition-transform hover:scale-[1.02]">
                <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4 border border-brand-primary/20">
                  <span className="text-2xl font-bold text-brand-primary">{user.fullName.charAt(0).toUpperCase()}</span>
                </div>
                <h3 className="font-semibold text-lg">{user.fullName}</h3>
                <p className="text-brand-primary/80 text-sm font-medium mb-2">@{user.username}</p>
                <p className="text-text-secondary text-sm mb-6 line-clamp-2">{user.bio || 'Hi there! I am using CipherLink.'}</p>
                
                <div className="mt-auto w-full">
                  {!rel && (
                    <button 
                      onClick={() => handleSendRequest(user.id)}
                      className="w-full bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" /> Add Friend
                    </button>
                  )}
                  {rel?.status === 'pending' && rel.senderId === currentUser?.id && (
                    <button disabled className="w-full bg-bg-app text-text-secondary font-medium py-2 rounded-lg border border-border-subtle flex items-center justify-center gap-2 cursor-not-allowed">
                      <Clock className="w-4 h-4" /> Request Sent
                    </button>
                  )}
                  {rel?.status === 'pending' && rel.senderId !== currentUser?.id && (
                    <button disabled className="w-full bg-brand-primary/20 text-brand-primary font-medium py-2 rounded-lg border border-brand-primary/30 flex items-center justify-center gap-2 cursor-not-allowed">
                      <span className="text-sm">Review in Requests tab</span>
                    </button>
                  )}
                  {rel?.status === 'accepted' && (
                    <button disabled className="w-full bg-emerald-500/10 text-emerald-400 font-medium py-2 rounded-lg border border-emerald-500/20 flex items-center justify-center gap-2 cursor-not-allowed">
                      <ShieldCheck className="w-4 h-4" /> Connected
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {users.length === 0 && (
            <div className="col-span-full py-12 text-center text-text-secondary">
              No users found matching "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllUsers;
