import prisma from '@/lib/prisma';

export const createSkinCondition = async (data: {
  analyse_id: number;
  nom: string;
  severite?: string;
}) => {
  return await prisma.skinCondition.create({ data });
};

export const findSkinConditionById = async (id: number) => {
  return await prisma.skinCondition.findUnique({ where: { id } });
};

export const findSkinConditionsByAnalyseId = async (analyseId: number) => {
  return await prisma.skinCondition.findMany({
    where: { analyse_id: analyseId },
  });
};

export const findAllSkinConditions = async () => {
  return await prisma.skinCondition.findMany();
};

export const updateSkinCondition = async (
  id: number,
  data: { nom?: string; severite?: string }
) => {
  return await prisma.skinCondition.update({ where: { id }, data });
};

export const deleteSkinCondition = async (id: number) => {
  return await prisma.skinCondition.delete({ where: { id } });
};
