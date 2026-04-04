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
        if (account?.provider === 'google') {
          // Check if user exists
          let existingUser = await findUserByEmail(user.email!);

          if (!existingUser) {
            // Create new user with Google info
            existingUser = await createUser({
              email: user.email!,
              password: '', // No password for OAuth users
              nom: user.name || '',
              image: user.image || '',
              verified: true, // Auto-verify Google users
            });
          }

          await trackLoginActivity(existingUser.id, 'google');
          await evaluateAndAwardBadgesForUser({
            userId: existingUser.id,
            trigger: 'login',
          });
        }
        return true;
      } catch (error) {
        console.error('Error during sign in:', error);
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
