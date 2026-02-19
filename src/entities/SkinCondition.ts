import { prisma } from '../../prisma/prisma.config';

export class SkinCondition {
  id!: number;
  nom!: string;
  description?: string;
  type?: string;
}

// Fonctions utilitaires pour SkinCondition
export const createSkinCondition = async (data: {
  nom: string;
  description?: string;
  type?: string;
}) => {
  return await prisma.skinCondition.create({ data });
};

export const findSkinConditionById = async (id: number) => {
  return await prisma.skinCondition.findUnique({ where: { id } });
};

export const findSkinConditionsByType = async (type: string) => {
  return await prisma.skinCondition.findMany({ where: { type } });
};

export const findAllSkinConditions = async () => {
  return await prisma.skinCondition.findMany();
};

export const updateSkinCondition = async (id: number, data: Partial<Omit<SkinCondition, 'id'>>) => {
  return await prisma.skinCondition.update({ where: { id }, data });
};

export const deleteSkinCondition = async (id: number) => {
  return await prisma.skinCondition.delete({ where: { id } });
};
