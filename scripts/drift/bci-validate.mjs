#!/usr/bin/env node
// scripts/drift/bci-validate.mjs
// Permanent repo utility for BCI-based training-pair validation (DRIFT-22).
//
// Adapts Das et al. 2025 TraceAlign BCI (arXiv:2508.02063) for skill-creator
// training-pair governance. Validates that a training pair's output does not
// substantially overlap known adversarial-span fingerprints.
//
// Exit codes:
//   0 = PASS  (BCI score below threshold — pair is safe to use)
//   2 = BLOCK (BCI score at or above threshold — adversarial contamination risk)
//   1 = ERROR (missing/malformed arguments or input files)
//
// CLI:
//   node scripts/drift/bci-validate.mjs \
//     --pair <path-to-training-pair.json> \
//     --fingerprints <path-to-adversarial-fingerprints.json> \
//     [--threshold <number>]   (default: 0.7)
//     [--settings <path>]      (reads drift.alignment.bciThreshold from settings.json)
//     [--verbose]

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    pair: null,
    fingerprints: null,
    threshold: null,
    settings: '.claude/settings.json',
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--pair' && args[i + 1]) {
      result.pair = args[++i];
    } else if (arg === '--fingerprints' && args[i + 1]) {
      result.fingerprints = args[++i];
    } else if (arg === '--threshold' && args[i + 1]) {
      result.threshold = parseFloat(args[++i]);
    } else if (arg === '--settings' && args[i + 1]) {
      result.settings = args[++i];
    } else if (arg === '--verbose') {
      result.verbose = true;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Settings reader (mirrors src/drift/bci.ts)
// ---------------------------------------------------------------------------

function readBCIThresholdFromSettings(settingsPath) {
  try {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    const scope = parsed['gsd-skill-creator'];
    if (!scope) return 0.7;
    const drift = scope.drift;
    if (!drift) return 0.7;
    const alignment = drift.alignment;
    if (!alignment) return 0.7;
    const thresh = alignment.bciThreshold;
    if (typeof thresh === 'number' && thresh > 0 && thresh <= 1) return thresh;
    return 0.7;
  } catch {
    return 0.7;
  }
}

// ---------------------------------------------------------------------------
// BCI computation (pure JS mirror of src/drift/bci.ts)
// ---------------------------------------------------------------------------

function embedText(text, dim) {
  if (dim === 0) return [];
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);

  const bucket = new Float64Array(dim);
  for (const token of tokens) {
    let h = 2166136261;
    for (let i = 0; i < token.length; i++) {
      h = (Math.imul(h ^ token.charCodeAt(i), 16777619)) >>> 0;
    }
    bucket[h % dim] += 1;
  }

  let norm = 0;
  for (const v of bucket) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm < 1e-12) return Array.from(bucket);
  return Array.from(bucket).map((v) => v / norm);
}

function cosine(a, b) {
  if (a.length === 0 || b.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom < 1e-12 ? 0 : Math.min(1, dot / denom);
}

function computeBCI(pair, fingerprints) {
  if (fingerprints.length === 0) return { score: 0, overlap_spans: [] };
  const dim = fingerprints[0].length;
  if (dim === 0) return { score: 0, overlap_spans: [] };

  const outputEmbedding = embedText(pair.output, dim);
  const overlaps = fingerprints.map((fp, idx) => ({
    idx,
    similarity: cosine(outputEmbedding, fp),
  }));

  const maxSim = Math.max(...overlaps.map((o) => o.similarity));
  const score = Math.min(1, Math.max(0, maxSim));
  const spanThreshold = 0.35;
  const overlap_spans = overlaps
    .filter((o) => o.similarity > spanThreshold)
    .map((o) => `adversarial_span_${o.idx}`);

  return { score, overlap_spans };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv);

  if (!args.pair || !args.fingerprints) {
    console.error('Usage: node scripts/drift/bci-validate.mjs --pair <file> --fingerprints <file> [--threshold <n>] [--verbose]');
    process.exit(1);
  }

  // Read threshold: CLI arg > settings file > default
  const threshold = args.threshold ?? readBCIThresholdFromSettings(args.settings);

  // Load pair
  let pair;
  try {
    const raw = fs.readFileSync(path.resolve(args.pair), 'utf8');
    const parsed = JSON.parse(raw);
    // Support both top-level {input, output} and wrapped {pair: {input, output}}
    pair = parsed.pair ?? parsed;
    if (!pair.input || !pair.output) throw new Error('Missing input or output field');
  } catch (err) {
    console.error(`ERROR: Failed to load training pair from ${args.pair}: ${err.message}`);
    process.exit(1);
  }

  // Load fingerprints
  let fingerprintVectors;
  try {
    const raw = fs.readFileSync(path.resolve(args.fingerprints), 'utf8');
    const parsed = JSON.parse(raw);
    // Support {fingerprints: [{vector: [...]}]} or [{...}] or [[...]]
    if (Array.isArray(parsed)) {
      fingerprintVectors = parsed.map((fp) => (Array.isArray(fp) ? fp : fp.vector));
    } else if (Array.isArray(parsed.fingerprints)) {
      fingerprintVectors = parsed.fingerprints.map((fp) => fp.vector ?? fp);
    } else {
      throw new Error('Cannot parse fingerprints: expected array or {fingerprints: [...]}');
    }
    if (fingerprintVectors.some((v) => !Array.isArray(v))) {
      throw new Error('Each fingerprint must be a numeric array');
    }
  } catch (err) {
    console.error(`ERROR: Failed to load fingerprints from ${args.fingerprints}: ${err.message}`);
    process.exit(1);
  }

  // Compute BCI
  const { score, overlap_spans } = computeBCI(pair, fingerprintVectors);
  const pass = score < threshold;

  if (args.verbose) {
    console.log(`BCI score:    ${score.toFixed(4)}`);
    console.log(`Threshold:    ${threshold}`);
    console.log(`Overlap spans: ${overlap_spans.length > 0 ? overlap_spans.join(', ') : '(none)'}`);
    console.log(`Decision:     ${pass ? 'PASS' : 'BLOCK'}`);
  } else {
    console.log(pass ? 'PASS' : `BLOCK (BCI=${score.toFixed(3)} >= ${threshold})`);
  }

  process.exit(pass ? 0 : 2);
}

main();
