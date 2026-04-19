import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  registerCurrentArtifactAsModel,
  relinkLegacyFilesFromModel,
  replaceModelFilesAfterTraining,
} from "@/lib/trendModelRegistry";

export type TrendTrainingJob = {
  id: string;
  modelName: string;
  mode: "new" | "retrain";
  targetModelId?: string;
  status: "queued" | "running" | "success" | "failed";
  logs: string[];
  startedAt: string;
  endedAt?: string;
  createdModelId?: string;
  error?: string;
};

const jobs = new Map<string, TrendTrainingJob>();
const JOBS_STATE_PATH = path.join(process.cwd(), "src", "modele", "artifacts", "trend-jobs.json");

const saveJobsToDisk = () => {
  try {
    mkdirSync(path.dirname(JOBS_STATE_PATH), { recursive: true });
    const serialized = JSON.stringify(Array.from(jobs.values()), null, 2);
    writeFileSync(JOBS_STATE_PATH, serialized, "utf8");
  } catch {
    // Ignore persistence failures; in-memory behavior still works.
  }
};

const loadJobsFromDisk = () => {
  if (jobs.size > 0) return;

  try {
    const raw = readFileSync(JOBS_STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as TrendTrainingJob[];
    if (!Array.isArray(parsed)) return;

    parsed.forEach((job) => {
      if (!job?.id) return;
      jobs.set(job.id, job);
    });
  } catch {
    // Ignore missing/corrupt state file.
  }
};

const makeJobId = (): string => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `trend-job-${stamp}-${rnd}`;
};

const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";

const runNpmScript = async (
  scriptName: string,
  onLog: (line: string) => void
): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const useShell = process.platform === "win32";
    const child = spawn(npmBin, ["run", scriptName], {
      cwd: process.cwd(),
      env: { ...process.env },
      shell: useShell,
    });

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      text
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter(Boolean)
        .forEach((line) => onLog(line));
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      text
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter(Boolean)
        .forEach((line) => onLog(`[stderr] ${line}`));
    });

    child.on("error", (error) => {
      onLog(`Failed to spawn script ${scriptName}: ${error.message}`);
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptName} exited with code ${code ?? -1}`));
      }
    });
  });
};

const updateJob = (jobId: string, patch: Partial<TrendTrainingJob>) => {
  loadJobsFromDisk();
  const existing = jobs.get(jobId);
  if (!existing) return;
  jobs.set(jobId, { ...existing, ...patch });
  saveJobsToDisk();
};

const appendJobLog = (jobId: string, line: string) => {
  loadJobsFromDisk();
  const existing = jobs.get(jobId);
  if (!existing) return;

  const logs = [...existing.logs, `[${new Date().toISOString()}] ${line}`];
  const clipped = logs.slice(-500);
  jobs.set(jobId, { ...existing, logs: clipped });
  saveJobsToDisk();
};

export const listTrendTrainingJobs = (): TrendTrainingJob[] => {
  loadJobsFromDisk();
  return Array.from(jobs.values()).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
};

export const getTrendTrainingJob = (jobId: string): TrendTrainingJob | null => {
  loadJobsFromDisk();
  return jobs.get(jobId) ?? null;
};

const runTrainAndTest = async (job: TrendTrainingJob) => {
  updateJob(job.id, { status: "running" });
  appendJobLog(job.id, "Training started.");

  if (job.mode === "retrain" && job.targetModelId) {
    appendJobLog(job.id, `Switching legacy artifact to target model ${job.targetModelId}.`);
    const linked = await relinkLegacyFilesFromModel(job.targetModelId);
    if (!linked) {
      throw new Error("Unable to prepare retrain target model.");
    }
  }

  await runNpmScript("ml:train-trend", (line) => appendJobLog(job.id, line));
  appendJobLog(job.id, "Training script completed.");

  await runNpmScript("ml:test-trend", (line) => appendJobLog(job.id, line));
  appendJobLog(job.id, "Test script completed.");

  if (job.mode === "retrain" && job.targetModelId) {
    const replaced = await replaceModelFilesAfterTraining(job.targetModelId);
    if (!replaced) {
      throw new Error("Unable to update retrained model files.");
    }

    updateJob(job.id, {
      status: "success",
      endedAt: new Date().toISOString(),
      createdModelId: job.targetModelId,
    });

    appendJobLog(job.id, `Retrained existing model: ${job.targetModelId}.`);
    return;
  }

  const created = await registerCurrentArtifactAsModel(job.modelName);
  updateJob(job.id, {
    status: "success",
    endedAt: new Date().toISOString(),
    createdModelId: created.id,
  });
  appendJobLog(job.id, `Created model: ${created.id}.`);
};

export const startTrendTrainingJob = (input?: {
  modelName?: string;
  mode?: "new" | "retrain";
  targetModelId?: string;
}): TrendTrainingJob => {
  loadJobsFromDisk();
  const jobId = makeJobId();
  const modelName = input?.modelName?.trim() || `Trend Model ${new Date().toLocaleString()}`;
  const mode = input?.mode === "retrain" ? "retrain" : "new";

  const job: TrendTrainingJob = {
    id: jobId,
    modelName,
    mode,
    targetModelId: input?.targetModelId,
    status: "queued",
    logs: [],
    startedAt: new Date().toISOString(),
  };

  jobs.set(job.id, job);
  saveJobsToDisk();

  runTrainAndTest(job)
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Unexpected training failure.";
      updateJob(job.id, {
        status: "failed",
        error: message,
        endedAt: new Date().toISOString(),
      });
      appendJobLog(job.id, `Job failed: ${message}`);
    });

  return job;
};
