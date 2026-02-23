import { prisma } from '../../prisma/prisma.config';

export class Ingredient {
  id!: number;
  routine_step_id!: number;
  nom!: string;
  description?: string;
}

// Fonctions utilitaires pour Ingredient
export const createIngredient = async (data: {
  routine_step_id: number;
  nom: string;
  description?: string;
}) => {
  return await prisma.ingredient.create({ data });
};

export const findIngredientById = async (id: number) => {
  return await prisma.ingredient.findUnique({ 
    where: { id },
    include: { ingredientConflicts: true }
  });
};

export const findIngredientsByRoutineStepId = async (routine_step_id: number) => {
  return await prisma.ingredient.findMany({ 
    where: { routine_step_id },
    include: { ingredientConflicts: true }
  });
};

export const findAllIngredients = async () => {
  return await prisma.ingredient.findMany({ include: { ingredientConflicts: true } });
};

export const updateIngredient = async (id: number, data: Partial<Omit<Ingredient, 'id'>>) => {
  return await prisma.ingredient.update({ where: { id }, data });
};

export const deleteIngredient = async (id: number) => {
  return await prisma.ingredient.delete({ where: { id } });
};
