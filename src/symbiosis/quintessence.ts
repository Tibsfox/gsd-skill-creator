/**
 * M8 Symbiosis — Quintessence 5-Axis Metric Suite
 *
 * Computes time-series snapshots across five axes derived from Lanzara &
 * Kuperstein's Quintessence frame (five features of living systems), adapted
 * as engineering-observable metrics for the developer–skill-creator relationship.
 *
 * All five axes are computed from pluggable source interfaces so that real
 * M1–M7 data can be wired in without changing the computation core. Mock
 * implementations are provided for this phase.
 *
 * Axis definitions:
 *   1. Self-vs-Non-Self     — fraction of project-unique M1 communities
 *   2. Essential Tensions   — override-ratio + 20%-bound-hit ratio
 *   3. Growth-and-Energy-Flow — rolling tokens-per-productive-outcome
 *   4. Stability-vs-Novelty — trunk-preserved / branch-committed ratio
 *   5. Fateful Encounters   — count of M3 decisions with high impact
 *
 * Sources: Lanzara & Kuperstein 1991 (Quintessence, five features of life);
 * Lanzara 2023 Chapter 7; component spec 08-m8-symbiosis.md §Quintessence.
 *
 * @module symbiosis/quintessence
 */

import type { QuintessenceSnapshot } from '../types/symbiosis.js';
import { recordQuintessenceUpdated } from '../reinforcement/channel-sources.js';

// ─── Pluggable source interfaces ────────────────────────────────────────────

/** Source for Axis 1 (Self-vs-Non-Self). */
export interface CommunitySource {
  /**
   * Returns the fraction [0, 1] of M1 community memberships that are unique
   * to this project (not borrowed from generic skill libraries).
   */
  selfFraction(): number;
}

/** Source for Axis 2 (Essential Tensions). */
export interface TensionSource {
  /** Ratio of user overrides to system suggestions [0, ∞). */
  overrideRatio(): number;
  /** Ratio of sessions that hit the 20%-refinement bound to free refinements [0, 1]. */
  boundHitRatio(): number;
}

/** Source for Axis 3 (Growth-and-Energy-Flow). */
export interface EnergySource {
  /**
   * Rolling average of tokens consumed per "productive" outcome label
   * (lower = more efficient). Returns a positive finite number.
   */
  tokensPerProductiveOutcome(): number;
}

/** Source for Axis 4 (Stability-vs-Novelty). */
export interface StabilitySource {
  /** Number of M4 sessions whose output was committed to trunk. */
  trunkPreservedCount(): number;
  /** Number of M4 sessions that committed to a branch (not trunk). */
  branchCommittedCount(): number;
}

/** Source for Axis 5 (Fateful Encounters). */
export interface FatefulSource {
  /**
   * Count of M3 decision-trace entries whose retrospective outcome-impact
   * (measured by M1 graph-change magnitude) exceeds `threshold`.
   */
  highImpactDecisionCount(threshold: number): number;
}

// ─── Mock implementations (Phase 641, Wave 1) ───────────────────────────────

export class MockCommunitySource implements CommunitySource {
  constructor(private readonly fraction: number = 0.6) {}
  selfFraction(): number { return this.fraction; }
}

export class MockTensionSource implements TensionSource {
  constructor(
    private readonly override: number = 0.15,
    private readonly bound: number = 0.08,
  ) {}
  overrideRatio(): number { return this.override; }
  boundHitRatio(): number { return this.bound; }
}

export class MockEnergySource implements EnergySource {
  constructor(private readonly tpp: number = 1200) {}
  tokensPerProductiveOutcome(): number { return this.tpp; }
}

export class MockStabilitySource implements StabilitySource {
  constructor(
    private readonly trunk: number = 18,
    private readonly branch: number = 7,
  ) {}
  trunkPreservedCount(): number { return this.trunk; }
  branchCommittedCount(): number { return this.branch; }
}

export class MockFatefulSource implements FatefulSource {
  constructor(private readonly count: number = 4) {}
  highImpactDecisionCount(_threshold: number): number { return this.count; }
}

// ─── Computation ─────────────────────────────────────────────────────────────

export interface QuintessenceSources {
  community: CommunitySource;
  tension: TensionSource;
  energy: EnergySource;
  stability: StabilitySource;
  fateful: FatefulSource;
}

/** Default impact threshold for Axis 5. */
export const DEFAULT_FATEFUL_THRESHOLD = 0.25;

/**
 * Compute a single Quintessence snapshot from the provided sources.
 *
 * Axis computations:
 *   1. selfVsNonSelf     = community.selfFraction()                       ∈ [0, 1]
 *   2. essentialTensions = overrideRatio + boundHitRatio                  ∈ [0, ∞)
 *   3. growthAndEnergyFlow = tokensPerProductiveOutcome (raw tokens value) ∈ (0, ∞)
 *   4. stabilityVsNovelty = trunk / (trunk + branch), or 1 if no sessions ∈ [0, 1]
 *   5. fatefulEncounters  = highImpactDecisionCount(threshold)             ∈ [0, ∞)
 */
export function computeQuintessenceSnapshot(
  sources: QuintessenceSources,
  opts: { threshold?: number; now?: number; emitReinforcement?: boolean; reinforcementLogPath?: string } = {},
): QuintessenceSnapshot {
  const threshold = opts.threshold ?? DEFAULT_FATEFUL_THRESHOLD;
  const now = opts.now ?? Date.now();

  const selfVsNonSelf = clamp01(sources.community.selfFraction());

  const overrideRatio = Math.max(0, sources.tension.overrideRatio());
  const boundHitRatio = clamp01(sources.tension.boundHitRatio());
  const essentialTensions = overrideRatio + boundHitRatio;

  const growthAndEnergyFlow = Math.max(0, sources.energy.tokensPerProductiveOutcome());

  const trunk = Math.max(0, sources.stability.trunkPreservedCount());
  const branch = Math.max(0, sources.stability.branchCommittedCount());
  const totalSessions = trunk + branch;
  const stabilityVsNovelty = totalSessions > 0 ? trunk / totalSessions : 1;

  const fatefulEncounters = Math.max(0, sources.fateful.highImpactDecisionCount(threshold));

  const snapshot: QuintessenceSnapshot = {
    ts: now,
    selfVsNonSelf,
    essentialTensions,
    growthAndEnergyFlow,
    stabilityVsNovelty,
    fatefulEncounters,
  };

  // MA-6: emit quintessence_updated reinforcement (axis recomputation).
  // Fire-and-forget; computeQuintessenceSnapshot must remain synchronous.
  if (opts.emitReinforcement !== false) {
    void recordQuintessenceUpdated(
      {
        actor: 'symbiosis:quintessence',
        metadata: {
          axes: {
            selfVsNonSelf,
            essentialTensions,
            growthAndEnergyFlow,
            stabilityVsNovelty,
            fatefulEncounters,
          },
        },
        ts: now,
      },
      { logPath: opts.reinforcementLogPath },
    );
  }

  return snapshot;
}

/**
 * Compute a time series of snapshots from a sequence of per-snapshot sources.
 * Each element in `sourceArray` corresponds to one point in the time series.
 */
export function computeQuintessenceTimeSeries(
  sourceArray: QuintessenceSources[],
  opts: { threshold?: number; baseTs?: number; stepMs?: number } = {},
): QuintessenceSnapshot[] {
  const baseTs = opts.baseTs ?? Date.now();
  const stepMs = opts.stepMs ?? 86_400_000; // 1 day default
  return sourceArray.map((sources, i) =>
    computeQuintessenceSnapshot(sources, {
      threshold: opts.threshold,
      now: baseTs + i * stepMs,
    }),
  );
}

// ─── CLI narrative report ───────────────────────────────────────────────────

/**
 * Produce a human-readable narrative report for a Quintessence snapshot.
 * Language is engineering-observational; no emotion, no personification.
 */
export function narrativeReport(snapshot: QuintessenceSnapshot): string {
  const date = new Date(snapshot.ts).toISOString().slice(0, 10);
  const lines: string[] = [
    `Quintessence Report — ${date}`,
    `${'─'.repeat(40)}`,
    `1. Self-vs-Non-Self:       ${(snapshot.selfVsNonSelf * 100).toFixed(1)}% project-unique communities`,
    `2. Essential Tensions:     ${snapshot.essentialTensions.toFixed(3)} (override + bound-hit ratio)`,
    `3. Growth-and-Energy-Flow: ${snapshot.growthAndEnergyFlow.toFixed(0)} tokens per productive outcome`,
    `4. Stability-vs-Novelty:   ${(snapshot.stabilityVsNovelty * 100).toFixed(1)}% trunk-preserved sessions`,
    `5. Fateful Encounters:     ${snapshot.fatefulEncounters} high-impact M3 decisions`,
  ];
  return lines.join('\n');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
