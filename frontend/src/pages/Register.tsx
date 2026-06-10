import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Loader2, Lock, Eye, EyeOff, ScanFace } from 'lucide-react';
import { generateKeyPair, deriveMasterKey, encryptPrivateKey, generateSalt } from '../utils/crypto';
import api from '../utils/api';
import FaceScanner from '../components/FaceScanner';
import { encryptBiometricPayload } from '../utils/faceCrypto';

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_.]+$/, 'Only lowercase letters, numbers, underscore, and dot allowed'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [faceEnabled, setFaceEnabled] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    if (faceEnabled && !faceDescriptor) {
      setError('Please scan your face to complete registration with Face Login.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // 1. Generate keys
      const keys = await generateKeyPair();
      
      // 2. Generate Salt & Derive Master Key from password
      const salt = generateSalt();
      const masterKey = await deriveMasterKey(data.password, salt);
      
      // 3. Encrypt the Private Key
      const encryptedPrivateKeyData = await encryptPrivateKey(keys.privateKey, masterKey);
      
      // We combine the encrypted key and IV into a single string to store in backend
      const storedEncryptedPrivateKey = `${encryptedPrivateKeyData.iv}:${encryptedPrivateKeyData.encryptedPrivateKey}`;

      // 4. Encrypt face payload if enabled
      let inTransitEncryptedFaceDescriptor = undefined;
      if (faceEnabled && faceDescriptor) {
        inTransitEncryptedFaceDescriptor = await encryptBiometricPayload(faceDescriptor);
      }

      // 5. Send to backend
      await api.post('/auth/register', {
        fullName: data.fullName,
        username: data.username,
        email: data.email,
        password: data.password,
        publicKey: keys.publicKey,
        encryptedPrivateKey: storedEncryptedPrivateKey,
        rawPrivateKeyForEscrow: keys.privateKey, // Escrow raw key for Face ID
        keySalt: salt,
        faceEnabled,
        inTransitEncryptedFaceDescriptor
      });

      // 6. Success! Redirect to login
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative blur elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary opacity-10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-secondary opacity-10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

        <div className="flex justify-center mb-6">
          <div className="bg-brand-primary/20 p-3 rounded-full">
            <Shield className="w-8 h-8 text-brand-primary" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
        <p className="text-text-secondary text-center mb-8">Join CipherLink for secure messaging</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
            <input 
              {...register('fullName')} 
              className="w-full bg-bg-app border border-border-subtle rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
              placeholder="John Doe"
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
              <input 
                {...register('username')} 
                className="w-full bg-bg-app border border-border-subtle rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                placeholder="johndoe"
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input 
                type="email"
                {...register('email')} 
                className="w-full bg-bg-app border border-border-subtle rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
            <input 
              type="password"
              {...register('password')} 
              className="w-full bg-bg-app border border-border-subtle rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Confirm Password</label>
            <input 
              type="password"
              {...register('confirmPassword')} 
              className="w-full bg-bg-app border border-border-subtle rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <div className="pt-2 border-t border-border-subtle mt-4">
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-bg-app rounded-xl border border-border-subtle hover:bg-bg-panel transition-colors">
              <input 
                type="checkbox" 
                checked={faceEnabled} 
                onChange={(e) => setFaceEnabled(e.target.checked)}
                className="w-5 h-5 rounded border-border-subtle text-brand-primary focus:ring-brand-primary bg-bg-panel"
              />
              <div className="flex-1">
                <p className="font-medium flex items-center gap-2">
                  <ScanFace className="w-5 h-5 text-brand-primary" /> Setup Face Login
                </p>
                <p className="text-xs text-text-secondary">Login without a password from any device. Highly secure.</p>
              </div>
            </label>
          </div>

          {faceEnabled && !faceDescriptor && (
            <div className="mt-4">
              <FaceScanner onCapture={(desc) => setFaceDescriptor(desc)} actionText="Capture Face" />
            </div>
          )}
          {faceEnabled && faceDescriptor && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
              <p className="text-emerald-500 font-medium flex items-center justify-center gap-2">
                <ScanFace className="w-5 h-5" /> Face captured successfully!
              </p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-3 rounded-lg transition-colors mt-6 flex justify-center items-center"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-text-secondary mt-6 text-sm">
          Already have an account? <Link to="/login" className="text-brand-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
