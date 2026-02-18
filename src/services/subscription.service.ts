import { prisma } from '../../prisma/prisma.config';

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

export const findSubscriptionsByUserId = async (userId: number) => {
  return await prisma.subscription.findMany({ where: { user_id: userId } });
};

export const findActiveSubscriptionByUserId = async (userId: number) => {
  return await prisma.subscription.findFirst({
    where: {
      user_id: userId,
      date_fin: { gte: new Date() },
    },
    orderBy: { date_fin: 'desc' },
  });
};

export const findAllSubscriptions = async () => {
  return await prisma.subscription.findMany();
};

export const updateSubscription = async (
  id: number,
  data: { plan?: string; date_debut?: Date; date_fin?: Date }
) => {
  return await prisma.subscription.update({ where: { id }, data });
};

export const deleteSubscription = async (id: number) => {
  return await prisma.subscription.delete({ where: { id } });
};

export const isUserPremium = async (userId: number): Promise<boolean> => {
  const activeSubscription = await findActiveSubscriptionByUserId(userId);
  return !!activeSubscription;
};
