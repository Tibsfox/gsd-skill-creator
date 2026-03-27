/**
 * Flags packages that are candidates for code internalization.
 *
 * A package is an internalization candidate when:
 * 1. The project uses <20% of its API surface
 * 2. The implementation is purely algorithmic (no I/O, network, etc.)
 * 3. No hard absorption barriers exist (no crypto, complex parsers, etc.)
 * 4. The dependency has a non-healthy classification (only act on problem deps)
 *
 * DISC-04 implementation.
 */

import type { DiagnosisResult } from '../health-diagnostician/types.js';
import type { AlternativeReport } from './types.js';
import type { Ecosystem } from '../dependency-auditor/types.js';

// ─── UsageAnalysisInput ───────────────────────────────────────────────────────

/**
 * Per-package usage analysis data required by the internalization flagger.
 * In production this would be produced by a static analysis pass over the
 * consuming project's source code.
 */
export interface UsageAnalysisInput {
  /** The package name being analyzed. */
  packageName: string;
  /** Ecosystem the package belongs to. */
  ecosystem: Ecosystem;
  /** Total number of public functions/exports the package exposes. */
  totalExports: number;
  /** The subset of exports the project actually calls. */
  usedExports: string[];
  /**
   * True when the package implements pure algorithms (no I/O, no network, no
   * side effects). Pure algorithmic packages are safe to internalize.
   */
  isAlgorithmic: boolean;
  /**
   * True when the package contains hard absorption barriers:
   * - Cryptographic implementations
   * - Complex parsers (HTML, CSS, SQL, AST)
   * - Network protocols
   * - Compression with native bindings
   *
   * Packages with barriers are NEVER flagged regardless of usage ratio.
   */
  hasAbsorptionBarriers: boolean;
}

// ─── Core function ────────────────────────────────────────────────────────────

/** Usage ratio threshold below which internalization is considered. */
const USAGE_THRESHOLD = 0.20;

/**
 * Evaluates each diagnosis result against available usage analysis data and
 * returns AlternativeReport[] for packages that are internalization candidates.
 *
 * All four criteria must pass simultaneously:
 *   1. usedExports.length / totalExports < 0.20
 *   2. isAlgorithmic === true
 *   3. hasAbsorptionBarriers === false
 *   4. classification !== 'healthy'
 */
export function flagInternalizationCandidates(
  results: DiagnosisResult[],
  usageAnalysis: UsageAnalysisInput[],
): AlternativeReport[] {
  // Build a lookup map for O(1) access
  const usageMap = new Map<string, UsageAnalysisInput>(
    usageAnalysis.map((u) => [u.packageName, u]),
  );

  const reports: AlternativeReport[] = [];

  for (const result of results) {
    const dep = result.signal.dependency;

    // Criterion 4: only flag non-healthy deps
    if (result.classification === 'healthy') continue;

    const usage = usageMap.get(dep.name);
    if (!usage) continue;

    // Criterion 3: hard absorption barriers block all flagging
    if (usage.hasAbsorptionBarriers) continue;

    // Criterion 2: must be purely algorithmic
    if (!usage.isAlgorithmic) continue;

    // Criterion 1: usage ratio must be below threshold
    const usageRatio = usage.usedExports.length / usage.totalExports;
    if (usageRatio >= USAGE_THRESHOLD) continue;

    // All criteria passed — build the report
    const usedCount = usage.usedExports.length;
    const pct = Math.round(usageRatio * 100);
    const usedList = usage.usedExports.join(', ');
    const evidenceSummary = `Uses ${usedCount}/${usage.totalExports} exports (${pct}% of API) — ${usedList}`;

    // confidenceScore = 0.5 + min((1 - usageRatio) * 0.5, 0.4)
    const confidenceScore = 0.5 + Math.min((1 - usageRatio) * 0.5, 0.4);

    reports.push({
      originalPackage: dep.name,
      originalEcosystem: dep.ecosystem,
      relationship: 'internalization-candidate',
      alternativeName: `${dep.name}-internal`,
      evidenceSummary,
      apiCompatibility: 'identical',
      migrationEffort: 'low',
      confidenceScore,
      sourceUrl: null,
    });
  }

  return reports;
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper for flagInternalizationCandidates, providing a stateful API surface. */
export class InternalizationFlagger {
  flag(results: DiagnosisResult[], usageAnalysis: UsageAnalysisInput[]): AlternativeReport[] {
    return flagInternalizationCandidates(results, usageAnalysis);
  }
}
