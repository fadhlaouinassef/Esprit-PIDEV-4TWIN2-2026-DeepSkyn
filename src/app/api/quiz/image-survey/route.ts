import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

type UploadBody = {
  userId?: number;
  analysisId?: number;
  images?: string[];
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!sessionUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const analysisIdParam = request.nextUrl.searchParams.get('analysisId');
    const analysisId = analysisIdParam ? Number(analysisIdParam) : undefined;

    if (analysisIdParam && !Number.isFinite(analysisId)) {
      return NextResponse.json({ error: 'Invalid analysisId' }, { status: 400 });
    }

    const rows = await prisma.$queryRawUnsafe<
      { id: number; user_id: number; analyse_id: number; image: string; created_at: Date }[]
    >(
      `SELECT "id", "user_id", "analyse_id", "image", "created_at"
       FROM "ImageSurvey"
       WHERE "user_id" = $1
       ${analysisId ? 'AND "analyse_id" = $2' : ''}
       ORDER BY "id" DESC
       LIMIT 50;`,
      ...(analysisId ? [sessionUser.id, analysisId] : [sessionUser.id])
    );

    return NextResponse.json({ count: rows.length, items: rows }, { status: 200 });
  } catch (error: unknown) {
    console.error('ImageSurvey fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch survey images.' }, { status: 500 });
  }
}

const DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\r\n]+$/i;

const getExtensionFromMime = (mimeType: string): string => {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('webp')) return 'webp';
  return 'jpg';
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!sessionUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as UploadBody;
    const targetUserId = Number(body.userId) || sessionUser.id;
    if (targetUserId !== sessionUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const analysisId = Number(body.analysisId);
    if (!Number.isFinite(analysisId)) {
      return NextResponse.json({ error: 'analysisId is required.' }, { status: 400 });
    }

    const images = Array.isArray(body.images) ? body.images : [];
    if (images.length === 0) {
      return NextResponse.json({ error: 'At least one image is required.' }, { status: 400 });
    }

    if (images.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 images allowed.' }, { status: 400 });
    }

    for (const image of images) {
      if (typeof image !== 'string' || !DATA_URL_RE.test(image)) {
        return NextResponse.json({ error: 'Invalid image format. Use image data URLs.' }, { status: 400 });
      }
    }

    const analysisExists = await prisma.$queryRawUnsafe<{ id: number }[]>(
      'SELECT "id" FROM "SkinScoreAnalysis" WHERE "id" = $1 LIMIT 1;',
      analysisId
    );

    if (!analysisExists[0]) {
      return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'image-survey');
    await mkdir(uploadDir, { recursive: true });

    const insertedIds: number[] = [];

    for (const image of images) {
      const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(image);
      if (!match) {
        return NextResponse.json({ error: 'Invalid image payload.' }, { status: 400 });
      }

      const mimeType = match[1];
      const base64Payload = match[2];
      const fileBuffer = Buffer.from(base64Payload, 'base64');
      const extension = getExtensionFromMime(mimeType);
      const fileName = `survey-${targetUserId}-${analysisId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
      const diskPath = path.join(uploadDir, fileName);
      const publicPath = `/uploads/image-survey/${fileName}`;

      await writeFile(diskPath, fileBuffer);

      const inserted = await prisma.$queryRawUnsafe<{ id: number }[]>(
        `INSERT INTO "ImageSurvey" ("user_id", "analyse_id", "image")
         VALUES ($1, $2, $3)
         RETURNING "id";`,
        targetUserId,
        analysisId,
        publicPath
      );
      if (inserted[0]?.id) insertedIds.push(inserted[0].id);
    }

    return NextResponse.json({ count: insertedIds.length, ids: insertedIds }, { status: 201 });
  } catch (error: unknown) {
    console.error('ImageSurvey upload error:', error);
    return NextResponse.json({ error: 'Failed to store survey images.' }, { status: 500 });
  }
}
