import { NextResponse } from "next/server";

type AnalyzeImageBody = {
  image?: string;
  question?: string;
  imageMetrics?: {
    width?: number;
    height?: number;
    avgBrightness?: number;
    contrast?: number;
    redRatio?: number;
    darkRatio?: number;
    highlightRatio?: number;
  };
};

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

const FACEPP_API_KEY = process.env.FACEPP_API_KEY;
const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET;
const FACEPP_DETECT_URL =
  process.env.FACEPP_DETECT_URL || "https://api-us.faceplusplus.com/facepp/v3/detect";

const DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\r\n]+$/i;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const toFinite = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const exceedsThreshold = (metric?: { value?: number; threshold?: number }): boolean => {
  const value = Number(metric?.value);
  const threshold = Number(metric?.threshold);

  if (!Number.isFinite(value)) return false;
  if (Number.isFinite(threshold)) return value > threshold;

  return value > 50;
};

const estimateBytesFromDataUrl = (dataUrl: string): number => {
  const base64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  return Math.floor((base64.length * 3) / 4);
};

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const buildFallbackAnalysis = (question?: string) => {
  const asked = String(question || "").trim();
  const intro = asked
    ? `Image question received: \"${asked}\".`
    : "Image received without an additional question.";

  return {
    answer:
      `${intro} Local simplified analysis is enabled. ` +
      "Recommended skincare base: gentle cleanser, hydrating serum, barrier moisturizer, SPF 30+ every morning.",
    confidence: 0.6,
    intent: "image_analysis_fallback",
    suggestions: [
      "Re-upload a clear frontal image in natural light.",
      "Add your skin type for a more precise recommendation.",
      "Ask for a personalized AM/PM routine.",
    ],
  };
};

const buildLocalMetricsAnalysis = (
  question: string | undefined,
  metrics: AnalyzeImageBody["imageMetrics"]
) => {
  const asked = String(question || "").trim();
  const intro = asked
    ? `Image question received: \"${asked}\". `
    : "Image received without an additional question. ";

  const avgBrightness = toFinite(metrics?.avgBrightness, 0);
  const contrast = toFinite(metrics?.contrast, 0);
  const redRatio = toFinite(metrics?.redRatio, 0);
  const darkRatio = toFinite(metrics?.darkRatio, 0);
  const highlightRatio = toFinite(metrics?.highlightRatio, 0);
  const width = Math.round(toFinite(metrics?.width, 0));
  const height = Math.round(toFinite(metrics?.height, 0));

  const lightAssessment =
    avgBrightness < 85
      ? "low brightness"
      : avgBrightness > 170
        ? "high brightness"
        : "balanced brightness";

  const contrastAssessment =
    contrast < 35 ? "low contrast" : contrast > 65 ? "high contrast" : "medium contrast";

  const rednessSignal =
    redRatio > 0.355
      ? "strong red dominance (possible visible irritation)"
      : redRatio > 0.338
        ? "slight red dominance"
        : "moderate red dominance";

  const exposureSignal =
    darkRatio > 0.4
      ? "important dark areas"
      : highlightRatio > 0.28
        ? "important overexposed areas"
        : "overall usable exposure";

  const recommendations: string[] = [];

  const rednessScore = clamp01((redRatio - 0.33) / 0.05);
  const underExposureScore = clamp01((0.34 - avgBrightness) / 0.34);
  const overExposureScore = clamp01((highlightRatio - 0.2) / 0.35);
  const lowContrastScore = clamp01((30 - contrast) / 30);

  const primaryIssue = [
    {
      key: "redness",
      score: rednessScore,
      advice:
        "Prioritize a soothing routine: gentle cleanser, hydrating serum, barrier moisturizer, SPF 30+, and pause irritating actives.",
    },
    {
      key: "underExposure",
      score: underExposureScore,
      advice: "Retake the photo in frontal natural light for more reliable skin reading.",
    },
    {
      key: "overExposure",
      score: overExposureScore,
      advice: "Reduce direct light/flash to avoid overexposure in shiny areas.",
    },
    {
      key: "lowContrast",
      score: lowContrastScore,
      advice: "Add a clear profile photo to better assess texture and relief.",
    },
  ].sort((a, b) => b.score - a.score)[0];

  if (avgBrightness < 85) {
    recommendations.push(
      "Retake the photo with frontal natural light for a more reliable analysis."
    );
  }
  if (highlightRatio > 0.28) {
    recommendations.push(
      "Avoid strong direct light or flash to reduce overexposure."
    );
  }
  if (redRatio > 0.355) {
    recommendations.push(
      "Prioritize a soothing routine: gentle cleanser, hydrating serum, barrier moisturizer, SPF 30+."
    );
    recommendations.push(
      "Temporarily reduce irritating actives (strong AHA/BHA, frequent retinoids)."
    );
  } else {
    recommendations.push(
      "Recommended base routine: gentle cleanser, hydrating serum, barrier moisturizer, daily SPF 30+."
    );
  }

  if (contrast < 35) {
    recommendations.push(
      "Add a profile photo and a clear frontal photo to better assess texture and relief."
    );
  }

  if (primaryIssue.score > 0.18) {
    recommendations.unshift(primaryIssue.advice);
  }

  const answer =
    `${intro}Local analysis completed (${width}x${height}). ` +
    `Result: ${lightAssessment}, ${contrastAssessment}, ${rednessSignal}, ${exposureSignal}. ` +
    `Scores: redness ${Math.round(rednessScore * 100)}%, under-exposure ${Math.round(underExposureScore * 100)}%, ` +
    `over-exposure ${Math.round(overExposureScore * 100)}%, low-contrast ${Math.round(lowContrastScore * 100)}%. ` +
    `Main advice: ${recommendations[0] || "continue a gentle and consistent routine."}`;

  return {
    answer,
    confidence: 0.74,
    intent: "image_analysis_local",
    suggestions: recommendations.slice(0, 3),
  };
};

const analyzeWithFacePP = async (imageDataUrl: string, question?: string) => {
  const base64Payload = imageDataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");

  const formData = new FormData();
  formData.append("api_key", FACEPP_API_KEY || "");
  formData.append("api_secret", FACEPP_API_SECRET || "");
  formData.append("image_base64", base64Payload);
  formData.append("return_attributes", "headpose,blur,facequality");

  const response = await fetch(FACEPP_DETECT_URL, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as FacePlusPlusDetectResponse;

  if (!response.ok || payload.error_message) {
    throw new Error(payload.error_message || "Face++ request failed");
  }

  const faces = Array.isArray(payload.faces) ? payload.faces : [];
  if (faces.length === 0) {
    return {
      answer:
        "No face detected. Upload a frontal face photo, well lit, without filters, for a more precise analysis.",
      confidence: 0.66,
      intent: "image_no_face",
      suggestions: [
        "Frontal photo with full face visible",
        "Natural light, without backlighting",
        "Sharp image without blur",
      ],
    };
  }

  if (faces.length > 1) {
    return {
      answer:
        "Multiple faces detected. Please upload an image with a single face for reliable skincare analysis.",
      confidence: 0.72,
      intent: "image_multiple_faces",
      suggestions: [
        "Crop the image to a single face",
        "Avoid group photos",
        "Keep the face centered",
      ],
    };
  }

  const face = faces[0];
  const headpose = face.attributes?.headpose;
  const blur = face.attributes?.blur;

  const yaw = Math.abs(toFinite(headpose?.yaw_angle));
  const pitch = Math.abs(toFinite(headpose?.pitch_angle));
  const roll = Math.abs(toFinite(headpose?.roll_angle));
  const faceQuality = toFinite(face.attributes?.facequality?.value, 50);

  const blurry =
    exceedsThreshold(blur?.blurness) ||
    exceedsThreshold(blur?.motionblur) ||
    exceedsThreshold(blur?.gaussianblur);

  const orientationGood = yaw <= 28 && pitch <= 28 && roll <= 28;

  const qualityLabel =
    faceQuality >= 70 ? "good" : faceQuality >= 40 ? "medium" : "low";

  const focusLabel = blurry ? "blurry" : "sharp";

  const asked = String(question || "").trim();
  const askedPrefix = asked ? `Question: \"${asked}\". ` : "";

  const answer =
    `${askedPrefix}Image analysis: quality ${qualityLabel}, sharpness ${focusLabel}, ` +
    `${orientationGood ? "frontal face is acceptable" : "face orientation should be corrected"}. ` +
    "Recommendation: gentle routine (non-aggressive cleanser, hydrating care, SPF 30+) and avoid irritating actives if sensitivity is visible.";

  const suggestions = [
    orientationGood ? "Frontal photo is OK" : "Retake a more frontal photo",
    blurry ? "Retake a sharper photo" : "Sharpness is sufficient",
    "Ask for a targeted routine (acne/spots/sensitivity)",
  ];

  return {
    answer,
    confidence: 0.83,
    intent: "image_analysis",
    suggestions,
    details: {
      yaw,
      pitch,
      roll,
      faceQuality,
      blurry,
      imageWidth: toFinite(payload.image_width),
      imageHeight: toFinite(payload.image_height),
    },
  };
};

export async function POST(request: Request) {
  let parsedBody: AnalyzeImageBody = {};
  try {
    const body = (await request.json().catch(() => ({}))) as AnalyzeImageBody;
    parsedBody = body;
    const image = String(body.image || "");

    if (!image || !DATA_URL_RE.test(image)) {
      return NextResponse.json(
        { error: "Invalid image. Use an image data URL (png/jpeg/jpg/webp)." },
        { status: 400 }
      );
    }

    const byteLength = estimateBytesFromDataUrl(image);
    if (byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image is too large. Maximum is 8MB." },
        { status: 400 }
      );
    }

    if (!FACEPP_API_KEY || !FACEPP_API_SECRET || FACEPP_API_KEY === FACEPP_API_SECRET) {
      const localResult = buildLocalMetricsAnalysis(body.question, body.imageMetrics);
      return NextResponse.json(localResult, { status: 200 });
    }

    const result = await analyzeWithFacePP(image, body.question);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Chatbot image analysis error:", error);
    const localResult = buildLocalMetricsAnalysis(parsedBody.question, parsedBody.imageMetrics);
    return NextResponse.json(localResult, { status: 200 });
  }
}
