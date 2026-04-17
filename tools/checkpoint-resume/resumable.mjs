// Minimal checkpoint-resume library.
// Companion to the `checkpoint-resume-long-job` skill.
//
// Usage:
//   import { processBatches } from './tools/checkpoint-resume/resumable.mjs';
//
//   await processBatches({
//     items,
//     keyFn: x => x.id,
//     checkpointFile: '.planning/sessions/my-job.jsonl',
//     batchSize: 5,
//     async handler(batch) { ... return results; },
//     onProgress({ completed, total, skipped }) { ... },
//   });
//
// The checkpoint file is append-only JSONL — each line is `{key, t}`.
// On resume, already-processed keys are skipped.

import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function loadCheckpoint(checkpointFile) {
  if (!existsSync(checkpointFile)) return new Set();
  const done = new Set();
  const text = readFileSync(checkpointFile, 'utf8');
  for (const line of text.split('\n')) {
    if (!line) continue;
    try {
      const e = JSON.parse(line);
      if (e.key !== undefined) done.add(String(e.key));
    } catch { /* skip malformed lines */ }
  }
  return done;
}

export function recordCompletion(checkpointFile, key, extra = {}) {
  mkdirSync(dirname(checkpointFile), { recursive: true });
  const line = JSON.stringify({ key: String(key), t: new Date().toISOString(), ...extra });
  appendFileSync(checkpointFile, line + '\n');
}

export async function processBatches({
  items,
  keyFn,
  checkpointFile,
  batchSize = 10,
  handler,
  onProgress,
  onBatchError,
}) {
  if (!items || !keyFn || !checkpointFile || !handler) {
    throw new Error('processBatches requires items, keyFn, checkpointFile, handler');
  }

  const done = loadCheckpoint(checkpointFile);
  const total = items.length;
  const pending = items.filter(i => !done.has(String(keyFn(i))));
  const skipped = total - pending.length;

  if (skipped > 0) {
    console.error(`[resumable] resuming: ${skipped} of ${total} already completed; ${pending.length} pending`);
  }

  let completed = 0;
  let errors = 0;

  for (let i = 0; i < pending.length; i += batchSize) {
    const batch = pending.slice(i, i + batchSize);
    try {
      const results = await handler(batch);
      for (const item of batch) {
        const key = keyFn(item);
        const result = results?.find(r => String(r.id ?? r.key) === String(key));
        recordCompletion(checkpointFile, key, result ? { result: summarize(result) } : {});
        completed++;
      }
    } catch (e) {
      errors++;
      if (onBatchError) onBatchError(e, batch);
      else console.error(`[resumable] batch starting at ${i} failed: ${e.message}`);
    }
    if (onProgress) onProgress({ completed, skipped, total, errors });
  }

  return { completed, skipped, errors, total };
}

// Serialize a result compactly for the checkpoint line (skip long bodies).
function summarize(result) {
  if (typeof result !== 'object' || result === null) return result;
  const out = {};
  for (const [k, v] of Object.entries(result)) {
    if (typeof v === 'string' && v.length > 200) out[k] = v.slice(0, 200) + '…';
    else out[k] = v;
  }
  return out;
}

/**
 * Reset a checkpoint — use when a job's logic has changed and prior results
 * should not be trusted.
 */
export function resetCheckpoint(checkpointFile) {
  if (existsSync(checkpointFile)) {
    const bak = checkpointFile + '.bak.' + Date.now();
    import('node:fs').then(({ renameSync }) => renameSync(checkpointFile, bak));
    console.error(`[resumable] archived previous checkpoint to ${bak}`);
  }
}
