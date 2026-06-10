import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  bio: string;
  faceEnabled?: boolean;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  publicKey: string | null;
  privateKey: string | null; // Stored in memory only
  isAuthenticated: boolean;
  isLocked: boolean; // New state for session locking
  login: (data: { token: string; user: User; publicKey: string; privateKey: string }) => void;
  logout: () => void;
  lock: () => void;
  unlock: (privateKey: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('cipherlink_token'),
  user: JSON.parse(localStorage.getItem('cipherlink_user') || 'null'),
  publicKey: localStorage.getItem('cipherlink_public_key'),
  privateKey: sessionStorage.getItem('cipherlink_private_key'),
  isAuthenticated: !!localStorage.getItem('cipherlink_token'),
  isLocked: false,

  login: (data) => {
    localStorage.setItem('cipherlink_token', data.token);
    localStorage.setItem('cipherlink_user', JSON.stringify(data.user));
    localStorage.setItem('cipherlink_public_key', data.publicKey);
    sessionStorage.setItem('cipherlink_private_key', data.privateKey);
    
    set({
      token: data.token,
      user: data.user,
      publicKey: data.publicKey,
      privateKey: data.privateKey,
      isAuthenticated: true,
      isLocked: false,
    });
  },

  logout: () => {
    localStorage.removeItem('cipherlink_token');
    localStorage.removeItem('cipherlink_user');
    localStorage.removeItem('cipherlink_public_key');
    sessionStorage.removeItem('cipherlink_private_key');
    
    set({
      token: null,
      user: null,
      publicKey: null,
      privateKey: null,
      isAuthenticated: false,
      isLocked: false,
    });
  },

  lock: () => {
    sessionStorage.removeItem('cipherlink_private_key');
    set({ isLocked: true, privateKey: null });
  },
  
  unlock: (privateKey) => {
    sessionStorage.setItem('cipherlink_private_key', privateKey);
    set({ isLocked: false, privateKey });
  },
}));
