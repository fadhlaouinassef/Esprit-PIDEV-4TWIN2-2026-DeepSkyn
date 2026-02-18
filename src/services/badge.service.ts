import { prisma } from '../../prisma/prisma.config';
import { NiveauBadge } from '../entities/Enums';

export const createBadge = async (data: {
  user_id: number;
  description?: string;
  niveau: NiveauBadge;
}) => {
  return await prisma.badge.create({ data });
};

export const findBadgeById = async (id: number) => {
  return await prisma.badge.findUnique({ where: { id } });
};

export const findBadgesByUserId = async (userId: number) => {
  return await prisma.badge.findMany({ where: { user_id: userId } });
};

export const findAllBadges = async () => {
  return await prisma.badge.findMany();
};

export const updateBadge = async (id: number, data: { description?: string; niveau?: NiveauBadge }) => {
  return await prisma.badge.update({ where: { id }, data });
};

export const deleteBadge = async (id: number) => {
  return await prisma.badge.delete({ where: { id } });
};
