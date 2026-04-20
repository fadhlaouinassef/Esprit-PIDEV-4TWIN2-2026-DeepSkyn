import { NiveauBadge, PromoCodeStatus } from '@prisma/client';
import prisma from '@/lib/prisma';

const PROMO_ELIGIBLE_LEVELS = new Set<NiveauBadge>([
  NiveauBadge.GOLD,
  NiveauBadge.PLATINUM,
  NiveauBadge.RUBY_MASTER,
]);

const randomChars = (length: number): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let output = '';

  for (let i = 0; i < length; i += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return output;
};

const generatePromoCode = (prefix?: string | null): string => {
  const normalizedPrefix = String(prefix || 'DSK')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);

  return `${normalizedPrefix}-${randomChars(4)}-${randomChars(4)}`;
};

const addDays = (date: Date, days: number): Date => {
  const out = new Date(date);
  out.setUTCDate(out.getUTCDate() + Math.max(1, days));
  return out;
};

export const issuePromoCodeForBadge = async (params: {
  userId: number;
  badgeId: number;
  badgeLevel: NiveauBadge;
  now?: Date;
}) => {
  const now = params.now ?? new Date();

  if (!PROMO_ELIGIBLE_LEVELS.has(params.badgeLevel)) {
    return null;
  }

  let campaign = await prisma.promoCampaign.findFirst({
    where: {
      badge_level: params.badgeLevel,
      is_active: true,
      OR: [{ ends_at: null }, { ends_at: { gte: now } }],
    },
    orderBy: { id: 'asc' },
  });

  // Fallback for clock skew / timezone drifts: keep feature usable if starts_at is slightly ahead.
  if (!campaign) {
    campaign = await prisma.promoCampaign.findFirst({
      where: {
        badge_level: params.badgeLevel,
        is_active: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  if (!campaign) {
    return null;
  }

  const existing = await prisma.userPromoCode.findUnique({
    where: {
      user_id_campaign_id: {
        user_id: params.userId,
        campaign_id: campaign.id,
      },
    },
  });

  if (existing) {
    return existing;
  }

  const expiresAt = addDays(now, campaign.expires_in_days);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generatePromoCode(campaign.code_prefix);

    try {
      const created = await prisma.userPromoCode.create({
        data: {
          user_id: params.userId,
          campaign_id: campaign.id,
          badge_id: params.badgeId,
          code,
          status: PromoCodeStatus.ACTIVE,
          issued_at: now,
          expires_at: expiresAt,
        },
      });

      return created;
    } catch (error) {
      // P2002 unique collision (code or user/campaign), retry code collisions only.
      const message = String((error as { message?: string })?.message || '');
      if (!message.includes('Unique constraint')) {
        throw error;
      }

      const recheck = await prisma.userPromoCode.findUnique({
        where: {
          user_id_campaign_id: {
            user_id: params.userId,
            campaign_id: campaign.id,
          },
        },
      });

      if (recheck) {
        return recheck;
      }
    }
  }

  throw new Error('Could not generate a unique promo code');
};

export const getUserPromos = async (userId: number, now: Date = new Date()) => {
  let promos;

  try {
    promos = await prisma.userPromoCode.findMany({
      where: { user_id: userId },
      include: {
        campaign: true,
        badge: true,
      },
      orderBy: [{ issued_at: 'desc' }],
    });
  } catch (error) {
    console.warn('[PromoService:getUserPromos] Promo subsystem unavailable, returning empty list.', error);
    return [];
  }

  const updated: number[] = [];

  for (const promo of promos) {
    if (promo.status === PromoCodeStatus.ACTIVE && promo.expires_at.getTime() < now.getTime()) {
      updated.push(promo.id);
    }
  }

  if (updated.length > 0) {
    try {
      await prisma.userPromoCode.updateMany({
        where: { id: { in: updated } },
        data: { status: PromoCodeStatus.EXPIRED },
      });

      return await prisma.userPromoCode.findMany({
        where: { user_id: userId },
        include: {
          campaign: true,
          badge: true,
        },
        orderBy: [{ issued_at: 'desc' }],
      });
    } catch (error) {
      console.warn('[PromoService:getUserPromos] Promo expiration sync failed, returning stale list.', error);
      return promos;
    }
  }

  return promos;
};

export const markPromoCodeAsUsed = async (params: { userId: number; promoCodeId: number }) => {
  const current = await prisma.userPromoCode.findFirst({
    where: {
      id: params.promoCodeId,
      user_id: params.userId,
    },
  });

  if (!current) return null;

  if (current.status === PromoCodeStatus.USED) return current;

  return await prisma.userPromoCode.update({
    where: { id: current.id },
    data: {
      status: PromoCodeStatus.USED,
      used_at: new Date(),
    },
  });
};

export const ensureRetroactivePromosForUser = async (userId: number) => {
  const eligibleBadges = await prisma.badge.findMany({
    where: {
      user_id: userId,
      niveau: {
        in: [NiveauBadge.GOLD, NiveauBadge.PLATINUM, NiveauBadge.RUBY_MASTER],
      },
    },
    orderBy: { date: 'desc' },
  });

  if (eligibleBadges.length === 0) {
    return [];
  }

  const createdCodes: string[] = [];

  for (const badge of eligibleBadges) {
    try {
      const promo = await issuePromoCodeForBadge({
        userId,
        badgeId: badge.id,
        badgeLevel: badge.niveau,
        now: new Date(),
      });

      if (promo) {
        createdCodes.push(promo.code);
      }
    } catch (error) {
      console.warn('[PromoService:ensureRetroactivePromosForUser] Failed for badge', badge.id, error);
    }
  }

  return createdCodes;
};
