/**
 * Pattern aggregator for cross-session/project frequency analysis.
 *
 * Accumulates tool n-gram and bash command pattern occurrences across multiple
 * sessions and projects, tracks frequency metrics (totalCount, sessionCount,
 * projectCount), and filters framework noise that appears ubiquitously.
 *
 * Bridges per-session extraction results (from tool-sequence-extractor and
 * bash-pattern-extractor) into cross-corpus frequency data for Phase 33 scoring.
 */

// ============================================================================
// Types
// ============================================================================

/** Frequency metrics for a single pattern across the corpus */
export interface PatternOccurrence {
  totalCount: number;
  sessionCount: number;
  projectCount: number;
  sessionIds: Set<string>;
  projectSlugs: Set<string>;
  perSessionCounts: Map<string, number>;
}

/** Pattern data extracted from a single session, ready for aggregation */
export interface SessionPatterns {
  sessionId: string;
  projectSlug: string;
  toolBigrams: Map<string, number>;
  toolTrigrams: Map<string, number>;
  bashPatterns: Map<string, number>;
}

// ============================================================================
// PatternAggregator
// ============================================================================

/**
 * Accumulates pattern occurrences across sessions and projects.
 *
 * Usage:
 * 1. Call addSessionPatterns() for each session's extracted data
 * 2. Call filterNoise() to remove ubiquitous framework patterns
 * 3. Call getResults() to retrieve the final frequency map
 */
export class PatternAggregator {
  private readonly patterns: Map<string, PatternOccurrence> = new Map();
  private readonly allProjectSlugs: Set<string> = new Set();

  /**
   * Add patterns from a single session into the aggregator.
   *
   * Merges tool bigrams (key: "tool:bigram:{ngram}"), tool trigrams
   * (key: "tool:trigram:{ngram}"), and bash patterns (key: "bash:{category}")
   * into the internal frequency map.
   */
  addSessionPatterns(patterns: SessionPatterns): void {
    const { sessionId, projectSlug, toolBigrams, toolTrigrams, bashPatterns } = patterns;

    this.allProjectSlugs.add(projectSlug);

    for (const [ngram, count] of toolBigrams) {
      this.merge(`tool:bigram:${ngram}`, count, sessionId, projectSlug);
    }

    for (const [ngram, count] of toolTrigrams) {
      this.merge(`tool:trigram:${ngram}`, count, sessionId, projectSlug);
    }

    for (const [category, count] of bashPatterns) {
      this.merge(`bash:${category}`, count, sessionId, projectSlug);
    }
  }

  /**
   * Remove framework noise patterns that appear ubiquitously.
   *
   * A pattern is considered noise if BOTH conditions are true:
   * - projectCount >= minProjectThreshold (default: 15)
   * - projectCount / totalProjects >= 0.8 (80%)
   *
   * Mutates internal state in place.
   */
  filterNoise(totalProjects: number, minProjectThreshold: number = 15): void {
    for (const [key, occurrence] of this.patterns) {
      if (
        occurrence.projectCount >= minProjectThreshold &&
        occurrence.projectCount / totalProjects >= 0.8
      ) {
        this.patterns.delete(key);
      }
    }
  }

  /**
   * Get all aggregated pattern occurrences.
   *
   * @returns A defensive copy of the internal pattern map.
   */
  getResults(): Map<string, PatternOccurrence> {
    return new Map(this.patterns);
  }

  /**
   * Get the total number of unique projects tracked.
   */
  getTotalProjectsTracked(): number {
    return this.allProjectSlugs.size;
  }

  // --------------------------------------------------------------------------
  // Private
  // --------------------------------------------------------------------------

  /**
   * Merge a pattern occurrence into the internal map.
   */
  private merge(key: string, count: number, sessionId: string, projectSlug: string): void {
    let entry = this.patterns.get(key);

    if (!entry) {
      entry = {
        totalCount: 0,
        sessionCount: 0,
        projectCount: 0,
        sessionIds: new Set(),
        projectSlugs: new Set(),
        perSessionCounts: new Map(),
      };
      this.patterns.set(key, entry);
    }

    entry.totalCount += count;

    if (!entry.sessionIds.has(sessionId)) {
      entry.sessionIds.add(sessionId);
      entry.sessionCount++;
    }

    if (!entry.projectSlugs.has(projectSlug)) {
      entry.projectSlugs.add(projectSlug);
      entry.projectCount++;
    }

    entry.perSessionCounts.set(
      sessionId,
      (entry.perSessionCounts.get(sessionId) ?? 0) + count,
    );
  }
}
