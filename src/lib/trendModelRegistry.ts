import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export type TrendModelReportSummary = {
  users?: number;
  trainSeries?: number;
  valSeriesCount?: number;
  testSeriesCount?: number;
  inputCols?: number;
  strictTestMae?: number;
  strictTestRmse?: number;
  strictTestDirectionAccuracy?: number;
  temporalCvMae?: number;
  temporalCvRmse?: number;
  temporalCvDirectionAccuracy?: number;
};

export type TrendModelRecord = {
  id: string;
  name: string;
  artifactPath: string;
  reportPath?: string;
  createdAt: string;
};

type TrendModelRegistryFile = {
  version: number;
  models: TrendModelRecord[];
};

type TrendModelActiveFile = {
  activeModelId: string | null;
};

type TrendTrainingReportFile = {
  artifact?: {
    inputCols?: number;
  };
  data?: {
    users?: number;
    trainSeries?: number;
    valSeriesCount?: number;
    testSeriesCount?: number;
  };
  metrics?: {
    strictTest?: {
      mae?: number;
      rmse?: number;
      directionAccuracy?: number;
    };
    temporalCv?: {
      mae?: number;
      rmse?: number;
      directionAccuracy?: number;
    };
  };
};

const ARTIFACTS_DIR = path.join(process.cwd(), "src", "modele", "artifacts");
const LEGACY_ARTIFACT_PATH = path.join(ARTIFACTS_DIR, "trend-model.json");
const LEGACY_REPORT_PATH = path.join(ARTIFACTS_DIR, "trend-training-report.json");
const MODELS_DIR = path.join(ARTIFACTS_DIR, "models");
const REPORTS_DIR = path.join(ARTIFACTS_DIR, "model-reports");
const REGISTRY_PATH = path.join(ARTIFACTS_DIR, "model-registry.json");
const ACTIVE_MODEL_PATH = path.join(ARTIFACTS_DIR, "active-model.json");

const toSlug = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
};

const uniqueId = (name?: string): string => {
  const base = toSlug(name || "trend-model") || "trend-model";
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${base}-${stamp}`;
};

const readJsonSafe = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as T;
    return parsed;
  } catch {
    return fallback;
  }
};

const ensureDirs = async () => {
  await mkdir(MODELS_DIR, { recursive: true });
  await mkdir(REPORTS_DIR, { recursive: true });
};

const readRegistry = async (): Promise<TrendModelRegistryFile> => {
  const parsed = await readJsonSafe<TrendModelRegistryFile>(REGISTRY_PATH, {
    version: 1,
    models: [],
  });

  if (!parsed || !Array.isArray(parsed.models)) {
    return { version: 1, models: [] };
  }

  return {
    version: 1,
    models: parsed.models,
  };
};

const writeRegistry = async (registry: TrendModelRegistryFile) => {
  await ensureDirs();
  await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), "utf8");
};

const readActive = async (): Promise<TrendModelActiveFile> => {
  return readJsonSafe<TrendModelActiveFile>(ACTIVE_MODEL_PATH, { activeModelId: null });
};

const writeActive = async (active: TrendModelActiveFile) => {
  await ensureDirs();
  await writeFile(ACTIVE_MODEL_PATH, JSON.stringify(active, null, 2), "utf8");
};

const parseReportSummary = async (reportPath?: string): Promise<TrendModelReportSummary | null> => {
  if (!reportPath) return null;

  try {
    const raw = await readFile(reportPath, "utf8");
    const parsed = JSON.parse(raw) as TrendTrainingReportFile;

    return {
      users: parsed?.data?.users,
      trainSeries: parsed?.data?.trainSeries,
      valSeriesCount: parsed?.data?.valSeriesCount,
      testSeriesCount: parsed?.data?.testSeriesCount,
      inputCols: parsed?.artifact?.inputCols,
      strictTestMae: parsed?.metrics?.strictTest?.mae,
      strictTestRmse: parsed?.metrics?.strictTest?.rmse,
      strictTestDirectionAccuracy: parsed?.metrics?.strictTest?.directionAccuracy,
      temporalCvMae: parsed?.metrics?.temporalCv?.mae,
      temporalCvRmse: parsed?.metrics?.temporalCv?.rmse,
      temporalCvDirectionAccuracy: parsed?.metrics?.temporalCv?.directionAccuracy,
    };
  } catch {
    return null;
  }
};

export const listTrendModels = async (): Promise<{
  activeModelId: string | null;
  models: Array<TrendModelRecord & { summary: TrendModelReportSummary | null }>;
}> => {
  const [registry, active] = await Promise.all([readRegistry(), readActive()]);

  const withSummary = await Promise.all(
    registry.models.map(async (model) => ({
      ...model,
      summary: await parseReportSummary(model.reportPath),
    }))
  );

  return {
    activeModelId: active.activeModelId,
    models: withSummary.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
};

export const setActiveTrendModel = async (id: string): Promise<boolean> => {
  const registry = await readRegistry();
  const exists = registry.models.some((m) => m.id === id);
  if (!exists) return false;

  await writeActive({ activeModelId: id });
  return true;
};

export const resolveActiveTrendModelArtifactPath = async (): Promise<string | null> => {
  const [registry, active] = await Promise.all([readRegistry(), readActive()]);
  if (active.activeModelId) {
    const selected = registry.models.find((m) => m.id === active.activeModelId);
    if (selected) {
      return selected.artifactPath;
    }
  }

  try {
    await readFile(LEGACY_ARTIFACT_PATH, "utf8");
    return LEGACY_ARTIFACT_PATH;
  } catch {
    return null;
  }
};

export const registerCurrentArtifactAsModel = async (name?: string): Promise<TrendModelRecord> => {
  await ensureDirs();
  const registry = await readRegistry();

  const id = uniqueId(name);
  const recordName = (name || "Trend Model").trim() || "Trend Model";

  const artifactPath = path.join(MODELS_DIR, `${id}.json`);
  await copyFile(LEGACY_ARTIFACT_PATH, artifactPath);

  let reportPath: string | undefined;
  try {
    reportPath = path.join(REPORTS_DIR, `${id}.json`);
    await copyFile(LEGACY_REPORT_PATH, reportPath);
  } catch {
    reportPath = undefined;
  }

  const record: TrendModelRecord = {
    id,
    name: recordName,
    artifactPath,
    reportPath,
    createdAt: new Date().toISOString(),
  };

  registry.models.push(record);
  await writeRegistry(registry);

  const active = await readActive();
  if (!active.activeModelId) {
    await writeActive({ activeModelId: id });
  }

  return record;
};

export const renameTrendModel = async (id: string, name: string): Promise<boolean> => {
  const registry = await readRegistry();
  const model = registry.models.find((m) => m.id === id);
  if (!model) return false;

  model.name = name.trim() || model.name;
  await writeRegistry(registry);
  return true;
};

export const deleteTrendModel = async (id: string): Promise<{ ok: boolean; reason?: string }> => {
  const registry = await readRegistry();
  const index = registry.models.findIndex((m) => m.id === id);
  if (index < 0) return { ok: false, reason: "Model not found" };

  const model = registry.models[index];
  registry.models.splice(index, 1);
  await writeRegistry(registry);

  try {
    await rm(model.artifactPath, { force: true });
  } catch {
    // Ignore file deletion errors.
  }

  if (model.reportPath) {
    try {
      await rm(model.reportPath, { force: true });
    } catch {
      // Ignore file deletion errors.
    }
  }

  const active = await readActive();
  if (active.activeModelId === id) {
    const fallback = registry.models[registry.models.length - 1]?.id ?? null;
    await writeActive({ activeModelId: fallback });
  }

  return { ok: true };
};

export const getCurrentLegacyDatasetSize = async (): Promise<number | null> => {
  const summary = await parseReportSummary(LEGACY_REPORT_PATH);
  if (!summary) return null;
  return summary.trainSeries ?? null;
};

export const getCurrentLegacyDatasetInfo = async (): Promise<TrendModelReportSummary | null> => {
  return parseReportSummary(LEGACY_REPORT_PATH);
};

export const getActiveTrendModelInfo = async (): Promise<TrendModelRecord | null> => {
  const [registry, active] = await Promise.all([readRegistry(), readActive()]);
  if (!active.activeModelId) return null;
  return registry.models.find((m) => m.id === active.activeModelId) ?? null;
};

export const materializeLegacyModelIntoRegistry = async (): Promise<TrendModelRecord | null> => {
  const registry = await readRegistry();
  if (registry.models.length > 0) {
    return null;
  }

  try {
    await readFile(LEGACY_ARTIFACT_PATH, "utf8");
  } catch {
    return null;
  }

  const created = await registerCurrentArtifactAsModel("Baseline model");
  return created;
};

export const duplicateModelAs = async (id: string, newName: string): Promise<TrendModelRecord | null> => {
  const registry = await readRegistry();
  const existing = registry.models.find((m) => m.id === id);
  if (!existing) return null;

  await ensureDirs();

  const newId = uniqueId(newName);
  const newArtifactPath = path.join(MODELS_DIR, `${newId}.json`);
  await copyFile(existing.artifactPath, newArtifactPath);

  let newReportPath: string | undefined;
  if (existing.reportPath) {
    newReportPath = path.join(REPORTS_DIR, `${newId}.json`);
    try {
      await copyFile(existing.reportPath, newReportPath);
    } catch {
      newReportPath = undefined;
    }
  }

  const cloned: TrendModelRecord = {
    id: newId,
    name: newName.trim() || `${existing.name} copy`,
    artifactPath: newArtifactPath,
    reportPath: newReportPath,
    createdAt: new Date().toISOString(),
  };

  registry.models.push(cloned);
  await writeRegistry(registry);
  return cloned;
};

export const relinkLegacyFilesFromModel = async (id: string): Promise<boolean> => {
  const registry = await readRegistry();
  const existing = registry.models.find((m) => m.id === id);
  if (!existing) return false;

  await copyFile(existing.artifactPath, LEGACY_ARTIFACT_PATH);

  if (existing.reportPath) {
    try {
      await copyFile(existing.reportPath, LEGACY_REPORT_PATH);
    } catch {
      // Ignore report linking issues.
    }
  }

  return true;
};

export const replaceModelFilesAfterTraining = async (id: string): Promise<boolean> => {
  const registry = await readRegistry();
  const existing = registry.models.find((m) => m.id === id);
  if (!existing) return false;

  await copyFile(LEGACY_ARTIFACT_PATH, existing.artifactPath);

  if (existing.reportPath) {
    await copyFile(LEGACY_REPORT_PATH, existing.reportPath);
  } else {
    const generatedReportPath = path.join(REPORTS_DIR, `${id}.json`);
    try {
      await copyFile(LEGACY_REPORT_PATH, generatedReportPath);
      existing.reportPath = generatedReportPath;
      await writeRegistry(registry);
    } catch {
      // Ignore report generation issues.
    }
  }

  return true;
};

export const moveModelFiles = async (id: string, targetName: string): Promise<boolean> => {
  const registry = await readRegistry();
  const model = registry.models.find((m) => m.id === id);
  if (!model) return false;

  const slug = toSlug(targetName) || id;
  const targetArtifactPath = path.join(MODELS_DIR, `${slug}.json`);
  if (targetArtifactPath !== model.artifactPath) {
    await rename(model.artifactPath, targetArtifactPath);
    model.artifactPath = targetArtifactPath;
  }

  if (model.reportPath) {
    const targetReportPath = path.join(REPORTS_DIR, `${slug}.json`);
    if (targetReportPath !== model.reportPath) {
      try {
        await rename(model.reportPath, targetReportPath);
        model.reportPath = targetReportPath;
      } catch {
        // Ignore report move errors.
      }
    }
  }

  model.name = targetName.trim() || model.name;
  await writeRegistry(registry);
  return true;
};
