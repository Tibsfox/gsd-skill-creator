/**
 * M8 Quintessence — concrete source implementations over M1–M7 data.
 *
 * Wave 2 integration: replace the mock `QuintessenceSources` with real
 * pipe adapters that read from the shipped modules:
 *
 *   Axis 1 Self-vs-Non-Self        ← M1 communities (project-unique ratio)
 *   Axis 2 Essential Tensions       ← M4 branch outcomes + user-overrides
 *   Axis 3 Growth-and-Energy-Flow   ← M2 reflection-derived tokens-per-outcome
 *   Axis 4 Stability-vs-Novelty     ← M4 trunk-vs-branch commit ratio
 *   Axis 5 Fateful Encounters       ← M3 high-impact decision count
 *
 * Each source accepts a narrow dependency injected at construction so we can
 * unit-test without a full Grove stack.
 *
 * @module symbiosis/quintessence-sources
 */

import type { Community, DecisionTrace, MemoryEntry } from '../types/memory.js';
import type { BranchManifest } from '../branches/manifest.js';
import type {
  CommunitySource,
  EnergySource,
  FatefulSource,
  StabilitySource,
  TensionSource,
} from './quintessence.js';

// ─── Axis 1 — M1 communities ─────────────────────────────────────────────────

/**
 * Self-vs-Non-Self is the fraction of community memberships whose members
 * are unique to this project vs. memberships that come from generic skill
 * libraries. We approximate "project-unique" as communities that contain at
 * least one entity whose id/name appears in `projectSignatures` (or the
 * complement when no signatures are supplied — all communities count as
 * project-unique in bootstrap mode).
 */
export class M1CommunitySource implements CommunitySource {
  constructor(
    private readonly communities: readonly Community[],
    private readonly projectSignatures: ReadonlySet<string> = new Set(),
  ) {}

  selfFraction(): number {
    const total = this.communities.length;
    if (total === 0) return 1; // bootstrap degenerate — treat as all-self
    if (this.projectSignatures.size === 0) return 1; // no signatures → all-self
    let projectUnique = 0;
    for (const c of this.communities) {
      for (const m of c.members) {
        if (this.projectSignatures.has(m)) {
          projectUnique += 1;
          break;
        }
      }
    }
    return projectUnique / total;
  }
}

// ─── Axis 2 — M4 branches + user overrides ──────────────────────────────────

export interface TensionInputs {
  /** Count of user-override events (developer rejects a system suggestion). */
  overrideCount: number;
  /** Count of system-suggestion events. */
  suggestionCount: number;
  /** Count of M4 sessions that hit the 20%-refinement bound (rejected). */
  boundHitCount: number;
  /** Count of M4 sessions that completed under the bound. */
  freeRefinementCount: number;
}

/**
 * Essential Tensions as override-ratio plus bound-hit ratio. Both are
 * normalised so zero-sample edge-cases return 0 (not NaN).
 */
export class M4TensionSource implements TensionSource {
  constructor(private readonly inputs: TensionInputs) {}

  overrideRatio(): number {
    if (this.inputs.suggestionCount <= 0) return 0;
    return this.inputs.overrideCount / this.inputs.suggestionCount;
  }

  boundHitRatio(): number {
    const total = this.inputs.boundHitCount + this.inputs.freeRefinementCount;
    if (total <= 0) return 0;
    return this.inputs.boundHitCount / total;
  }
}

/**
 * Compute TensionInputs straight from branch manifests. Rejected branches
 * (`state === 'aborted'` with a delta at the 20% bound) count as bound-hits.
 */
export function tensionInputsFromBranches(
  manifests: readonly BranchManifest[],
  opts: {
    /** Fraction threshold to classify a branch as a bound-hit. Default 0.19. */
    boundHitThreshold?: number;
    overrideCount?: number;
    suggestionCount?: number;
  } = {},
): TensionInputs {
  const threshold = opts.boundHitThreshold ?? 0.19;
  let boundHitCount = 0;
  let freeRefinementCount = 0;
  for (const m of manifests) {
    if (m.deltaFraction >= threshold) boundHitCount += 1;
    else freeRefinementCount += 1;
  }
  return {
    overrideCount: opts.overrideCount ?? 0,
    suggestionCount: opts.suggestionCount ?? 0,
    boundHitCount,
    freeRefinementCount,
  };
}

// ─── Axis 3 — M2 tokens-per-outcome ─────────────────────────────────────────

/**
 * Growth-and-Energy-Flow reads tokens-per-productive-outcome out of an M2
 * long-term store. Productive outcomes are tagged `success` (configurable).
 * The source falls back to a caller-supplied default when no samples match.
 */
export class M2EnergySource implements EnergySource {
  constructor(
    private readonly entries: readonly MemoryEntry[],
    private readonly opts: {
      /** Substring that marks a productive outcome. Default 'success'. */
      productiveTag?: string;
      /** Property path to tokens count in MemoryEntry (numeric). Default 'tokens'. */
      tokensField?: string;
      /** Fallback return when no samples available. Default 1000. */
      fallback?: number;
    } = {},
  ) {}

  tokensPerProductiveOutcome(): number {
    const tag = this.opts.productiveTag ?? 'success';
    const field = this.opts.tokensField ?? 'tokens';
    const fallback = this.opts.fallback ?? 1000;
    let total = 0;
    let samples = 0;
    for (const e of this.entries) {
      if (!e.content.includes(tag)) continue;
      const anyEntry = e as unknown as Record<string, unknown>;
      const rawTokens = anyEntry[field];
      if (typeof rawTokens === 'number' && Number.isFinite(rawTokens) && rawTokens > 0) {
        total += rawTokens;
        samples += 1;
      }
    }
    if (samples === 0) return fallback;
    return total / samples;
  }
}

// ─── Axis 4 — M4 trunk vs branch ratio ───────────────────────────────────────

export class M4StabilitySource implements StabilitySource {
  constructor(private readonly manifests: readonly BranchManifest[]) {}

  trunkPreservedCount(): number {
    // Trunk-preserved ≈ committed branches (merged into trunk via commit.ts).
    return this.manifests.filter((m) => m.state === 'committed').length;
  }

  branchCommittedCount(): number {
    // Open and aborted branches indicate novelty that did not merge.
    return this.manifests.filter((m) => m.state !== 'committed').length;
  }
}

// ─── Axis 5 — M3 high-impact decisions ──────────────────────────────────────

/**
 * Fateful Encounters count M3 traces whose retrospective outcome-impact
 * score exceeds `threshold`. Callers supply an impact-scorer that maps
 * a trace to a scalar in [0, 1]. The default scorer approximates impact
 * as the fraction of `reasoning` that mentions a high-impact keyword.
 */
export class M3FatefulSource implements FatefulSource {
  constructor(
    private readonly traces: readonly DecisionTrace[],
    private readonly impactFn: (trace: DecisionTrace) => number = defaultImpact,
  ) {}

  highImpactDecisionCount(threshold: number): number {
    let count = 0;
    for (const t of this.traces) {
      if (this.impactFn(t) >= threshold) count += 1;
    }
    return count;
  }
}

const HIGH_IMPACT_KEYWORDS = [
  'refactor',
  'migration',
  'breaking',
  'architecture',
  'schema-change',
  'commit-to-trunk',
];

/**
 * Default impact score: proportional to the count of high-impact keywords
 * appearing in the trace's reasoning and outcome fields, capped at 1.
 */
function defaultImpact(trace: DecisionTrace): number {
  const hay = `${trace.reasoning} ${trace.outcome ?? ''}`.toLowerCase();
  let hits = 0;
  for (const kw of HIGH_IMPACT_KEYWORDS) {
    if (hay.includes(kw)) hits += 1;
  }
  // 3 keyword hits → score 1.0
  return Math.min(1, hits / 3);
}

// ─── Composite factory ──────────────────────────────────────────────────────

export interface LiveSourcesInput {
  communities: readonly Community[];
  projectSignatures?: ReadonlySet<string>;
  branches: readonly BranchManifest[];
  overrideCount?: number;
  suggestionCount?: number;
  memoryEntries: readonly MemoryEntry[];
  traces: readonly DecisionTrace[];
}

/**
 * Assemble a full `QuintessenceSources` bundle from live M1–M7 module data.
 * Every field of `LiveSourcesInput` can be empty — all adapters degrade
 * gracefully to neutral values on empty input so bootstrap runs never crash.
 */
export function buildLiveQuintessenceSources(input: LiveSourcesInput): {
  community: CommunitySource;
  tension: TensionSource;
  energy: EnergySource;
  stability: StabilitySource;
  fateful: FatefulSource;
} {
  return {
    community: new M1CommunitySource(input.communities, input.projectSignatures),
    tension: new M4TensionSource(
      tensionInputsFromBranches(input.branches, {
        overrideCount: input.overrideCount,
        suggestionCount: input.suggestionCount,
      }),
    ),
    energy: new M2EnergySource(input.memoryEntries),
    stability: new M4StabilitySource(input.branches),
    fateful: new M3FatefulSource(input.traces),
  };
}
