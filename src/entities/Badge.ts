import { NiveauBadge } from './Enums';
import { prisma } from '../../prisma/prisma.config';

export class Badge {
  id!: number;
  user_id!: number;
  date!: Date;
  description?: string;
  niveau!: NiveauBadge;
}

// Fonctions utilitaires pour Badge
export const createBadge = async (data: {
  user_id: number;
  niveau: NiveauBadge;
  description?: string;
}) => {
  return await prisma.badge.create({ data });
};

export const findBadgeById = async (id: number) => {
  return await prisma.badge.findUnique({ where: { id } });
};

export const findBadgesByUserId = async (user_id: number) => {
  return await prisma.badge.findMany({ where: { user_id } });
};

export const findAllBadges = async () => {
  return await prisma.badge.findMany();
};

export const updateBadge = async (id: number, data: Partial<Omit<Badge, 'id' | 'date'>>) => {
  return await prisma.badge.update({ where: { id }, data });
};

export const deleteBadge = async (id: number) => {
  return await prisma.badge.delete({ where: { id } });
};
