import { prisma } from '../../prisma/prisma.config';

export class IngredientConflict {
  id!: number;
  ingredient_id!: number;
  description!: string;
}

// Fonctions utilitaires pour IngredientConflict
export const createIngredientConflict = async (data: {
  ingredient_id: number;
  description: string;
}) => {
  return await prisma.ingredientConflict.create({ data });
};

export const findIngredientConflictById = async (id: number) => {
  return await prisma.ingredientConflict.findUnique({ where: { id } });
};

export const findIngredientConflictsByIngredientId = async (ingredient_id: number) => {
  return await prisma.ingredientConflict.findMany({ where: { ingredient_id } });
};

export const findAllIngredientConflicts = async () => {
  return await prisma.ingredientConflict.findMany();
};

export const updateIngredientConflict = async (id: number, data: Partial<Omit<IngredientConflict, 'id'>>) => {
  return await prisma.ingredientConflict.update({ where: { id }, data });
};

export const deleteIngredientConflict = async (id: number) => {
  return await prisma.ingredientConflict.delete({ where: { id } });
};
