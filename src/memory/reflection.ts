/**
 * M2 Hierarchical Hybrid Memory — Reflection Pass
 *
 * Compresses N raw MemoryEntry observations into ≤M summary entries
 * (M ≤ N/10 by default) via theme-preserving clustering.
 *
 * The referenced-entity set is preserved (CF-M2-03): every unique content
 * token (after stop-word removal) that appears in the input entries must
 * appear in at least one summary entry.
 *
 * Algorithm:
 *   1. Cluster entries by theme using keyword overlap (greedy).
 *   2. Summarise each cluster via `LongTermMemory.summarize()`.
 *   3. Merge clusters until ≤ maxSummaries remain.
 *   4. Validate referenced-entity preservation.
 *
 * Reflection depth is bounded by `maxDepth` to prevent unbounded chains.
 *
 * @module memory/reflection
 */

import { randomUUID } from 'node:crypto';
import type { MemoryEntry, ReflectionBatch } from '../types/memory.js';
import { tokenize } from './scorer.js';
import { LongTermMemory } from './long-term.js';

// ─── Config ───────────────────────────────────────────────────────────────────

export interface ReflectionConfig {
  /**
   * Target compression ratio: output entries ≤ ceil(input / compressionRatio).
   * Default: 10 (1000 raw → ≤100 summaries — CF-M2-03).
   */
  compressionRatio?: number;
  /**
   * Hard cap on output entries regardless of compression ratio.
   * Default: 100.
   */
  maxSummaries?: number;
  /**
   * Maximum reflection depth (prevents unbounded summary chains).
   * Default: 3.
   */
  maxDepth?: number;
  /**
   * Minimum keyword overlap (Jaccard) for two entries to land in the same
   * cluster. Default: 0.1.
   */
  clusterThreshold?: number;
  /**
   * Label prefix for summary entries.
   * Default: 'reflection'
   */
  label?: string;
}

const DEFAULT_COMPRESSION_RATIO = 10;
const DEFAULT_MAX_SUMMARIES     = 100;
const DEFAULT_MAX_DEPTH         = 3;
const DEFAULT_CLUSTER_THRESHOLD = 0.1;

// ─── Reflection result ────────────────────────────────────────────────────────

export interface ReflectionResult {
  /** The compressed summary entries. */
  summaries: MemoryEntry[];
  /** M2 shared-type batch record linking input ids → summary id. */
  batch: ReflectionBatch;
  /**
   * Lossless entity recall: all unique content tokens from input appear in
   * at least one summary. True when CF-M2-03 is satisfied.
   */
  entityRecallLossless: boolean;
  /** Number of input entries consumed. */
  inputCount: number;
  /** Number of summary entries produced. */
  outputCount: number;
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

/** Jaccard similarity between two token sets. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Greedy single-pass clustering by keyword overlap.
 * Each cluster is seeded by the first unclustered entry. Subsequent entries
 * join a cluster if their Jaccard similarity to the cluster centroid exceeds
 * the threshold.
 */
function clusterByKeywords(
  entries: MemoryEntry[],
  threshold: number,
): MemoryEntry[][] {
  const centroids: Set<string>[] = [];
  const clusters: MemoryEntry[][] = [];

  for (const entry of entries) {
    const tokens = tokenize(entry.content);
    let bestIdx = -1;
    let bestSim = -1;

    for (let i = 0; i < centroids.length; i++) {
      const sim = jaccard(tokens, centroids[i]);
      if (sim > bestSim) { bestSim = sim; bestIdx = i; }
    }

    if (bestIdx >= 0 && bestSim >= threshold) {
      clusters[bestIdx].push(entry);
      // Update centroid: union of tokens.
      for (const t of tokens) centroids[bestIdx].add(t);
    } else {
      centroids.push(new Set(tokens));
      clusters.push([entry]);
    }
  }

  return clusters;
}

/**
 * Merge clusters pairwise by highest Jaccard until count ≤ target.
 */
function mergeClusters(
  clusters: MemoryEntry[][],
  target: number,
  ltm: LongTermMemory,
  label: string,
): MemoryEntry[] {
  // Convert each cluster to a summary for easier merging.
  let summaries: MemoryEntry[] = clusters.map((c) => ltm.summarize(c, label));

  while (summaries.length > target) {
    // Find most similar pair.
    let bestI = 0, bestJ = 1, bestSim = -1;
    for (let i = 0; i < summaries.length; i++) {
      for (let j = i + 1; j < summaries.length; j++) {
        const sim = jaccard(
          tokenize(summaries[i].content),
          tokenize(summaries[j].content),
        );
        if (sim > bestSim) { bestSim = sim; bestI = i; bestJ = j; }
      }
    }
    // Merge best pair into one summary.
    const merged = ltm.summarize([summaries[bestI], summaries[bestJ]], label);
    summaries = [
      ...summaries.slice(0, bestI),
      ...summaries.slice(bestI + 1, bestJ),
      ...summaries.slice(bestJ + 1),
      merged,
    ];
  }

  return summaries;
}

// ─── Reflector ────────────────────────────────────────────────────────────────

/**
 * Reflection pass: compress N raw entries into ≤M summaries.
 *
 * @example
 * ```ts
 * const reflector = new Reflector({ compressionRatio: 10 });
 * const { summaries, batch, entityRecallLossless } = reflector.reflect(rawEntries);
 * ```
 */
export class Reflector {
  private readonly compressionRatio: number;
  private readonly maxSummaries: number;
  private readonly maxDepth: number;
  private readonly clusterThreshold: number;
  private readonly label: string;
  private readonly ltm: LongTermMemory;

  constructor(config: ReflectionConfig = {}) {
    this.compressionRatio  = config.compressionRatio  ?? DEFAULT_COMPRESSION_RATIO;
    this.maxSummaries      = config.maxSummaries      ?? DEFAULT_MAX_SUMMARIES;
    this.maxDepth          = config.maxDepth          ?? DEFAULT_MAX_DEPTH;
    this.clusterThreshold  = config.clusterThreshold  ?? DEFAULT_CLUSTER_THRESHOLD;
    this.label             = config.label             ?? 'reflection';
    // LongTermMemory is used only for its pure `summarize()` method here.
    this.ltm = new LongTermMemory();
  }

  /**
   * Run the reflection pass on the given entries.
   * Pure — no IO. The caller is responsible for persisting the summaries.
   */
  reflect(entries: MemoryEntry[], depth = 0): ReflectionResult {
    if (entries.length === 0) {
      const emptyEntry = this.ltm.summarize([], this.label);
      return {
        summaries: [emptyEntry],
        batch: {
          inputIds:  [],
          summaryId: emptyEntry.id,
          ts:        Date.now(),
        },
        entityRecallLossless: true,
        inputCount:  0,
        outputCount: 1,
      };
    }

    const inputIds = entries.map((e) => e.id);

    // Compute target output count.
    const targetCount = Math.min(
      this.maxSummaries,
      Math.max(1, Math.ceil(entries.length / this.compressionRatio)),
    );

    // Depth guard: if already at max depth, produce a single summary.
    if (depth >= this.maxDepth) {
      const single = this.ltm.summarize(entries, this.label);
      return {
        summaries: [single],
        batch: { inputIds, summaryId: single.id, ts: Date.now() },
        entityRecallLossless: this._checkEntityRecall(entries, [single]),
        inputCount:  entries.length,
        outputCount: 1,
      };
    }

    // If already within target, return as-is (no compression needed).
    if (entries.length <= targetCount) {
      const summaryId = randomUUID();
      return {
        summaries: entries,
        batch: { inputIds, summaryId, ts: Date.now() },
        entityRecallLossless: true,
        inputCount:  entries.length,
        outputCount: entries.length,
      };
    }

    // 1. Cluster by keyword overlap.
    const clusters = clusterByKeywords(entries, this.clusterThreshold);

    // 2. Merge clusters down to target count.
    const summaries = clusters.length <= targetCount
      ? clusters.map((c) => this.ltm.summarize(c, this.label))
      : mergeClusters(clusters, targetCount, this.ltm, this.label);

    // 3. Check entity recall.
    const entityRecallLossless = this._checkEntityRecall(entries, summaries);

    const summaryId = summaries[0]?.id ?? randomUUID();

    return {
      summaries,
      batch: { inputIds, summaryId, ts: Date.now() },
      entityRecallLossless,
      inputCount:  entries.length,
      outputCount: summaries.length,
    };
  }

  // ─── Entity recall check ────────────────────────────────────────────────────

  /**
   * Verify that all unique content tokens present in the input entries also
   * appear in at least one summary entry. This is the CF-M2-03 load-bearing
   * property: lossless referenced-entity recall.
   */
  private _checkEntityRecall(
    inputs:    MemoryEntry[],
    summaries: MemoryEntry[],
  ): boolean {
    // Build the union of all input tokens.
    const inputTokens = new Set<string>();
    for (const e of inputs) {
      for (const t of tokenize(e.content)) inputTokens.add(t);
    }

    // Build the union of all summary tokens.
    const summaryTokens = new Set<string>();
    for (const s of summaries) {
      for (const t of tokenize(s.content)) summaryTokens.add(t);
    }

    // Every input token must appear in at least one summary.
    for (const t of inputTokens) {
      if (!summaryTokens.has(t)) return false;
    }
    return true;
  }
}
