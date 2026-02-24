'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';

function SessionSync() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 1. Synchronisation depuis localStorage (pour les connexions Email/Password persistées)
    if (status !== 'loading') {
      const storedUser = localStorage.getItem('deepskyn_user');
      if (storedUser && status !== 'authenticated') {
        try {
          const userData = JSON.parse(storedUser);
          console.log('📦 [AuthSync] Chargement de l\'utilisateur depuis localStorage...');
          dispatch(setUser(userData));
        } catch (e) {
          console.error('Failed to parse stored user', e);
        }
      }
    }
  }, [status, dispatch]);

  useEffect(() => {
    // 2. Synchronisation depuis Session NextAuth (OAuth)
    if (status === 'authenticated' && session?.user) {
      console.log('🔄 [AuthSync] Session NextAuth détectée, synchronisation Redux...');

      dispatch(setUser({
        id: session.user.id ? parseInt(session.user.id) : 0,
        nom: session.user.name || '',
        email: session.user.email || '',
        photo: session.user.image || '/avatar.png',
        role: session.user.role || 'user',
        verified: true
      }));
    }
  }, [session, status, dispatch]);

  return null;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionSync />
      {children}
    </SessionProvider>
  );
}
