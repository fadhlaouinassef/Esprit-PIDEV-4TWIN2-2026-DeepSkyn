import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { NiveauBadge } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

const LEVEL_RANK: Record<NiveauBadge, number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  RUBY_MASTER: 5,
};

const getTopBadge = (badges: Array<{ niveau: NiveauBadge; date: Date; titre: string }>) => {
  return badges
    .slice()
    .sort((a, b) => {
      const rankDiff = LEVEL_RANK[b.niveau] - LEVEL_RANK[a.niveau];
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })[0] ?? null;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        badges: {
          some: {},
        },
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        image: true,
        badges: {
          select: {
            id: true,
            titre: true,
            description: true,
            niveau: true,
            date: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const usersWithTopBadge = users
      .map((user) => {
        const topBadge = getTopBadge(user.badges);
        if (!topBadge) {
          return null;
        }

        const fullName = `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || user.email.split('@')[0];

        return {
          id: user.id,
          name: fullName,
          email: user.email,
          photo: user.image,
          highestBadge: {
            level: topBadge.niveau,
            title: topBadge.titre,
            date: topBadge.date,
          },
          badgeCount: user.badges.length,
          history: user.badges.map((badge) => ({
            id: badge.id,
            title: badge.titre,
            description: badge.description,
            level: badge.niveau,
            date: badge.date,
          })),
        };
      })
      .filter((user): user is NonNullable<typeof user> => user !== null);

    const totalUsers = usersWithTopBadge.length;
    const holdersByLevel: Record<NiveauBadge, number> = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0,
      RUBY_MASTER: 0,
    };

    for (const user of usersWithTopBadge) {
      holdersByLevel[user.highestBadge.level] += 1;
    }

    return NextResponse.json({
      users: usersWithTopBadge,
      stats: {
        totalUsers,
        holdersByLevel,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[admin/badges GET]', error);
    return NextResponse.json({ error: 'Failed to fetch admin badges' }, { status: 500 });
  }
}
