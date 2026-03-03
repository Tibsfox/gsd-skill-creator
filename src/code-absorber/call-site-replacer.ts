/**
 * Manages gradual call-site replacement in cycles (≤20% per cycle).
 *
 * ABSB-04: Each cycle replaces at most 20% of total call sites.
 * Independent verification is run per replaced call site before next cycle.
 *
 * Pure computation — produces replacement plans and cycle records.
 * Actual file I/O is the caller's responsibility.
 */

import type { CallSiteCycle } from './types.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CallSiteRecord {
  /** Absolute path to the file containing the call site. */
  filePath: string;
  /** Line number (1-based) of the import/require statement. */
  lineNumber: number;
  /** The original import expression (e.g. `import { fn } from 'pkg'`). */
  originalImport: string;
  /** The replacement expression (e.g. `import { fn } from './internal/fn.js'`). */
  replacementImport: string;
}

export interface ReplacementCycleInput {
  packageName: string;
  callSites: CallSiteRecord[];
  /** Per-call-site verification function — returns true if the replacement is valid. */
  verify: (site: CallSiteRecord) => Promise<boolean>;
}

export interface ReplacementPlan {
  packageName: string;
  totalCallSites: number;
  cycleCount: number;
  /** Groups of call sites for each cycle. */
  cycles: CallSiteRecord[][];
}

// ─── Core functions ────────────────────────────────────────────────────────────

const MAX_CYCLE_RATIO = 0.20;

/**
 * Partitions call sites into cycles of at most 20% each.
 *
 * Minimum 1 call site per cycle to avoid zero-size cycles for small lists.
 * Returns a ReplacementPlan with all cycles pre-computed.
 */
export function planReplacementCycles(
  packageName: string,
  callSites: CallSiteRecord[],
): ReplacementPlan {
  if (callSites.length === 0) {
    return { packageName, totalCallSites: 0, cycleCount: 0, cycles: [] };
  }

  const maxPerCycle = Math.max(1, Math.ceil(callSites.length * MAX_CYCLE_RATIO));
  const cycles: CallSiteRecord[][] = [];

  for (let i = 0; i < callSites.length; i += maxPerCycle) {
    cycles.push(callSites.slice(i, i + maxPerCycle));
  }

  return {
    packageName,
    totalCallSites: callSites.length,
    cycleCount: cycles.length,
    cycles,
  };
}

/**
 * Executes all replacement cycles sequentially.
 *
 * For each cycle:
 * 1. For each call site: run caller's verify(); count verified or failed
 * 2. Record CallSiteCycle with counts
 *
 * Stops further cycles immediately if a cycle has any failures.
 * Returns the array of CallSiteCycle records (one per executed cycle).
 */
export async function executeReplacementCycles(
  input: ReplacementCycleInput,
): Promise<CallSiteCycle[]> {
  const plan = planReplacementCycles(input.packageName, input.callSites);
  const results: CallSiteCycle[] = [];

  for (let cycleIdx = 0; cycleIdx < plan.cycles.length; cycleIdx++) {
    const cycle = plan.cycles[cycleIdx];
    let verified = 0;
    let failed = 0;

    for (const site of cycle) {
      const ok = await input.verify(site);
      if (ok) {
        verified++;
      } else {
        failed++;
      }
    }

    results.push({
      cycleNumber: cycleIdx + 1,
      totalCallSites: input.callSites.length,
      replacedInCycle: cycle.length,
      verifiedInCycle: verified,
      failedInCycle: failed,
    });

    // Stop further cycles on any verification failure
    if (failed > 0) {
      break;
    }
  }

  return results;
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper providing a stateful API surface for call-site replacement. */
export class CallSiteReplacer {
  plan(packageName: string, callSites: CallSiteRecord[]): ReplacementPlan {
    return planReplacementCycles(packageName, callSites);
  }

  execute(input: ReplacementCycleInput): Promise<CallSiteCycle[]> {
    return executeReplacementCycles(input);
  }
}
