/**
 * Detects recurring failure patterns across projects from HealthEvents.
 *
 * INTG-04: Pre-emptive warnings after same failure observed in 5+ projects.
 *
 * Pure function — input is HealthEvent[], output is PatternMatch[].
 * No I/O — caller supplies events from HealthEventWriter.readAll().
 */

import type { HealthEvent, PatternMatch } from './types.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PATTERN_THRESHOLD = 5;

/** Classifications that indicate failure patterns worth learning from. */
const FAILURE_CLASSIFICATIONS = new Set([
  'abandoned', 'vulnerable', 'stale', 'conflicting',
]);

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Analyzes HealthEvents and returns PatternMatch entries for packages
 * whose failure has been observed across >= threshold distinct projects.
 *
 * Groups events by packageName, using payload.classification to identify failures.
 * Counts distinct projectIds per package (Set-based deduplication).
 * Returns sorted by projectCount descending (most widespread patterns first).
 */
export function detectPatterns(
  events: HealthEvent[],
  threshold = DEFAULT_PATTERN_THRESHOLD,
): PatternMatch[] {
  // Map: packageName → Set of projectIds where a failure was observed
  const packageProjects = new Map<string, Set<string>>();
  // Map: packageName → most-recently-seen failure classification
  const packageClassifications = new Map<string, string>();

  for (const event of events) {
    const classification = event.payload['classification'];
    if (typeof classification !== 'string') continue;
    if (!FAILURE_CLASSIFICATIONS.has(classification)) continue;

    const key = event.packageName;
    if (!packageProjects.has(key)) {
      packageProjects.set(key, new Set());
    }
    packageProjects.get(key)!.add(event.projectId);
    packageClassifications.set(key, classification);
  }

  const matches: PatternMatch[] = [];

  for (const [packageName, projectIds] of packageProjects) {
    if (projectIds.size >= threshold) {
      const classification = packageClassifications.get(packageName) ?? 'unknown';
      matches.push({
        packageName,
        projectCount: projectIds.size,
        patternSummary: `Package '${packageName}' has been classified as '${classification}' in ${projectIds.size} projects`,
        evidenceProjectIds: [...projectIds].sort(),
      });
    }
  }

  // Sort by projectCount descending — most widespread patterns first
  matches.sort((a, b) => b.projectCount - a.projectCount);

  return matches;
}

/**
 * Returns the pre-emptive warning for a specific package.
 * Returns null if the package's failure count is below the threshold.
 */
export function getPackageWarning(
  events: HealthEvent[],
  packageName: string,
  threshold = DEFAULT_PATTERN_THRESHOLD,
): PatternMatch | null {
  const patterns = detectPatterns(events, threshold);
  return patterns.find(p => p.packageName === packageName) ?? null;
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper providing a stateful API surface for pattern detection. */
export class PatternLearner {
  constructor(private readonly threshold: number = DEFAULT_PATTERN_THRESHOLD) {}

  detect(events: HealthEvent[]): PatternMatch[] {
    return detectPatterns(events, this.threshold);
  }

  getWarning(events: HealthEvent[], packageName: string): PatternMatch | null {
    return getPackageWarning(events, packageName, this.threshold);
  }
}
