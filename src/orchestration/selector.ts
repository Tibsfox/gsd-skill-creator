/**
 * M5 — Activation Selector.
 *
 * Composes M1 graph queries (structural signal) with M2 αβγ scoring
 * (memory relevance) and, when the Sensoria flag is enabled, M6 net-shift
 * gating. Writes an M3 trace on every activation decision so the trace
 * ledger reflects the full composition chain.
 *
 * Flag-off guarantee: when Sensoria is disabled (the default), the selector
 * is byte-identical to a no-M6 pipeline — no net-shift computation runs and
 * no Sensoria-specific fields leak into scoring. This preserves the
 * SC-FLAG-OFF contract at the selector boundary.
 *
 * Fairness invariant: every candidate whose composite score is > 0 is
 * eligible for selection. Scores are never clamped to zero for candidates
 * that had non-zero ligand signal. Ties are broken deterministically by id.
 *
 * @module orchestration/selector
 */

import type { StepGraphNode } from '../types/memory.js';
import { MemoryScorer, type ScorerConfig } from '../memory/scorer.js';
import type { QueryEngine } from '../graph/query.js';
import {
  decideActivation,
  type HookDecision,
  type SensoriaHookOptions,
} from '../sensoria/applicator-hook.js';
import { ActivationWriter } from '../traces/activation-writer.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Candidate {
  /** Opaque skill id. */
  id: string;
  /** Human-readable skill name (may equal id). */
  name?: string;
  /** Short description; optionally scored against query keywords. */
  content: string;
  /** Entry timestamp in ms (for αβγ recency). Defaults to now. */
  ts?: number;
  /** Importance hint in [0, 1]. Defaults to 0. */
  importance?: number;
}

export interface SelectorDecision {
  /** Candidate id. */
  id: string;
  /** Composite score used for ranking. */
  score: number;
  /** Breakdown of signals that contributed. */
  signals: {
    /** αβγ score from M2 scorer (memory recency+relevance+importance). */
    m2Score: number;
    /** M1 graph-neighbor co-fire weight bump. */
    m1Boost: number;
    /** Prefix-cache / step-graph boost when the candidate matches a prediction. */
    stepBoost: number;
    /** M6 net-shift decision (null when flag off). */
    sensoria: HookDecision | null;
  };
  /** Whether the selector chose to activate this candidate. */
  activated: boolean;
}

export interface SelectorOptions {
  /** αβγ scorer config. */
  scorer?: ScorerConfig;
  /** Optional M1 query engine. If supplied, co-fire weights boost candidates. */
  query?: QueryEngine;
  /** Optional previously-active skill id for M1 co-fire lookup. */
  previousSkillId?: string;
  /** Prediction from the step-graph (boosts matching candidates). */
  prediction?: StepGraphNode;
  /** Weight applied to step-graph prediction boost. Default 0.25. */
  stepWeight?: number;
  /** Weight applied to M1 co-fire boost. Default 0.15. */
  coFireWeight?: number;
  /** Sensoria options; pass `enabled: true` to activate the M6 gate. */
  sensoria?: SensoriaHookOptions;
  /** Trace writer. Defaults to a fresh one rooted at DEFAULT_TRACE_PATH. */
  writer?: ActivationWriter;
  /** If true, writer.activation() is not awaited (fire-and-forget). */
  fireAndForgetTrace?: boolean;
  /** Actor label for traces. */
  actor?: string;
  /** Top-k cap on returned decisions. Default: all candidates. */
  topK?: number;
}

// ─── Selector ───────────────────────────────────────────────────────────────

/**
 * Select the skills to activate for a given query against a candidate pool.
 * Composition order:
 *   1. Compute M2 αβγ score per candidate.
 *   2. Add M1 co-fire boost if a `previousSkillId` is supplied.
 *   3. Add step-graph boost for candidates in `prediction.predictedNext`.
 *   4. If Sensoria flag on: gate each candidate via `decideActivation`.
 *      Otherwise: activate top-N by composite score (default topK=all).
 *   5. Write one activation trace per *decision* via M3 ActivationWriter.
 */
export class ActivationSelector {
  private readonly scorer: MemoryScorer;
  private readonly query: QueryEngine | undefined;
  private readonly previousSkillId: string | undefined;
  private readonly prediction: StepGraphNode | undefined;
  private readonly stepWeight: number;
  private readonly coFireWeight: number;
  private readonly sensoria: SensoriaHookOptions | undefined;
  private readonly writer: ActivationWriter;
  private readonly fireAndForgetTrace: boolean;
  private readonly actor: string;
  private readonly topK: number | undefined;

  constructor(opts: SelectorOptions = {}) {
    this.scorer = new MemoryScorer(opts.scorer);
    this.query = opts.query;
    this.previousSkillId = opts.previousSkillId;
    this.prediction = opts.prediction;
    this.stepWeight = opts.stepWeight ?? 0.25;
    this.coFireWeight = opts.coFireWeight ?? 0.15;
    this.sensoria = opts.sensoria;
    this.writer = opts.writer ?? new ActivationWriter();
    this.fireAndForgetTrace = opts.fireAndForgetTrace ?? false;
    this.actor = opts.actor ?? 'm5-selector';
    this.topK = opts.topK;
  }

  /**
   * Score + (optionally) gate the candidate pool and return the ranked
   * decisions. Writes one M3 trace per decision.
   */
  async select(
    query: string,
    candidates: Candidate[],
  ): Promise<SelectorDecision[]> {
    if (candidates.length === 0) return [];
    const now = Date.now();
    const predictedSet = new Set(this.prediction?.predictedNext ?? []);

    // Decide whether Sensoria gating is on (one flag-read per select call).
    const sensoriaEnabled = this._sensoriaEnabled();

    const decisions: SelectorDecision[] = [];

    for (const cand of candidates) {
      // --- 1) M2 αβγ score -------------------------------------------------
      const entry = {
        id: cand.id,
        content: cand.content,
        ts: cand.ts ?? now,
        alpha: 0,
        beta: 0,
        gamma: cand.importance ?? 0,
        score: 0,
      };
      const queryTokens = this._tokens(query);
      const components = this.scorer.scoreEntry(entry, queryTokens, now);
      const m2Score = components.score;

      // --- 2) M1 co-fire boost --------------------------------------------
      let m1Boost = 0;
      if (this.query && this.previousSkillId) {
        const { weight } = this.query.coFire(this.previousSkillId, cand.id);
        m1Boost = this.coFireWeight * this._squash(weight);
      }

      // --- 3) Step-graph boost --------------------------------------------
      const stepBoost = predictedSet.has(cand.id)
        ? this.stepWeight * (this.prediction?.confidence ?? 0)
        : 0;

      const composite = m2Score + m1Boost + stepBoost;

      // --- 4) Activation decision -----------------------------------------
      let sensoriaDecision: HookDecision | null = null;
      let activated: boolean;
      if (sensoriaEnabled) {
        sensoriaDecision = decideActivation(cand.name ?? cand.id, composite, this.sensoria);
        activated =
          sensoriaDecision.via === 'netshift'
            ? sensoriaDecision.shouldActivate
            : composite > 0; // m5-fallback preserves αβγ path
      } else {
        activated = composite > 0;
      }

      decisions.push({
        id: cand.id,
        score: composite,
        signals: {
          m2Score,
          m1Boost,
          stepBoost,
          sensoria: sensoriaDecision,
        },
        activated,
      });
    }

    // Rank: desc by composite, stable id-tiebreak for determinism.
    decisions.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

    const sliced = this.topK !== undefined ? decisions.slice(0, this.topK) : decisions;

    // --- 5) M3 trace write per decision ---------------------------------
    await this._writeTraces(query, sliced);

    return sliced;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async _writeTraces(
    query: string,
    decisions: SelectorDecision[],
  ): Promise<void> {
    const writes: Promise<unknown>[] = [];
    for (const d of decisions) {
      const p = this.writer.activation({
        actor: this.actor,
        intent: `select for query: ${query}`,
        reasoning:
          `composite=${d.score.toFixed(4)} ` +
          `(m2=${d.signals.m2Score.toFixed(3)} ` +
          `m1=${d.signals.m1Boost.toFixed(3)} ` +
          `step=${d.signals.stepBoost.toFixed(3)})`,
        constraints: [`activated:${d.activated}`],
        alternatives: [],
        outcome: d.activated ? 'selected' : 'skipped',
        entityIds: [d.id],
      });
      writes.push(p);
    }
    if (!this.fireAndForgetTrace) {
      try {
        await Promise.all(writes);
      } catch {
        // Trace failures do not block selection.
      }
    } else {
      // fire-and-forget: swallow rejections.
      for (const p of writes) {
        p.catch(() => {
          /* ignore */
        });
      }
    }
  }

  private _sensoriaEnabled(): boolean {
    if (!this.sensoria) return false;
    if (typeof this.sensoria.enabled === 'boolean') return this.sensoria.enabled;
    return false; // no explicit enable → treat as off (byte-identical path)
  }

  private _tokens(q: string): Set<string> {
    // Lightweight tokeniser matching the scorer's conventions; the scorer
    // re-tokenises internally on content, so we just precompute query tokens.
    const words = q.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/);
    const out = new Set<string>();
    for (const w of words) if (w.length > 1) out.add(w);
    return out;
  }

  /** Squash unbounded edge weights into [0,1]. */
  private _squash(weight: number): number {
    if (weight <= 0) return 0;
    return 1 - 1 / (1 + weight);
  }
}

// ─── Convenience function ───────────────────────────────────────────────────

/**
 * Functional wrapper for one-shot selection without constructing a class
 * instance. Equivalent to `new ActivationSelector(opts).select(query, cands)`.
 */
export async function select(
  query: string,
  candidates: Candidate[],
  opts: SelectorOptions = {},
): Promise<SelectorDecision[]> {
  const sel = new ActivationSelector(opts);
  return sel.select(query, candidates);
}
