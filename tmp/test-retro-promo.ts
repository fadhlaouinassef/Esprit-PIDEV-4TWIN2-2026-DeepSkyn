import prisma from "../src/lib/prisma";
import { ensureRetroactivePromosForUser } from "../src/services/promo.service";

async function main() {
  const user = await prisma.user.findUnique({ where: { id: 3 }, select: { id: true, email: true } });
  console.log("USER", user);

  const before = await prisma.userPromoCode.findMany({ where: { user_id: 3 }, include: { campaign: true } });
  console.log("BEFORE", before.map(p => ({ id: p.id, code: p.code, status: p.status, camp: p.campaign.badge_level })));

  const created = await ensureRetroactivePromosForUser(3);
  console.log("CREATED", created);

  const after = await prisma.userPromoCode.findMany({ where: { user_id: 3 }, include: { campaign: true } });
  console.log("AFTER", after.map(p => ({ id: p.id, code: p.code, status: p.status, camp: p.campaign.badge_level })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
