import NextAuth from 'next-auth';
import { RoleType } from '@/entities/Enums';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role?: RoleType;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role?: RoleType;
  }
}
