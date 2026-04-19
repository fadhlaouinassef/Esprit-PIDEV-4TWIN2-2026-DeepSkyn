"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
  type WheelEvent,
} from "react";
import {
  ChevronRight,
  RefreshCcw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Pencil,
  Rocket,
  FlaskConical,
  CircleHelp,
} from "lucide-react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import { useTranslations } from "next-intl";

type ModelSummary = {
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

type ModelItem = {
  id: string;
  name: string;
  artifactPath: string;
  reportPath?: string;
  createdAt: string;
  summary: ModelSummary | null;
};

type JobStatus = "queued" | "running" | "success" | "failed";

type TrainJob = {
  id: string;
  modelName: string;
  mode: "new" | "retrain";
  targetModelId?: string;
  status: JobStatus;
  logs: string[];
  startedAt: string;
  endedAt?: string;
  createdModelId?: string;
  error?: string;
};

type LegacyDatasetInfo = ModelSummary | null;

const fmt = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return value.toFixed(3);
};

const LabelWithTip = ({ label, tip }: { label: string; tip: string }) => (
  <span className="inline-flex items-center gap-1" title={tip}>
    <span className="underline decoration-dotted underline-offset-2 cursor-help">{label}</span>
    <CircleHelp className="size-3.5 text-gray-400 cursor-help" />
  </span>
);

export default function AdminModelsPage() {
  const t = useTranslations("adminModelsPage");
  const jobLogsRef = useRef<HTMLDivElement | null>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const [models, setModels] = useState<ModelItem[]>([]);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [currentDatasetSize, setCurrentDatasetSize] = useState<number | null>(null);
  const [legacyDataset, setLegacyDataset] = useState<LegacyDatasetInfo>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [currentJob, setCurrentJob] = useState<TrainJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    const response = await fetch("/api/admin/models", { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || t("errors.fetchModels"));
    }

    setModels(data.models || []);
    setActiveModelId(data.activeModelId || null);
    setCurrentDatasetSize(data.currentDatasetSize ?? null);
    setLegacyDataset(data.legacyDataset ?? null);

    setSelectedModelId((current) => {
      if (current) return current;
      const firstId = Array.isArray(data.models) && data.models.length > 0 ? data.models[0].id : null;
      return firstId;
    });
  }, [t]);

  const fetchJobs = useCallback(async () => {
    const response = await fetch("/api/admin/models/train", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || t("errors.fetchJobs"));
    }

    const jobs = (data.jobs || []) as TrainJob[];
    const inProgress = jobs.find((job) => job.status === "queued" || job.status === "running") || null;

    if (inProgress) {
      setCurrentJob(inProgress);
      return;
    }

    if (!currentJob && jobs.length > 0) {
      setCurrentJob(jobs[0]);
    }
  }, [currentJob, t]);

  const refreshAll = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await Promise.all([fetchModels(), fetchJobs()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("errors.refresh");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchModels, fetchJobs, t]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!currentJob?.id) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/models/jobs/${currentJob.id}`, { cache: "no-store" });
        if (response.status === 404) {
          setCurrentJob(null);
          setError(t("errors.jobMissing"));
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          setError(data?.error || t("errors.poll"));
          return;
        }

        const nextJob = data.job as TrainJob;
        setCurrentJob(nextJob);

        if (nextJob.status === "success" || nextJob.status === "failed") {
          await fetchModels();
        }
      } catch {
        setError(t("errors.poll"));
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [currentJob?.id, fetchModels, t]);

  useEffect(() => {
    setIsAutoScrollEnabled(true);
  }, [currentJob?.id]);

  useEffect(() => {
    if (!isAutoScrollEnabled) return;
    const el = jobLogsRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [currentJob?.logs, isAutoScrollEnabled]);

  const selectedModel = useMemo(() => {
    if (!selectedModelId) return null;
    return models.find((model) => model.id === selectedModelId) || null;
  }, [models, selectedModelId]);

  const activeModel = useMemo(() => {
    if (!activeModelId) return null;
    return models.find((model) => model.id === activeModelId) || null;
  }, [models, activeModelId]);

  const deltaVsActive = useMemo(() => {
    if (!selectedModel || !activeModel || selectedModel.id === activeModel.id) {
      return null;
    }

    const selectedMae = selectedModel.summary?.strictTestMae;
    const activeMae = activeModel.summary?.strictTestMae;
    if (selectedMae === undefined || activeMae === undefined) {
      return null;
    }

    const delta = selectedMae - activeMae;
    return {
      maeDelta: delta,
      better: delta < 0,
    };
  }, [selectedModel, activeModel]);

  const selectedDatasetIsTiny = useMemo(() => {
    const trainSeries = selectedModel?.summary?.trainSeries ?? 0;
    return Number(trainSeries) > 0 && Number(trainSeries) <= 3;
  }, [selectedModel]);

  const formatShape = (summary?: ModelSummary | null): string => {
    if (!summary) return "-";
    const rows = summary.trainSeries ?? "-";
    const cols = summary.inputCols ?? "-";
    return `${rows} x ${cols}`;
  };

  const formatMlShape = (summary?: ModelSummary | null): string => {
    if (!summary) return "-";
    const users = summary.users ?? "-";
    const rows = summary.trainSeries ?? "-";
    const cols = summary.inputCols ?? "-";
    return `${users} x ${rows} x ${cols}`;
  };

  const startNewTraining = async () => {
    const modelName = window.prompt(t("prompts.newModelName"), `Trend Model ${new Date().toLocaleString()}`) || "";
    if (!modelName.trim()) return;

    setActionBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/models/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || t("errors.startTraining"));
      }

      setCurrentJob({
        id: data.jobId,
        modelName,
        mode: "new",
        status: "queued",
        logs: [],
        startedAt: new Date().toISOString(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("errors.startTraining");
      setError(msg);
    } finally {
      setActionBusy(false);
    }
  };

  const retrainSelected = async () => {
    if (!selectedModel) return;

    setActionBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/models/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "retrain",
          targetModelId: selectedModel.id,
          modelName: selectedModel.name,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || t("errors.startRetrain"));
      }

      setCurrentJob({
        id: data.jobId,
        modelName: selectedModel.name,
        mode: "retrain",
        targetModelId: selectedModel.id,
        status: "queued",
        logs: [],
        startedAt: new Date().toISOString(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("errors.startRetrain");
      setError(msg);
    } finally {
      setActionBusy(false);
    }
  };

  const activateModel = async (id: string) => {
    setActionBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/models/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || t("errors.activate"));
      }

      setActiveModelId(id);
      await fetchModels();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("errors.activate");
      setError(msg);
    } finally {
      setActionBusy(false);
    }
  };

  const renameModel = async (model: ModelItem) => {
    const name = window.prompt(t("prompts.renameModel"), model.name) || "";
    if (!name.trim()) return;

    setActionBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/models/${model.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || t("errors.rename"));
      }

      await fetchModels();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("errors.rename");
      setError(msg);
    } finally {
      setActionBusy(false);
    }
  };

  const deleteModel = async (model: ModelItem) => {
    const sure = window.confirm(t("confirm.deleteModel", { name: model.name }));
    if (!sure) return;

    setActionBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/models/${model.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || t("errors.delete"));
      }

      if (selectedModelId === model.id) {
        setSelectedModelId(null);
      }

      await fetchModels();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("errors.delete");
      setError(msg);
    } finally {
      setActionBusy(false);
    }
  };

  const handleJobLogsWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const deltaY = event.deltaY;
    const canScrollUp = el.scrollTop > 0;
    const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight;

    if ((deltaY < 0 && canScrollUp) || (deltaY > 0 && canScrollDown)) {
      el.scrollTop += deltaY;
    }
  }, []);

  const handleJobLogsScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    const isNearBottom = distanceToBottom <= 8;
    setIsAutoScrollEnabled(isNearBottom);
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <span>{t("breadcrumb.admin")}</span>
          <ChevronRight size={14} />
          <span className="text-gray-700 dark:text-gray-200 font-medium">{t("breadcrumb.manageModels")}</span>
        </nav>

        <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t("header.title")}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{t("header.subtitle")}</p>
            </div>
            <div className="flex flex-wrap items-stretch gap-2 md:justify-end">
              <button
                onClick={refreshAll}
                disabled={loading || actionBusy}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-bold"
              >
                <RefreshCcw className="size-4" />
                {t("buttons.refresh")}
              </button>
              <button
                onClick={startNewTraining}
                disabled={actionBusy}
                className="inline-flex min-w-[220px] justify-center items-center gap-2 rounded-xl bg-[#156d95] hover:bg-[#0f5777] text-white px-4 py-2 text-sm font-bold"
              >
                <Play className="size-4" />
                {t("buttons.trainNewModel")}
              </button>
              <button
                onClick={retrainSelected}
                disabled={actionBusy || !selectedModel}
                className="inline-flex min-w-[220px] justify-center items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                <FlaskConical className="size-4" />
                {t("buttons.retrainSelected")}
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">{t("cards.selectedDataset")}</p>
              <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">{t("cards.datasetSize")}: {selectedModel?.summary?.trainSeries ?? "-"}</p>
              <p className="mt-1 text-xs text-gray-500"><LabelWithTip label={t("cards.shape")} tip={t("tips.shape")} />: {formatShape(selectedModel?.summary)}</p>
              <p className="mt-1 text-xs text-gray-500"><LabelWithTip label={t("cards.shapeMl")} tip={t("tips.shapeMl")} />: {formatMlShape(selectedModel?.summary)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">{t("cards.activeDataset")}</p>
              <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">{t("cards.datasetSize")}: {activeModel?.summary?.trainSeries ?? "-"}</p>
              <p className="mt-1 text-xs text-gray-500"><LabelWithTip label={t("cards.shape")} tip={t("tips.shape")} />: {formatShape(activeModel?.summary)}</p>
              <p className="mt-1 text-xs text-gray-500"><LabelWithTip label={t("cards.shapeMl")} tip={t("tips.shapeMl")} />: {formatMlShape(activeModel?.summary)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">{t("cards.legacyDataset")}</p>
              <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">{t("cards.datasetSize")}: {currentDatasetSize ?? "-"}</p>
              <p className="mt-1 text-xs text-gray-500"><LabelWithTip label={t("cards.shape")} tip={t("tips.shape")} />: {formatShape(legacyDataset)}</p>
              <p className="mt-1 text-xs text-gray-500"><LabelWithTip label={t("cards.shapeMl")} tip={t("tips.shapeMl")} />: {formatMlShape(legacyDataset)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">{t("cards.modelsCount")}</p>
              <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">{models.length}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 md:p-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-3 pr-2">{t("table.name")}</th>
                  <th className="pb-3 pr-2">{t("table.created")}</th>
                  <th className="pb-3 pr-2"><LabelWithTip label={t("table.datasetSize")} tip={t("tips.datasetSize")} /></th>
                  <th className="pb-3 pr-2"><LabelWithTip label={t("table.strictTestMae")} tip={t("tips.strictTestMae")} /></th>
                  <th className="pb-3 pr-2"><LabelWithTip label={t("table.temporalCvMae")} tip={t("tips.temporalCvMae")} /></th>
                  <th className="pb-3 pr-2">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {!loading && models.length === 0 && (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={6}>{t("table.noModels")}</td>
                  </tr>
                )}

                {models.map((model) => {
                  const isActive = model.id === activeModelId;
                  const isSelected = model.id === selectedModelId;

                  return (
                    <tr
                      key={model.id}
                      aria-selected={isSelected}
                      onClick={() => setSelectedModelId(model.id)}
                      className={`border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${isSelected ? "bg-cyan-50 dark:bg-cyan-900/30 border-l-4 border-l-cyan-500" : "hover:bg-gray-50 dark:hover:bg-gray-700/40"}`}
                    >
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{model.name}</span>
                          {isActive && <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">ACTIVE</span>}
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-gray-500">{new Date(model.createdAt).toLocaleString()}</td>
                      <td className="py-3 pr-2 text-gray-700 dark:text-gray-300">{model.summary?.trainSeries ?? "-"}</td>
                      <td className="py-3 pr-2 text-gray-700 dark:text-gray-300">{fmt(model.summary?.strictTestMae)}</td>
                      <td className="py-3 pr-2 text-gray-700 dark:text-gray-300">{fmt(model.summary?.temporalCvMae)}</td>
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2">
                          <button
                            title={t("actions.activate")}
                            disabled={actionBusy || isActive}
                            onClick={(e) => {
                              e.stopPropagation();
                              activateModel(model.id);
                            }}
                            className="rounded-lg border border-gray-200 dark:border-gray-700 p-1.5 disabled:opacity-40"
                          >
                            <Rocket className="size-4" />
                          </button>
                          <button
                            title={t("actions.rename")}
                            disabled={actionBusy}
                            onClick={(e) => {
                              e.stopPropagation();
                              renameModel(model);
                            }}
                            className="rounded-lg border border-gray-200 dark:border-gray-700 p-1.5 disabled:opacity-40"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            title={t("actions.delete")}
                            disabled={actionBusy || isActive}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteModel(model);
                            }}
                            className="rounded-lg border border-red-200 dark:border-red-900/40 p-1.5 text-red-600 disabled:opacity-40"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <h3 className="font-black text-gray-900 dark:text-white">{t("comparison.title")}</h3>
              {!selectedModel && <p className="text-sm text-gray-500 mt-3">{t("comparison.selectPrompt")}</p>}

              {selectedModel && (
                <div className="space-y-3 mt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("comparison.selected")}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedModel.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500"><LabelWithTip label={t("comparison.strictTestMae")} tip={t("tips.strictTestMaeShort")} /></span>
                    <span className="font-semibold text-gray-900 dark:text-white">{fmt(selectedModel.summary?.strictTestMae)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500"><LabelWithTip label={t("comparison.temporalCvMae")} tip={t("tips.temporalCvMaeShort")} /></span>
                    <span className="font-semibold text-gray-900 dark:text-white">{fmt(selectedModel.summary?.temporalCvMae)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("comparison.datasetSize")}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedModel.summary?.trainSeries ?? "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500"><LabelWithTip label={t("comparison.datasetShape")} tip={t("tips.datasetShape")} /></span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatShape(selectedModel.summary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500"><LabelWithTip label={t("comparison.datasetShapeMl")} tip={t("tips.datasetShapeMl")} /></span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatMlShape(selectedModel.summary)}</span>
                  </div>

                  {selectedDatasetIsTiny && (
                    <div className="mt-3 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 px-3 py-2 text-xs">
                      {t("comparison.tinyDatasetWarning")}
                    </div>
                  )}

                  {deltaVsActive && (
                    <div className={`mt-3 rounded-xl px-3 py-2 ${deltaVsActive.better ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"}`}>
                      {t("comparison.deltaMaeVsActive")}: {deltaVsActive.maeDelta.toFixed(3)} ({deltaVsActive.better ? t("comparison.better") : t("comparison.worse")})
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <h3 className="font-black text-gray-900 dark:text-white">{t("jobLogs.title")}</h3>

              {!currentJob && (
                <p className="text-sm text-gray-500 mt-3">{t("jobLogs.noActive")}</p>
              )}

              {currentJob && (
                <>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-500">{t("jobLogs.status")}</span>
                    <span className="inline-flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                      {currentJob.status === "success" && <CheckCircle2 className="size-4 text-emerald-500" />}
                      {currentJob.status === "failed" && <AlertTriangle className="size-4 text-red-500" />}
                      {(currentJob.status === "queued" || currentJob.status === "running") && <RefreshCcw className="size-4 animate-spin text-sky-500" />}
                      {currentJob.status}
                    </span>
                  </div>

                  {(currentJob.status === "queued" || currentJob.status === "running") && (
                    <p className="mt-2 text-xs text-sky-600 dark:text-sky-300">{t("jobLogs.persistMessage")}</p>
                  )}

                  <div
                    ref={jobLogsRef}
                    onWheel={handleJobLogsWheel}
                    onScroll={handleJobLogsScroll}
                    className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 h-64 overflow-y-auto overscroll-contain font-mono text-xs"
                  >
                    {currentJob.logs.length === 0 ? (
                      <p className="text-gray-500">{t("jobLogs.waiting")}</p>
                    ) : (
                      currentJob.logs.map((line, idx) => (
                        <div key={idx} className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">{line}</div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
