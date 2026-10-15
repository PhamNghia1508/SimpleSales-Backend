// On-device embedding model. Everything is served from this repo:
// the Transformers.js bundle + ONNX Runtime WebAssembly in /vendor and the
// quantised all-MiniLM-L6-v2 weights in /models. No network calls leave the site.
import { pipeline, env } from '../vendor/transformers.min.js';

const base = new URL('../', import.meta.url);
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = new URL('models/', base).href;
env.backends.onnx.wasm.wasmPaths = new URL('vendor/', base).href;
env.backends.onnx.wasm.numThreads = 1; // GitHub Pages has no cross-origin isolation

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
let extractorPromise = null;

/** Loads the model once. onProgress(percent 0-100). */
export function loadModel(onProgress = () => {}) {
  if (!extractorPromise) {
    const seen = new Map();
    extractorPromise = pipeline('feature-extraction', MODEL_ID, {
      dtype: 'q8',
      device: 'wasm',
      progress_callback: (p) => {
        if (p.status === 'progress' && p.total) {
          seen.set(p.file, [p.loaded, p.total]);
          let l = 0, t = 0;
          for (const [a, b] of seen.values()) { l += a; t += b; }
          onProgress(Math.round((l / t) * 100));
        }
      },
    }).catch((err) => {
      extractorPromise = null;
      throw err;
    });
  }
  return extractorPromise;
}

/** texts -> array of L2-normalised 384-d vectors */
export async function embed(texts, batchSize = 16) {
  const extractor = await loadModel();
  const out = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const t = await extractor(batch, { pooling: 'mean', normalize: true });
    out.push(...t.tolist());
  }
  return out;
}
