import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';
const Jimp = require('jimp');

const DATASET_PATH = path.resolve(process.cwd(), 'src/modele');
const SAVE_DIR = path.resolve(process.cwd(), 'src/modele/chatbot/image-model');
const IMAGE_SIZE = 64;
const BATCH_SIZE = 4;
const EPOCHS = 1;

const CATEGORY_MAP: Record<string, string> = {
  "Acne and Rosacea Photos": "acne_rosacea",
  "Seborrheic Keratoses and other Benign Tumors": "aging_wrinkles",
  "Eczema Photos": "eczema_dermatitis"
};

const CLASSES = Array.from(new Set(Object.values(CATEGORY_MAP)));
const CLASS_INDEX: Record<string, number> = {};
CLASSES.forEach((cls, idx) => { CLASS_INDEX[cls] = idx; });

async function loadAndProcessImage(imagePath: string): Promise<tf.Tensor3D | null> {
  try {
    const { Jimp: JimpClass } = await import('jimp');
    const image = await JimpClass.read(imagePath);
    image.resize({ w: IMAGE_SIZE, h: IMAGE_SIZE });
    const floatData = new Float32Array(IMAGE_SIZE * IMAGE_SIZE * 3);
    let i = 0;
    const pixels = image.bitmap.data;
    for (let j = 0; j < pixels.length; j += 4) {
      floatData[i++] = (pixels[j] / 127.5) - 1;
      floatData[i++] = (pixels[j + 1] / 127.5) - 1;
      floatData[i++] = (pixels[j + 2] / 127.5) - 1;
    }
    return tf.tensor3d(floatData, [IMAGE_SIZE, IMAGE_SIZE, 3]);
  } catch (err) {
    console.error("Error loading image:", imagePath, err.message);
    return null;
  }
}

async function train() {
  console.log("[AI] STARTING SUPER FAST TRAINING (TINY DATASET)");
  
  const xs: tf.Tensor[] = [];
  const ys: tf.Tensor[] = [];

  for (const [folder, category] of Object.entries(CATEGORY_MAP)) {
    const folderPath = path.join(DATASET_PATH, folder);
    if (!fs.existsSync(folderPath)) continue;
    
    const files = fs.readdirSync(folderPath).filter(f => f.match(/\.(jpg|jpeg)$/i)).slice(0, 5);
    console.log(`[AI] Reading ${folder}...`);
    
    for (const file of files) {
      const tensor = await loadAndProcessImage(path.join(folderPath, file));
      if (tensor) {
        xs.push(tensor);
        ys.push(tf.oneHot(CLASS_INDEX[category], CLASSES.length));
      }
    }
  }

  if (xs.length === 0) {
    console.log("[AI] No data found.");
    return;
  }

  const model = tf.sequential();
  model.add(tf.layers.flatten({ inputShape: [IMAGE_SIZE, IMAGE_SIZE, 3] }));
  model.add(tf.layers.dense({ units: CLASSES.length, activation: 'softmax' }));
  model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });

  console.log("[AI] Training...");
  await model.fit(tf.stack(xs), tf.stack(ys), { epochs: EPOCHS });

  if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });

  await model.save(tf.io.withSaveHandler(async (artifacts) => {
    fs.writeFileSync(path.join(SAVE_DIR, 'model.json'), JSON.stringify({
      modelTopology: artifacts.modelTopology,
      weightsManifest: [{ paths: ['./model.weights.bin'], weights: artifacts.weightSpecs }]
    }));
    if (artifacts.weightData) fs.writeFileSync(path.join(SAVE_DIR, 'model.weights.bin'), Buffer.from(artifacts.weightData));
    return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
  }));

  fs.writeFileSync(path.join(SAVE_DIR, 'classes.json'), JSON.stringify({ classes: CLASSES, index: CLASS_INDEX }));
  console.log("[AI] DONE!");
}

train();
