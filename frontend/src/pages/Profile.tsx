import React from 'react';
import { useAuthStore } from '../store/auth.store';
import { UserCircle, Copy, ShieldCheck, Key } from 'lucide-react';

const Profile = () => {
  const user = useAuthStore(state => state.user);
  const publicKey = useAuthStore(state => state.publicKey);
  const privateKey = useAuthStore(state => state.privateKey);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app, show a toast notification here
  };

  if (!user) return null;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8 border-b border-border-subtle pb-6 flex items-center gap-4">
        <UserCircle className="w-10 h-10 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-text-secondary">Manage your personal information and keys.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center border-2 border-brand-primary/20 shrink-0">
            <span className="text-4xl font-bold text-brand-primary">{user.fullName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <h2 className="text-2xl font-bold text-text-primary">{user.fullName}</h2>
            <div className="flex items-center justify-center md:justify-start gap-2 text-brand-primary font-medium">
              <span>@{user.username}</span>
              <button onClick={() => copyToClipboard(user.username)} className="text-text-secondary hover:text-brand-primary transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-text-secondary">{user.email}</p>
            <p className="pt-2 text-text-primary">{user.bio || 'Available on CipherLink.'}</p>
          </div>
        </div>

        {/* Security / Cryptography Info */}
        <div className="bg-bg-panel border border-border-subtle rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" /> Security Status
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-bg-app rounded-xl border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-text-primary flex items-center gap-2">
                  <Key className="w-4 h-4 text-brand-primary" /> Public Key
                </h4>
                <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded">Shared</span>
              </div>
              <p className="text-xs text-text-secondary break-all font-mono">
                {publicKey ? publicKey.substring(0, 60) + '...' : 'Not available'}
              </p>
            </div>

            <div className="p-4 bg-bg-app rounded-xl border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-text-primary flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-500" /> Private Key (Unlocked)
                </h4>
                <span className={privateKey ? "text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded" : "text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded"}>
                  {privateKey ? 'Secured in memory' : 'Locked'}
                </span>
              </div>
              <p className="text-xs text-text-secondary break-words">
                Your private key is unlocked and stored safely in temporary memory. It will be cleared when you sign out or close the tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
