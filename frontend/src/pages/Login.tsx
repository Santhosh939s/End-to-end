import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Loader2, ScanFace, Key } from 'lucide-react';
import { deriveMasterKey, decryptPrivateKey } from '../utils/crypto';
import api from '../utils/api';
import { useAuthStore } from '../store/auth.store';
import FaceScanner from '../components/FaceScanner';
import { encryptBiometricPayload } from '../utils/faceCrypto';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<'password' | 'face'>('password');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmitPassword = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Authenticate with backend
      const response = await api.post('/auth/login', {
        username: data.username,
        password: data.password,
      });

      const { token, user, crypto } = response.data;
      
      // 2. Derive master key to unlock private key
      const masterKey = await deriveMasterKey(data.password, crypto.keySalt);
      
      // 3. Decrypt private key
      const [ivBase64, encryptedPrivateKeyBase64] = crypto.encryptedPrivateKey.split(':');
      const decryptedPrivateKey = await decryptPrivateKey(encryptedPrivateKeyBase64, ivBase64, masterKey);

      // 4. Save to global state (Zustand)
      login({
        token, 
        user, 
        publicKey: crypto.publicKey, 
        privateKey: decryptedPrivateKey
      });

      // 5. Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid credentials or decryption failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceLogin = async (descriptor: Float32Array) => {
    setIsLoading(true);
    setError(null);
    try {
      const inTransitEncryptedFaceDescriptor = await encryptBiometricPayload(descriptor);
      
      const response = await api.post('/auth/login-face', {
        inTransitEncryptedFaceDescriptor
      });

      const { token, user, crypto } = response.data;
      
      // The backend returns the decrypted raw private key directly!
      // (Because we will update Register.tsx to send the raw private key encrypted in transit)
      const rawPrivateKey = crypto.rawPrivateKey;

      login({
        token,
        user,
        publicKey: crypto.publicKey,
        privateKey: rawPrivateKey
      });
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Face login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-brand-primary/20 p-3 rounded-full">
            <Lock className="w-8 h-8 text-brand-primary" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center mb-2">Welcome Back</h2>
        <p className="text-text-secondary text-center mb-6">Secure messaging awaits</p>

        {/* Login Method Toggle */}
        <div className="flex p-1 bg-bg-app rounded-xl border border-border-subtle mb-6">
          <button 
            type="button"
            onClick={() => setLoginMethod('password')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${loginMethod === 'password' ? 'bg-bg-panel shadow-sm text-brand-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Key className="w-4 h-4" /> Password
          </button>
          <button 
            type="button"
            onClick={() => setLoginMethod('face')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${loginMethod === 'face' ? 'bg-bg-panel shadow-sm text-brand-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <ScanFace className="w-4 h-4" /> Face ID
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {loginMethod === 'password' ? (
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
              <input 
                {...register('username')} 
                className="w-full bg-bg-app border border-border-subtle rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                placeholder="Enter your username"
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
              <input 
                type="password"
                {...register('password')} 
                className="w-full bg-bg-app border border-border-subtle rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                placeholder="Enter your password"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-3 rounded-lg transition-colors mt-6 flex justify-center items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In securely'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <FaceScanner onCapture={handleFaceLogin} actionText="Authenticate" />
          </div>
        )}

        <p className="text-center text-text-secondary mt-6 text-sm">
          New to CipherLink? <Link to="/register" className="text-brand-primary hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
