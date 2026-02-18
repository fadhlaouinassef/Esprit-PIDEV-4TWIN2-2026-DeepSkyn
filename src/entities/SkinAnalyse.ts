import { prisma } from '../../prisma/prisma.config';

export class SkinAnalyse {
  id!: number;
  user_id!: number;
  score_peau?: number;
  age_peau?: number;
  date_analyse!: Date;
  score?: number;
  description?: string;
}

// Fonctions utilitaires pour SkinAnalyse
export const createSkinAnalyse = async (data: {
  user_id: number;
  score_peau?: number;
  age_peau?: number;
  score?: number;
  description?: string;
}) => {
  return await prisma.skinAnalyse.create({ data });
};

export const findSkinAnalyseById = async (id: number) => {
  return await prisma.skinAnalyse.findUnique({ 
    where: { id },
    include: { images: true }
  });
};

export const findSkinAnalysesByUserId = async (user_id: number) => {
  return await prisma.skinAnalyse.findMany({ 
    where: { user_id },
    include: { images: true },
    orderBy: { date_analyse: 'desc' }
  });
};

export const findAllSkinAnalyses = async () => {
  return await prisma.skinAnalyse.findMany({ include: { images: true } });
};

export const updateSkinAnalyse = async (id: number, data: Partial<Omit<SkinAnalyse, 'id' | 'date_analyse'>>) => {
  return await prisma.skinAnalyse.update({ where: { id }, data });
};

export const deleteSkinAnalyse = async (id: number) => {
  return await prisma.skinAnalyse.delete({ where: { id } });
};
