/**
 * M4 Branch-Context Experimentation — branched skill activation alongside trunk.
 *
 * `explore()` activates the branched skill alongside the trunk for N sessions,
 * captures per-session outcomes, and writes branch-scoped M3 traces so the
 * precedent query system can see them.
 *
 * Semantics:
 *   - Each session fires both the trunk skill and the branched skill.
 *   - Outcomes (pass/fail + latency) are captured in a per-branch outcome
 *     trace written via `ActivationWriter`.
 *   - The branch manifest is updated after each session (exploreSessionCount++,
 *     tracePaths updated).
 *   - The branch and trunk are desensitised independently: trunk activation
 *     failures do not abort the branch, and vice versa (IT-05 hook).
 *   - Caller supplies the `runSkill` function — this module is IO-agnostic and
 *     does not invoke any real skill executor; the test harness can supply a mock.
 *
 * Cross-platform:
 *   - Only `node:fs`, `node:path`, `node:os`, `node:crypto` from stdlib.
 *   - No filesystem-specific primitives.
 *
 * Phase 645, Wave 1 Track D (M4).
 *
 * @module branches/explore
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { readManifest, writeManifest } from './fork.js';
import { ActivationWriter } from '../traces/activation-writer.js';
import type { BranchManifest } from './manifest.js';
import {
  selectBranchVariant,
  type BranchVariant,
  type BranchVariantSelection,
} from './select-variant.js';
import type { TractabilityClass } from '../tractability/selector-api.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Per-session outcome captured during an explore session.
 */
export interface SessionOutcome {
  /** Branch or trunk tag. */
  side: 'branch' | 'trunk';

  /** Whether the skill completed without error. */
  passed: boolean;

  /** Latency in ms (wall-clock from start to completion). */
  latencyMs: number;

  /** Optional output captured from the skill run. */
  output?: string;

  /** Error message if the skill threw. */
  error?: string;
}

/**
 * Result summary for a single explore session (one pair of branch + trunk runs).
 */
export interface ExploreSessionResult {
  /** 1-based session index within this explore() call. */
  sessionIndex: number;

  /** Unix ms start time of the session. */
  startedAt: number;

  /** Outcomes for trunk and branch. */
  outcomes: { trunk: SessionOutcome; branch: SessionOutcome };

  /** Path to the M3 trace file written for this session. */
  tracePath: string;
}

/**
 * Result of a full explore() call (N sessions).
 */
export interface ExploreResult {
  /** The final branch manifest after all sessions. */
  manifest: BranchManifest;

  /** Per-session results, in session order. */
  sessions: ExploreSessionResult[];

  /**
   * The stochastic variant selection made for this explore() call, when
   * `variantSelection` was supplied in the options. Absent otherwise.
   */
  variantSelection?: BranchVariantSelection;
}

/**
 * Function signature for running a skill body.
 * Called by explore() for both trunk and branch per session.
 * Returns the output string on success; throws on failure.
 */
export type RunSkillFn = (skillBody: string, sessionIndex: number) => Promise<string>;

// ─── Explore options ──────────────────────────────────────────────────────────

export interface ExploreOptions {
  /**
   * Branch ID to explore.
   */
  branchId: string;

  /**
   * Root directory containing branch subdirectories.
   * Defaults to `.planning/branches`.
   */
  branchesDir?: string;

  /**
   * The current trunk skill body. Run alongside the branch for comparison.
   */
  trunkBody: string;

  /**
   * Number of sessions to explore. Defaults to 1.
   */
  sessionCount?: number;

  /**
   * Skill runner. Called for both trunk and branch per session.
   * Must be supplied by the caller (no real executor is embedded here).
   */
  runSkill: RunSkillFn;

  /**
   * Directory for M3 trace files.
   * Defaults to `.planning/traces/branches`.
   */
  traceDir?: string;

  /**
   * Override for ActivationWriter (DI for tests).
   */
  activationWriter?: ActivationWriter;

  /**
   * Optional stochastic branch-variant selection (M4 in-branch consumer of the
   * M5 selector). When supplied, `explore()` chooses WHICH variant body to run
   * as the branch side via {@link selectBranchVariant} — the first production
   * caller of the selector's `inBranchContext: true` path — instead of reading
   * `skill.md` from the branch directory. Default (field absent) → unchanged:
   * the branch body is read from disk.
   *
   * Reproducible: a given `branchSeed` + `variants` + `query` selects the same
   * variant every run. With the stochastic flag off or a single variant, the
   * choice collapses to the deterministic top-ranked variant.
   */
  variantSelection?: {
    /** Query describing the exploration goal. */
    query: string;
    /** Candidate variants (each carrying a `body` to run if chosen). */
    variants: Array<BranchVariant & { body: string }>;
    /** Per-branch seed for reproducible selection. */
    branchSeed?: number;
    /** ME-1 tractability class. Defaults to 'unknown'. */
    tractabilityClass?: TractabilityClass;
    /** Override the stochastic master flag (default: read from settings). */
    stochasticEnabled?: boolean;
    /** Base Boltzmann temperature. Defaults to 1.0. */
    baseTemperature?: number;
  };
}

// ─── explore() ───────────────────────────────────────────────────────────────

/**
 * Activate the branched skill alongside trunk for N sessions.
 *
 * Both trunk and branch are run independently per session. Failures on
 * either side are recorded but do not abort the other (IT-05).
 * Outcomes are appended to the M3 trace log as branch-scoped activation traces.
 *
 * @throws Error if the branch is not in 'open' state.
 */
export async function explore(opts: ExploreOptions): Promise<ExploreResult> {
  const {
    branchId,
    branchesDir = '.planning/branches',
    trunkBody,
    sessionCount = 1,
    runSkill,
    traceDir = '.planning/traces/branches',
    activationWriter,
    variantSelection,
  } = opts;

  const branchDir = join(branchesDir, branchId);
  let manifest = await readManifest(branchDir);

  if (manifest.state !== 'open') {
    throw new Error(
      `Branch ${branchId} is not open (state: ${manifest.state}). Cannot explore.`,
    );
  }

  // Determine the branch body. When a stochastic variant selection is supplied,
  // choose WHICH variant body to run via the M5 in-branch selector (the M4 frame
  // is the sanctioned home for in-branch stochasticity — the ME-3 gate). The
  // chosen variant's `body` is used as the branch side; the selection is returned
  // on the result. Default (no variantSelection) → read `skill.md` from disk.
  let chosenSelection: BranchVariantSelection | undefined;
  let branchBody: string;
  if (variantSelection) {
    chosenSelection = await selectBranchVariant({
      query: variantSelection.query,
      variants: variantSelection.variants,
      branchSeed: variantSelection.branchSeed,
      tractabilityClass: variantSelection.tractabilityClass,
      stochasticEnabled: variantSelection.stochasticEnabled,
      baseTemperature: variantSelection.baseTemperature,
    });
    // The chosen variant always carries a `body` (the field type requires it).
    branchBody = chosenSelection.chosen.body ?? '';
  } else {
    branchBody = await fs.readFile(join(branchDir, 'skill.md'), 'utf8');
  }

  // Set up M3 activation writer.
  const writer = activationWriter ?? new ActivationWriter(join(traceDir, `${branchId}.jsonl`));

  const sessions: ExploreSessionResult[] = [];

  for (let i = 0; i < sessionCount; i++) {
    const sessionIndex = manifest.exploreSessionCount + i + 1;
    const startedAt = Date.now();

    // Run trunk — failures are caught and recorded (IT-05).
    const trunkOutcome = await runSide('trunk', trunkBody, sessionIndex, runSkill);

    // Run branch — failures are caught and recorded independently (IT-05).
    const branchOutcome = await runSide('branch', branchBody, sessionIndex, runSkill);

    // Write M3 trace for this session.
    const tracePath = join(traceDir, `${branchId}.jsonl`);
    await writer.activation({
      actor: `branch:${branchId}`,
      intent: `Explore session ${sessionIndex} for skill '${manifest.skillName}'`,
      reasoning: `Branch vs trunk comparison: branch=${branchOutcome.passed}, trunk=${trunkOutcome.passed}`,
      constraints: [`branchId:${branchId}`, `session:${sessionIndex}`],
      alternatives: [`trunk:${trunkOutcome.output ?? ''}`],
      outcome: branchOutcome.passed ? 'pass' : `fail: ${branchOutcome.error ?? 'unknown'}`,
      entityIds: [branchId],
    });

    sessions.push({
      sessionIndex,
      startedAt,
      outcomes: { trunk: trunkOutcome, branch: branchOutcome },
      tracePath,
    });
  }

  // Update manifest: increment session count, append trace paths.
  const newTracePath = join(traceDir, `${branchId}.jsonl`);
  const updatedTracePaths = manifest.tracePaths.includes(newTracePath)
    ? manifest.tracePaths
    : [...manifest.tracePaths, newTracePath];

  const updatedManifest: BranchManifest = {
    ...manifest,
    exploreSessionCount: manifest.exploreSessionCount + sessionCount,
    tracePaths: updatedTracePaths,
  };

  await writeManifest(branchDir, updatedManifest);
  manifest = updatedManifest;

  return chosenSelection
    ? { manifest, sessions, variantSelection: chosenSelection }
    : { manifest, sessions };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Run a skill on one side (trunk or branch), catching errors (IT-05).
 */
async function runSide(
  side: 'trunk' | 'branch',
  body: string,
  sessionIndex: number,
  runSkill: RunSkillFn,
): Promise<SessionOutcome> {
  const start = Date.now();
  try {
    const output = await runSkill(body, sessionIndex);
    return {
      side,
      passed: true,
      latencyMs: Date.now() - start,
      output,
    };
  } catch (err) {
    return {
      side,
      passed: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
