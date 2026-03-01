import prisma from '@/lib/prisma';

export const createIngredient = async (data: {
  nom: string;
  description?: string;
  bienfaits?: string;
}) => {
  return await prisma.ingredient.create({ data });
};

export const findIngredientById = async (id: number) => {
  return await prisma.ingredient.findUnique({
    where: { id },
    include: { conflicts: true },
  });
};

export const findIngredientByName = async (nom: string) => {
  return await prisma.ingredient.findUnique({ where: { nom } });
};

export const findAllIngredients = async () => {
  return await prisma.ingredient.findMany({
    include: { conflicts: true },
  });
};

export const searchIngredients = async (searchTerm: string) => {
  return await prisma.ingredient.findMany({
    where: {
      OR: [
        { nom: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
  });
};

export const updateIngredient = async (
  id: number,
  data: { nom?: string; description?: string; bienfaits?: string }
) => {
  return await prisma.ingredient.update({ where: { id }, data });
};

export const deleteIngredient = async (id: number) => {
  return await prisma.ingredient.delete({ where: { id } });
};
