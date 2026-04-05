'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';

const AUTH_MODE_KEY = 'deepskyn_auth_mode';

function SessionSync() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 1. Synchronisation depuis localStorage (pour les connexions Email/Password persistées)
    if (status !== 'loading') {
      const storedUser = localStorage.getItem('deepskyn_user');
      if (storedUser) {
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
      const authMode = localStorage.getItem(AUTH_MODE_KEY);
      const storedUserRaw = localStorage.getItem('deepskyn_user');

      if (authMode === 'credentials' && storedUserRaw) {
        try {
          const storedUser = JSON.parse(storedUserRaw) as { id?: number };
          const nextAuthId = Number(session.user.id || 0);
          if (storedUser?.id && Number(storedUser.id) !== nextAuthId) {
            console.log('⏭️ [AuthSync] Session OAuth ignoree car session credentials active.');
            return;
          }
        } catch {
          // Ignore JSON parse errors and continue with NextAuth sync.
        }
      }

      console.log('🔄 [AuthSync] Session NextAuth détectée, synchronisation Redux...');

      dispatch(setUser({
        id: session.user.id ? parseInt(session.user.id) : 0,
        nom: session.user.name || '',
        email: session.user.email || '',
        photo: session.user.image || '/avatar.png',
        role: session.user.role || 'user',
        verified: true
      }));

      localStorage.setItem(AUTH_MODE_KEY, 'oauth');
    }
  }, [session, status, dispatch]);

  return null;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <SessionSync />
      {children}
    </SessionProvider>
  );
}
