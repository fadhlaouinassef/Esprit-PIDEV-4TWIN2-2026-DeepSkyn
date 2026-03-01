import prisma from '@/lib/prisma';

export const createSkinImage = async (data: {
  analyse_id: number;
  url: string;
}) => {
  return await prisma.skinImage.create({ data });
};

export const findSkinImageById = async (id: number) => {
  return await prisma.skinImage.findUnique({ where: { id } });
};

export const findSkinImagesByAnalyseId = async (analyseId: number) => {
  return await prisma.skinImage.findMany({
    where: { analyse_id: analyseId },
  });
};

export const findAllSkinImages = async () => {
  return await prisma.skinImage.findMany();
};

export const updateSkinImage = async (
  id: number,
  data: { url?: string }
) => {
  return await prisma.skinImage.update({ where: { id }, data });
};

export const deleteSkinImage = async (id: number) => {
  return await prisma.skinImage.delete({ where: { id } });
};
