import prisma from "../src/lib/prisma";
import { issuePromoCodeForBadge } from "../src/services/promo.service";

async function main() {
  const badge = await prisma.badge.findFirst({ where: { user_id: 3, niveau: 'GOLD' }, orderBy: { date: 'desc' } });
  console.log('BADGE', badge);

  const campaigns = await prisma.promoCampaign.findMany({ orderBy: { id: 'asc' } });
  console.log('CAMPAIGNS_DATES', campaigns.map(c => ({ id: c.id, level: c.badge_level, starts_at: c.starts_at.toISOString(), ends_at: c.ends_at ? c.ends_at.toISOString() : null, active: c.is_active })));

  if (!badge) return;
  const promo = await issuePromoCodeForBadge({ userId: 3, badgeId: badge.id, badgeLevel: badge.niveau, now: new Date() });
  console.log('ISSUED_PROMO', promo);
}

main().catch(console.error).finally(async()=>{await prisma.$disconnect();});
