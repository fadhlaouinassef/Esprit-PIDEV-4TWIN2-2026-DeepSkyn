import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';
const DATASET_PATH = path.resolve(process.cwd(), 'src/modele/chatbot/Skin v2');
const SAVE_DIR = path.resolve(process.cwd(), 'src/modele/chatbot/image-model');
const IMAGE_SIZE = 64;
const BATCH_SIZE = 4;
const EPOCHS = 5;

const CATEGORY_MAP: Record<string, string> = {
  "acne": "acne",
  "blackheades": "blackheads",
  "dark spots": "dark_spots",
  "pores": "pores",
  "wrinkles": "wrinkles"
};

const CLASSES = Array.from(new Set(Object.values(CATEGORY_MAP)));
const CLASS_INDEX: Record<string, number> = {};
CLASSES.forEach((cls, idx) => { CLASS_INDEX[cls] = idx; });

async function loadAndProcessImage(imagePath: string): Promise<tf.Tensor3D | null> {
  try {
    const { Jimp } = await import('jimp');
    const image = await (Jimp as any).read(imagePath);
    image.resize({ w: IMAGE_SIZE, h: IMAGE_SIZE });
    const floatData = new Float32Array(IMAGE_SIZE * IMAGE_SIZE * 3);
    let i = 0;

    // Using Jimp scan for better compatibility across versions
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (this: any, x: number, y: number, idx: number) {
      floatData[i++] = (this.bitmap.data[idx + 0] / 127.5) - 1;
      floatData[i++] = (this.bitmap.data[idx + 1] / 127.5) - 1;
      floatData[i++] = (this.bitmap.data[idx + 2] / 127.5) - 1;
    });

    return tf.tensor3d(floatData, [IMAGE_SIZE, IMAGE_SIZE, 3]);
  } catch (err: any) {
    console.error("Error loading image:", imagePath, err.message);
    return null;
  }
}

async function train() {
  console.log("[AI] STARTING COMPREHENSIVE TRAINING ON SKIN V2 DATASET");

  const xs: tf.Tensor[] = [];
  const ys: tf.Tensor[] = [];

  for (const [folder, category] of Object.entries(CATEGORY_MAP)) {
    const folderPath = path.join(DATASET_PATH, folder);
    if (!fs.existsSync(folderPath)) {
      console.warn(`[AI] Folder not found: ${folderPath}`);
      continue;
    }

    const files = fs.readdirSync(folderPath).filter(f => f.match(/\.(jpg|jpeg|png)$/i)).slice(0, 100);
    console.log(`[AI] Lecture rapide : 100 images de ${folder}...`);
    
    for (const file of files) {
      const tensor = await loadAndProcessImage(path.join(folderPath, file));
      if (tensor) {
        xs.push(tensor);
        ys.push(tf.oneHot(CLASS_INDEX[category], CLASSES.length));
      }
    }
  }

  if (xs.length === 0) {
    console.log("[AI] No data found. Training aborted.");
    return;
  }

  // Simplified CNN for speed on CPU
  const model = tf.sequential();

  model.add(tf.layers.conv2d({
    inputShape: [IMAGE_SIZE, IMAGE_SIZE, 3],
    kernelSize: 3,
    filters: 16,
    activation: 'relu'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: CLASSES.length, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  console.log("[AI] Training deep model (FAST MODE)... this should only take 1-2 minutes.");

  const xStack = tf.stack(xs);
  const yStack = tf.stack(ys);

  await model.fit(xStack, yStack, {
    epochs: 10,
    batchSize: 16,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}/10: Loss = ${logs?.loss.toFixed(4)}, Acc = ${logs?.acc.toFixed(4)}`);
      }
    }
  });

  if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });

  await model.save(tf.io.withSaveHandler(async (artifacts) => {
    fs.writeFileSync(path.join(SAVE_DIR, 'model.json'), JSON.stringify({
      modelTopology: artifacts.modelTopology,
      weightsManifest: [{ paths: ['./model.weights.bin'], weights: artifacts.weightSpecs }]
    }));
    if (artifacts.weightData) fs.writeFileSync(path.join(SAVE_DIR, 'model.weights.bin'), Buffer.from(new Uint8Array(artifacts.weightData as ArrayBuffer)));
    return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
  }));

  fs.writeFileSync(path.join(SAVE_DIR, 'classes.json'), JSON.stringify({ classes: CLASSES, index: CLASS_INDEX }));
  console.log("[AI] DONE!");
}

train();
