import { readFile } from "node:fs/promises";
import { SerializedTrendModelArtifact } from "@/modele/analysisTrendModel";
import { resolveActiveTrendModelArtifactPath } from "@/lib/trendModelRegistry";

let cachedArtifact: SerializedTrendModelArtifact | null | undefined;
let cachedArtifactPath: string | null | undefined;

export const loadPretrainedTrendArtifact = async (): Promise<SerializedTrendModelArtifact | null> => {
  const artifactPath = await resolveActiveTrendModelArtifactPath();
  if (!artifactPath) {
    cachedArtifact = null;
    cachedArtifactPath = null;
    return null;
  }

  if (cachedArtifact !== undefined && cachedArtifactPath === artifactPath) {
    return cachedArtifact;
  }

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
