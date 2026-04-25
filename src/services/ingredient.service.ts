import prisma from '@/lib/prisma';

export const createIngredient = async (data: {
  routine_step_id: number;
  ingredient: string;
  description?: string;
}) => {
  return await prisma.ingredient.create({ data });
};

export const findIngredientById = async (id: number) => {
  return await prisma.ingredient.findUnique({
    where: { id },
    include: { ingredientConflicts: true },
  });
};

export const findIngredientByName = async (ingredient: string) => {
  return await prisma.ingredient.findFirst({ where: { ingredient } });
};

export const findAllIngredients = async () => {
  return await prisma.ingredient.findMany({
    include: { ingredientConflicts: true },
  });
};

export const searchIngredients = async (searchTerm: string) => {
  return await prisma.ingredient.findMany({
    where: {
      OR: [
        { ingredient: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
  });
};

export const updateIngredient = async (
  id: number,
  data: { ingredient?: string; description?: string }
) => {
  return await prisma.ingredient.update({ where: { id }, data });
};

export const deleteIngredient = async (id: number) => {
  return await prisma.ingredient.delete({ where: { id } });
};
