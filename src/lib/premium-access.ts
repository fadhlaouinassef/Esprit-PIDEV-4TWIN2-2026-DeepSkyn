import prisma from '@/lib/prisma';
import { RoleType } from '@prisma/client';

export const ANALYSIS_WINDOW_MS = 24 * 60 * 60 * 1000;

export type PremiumAccessStatus = {
  userId: number;
  role: RoleType;
  hasActiveSubscription: boolean;
  subscriptionEndsAt: Date | null;
  isPremium: boolean;
};

export type AnalysisAccessStatus = PremiumAccessStatus & {
  canCreateAnalysis: boolean;
  lastAnalysisAt: Date | null;
  nextAvailableAt: Date | null;
  remainingMs: number;
};

export async function getPremiumAccessStatus(userId: number): Promise<PremiumAccessStatus> {
  const now = new Date();

  const [user, activeSubscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    }),
    prisma.subscription.findFirst({
      where: {
        user_id: userId,
        date_fin: { gte: now },
      },
      orderBy: { date_fin: 'desc' },
      select: { date_fin: true },
    }),
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  const hasActiveSubscription = Boolean(activeSubscription);
  const isPremium = user.role === RoleType.PREMIUM_USER || hasActiveSubscription;

  return {
    userId,
    role: user.role,
    hasActiveSubscription,
    subscriptionEndsAt: activeSubscription?.date_fin ?? null,
    isPremium,
  };
}

export async function getAnalysisAccessStatus(userId: number): Promise<AnalysisAccessStatus> {
  const premiumStatus = await getPremiumAccessStatus(userId);

  const lastAnalysis = await prisma.skinAnalyse.findFirst({
    where: { user_id: userId },
    orderBy: { date_creation: 'desc' },
    select: { date_creation: true },
  });

  const lastAnalysisAt = lastAnalysis?.date_creation ?? null;

  if (premiumStatus.isPremium) {
    return {
      ...premiumStatus,
      canCreateAnalysis: true,
      lastAnalysisAt,
      nextAvailableAt: null,
      remainingMs: 0,
    };
  }

  if (!lastAnalysisAt) {
    return {
      ...premiumStatus,
      canCreateAnalysis: true,
      lastAnalysisAt: null,
      nextAvailableAt: null,
      remainingMs: 0,
    };
  }

  const nextAvailableMs = lastAnalysisAt.getTime() + ANALYSIS_WINDOW_MS;
  const remainingMs = Math.max(0, nextAvailableMs - Date.now());

  return {
    ...premiumStatus,
    canCreateAnalysis: remainingMs === 0,
    lastAnalysisAt,
    nextAvailableAt: remainingMs > 0 ? new Date(nextAvailableMs) : null,
    remainingMs,
  };
}
