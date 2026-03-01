import prisma from '@/lib/prisma';

export const createSkinAnalyse = async (data: {
  user_id: number;
  date_analyse: Date;
  resultat?: any;
}) => {
  return await prisma.skinAnalyse.create({ data });
};

export const findSkinAnalyseById = async (id: number) => {
  return await prisma.skinAnalyse.findUnique({
    where: { id },
    include: {
      images: true,
      conditions: true,
    },
  });
};

export const findSkinAnalysesByUserId = async (userId: number) => {
  return await prisma.skinAnalyse.findMany({
    where: { user_id: userId },
    include: {
      images: true,
      conditions: true,
    },
    orderBy: { date_analyse: 'desc' },
  });
};

export const findAllSkinAnalyses = async () => {
  return await prisma.skinAnalyse.findMany({
    include: {
      images: true,
      conditions: true,
    },
  });
};

export const updateSkinAnalyse = async (
  id: number,
  data: { resultat?: any }
) => {
  return await prisma.skinAnalyse.update({ where: { id }, data });
};

export const deleteSkinAnalyse = async (id: number) => {
  return await prisma.skinAnalyse.delete({ where: { id } });
};
