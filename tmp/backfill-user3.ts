import prisma from "../src/lib/prisma";
import { ensureRetroactivePromosForUser } from "../src/services/promo.service";

async function main() {
  const createdFor3 = await ensureRetroactivePromosForUser(3);
  console.log('CREATED_USER_3', createdFor3);

  const promos3 = await prisma.userPromoCode.findMany({ where: { user_id: 3 }, include: { campaign: true }, orderBy: { issued_at: 'desc' } });
  console.log('PROMOS_USER_3', promos3.map(p => ({ id: p.id, code: p.code, status: p.status, level: p.campaign.badge_level, brand: p.campaign.brand })));
}

main().catch(console.error).finally(async()=>{await prisma.$disconnect();});
