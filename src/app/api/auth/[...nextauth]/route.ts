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
    async signIn({ user, account }) {
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
    async jwt({ token, user }) {
      try {
        if (user?.email) {
          const dbUser = await findUserByEmail(user.email);
          if (dbUser) {
            token.id = dbUser.id.toString();
            token.role = dbUser.role;
          }
        }
      } catch (error) {
        console.error('[AuthJwt] Failed to enrich JWT from database:', error);
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user?.email) {
        return session;
      }

      if (token?.id) {
        session.user.id = String(token.id);
      }
      if (token?.role) {
        session.user.role = token.role as typeof session.user.role;
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
