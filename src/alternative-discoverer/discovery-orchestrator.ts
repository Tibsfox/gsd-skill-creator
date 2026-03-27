/**
 * Wires all four alternative-discovery strategies into a unified pipeline.
 *
 * Runs SuccessorDetector, ForkFinder, EquivalentSearcher, and
 * InternalizationFlagger in parallel per dep, then merges and deduplicates
 * results into a DiscoveryReport.
 *
 * DISC-05 implementation.
 */

import type { DiagnosisReport } from '../health-diagnostician/types.js';
import type { AlternativeReport, RelationshipType } from './types.js';
import type { UsageAnalysisInput } from './internalization-flagger.js';
import { detectSuccessors } from './successor-detector.js';
import { findForks } from './fork-finder.js';
import { searchEquivalents } from './equivalent-searcher.js';
import { flagInternalizationCandidates } from './internalization-flagger.js';

// ─── DiscoveryReport ──────────────────────────────────────────────────────────

/** The unified output of the alternative discovery pipeline. */
export interface DiscoveryReport {
  /**
   * Map of originalPackage name → all alternatives found across all strategies.
   * Only packages with at least one alternative are included.
   */
  results: Map<string, AlternativeReport[]>;
  /** Aggregate statistics across all packages and strategies. */
  summary: {
    /** Total count of all AlternativeReport items across all packages. */
    total: number;
    /** Count of each relationship type across all alternatives. */
    byRelationship: Record<RelationshipType, number>;
    /** Number of packages that have at least one alternative. */
    packagesWithAlternatives: number;
  };
}

// ─── Orchestrator config ──────────────────────────────────────────────────────

export interface DiscoveryOrchestratorConfig {
  /** Whether to run SuccessorDetector (default: true). */
  enableSuccessorDetection: boolean;
  /** Whether to run ForkFinder (default: true). */
  enableForkFinding: boolean;
  /** Whether to run EquivalentSearcher (default: true). */
  enableEquivalentSearch: boolean;
  /** Whether to run InternalizationFlagger (default: true). */
  enableInternalizationFlagging: boolean;
}

const DEFAULT_CONFIG: DiscoveryOrchestratorConfig = {
  enableSuccessorDetection: true,
  enableForkFinding: true,
  enableEquivalentSearch: true,
  enableInternalizationFlagging: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Deduplicates alternatives by alternativeName within the same originalPackage.
 * When two strategies return the same alternativeName, keeps the one with the
 * highest confidenceScore.
 */
function deduplicate(reports: AlternativeReport[]): AlternativeReport[] {
  const best = new Map<string, AlternativeReport>();
  for (const report of reports) {
    const key = report.alternativeName;
    const existing = best.get(key);
    if (!existing || report.confidenceScore > existing.confidenceScore) {
      best.set(key, report);
    }
  }
  return Array.from(best.values());
}

/** Builds an empty byRelationship counter. */
function emptyByRelationship(): Record<RelationshipType, number> {
  return {
    successor: 0,
    fork: 0,
    equivalent: 0,
    'internalization-candidate': 0,
  };
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Runs all four discovery strategies and returns a DiscoveryReport.
 *
 * - Healthy deps are skipped (they don't need alternatives).
 * - Successor, fork, and equivalent strategies run in parallel per dep.
 * - Internalization flagging runs once for all deps at the end.
 * - Any strategy that throws has its error swallowed — other strategies proceed.
 * - Alternatives with the same alternativeName are deduplicated by highest confidence.
 */
export async function discoverAlternatives(
  diagnosisReport: DiagnosisReport,
  usageAnalysis: UsageAnalysisInput[],
  config: DiscoveryOrchestratorConfig = DEFAULT_CONFIG,
): Promise<DiscoveryReport> {
  // Filter to non-healthy deps only
  const actionableDeps = diagnosisReport.results.filter(
    (r) => r.classification !== 'healthy',
  );

  if (!actionableDeps.length) {
    return {
      results: new Map(),
      summary: {
        total: 0,
        byRelationship: emptyByRelationship(),
        packagesWithAlternatives: 0,
      },
    };
  }

  // Collect alternatives per dep
  const depAlternatives = new Map<string, AlternativeReport[]>();

  // Run per-dep strategies in parallel across all actionable deps
  await Promise.all(
    actionableDeps.map(async (result) => {
      const dep = result.signal.dependency;
      const registryMeta = result.signal.registryHealth as unknown as Record<string, unknown>;
      const collected: AlternativeReport[] = [];

      // Run successor, fork, equivalent in parallel
      const perDepTasks: Array<Promise<AlternativeReport[]>> = [];

      if (config.enableSuccessorDetection) {
        perDepTasks.push(
          Promise.resolve().then(() => {
            try {
              return detectSuccessors([result]);
            } catch {
              return [];
            }
          }),
        );
      }

      if (config.enableForkFinding) {
        perDepTasks.push(
          findForks(dep, registryMeta).catch(() => []),
        );
      }

      if (config.enableEquivalentSearch) {
        perDepTasks.push(
          searchEquivalents(dep, registryMeta).catch(() => []),
        );
      }

      const perDepResults = await Promise.all(perDepTasks);
      for (const batch of perDepResults) {
        collected.push(...batch);
      }

      if (collected.length > 0) {
        depAlternatives.set(dep.name, collected);
      }
    }),
  );

  // Run internalization flagging once for all deps
  if (config.enableInternalizationFlagging) {
    let internCandidates: AlternativeReport[] = [];
    try {
      internCandidates = flagInternalizationCandidates(
        diagnosisReport.results,
        usageAnalysis,
      );
    } catch {
      internCandidates = [];
    }

    // Merge internalization candidates into the correct dep's list
    for (const candidate of internCandidates) {
      const existing = depAlternatives.get(candidate.originalPackage) ?? [];
      existing.push(candidate);
      depAlternatives.set(candidate.originalPackage, existing);
    }
  }

  // Deduplicate per dep
  const deduplicated = new Map<string, AlternativeReport[]>();
  for (const [pkg, alts] of depAlternatives) {
    const deduped = deduplicate(alts);
    if (deduped.length > 0) {
      deduplicated.set(pkg, deduped);
    }
  }

  // Build summary
  const byRelationship = emptyByRelationship();
  let total = 0;

  for (const alts of deduplicated.values()) {
    for (const alt of alts) {
      byRelationship[alt.relationship]++;
      total++;
    }
  }

  return {
    results: deduplicated,
    summary: {
      total,
      byRelationship,
      packagesWithAlternatives: deduplicated.size,
    },
  };
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper for discoverAlternatives with configurable strategy toggles. */
export class DiscoveryOrchestrator {
  private config: DiscoveryOrchestratorConfig;

  constructor(config: Partial<DiscoveryOrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  discover(
    diagnosisReport: DiagnosisReport,
    usageAnalysis: UsageAnalysisInput[],
  ): Promise<DiscoveryReport> {
    return discoverAlternatives(diagnosisReport, usageAnalysis, this.config);
  }
}
