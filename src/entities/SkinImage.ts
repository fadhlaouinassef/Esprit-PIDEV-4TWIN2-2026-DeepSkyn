import { prisma } from '../../prisma/prisma.config';

export class SkinImage {
  id!: number;
  analyse_id!: number;
  image_url!: string;
}

// Fonctions utilitaires pour SkinImage
export const createSkinImage = async (data: {
  analyse_id: number;
  image_url: string;
}) => {
  return await prisma.skinImage.create({ data });
};

export const findSkinImageById = async (id: number) => {
  return await prisma.skinImage.findUnique({ where: { id } });
};

export const findSkinImagesByAnalyseId = async (analyse_id: number) => {
  return await prisma.skinImage.findMany({ where: { analyse_id } });
};

export const findAllSkinImages = async () => {
  return await prisma.skinImage.findMany();
};

export const updateSkinImage = async (id: number, data: Partial<Omit<SkinImage, 'id'>>) => {
  return await prisma.skinImage.update({ where: { id }, data });
};

export const deleteSkinImage = async (id: number) => {
  return await prisma.skinImage.delete({ where: { id } });
};
