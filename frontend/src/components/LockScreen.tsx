import React, { useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import FaceScanner from './FaceScanner';
import { Lock, ScanFace, LogOut } from 'lucide-react';
import api from '../utils/api';
import { encryptBiometricPayload } from '../utils/faceCrypto';
import { useNavigate } from 'react-router-dom';

const LockScreen = () => {
  const user = useAuthStore(state => state.user);
  const unlock = useAuthStore(state => state.unlock);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();
  
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFaceUnlock = async (descriptor: Float32Array) => {
    setIsProcessing(true);
    setError('');
    try {
      const inTransitEncryptedFaceDescriptor = await encryptBiometricPayload(descriptor);
      
      const response = await api.post('/auth/login-face', {
        inTransitEncryptedFaceDescriptor
      });

      // The backend returns the unlocked private key
      const { crypto } = response.data;
      
      unlock(crypto.rawPrivateKey); // Sets isLocked to false
    } catch (err: any) {
      console.error(err);
      setError('Face not recognized. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-app/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-bg-panel border border-border-subtle p-8 rounded-3xl shadow-2xl flex flex-col items-center relative overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary opacity-5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-brand-primary" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">Session Locked</h2>
        <p className="text-text-secondary text-center mb-8">
          Welcome back, <span className="font-semibold text-text-primary">{user?.fullName}</span>. Please verify your face to unlock your secure chats.
        </p>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <div className="w-full">
          <FaceScanner onCapture={handleFaceUnlock} actionText="Unlock Session" />
        </div>

        <div className="mt-8 pt-6 border-t border-border-subtle w-full flex justify-center">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-text-secondary hover:text-red-500 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Sign Out Instead
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
