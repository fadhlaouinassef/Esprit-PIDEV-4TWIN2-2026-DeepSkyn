import prisma from '@/lib/prisma';

export const createSkinAnalyse = async (data: {
  user_id: number;
  score?: number;
  score_eau?: number;
  age_peau?: number;
  description?: string;
}) => {
  return await prisma.skinAnalyse.create({ data });
};

export const findSkinAnalyseById = async (id: number) => {
  return await prisma.skinAnalyse.findUnique({
    where: { id },
    include: { images: true },
  });
};

export const findSkinAnalysesByUserId = async (userId: number) => {
  return await prisma.skinAnalyse.findMany({
    where: { user_id: userId },
    include: { images: true },
    orderBy: { date_creation: 'desc' },
  });
};

export const findAllSkinAnalyses = async () => {
  return await prisma.skinAnalyse.findMany({
    include: { images: true },
  });
};

export const updateSkinAnalyse = async (
  id: number,
  data: { score?: number; score_eau?: number; age_peau?: number; description?: string }
) => {
  return await prisma.skinAnalyse.update({ where: { id }, data });
};

export const deleteSkinAnalyse = async (id: number) => {
  return await prisma.skinAnalyse.delete({ where: { id } });
};
