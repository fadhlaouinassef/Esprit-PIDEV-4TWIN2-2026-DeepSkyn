import { readFile } from "node:fs/promises";
import path from "node:path";
import { SerializedTrendModelArtifact } from "@/modele/analysisTrendModel";

let cachedArtifact: SerializedTrendModelArtifact | null | undefined;
let cachedArtifactPath: string | null | undefined;

const DEFAULT_TREND_MODEL_PATH = path.join(process.cwd(), "src", "modele", "artifacts", "trend-model.json");

const resolveTrendModelPath = (): string => {
  const configured = process.env.TREND_MODEL_ARTIFACT_PATH?.trim();
  if (!configured) return DEFAULT_TREND_MODEL_PATH;
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
};

export const loadPretrainedTrendArtifact = async (): Promise<SerializedTrendModelArtifact | null> => {
  const artifactPath = resolveTrendModelPath();

  // Invalidate cache to ensure local training is immediately reflected
  // if (cachedArtifact !== undefined && cachedArtifactPath === artifactPath) {
  //   return cachedArtifact;
  // }

  try {
    const raw = await readFile(artifactPath, "utf8");
    const parsed = JSON.parse(raw) as SerializedTrendModelArtifact;

    if (!parsed || !Array.isArray(parsed.layers) || !parsed.layers.length) {
      cachedArtifact = null;
      cachedArtifactPath = artifactPath;
      return null;
    }

    cachedArtifact = parsed;
    cachedArtifactPath = artifactPath;
    return cachedArtifact;
  } catch {
    cachedArtifact = null;
    cachedArtifactPath = artifactPath;
    return null;
  }
};

export const resetPretrainedTrendArtifactCache = () => {
  cachedArtifact = undefined;
  cachedArtifactPath = undefined;
};
