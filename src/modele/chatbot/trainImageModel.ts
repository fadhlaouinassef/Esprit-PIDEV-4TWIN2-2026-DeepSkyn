import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';

const DATASET_PATH = path.resolve(process.cwd(), 'src/modele/chatbot/image-model/Skin v2');
const SAVE_DIR = path.resolve(process.cwd(), 'src/modele/chatbot/image-model');
const IMAGE_SIZE = 32;
const BATCH_SIZE = 32;
const EPOCHS = 20;
const MAX_IMAGES_PER_CLASS = 100;

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
    const pixels = image.bitmap.data as Buffer;
    const floatData = new Float32Array(IMAGE_SIZE * IMAGE_SIZE * 3);
    let i = 0;
    for (let p = 0; p < pixels.length; p += 4) {
      floatData[i++] = (pixels[p]     / 127.5) - 1;
      floatData[i++] = (pixels[p + 1] / 127.5) - 1;
      floatData[i++] = (pixels[p + 2] / 127.5) - 1;
    }
    return tf.tensor3d(floatData, [IMAGE_SIZE, IMAGE_SIZE, 3]);
  } catch (err: any) {
    console.error("Error:", imagePath, err.message);
    return null;
  }
}

function buildModel(): tf.Sequential {
  const model = tf.sequential();

  // separableConv2d = depthwise + pointwise: ~8x faster than conv2d on CPU
  model.add(tf.layers.separableConv2d({
    inputShape: [IMAGE_SIZE, IMAGE_SIZE, 3],
    filters: 32, kernelSize: 3, padding: 'same', activation: 'relu'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 })); // 16x16

  model.add(tf.layers.separableConv2d({
    filters: 64, kernelSize: 3, padding: 'same', activation: 'relu'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 })); // 8x8

  model.add(tf.layers.separableConv2d({
    filters: 128, kernelSize: 3, padding: 'same', activation: 'relu'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 })); // 4x4

  model.add(tf.layers.globalAveragePooling2d({}));
  model.add(tf.layers.dropout({ rate: 0.4 }));
  model.add(tf.layers.dense({ units: CLASSES.length, activation: 'softmax' }));

  return model;
}

async function train() {
  console.log("[AI] TRAINING START — separableConv2d fast mode, 32x32");

  if (!fs.existsSync(DATASET_PATH)) {
    console.error(`[AI] Dataset not found: ${DATASET_PATH}`);
    return;
  }

  const xs: tf.Tensor[] = [];
  const ys: tf.Tensor[] = [];

  for (const [folder, category] of Object.entries(CATEGORY_MAP)) {
    const folderPath = path.join(DATASET_PATH, folder);
    if (!fs.existsSync(folderPath)) { console.warn(`[AI] Not found: ${folderPath}`); continue; }

    const files = fs.readdirSync(folderPath)
      .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
      .slice(0, MAX_IMAGES_PER_CLASS);

    console.log(`[AI] "${folder}" → "${category}": ${files.length} images`);

    for (const file of files) {
      const tensor = await loadAndProcessImage(path.join(folderPath, file));
      if (!tensor) continue;
      const label = tf.oneHot(CLASS_INDEX[category], CLASSES.length);
      xs.push(tensor);
      ys.push(label);
      // horizontal flip
      xs.push(tf.tidy(() => tf.reverse(tensor, 1) as tf.Tensor3D));
      ys.push(label.clone());
    }
  }

  if (xs.length === 0) { console.error("[AI] No data. Aborted."); return; }

  console.log(`[AI] ${xs.length} samples total. Building model...`);

  const model = buildModel();
  model.summary();
  model.compile({ optimizer: tf.train.adam(0.001), loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

  const xStack = tf.stack(xs);
  const yStack = tf.stack(ys);

  console.log("[AI] Starting fit — first epoch may take 1-2 min...");

  await model.fit(xStack, yStack, {
    epochs: EPOCHS,
    batchSize: BATCH_SIZE,
    shuffle: true,
    validationSplit: 0.15,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        const acc  = ((logs?.acc     ?? 0) * 100).toFixed(1);
        const val  = ((logs?.val_acc ?? 0) * 100).toFixed(1);
        const loss = logs?.loss.toFixed(4);
        console.log(`Epoch ${epoch + 1}/${EPOCHS} — Loss: ${loss} | Acc: ${acc}% | Val: ${val}%`);
      }
    }
  });

  if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });

  await model.save(tf.io.withSaveHandler(async (artifacts) => {
    fs.writeFileSync(path.join(SAVE_DIR, 'model.json'), JSON.stringify({
      modelTopology: artifacts.modelTopology,
      weightsManifest: [{ paths: ['./model.weights.bin'], weights: artifacts.weightSpecs }]
    }));
    if (artifacts.weightData) {
      fs.writeFileSync(
        path.join(SAVE_DIR, 'model.weights.bin'),
        Buffer.from(new Uint8Array(artifacts.weightData as ArrayBuffer))
      );
    }
    return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
  }));

  fs.writeFileSync(path.join(SAVE_DIR, 'classes.json'), JSON.stringify({ classes: CLASSES, index: CLASS_INDEX }));
  tf.dispose([xStack, yStack, ...xs, ...ys]);

  console.log("[AI] TRAINING COMPLETE. Model saved.");
}

train();
