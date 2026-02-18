import { prisma } from '../../prisma/prisma.config';

export class Subscription {
  id!: number;
  user_id!: number;
  plan!: string;
  date_debut!: Date;
  date_fin!: Date;
}

// Fonctions utilitaires pour Subscription
export const createSubscription = async (data: {
  user_id: number;
  plan: string;
  date_debut: Date;
  date_fin: Date;
}) => {
  return await prisma.subscription.create({ data });
};

export const findSubscriptionById = async (id: number) => {
  return await prisma.subscription.findUnique({ where: { id } });
};

export const findActiveSubscriptionByUserId = async (user_id: number) => {
  return await prisma.subscription.findFirst({
    where: {
      user_id,
      date_fin: { gte: new Date() }
    },
    orderBy: { date_fin: 'desc' }
  });
};

export const findSubscriptionsByUserId = async (user_id: number) => {
  return await prisma.subscription.findMany({ 
    where: { user_id },
    orderBy: { date_debut: 'desc' }
  });
};

export const findAllSubscriptions = async () => {
  return await prisma.subscription.findMany();
};

export const updateSubscription = async (id: number, data: Partial<Omit<Subscription, 'id'>>) => {
  return await prisma.subscription.update({ where: { id }, data });
};

export const deleteSubscription = async (id: number) => {
  return await prisma.subscription.delete({ where: { id } });
};
