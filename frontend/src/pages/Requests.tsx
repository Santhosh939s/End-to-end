import React, { useState, useEffect } from 'react';
import { Check, X, UserPlus } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/auth.store';

interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  senderId: string;
  status: 'pending' | 'accepted' | 'rejected';
  otherUser: {
    id: string;
    username: string;
    fullName: string;
  };
}

const Requests = () => {
  const currentUser = useAuthStore(state => state.user);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/friends');
      setFriendships(res.data);
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await api.post(`/friends/requests/${id}/accept`);
      fetchRequests();
    } catch (error) {
      console.error('Failed to accept', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/friends/requests/${id}/reject`);
      fetchRequests();
    } catch (error) {
      console.error('Failed to reject', error);
    }
  };

  const pendingReceived = friendships.filter(f => f.status === 'pending' && f.senderId !== currentUser?.id);
  const pendingSent = friendships.filter(f => f.status === 'pending' && f.senderId === currentUser?.id);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 border-b border-border-subtle pb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-brand-primary" /> Friend Requests
        </h1>
        <p className="text-text-secondary">Manage your connections to start chatting securely.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Received Requests */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-text-primary flex items-center justify-between">
              Received Requests
              {pendingReceived.length > 0 && (
                <span className="bg-brand-primary text-white text-xs py-1 px-2.5 rounded-full">
                  {pendingReceived.length} New
                </span>
              )}
            </h2>
            
            {pendingReceived.length === 0 ? (
              <div className="bg-bg-panel border border-border-subtle rounded-xl p-8 text-center text-text-secondary">
                No pending requests received.
              </div>
            ) : (
              <div className="grid gap-3">
                {pendingReceived.map(req => (
                  <div key={req.id} className="glass-panel p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center border border-brand-primary/20">
                        <span className="text-xl font-bold text-brand-primary">
                          {req.otherUser.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{req.otherUser.fullName}</p>
                        <p className="text-brand-primary/80 text-sm">@{req.otherUser.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReject(req.id)}
                        className="w-10 h-10 rounded-lg bg-bg-app border border-border-subtle flex items-center justify-center text-text-secondary hover:text-red-400 hover:border-red-400/50 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleAccept(req.id)}
                        className="w-10 h-10 rounded-lg bg-brand-primary hover:bg-brand-secondary flex items-center justify-center text-white transition-colors"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sent Requests */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-text-primary">Sent Requests</h2>
            {pendingSent.length === 0 ? (
              <div className="bg-bg-panel border border-border-subtle rounded-xl p-8 text-center text-text-secondary">
                No pending requests sent.
              </div>
            ) : (
              <div className="grid gap-3 opacity-70">
                {pendingSent.map(req => (
                  <div key={req.id} className="bg-bg-panel border border-border-subtle p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-bg-app rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-text-secondary">
                          {req.otherUser.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{req.otherUser.fullName}</p>
                        <p className="text-text-secondary text-sm">@{req.otherUser.username}</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-text-secondary bg-bg-app px-3 py-1 rounded-md">
                      Pending
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Requests;
