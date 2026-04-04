import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { findUserByEmail, createUser } from '@/services/user.service';
import { evaluateAndAwardBadgesForUser, trackLoginActivity } from '@/services/badge.service';

export const authOptions: NextAuthOptions = {
  providers: [
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

          console.log('[AuthSign] Tracking login for user ID:', existingUser.id);
          await trackLoginActivity(existingUser.id, 'google');
          
          console.log('[AuthSign] Evaluating badges for user ID:', existingUser.id);
          await evaluateAndAwardBadgesForUser({
            userId: existingUser.id,
            trigger: 'login',
          });
        }
        console.log('[AuthSign] Login successful');
        return true;
      } catch (error) {
        console.error('[AuthSign] Error during sign in:', error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user) {
        const dbUser = await findUserByEmail(session.user.email!);
        if (dbUser) {
          session.user.id = dbUser.id.toString();
          session.user.role = dbUser.role;
        }
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
