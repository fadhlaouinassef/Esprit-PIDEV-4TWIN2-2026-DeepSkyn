import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';
import { getPremiumAccessStatus } from '@/lib/premium-access';

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

type FacePlusPlusDetectResponse = {
  image_width?: number;
  image_height?: number;
  faces?: Array<{
    face_rectangle?: {
      top?: number;
      left?: number;
      width?: number;
      height?: number;
    };
    attributes?: {
      headpose?: {
        pitch_angle?: number;
        yaw_angle?: number;
        roll_angle?: number;
      };
      facequality?: {
        value?: number;
      };
      blur?: {
        blurness?: { value?: number; threshold?: number };
        motionblur?: { value?: number; threshold?: number };
        gaussianblur?: { value?: number; threshold?: number };
      };
    };
  }>;
  error_message?: string;
};

type FaceValidationResult = {
  valid: boolean;
  code?: string;
  message?: string;
};

const FACEPP_API_KEY = process.env.FACEPP_API_KEY;
const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET;
const FACEPP_DETECT_URL = process.env.FACEPP_DETECT_URL || 'https://api-us.faceplusplus.com/facepp/v3/detect';

const exceedsThreshold = (metric?: { value?: number; threshold?: number }): boolean => {
  const value = Number(metric?.value);
  const threshold = Number(metric?.threshold);

  if (!Number.isFinite(value)) {
    return false;
  }

  if (Number.isFinite(threshold)) {
    return value > threshold;
  }

  return value > 50;
};

const validateFaceImage = async (dataUrl: string): Promise<FaceValidationResult> => {
  if (!FACEPP_API_KEY || !FACEPP_API_SECRET) {
    return {
      valid: false,
      code: 'FACE_API_NOT_CONFIGURED',
      message: 'Face validation service is not configured on server.',
    };
  }

  if (FACEPP_API_KEY === FACEPP_API_SECRET) {
    return {
      valid: false,
      code: 'FACE_API_AUTH_ERROR',
      message: 'Face validation credentials appear invalid (api_key and api_secret cannot be identical).',
    };
  }

  const base64Payload = dataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

  const formData = new FormData();
  formData.append('api_key', FACEPP_API_KEY);
  formData.append('api_secret', FACEPP_API_SECRET);
  formData.append('image_base64', base64Payload);
  formData.append('return_attributes', 'headpose,blur,facequality');

  const response = await fetch(FACEPP_DETECT_URL, {
    method: 'POST',
    body: formData,
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => ({}))) as FacePlusPlusDetectResponse;

  if (!response.ok || payload.error_message) {
    const errorMessage = String(payload.error_message || '').toUpperCase();

    if (errorMessage === 'AUTHENTICATION_ERROR') {
      return {
        valid: false,
        code: 'FACE_API_AUTH_ERROR',
        message: 'Face validation authentication failed. Please verify FACEPP_API_KEY and FACEPP_API_SECRET.',
      };
    }

    return {
      valid: false,
      code: 'FACE_API_ERROR',
      message: payload.error_message || 'Face validation API request failed.',
    };
  }

  const faces = Array.isArray(payload.faces) ? payload.faces : [];
  if (faces.length === 0) {
    return {
      valid: false,
      code: 'FACE_NOT_DETECTED',
      message: 'No face detected. Please upload a clear frontal face photo.',
    };
  }

  if (faces.length > 1) {
    return {
      valid: false,
      code: 'MULTIPLE_FACES',
      message: 'Multiple faces detected. Please upload a photo with one face only.',
    };
  }

  const face = faces[0];
  const headpose = face.attributes?.headpose;
  const yaw = Math.abs(Number(headpose?.yaw_angle ?? 0));
  const pitch = Math.abs(Number(headpose?.pitch_angle ?? 0));
  const roll = Math.abs(Number(headpose?.roll_angle ?? 0));

  if (yaw > 28 || pitch > 28 || roll > 28) {
    return {
      valid: false,
      code: 'FACE_NOT_FRONTAL',
      message: 'Please upload a frontal face photo (face looking straight at the camera).',
    };
  }

  const blur = face.attributes?.blur;
  const isBlurry = exceedsThreshold(blur?.blurness) || exceedsThreshold(blur?.motionblur) || exceedsThreshold(blur?.gaussianblur);

  const faceQuality = Number(face.attributes?.facequality?.value);
  const lowQuality = Number.isFinite(faceQuality) && faceQuality < 20;

  if (isBlurry || lowQuality) {
    return {
      valid: false,
      code: 'IMAGE_BLURRY',
      message: 'Image is blurry. Please upload a sharper photo with better focus.',
    };
  }

  const rect = face.face_rectangle;
  const imageWidth = Number(payload.image_width);
  const imageHeight = Number(payload.image_height);

  if (rect && Number.isFinite(imageWidth) && Number.isFinite(imageHeight) && imageWidth > 0 && imageHeight > 0) {
    const width = Number(rect.width ?? 0);
    const height = Number(rect.height ?? 0);
    const left = Number(rect.left ?? 0);
    const top = Number(rect.top ?? 0);

    const areaRatio = (width * height) / (imageWidth * imageHeight);
    const centerX = (left + width / 2) / imageWidth;
    const centerY = (top + height / 2) / imageHeight;

    const isFrameBad = areaRatio < 0.07 || areaRatio > 0.82 || Math.abs(centerX - 0.5) > 0.35 || Math.abs(centerY - 0.5) > 0.35;
    if (isFrameBad) {
      return {
        valid: false,
        code: 'BAD_FRAMING',
        message: 'Face framing is not good. Center your face and keep it clearly visible.',
      };
    }
  }

  return { valid: true };
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

    const access = await getPremiumAccessStatus(targetUserId);
    const maxImages = access.isPremium ? 5 : 1;

    if (images.length > maxImages) {
      return NextResponse.json({ error: `Maximum ${maxImages} image${maxImages > 1 ? 's' : ''} allowed.` }, { status: 400 });
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

    const insertedIds: number[] = [];

    for (let index = 0; index < images.length; index += 1) {
      const image = images[index];

      const validation = await validateFaceImage(image);
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: validation.message || 'Invalid face image.',
            code: validation.code || 'INVALID_FACE_IMAGE',
            index,
          },
          { status: 400 }
        );
      }

      // Upload to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: 'image-survey',
        resource_type: 'image',
      });

      const publicPath = uploadResponse.secure_url;

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
