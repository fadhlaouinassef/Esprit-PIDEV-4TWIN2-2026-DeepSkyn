import prisma from "../src/lib/prisma";
import { NiveauBadge } from "@prisma/client";

async function main() {
  const all = await prisma.badge.findMany({ where: { user_id: 3 }, select: { id: true, niveau: true, titre: true } });
  console.log("ALL", all);

  const byEnum = await prisma.badge.findMany({
    where: { user_id: 3, niveau: { in: [NiveauBadge.GOLD, NiveauBadge.PLATINUM, NiveauBadge.RUBY_MASTER] } },
    select: { id: true, niveau: true, titre: true }
  });
  console.log("BY_ENUM", byEnum);

  const byString = await prisma.$queryRawUnsafe('SELECT id, niveau, titre FROM "Badge" WHERE user_id = $1 AND niveau IN ($2,$3,$4)', 3, 'GOLD', 'PLATINUM', 'RUBY_MASTER');
  console.log("BY_SQL", byString);
}

main().finally(async()=>{await prisma.$disconnect();});
