import * as tf from "@tensorflow/tfjs";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type HamMetadataRow = {
  lesion_id: string;
  image_id: string;
  dx: string;
  dx_type: string;
  age: string;
  sex: string;
  localization: string;
};

type Encoders = {
  sexValues: string[];
  localizationValues: string[];
  dxValues: string[];
};

type DatasetBuildResult = {
  xTrain: tf.Tensor2D;
  yTrain: tf.Tensor2D;
  xTest: tf.Tensor2D;
  yTest: tf.Tensor2D;
  inputSize: number;
  encoders: Encoders;
  trainCount: number;
  testCount: number;
};

export type HamTrainingSummary = {
  rows: number;
  trainCount: number;
  testCount: number;
  inputSize: number;
  classes: string[];
  localizations: string[];
  finalLoss: number;
  finalAccuracy: number;
  evalLoss: number;
  evalAccuracy: number;
};

const DATASET_RELATIVE_PATH = path.join("src", "modele", "HAM10000_metadata.csv");

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const readHamMetadata = async (): Promise<HamMetadataRow[]> => {
  const absolutePath = path.join(process.cwd(), DATASET_RELATIVE_PATH);
  const raw = await readFile(absolutePath, "utf-8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const header = parseCsvLine(lines[0]);
  const rows: HamMetadataRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const entry: Record<string, string> = {};

    for (let j = 0; j < header.length; j++) {
      entry[header[j]] = (cells[j] || "").trim();
    }

    rows.push({
      lesion_id: entry.lesion_id || "",
      image_id: entry.image_id || "",
      dx: (entry.dx || "").toLowerCase(),
      dx_type: (entry.dx_type || "").toLowerCase(),
      age: entry.age || "",
      sex: (entry.sex || "unknown").toLowerCase(),
      localization: (entry.localization || "unknown").toLowerCase(),
    });
  }

  return rows;
};

const safeAge = (value: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0.5;
  }
  return Math.min(1, Math.max(0, parsed / 100));
};

const buildEncoders = (rows: HamMetadataRow[]): Encoders => {
  const sexSet = new Set<string>();
  const localizationSet = new Set<string>();
  const dxSet = new Set<string>();

  for (const row of rows) {
    sexSet.add(row.sex || "unknown");
    localizationSet.add(row.localization || "unknown");
    dxSet.add(row.dx || "unknown");
  }

  return {
    sexValues: [...sexSet].sort(),
    localizationValues: [...localizationSet].sort(),
    dxValues: [...dxSet].sort(),
  };
};

const oneHot = (index: number, size: number): number[] => {
  const vector = new Array(size).fill(0);
  if (index >= 0 && index < size) {
    vector[index] = 1;
  }
  return vector;
};

const encodeRow = (row: HamMetadataRow, encoders: Encoders): number[] => {
  const sexIdx = encoders.sexValues.indexOf(row.sex || "unknown");
  const locIdx = encoders.localizationValues.indexOf(row.localization || "unknown");

  return [
    safeAge(row.age),
    ...oneHot(sexIdx, encoders.sexValues.length),
    ...oneHot(locIdx, encoders.localizationValues.length),
  ];
};

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildDataset = (rows: HamMetadataRow[]): DatasetBuildResult => {
  const validRows = rows.filter((row) => row.dx && row.dx !== "unknown");
  if (validRows.length < 16) {
    throw new Error("Dataset HAM10000 insuffisant pour entrainement (minimum 16 lignes).");
  }

  const encoders = buildEncoders(validRows);
  const dxCount = encoders.dxValues.length;
  if (dxCount < 2) {
    throw new Error("Dataset HAM10000 invalide: au moins 2 classes de diagnostic sont requises.");
  }

  const shuffled = shuffle(validRows);
  const splitIndex = Math.max(1, Math.floor(shuffled.length * 0.8));
  const trainRows = shuffled.slice(0, splitIndex);
  const testRows = shuffled.slice(splitIndex);

  const xTrain = trainRows.map((row) => encodeRow(row, encoders));
  const xTest = testRows.map((row) => encodeRow(row, encoders));

  const yTrain = trainRows.map((row) => {
    const dxIdx = encoders.dxValues.indexOf(row.dx);
    return oneHot(dxIdx, dxCount);
  });

  const yTest = testRows.map((row) => {
    const dxIdx = encoders.dxValues.indexOf(row.dx);
    return oneHot(dxIdx, dxCount);
  });

  const inputSize = xTrain[0].length;

  return {
    xTrain: tf.tensor2d(xTrain, [xTrain.length, inputSize], "float32"),
    yTrain: tf.tensor2d(yTrain, [yTrain.length, dxCount], "float32"),
    xTest: tf.tensor2d(xTest, [xTest.length, inputSize], "float32"),
    yTest: tf.tensor2d(yTest, [yTest.length, dxCount], "float32"),
    inputSize,
    encoders,
    trainCount: trainRows.length,
    testCount: testRows.length,
  };
};

const buildModel = (inputSize: number, classes: number): tf.Sequential => {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [inputSize], units: 48, activation: "relu" }),
      tf.layers.dropout({ rate: 0.15 }),
      tf.layers.dense({ units: 24, activation: "relu" }),
      tf.layers.dense({ units: classes, activation: "softmax" }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
};

const lastMetric = (history: number[] | undefined): number => {
  if (!history || history.length === 0) return 0;
  const value = history[history.length - 1];
  return Number.isFinite(value) ? value : 0;
};

export const trainHam10000MetadataModel = async (): Promise<HamTrainingSummary> => {
  const rows = await readHamMetadata();
  const dataset = buildDataset(rows);

  const model = buildModel(dataset.inputSize, dataset.encoders.dxValues.length);

  const history = await model.fit(dataset.xTrain, dataset.yTrain, {
    epochs: 45,
    batchSize: 64,
    validationSplit: 0.1,
    verbose: 0,
  });

  const evaluation = model.evaluate(dataset.xTest, dataset.yTest, {
    batchSize: 64,
    verbose: 0,
  });

  const evalTensors = Array.isArray(evaluation) ? evaluation : [evaluation];
  const evalLoss = Number((await evalTensors[0].data())[0] || 0);
  const evalAccuracy = Number((await evalTensors[1].data())[0] || 0);

  const summary: HamTrainingSummary = {
    rows: rows.length,
    trainCount: dataset.trainCount,
    testCount: dataset.testCount,
    inputSize: dataset.inputSize,
    classes: dataset.encoders.dxValues,
    localizations: dataset.encoders.localizationValues,
    finalLoss: lastMetric(history.history.loss as number[]),
    finalAccuracy: lastMetric(history.history.acc as number[]) || lastMetric(history.history.accuracy as number[]),
    evalLoss,
    evalAccuracy,
  };

  tf.dispose([dataset.xTrain, dataset.yTrain, dataset.xTest, dataset.yTest, ...evalTensors]);
  model.dispose();

  return summary;
};
