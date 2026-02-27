import { prisma } from '../../prisma/prisma.config';
import { User as PrismaUser } from '@prisma/client';

export const createUser = async (data: {
  email: string;
  password: string;
  role?: 'USER' | 'PREMIUM_USER' | 'ADMIN';
  nom?: string;
  prenom?: string;
  sexe?: string;
  age?: number;
  skin_type?: 'OILY' | 'DRY' | 'SENSITIVE' | 'NORMAL' | 'COMBINATION';
  image?: string;
  verified?: boolean;
}) => {
  return await prisma.user.create({ data });
};

export const findUserById = async (id: number): Promise<PrismaUser | null> => {
  return await prisma.user.findUnique({ where: { id } });
};

export const findUserByEmail = async (email: string): Promise<PrismaUser | null> => {
  return await prisma.user.findUnique({ where: { email } });
};

export const findAllUsers = async (): Promise<PrismaUser[]> => {
  return await prisma.user.findMany();
};

export const updateUser = async (id: number, data: Partial<Omit<PrismaUser, 'id' | 'created_at'>>) => {
  return await prisma.user.update({ where: { id }, data });
};

export const deleteUser = async (id: number) => {
  return await prisma.user.delete({ where: { id } });
};

export const getUserWithRelations = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      badges: true,
      subscriptions: true,
      chatbotMessages: true,
      complaints: true,
      routines: true,
      skinAnalyses: true,
      surveyAnswers: true,
    },
  });
};

export const updateUserOtp = async (userId: number, otp_code: string, otp_expiry: Date) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { otp_code, otp_expiry },
  });
};

export const verifyUserOtp = async (userId: number, otp_code: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.otp_code || !user.otp_expiry) {
    return false;
  }

  if (user.otp_code !== otp_code) {
    return false;
  }

  if (new Date() > user.otp_expiry) {
    return false;
  }

  return true;
};

export const markUserAsVerified = async (userId: number) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      verified: true,
      otp_code: null,
      otp_expiry: null
    },
  });
};
