import prisma from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    take: 20,
    orderBy: { id: "asc" },
    select: { id: true, email: true, nom: true, prenom: true }
  });

  console.log("USERS", users);

  const campaigns = await prisma.promoCampaign.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true, badge_level: true, brand: true, is_active: true }
  });
  console.log("CAMPAIGNS", campaigns);

  for (const u of users) {
    const badges = await prisma.badge.findMany({
      where: { user_id: u.id },
      orderBy: { date: "desc" },
      select: { id: true, niveau: true, titre: true, date: true }
    });

    const promos = await prisma.userPromoCode.findMany({
      where: { user_id: u.id },
      include: { campaign: { select: { id: true, badge_level: true, brand: true } } },
      orderBy: { issued_at: "desc" }
    });

    if (badges.length > 0 || promos.length > 0) {
      console.log("--- USER", u.id, u.email, "---");
      console.log("BADGES", badges.map(b => ({ id: b.id, niveau: b.niveau, titre: b.titre })));
      console.log("PROMOS", promos.map(p => ({ id: p.id, code: p.code, status: p.status, camp: p.campaign.badge_level })));
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
