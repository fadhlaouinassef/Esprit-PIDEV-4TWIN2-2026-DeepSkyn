import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser } from '@/services/user.service';
import { evaluateAndAwardBadgesForUser, trackLoginActivity } from '@/services/badge.service';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || '').trim();
        const password = String(credentials?.password || '');

        if (!email || !password) {
          return null;
        }

        const user = await findUserByEmail(email);
        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        if (user.verified === false || user.activated === false) {
          return null;
        }

        return {
          id: String(user.id),
          email: user.email,
          name: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.nom || user.email,
          image: user.image || null,
          role: user.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log('[AuthSign] Process started for:', user.email);
        if (account?.provider === 'google') {
          let existingUser = await findUserByEmail(user.email!);

          if (!existingUser) {
            console.log('[AuthSign] Creating new Google user:', user.email);
            existingUser = await createUser({
              email: user.email!,
              password: '',
              nom: user.name || '',
              image: user.image || '',
              verified: true,
            });
          }

          try {
            console.log('[AuthSign] Tracking login for user ID:', existingUser.id);
            await trackLoginActivity(existingUser.id, 'google');

            console.log('[AuthSign] Evaluating badges for user ID:', existingUser.id);
            await evaluateAndAwardBadgesForUser({
              userId: existingUser.id,
              trigger: 'login',
            });
          } catch (sideEffectError) {
            console.error('[AuthSign] Non-blocking post-login side effect error:', sideEffectError);
          }
        }
        console.log('[AuthSign] Login successful');
        return true;
      } catch (error) {
        console.error('[AuthSign] Error during sign in:', error);
        return false;
      }
    },
    async session({ session }) {
      if (!session.user?.email) {
        return session;
      }

      try {
        const dbUser = await findUserByEmail(session.user.email);
        if (dbUser) {
          session.user.id = dbUser.id.toString();
          session.user.role = dbUser.role;
        }
      } catch (error) {
        console.error('[AuthSession] Failed to enrich session from database:', error);
      }

      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
