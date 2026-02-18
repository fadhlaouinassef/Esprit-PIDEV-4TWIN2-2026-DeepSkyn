import { RoleType, SkinType } from './Enums';
import { prisma } from '../../prisma/prisma.config';

export class User {
  id!: number;
  email!: string;
  password!: string;
  role!: RoleType;
  created_at!: Date;
  nom?: string;
  sexe?: string;
  age?: number;
  skin_type?: SkinType;
}

// Fonctions utilitaires pour User
export const createUser = async (data: {
  email: string;
  password: string;
  role?: RoleType;
  nom?: string;
  sexe?: string;
  age?: number;
  skin_type?: SkinType;
}) => {
  return await prisma.user.create({ data });
};

export const findUserById = async (id: number) => {
  return await prisma.user.findUnique({ where: { id } });
};

export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({ where: { email } });
};

export const findAllUsers = async () => {
  return await prisma.user.findMany();
};

export const updateUser = async (id: number, data: Partial<Omit<User, 'id' | 'created_at'>>) => {
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
