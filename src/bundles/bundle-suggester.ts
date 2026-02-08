/**
 * Auto-suggestion of bundles from co-activation patterns.
 *
 * Uses CoActivationTracker pairwise data to detect skill cliques --
 * groups of skills that ALL co-activate with each other above a
 * threshold. This is stricter than connected component detection:
 * every pair in the group must exceed minCoActivations.
 *
 * Clique detection uses the Bron-Kerbosch algorithm (without pivoting,
 * sufficient for small skill graphs). Suggestions include the skill
 * list, average co-activation score, and total session count.
 */

import { CoActivationTracker } from '../agents/co-activation-tracker.js';
import type { SkillCoActivation } from '../agents/co-activation-tracker.js';
import type { SessionObservation } from '../types/observation.js';

// ============================================================================
// Types
// ============================================================================

export interface BundleSuggestion {
  skills: string[];
  coActivationScore: number;
  sessionCount: number;
}

export interface BundleSuggesterConfig {
  minCoActivations: number;   // default 3
  minClusterSize: number;     // default 3
  recencyDays: number;        // default 14
}

const DEFAULT_CONFIG: BundleSuggesterConfig = {
  minCoActivations: 3,
  minClusterSize: 3,
  recencyDays: 14,
};

// ============================================================================
// BundleSuggester
// ============================================================================

/**
 * Suggests bundles based on co-activation patterns in session data.
 *
 * Workflow:
 * 1. Run CoActivationTracker.analyze() to get pairwise co-activation data
 * 2. Build adjacency graph of skills that co-activate above threshold
 * 3. Find maximal cliques using Bron-Kerbosch
 * 4. Filter by minClusterSize and sort by score
 */
export class BundleSuggester {
  private config: BundleSuggesterConfig;

  constructor(config?: Partial<BundleSuggesterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Suggest bundles from session co-activation patterns.
   *
   * @param sessions - Session observations to analyze
   * @param excludeSkills - Skills to exclude (e.g., already in bundles)
   * @returns Suggestions sorted by coActivationScore descending
   */
  suggest(
    sessions: SessionObservation[],
    excludeSkills?: Set<string>,
  ): BundleSuggestion[] {
    if (sessions.length === 0) return [];

    // 1. Get pairwise co-activation data
    const tracker = new CoActivationTracker({
      minCoActivations: this.config.minCoActivations,
      recencyDays: this.config.recencyDays,
    });
    const coActivations = tracker.analyze(sessions);

    if (coActivations.length === 0) return [];

    // 2. Build adjacency graph, filtering excluded skills
    const adjacency = this.buildAdjacency(coActivations, excludeSkills);

    // 3. Find maximal cliques
    const cliques = this.findCliques(adjacency);

    // 4. Filter by minClusterSize
    const validCliques = cliques.filter(
      c => c.length >= this.config.minClusterSize,
    );

    if (validCliques.length === 0) return [];

    // 5. Build suggestions with scores
    const suggestions = validCliques.map(clique =>
      this.buildSuggestion(clique, coActivations),
    );

    // 6. Sort by score descending
    suggestions.sort((a, b) => b.coActivationScore - a.coActivationScore);

    return suggestions;
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  /**
   * Build adjacency map from co-activation pairs.
   *
   * Each skill maps to the set of skills it co-activates with above threshold.
   * Skills in excludeSkills are omitted from the graph.
   */
  private buildAdjacency(
    coActivations: SkillCoActivation[],
    excludeSkills?: Set<string>,
  ): Map<string, Set<string>> {
    const adjacency = new Map<string, Set<string>>();

    for (const ca of coActivations) {
      const [skillA, skillB] = ca.skillPair;

      if (excludeSkills?.has(skillA) || excludeSkills?.has(skillB)) continue;

      if (!adjacency.has(skillA)) adjacency.set(skillA, new Set());
      if (!adjacency.has(skillB)) adjacency.set(skillB, new Set());

      adjacency.get(skillA)!.add(skillB);
      adjacency.get(skillB)!.add(skillA);
    }

    return adjacency;
  }

  /**
   * Find all maximal cliques in the adjacency graph using Bron-Kerbosch.
   *
   * No pivoting needed for small skill graphs (typically < 50 nodes).
   * Returns arrays of skill names, each representing a maximal clique.
   */
  private findCliques(adjacency: Map<string, Set<string>>): string[][] {
    const cliques: string[][] = [];
    const vertices = Array.from(adjacency.keys());

    const bronKerbosch = (
      R: Set<string>,
      P: Set<string>,
      X: Set<string>,
    ): void => {
      if (P.size === 0 && X.size === 0) {
        // R is a maximal clique
        if (R.size > 0) {
          cliques.push(Array.from(R));
        }
        return;
      }

      // Iterate over a copy since P is modified during recursion
      const candidates = Array.from(P);
      for (const v of candidates) {
        const neighbors = adjacency.get(v) ?? new Set<string>();

        // New R: R union {v}
        const newR = new Set(R);
        newR.add(v);

        // New P: P intersect neighbors(v)
        const newP = new Set<string>();
        for (const p of P) {
          if (neighbors.has(p)) newP.add(p);
        }

        // New X: X intersect neighbors(v)
        const newX = new Set<string>();
        for (const x of X) {
          if (neighbors.has(x)) newX.add(x);
        }

        bronKerbosch(newR, newP, newX);

        P.delete(v);
        X.add(v);
      }
    };

    bronKerbosch(
      new Set(),
      new Set(vertices),
      new Set(),
    );

    return cliques;
  }

  /**
   * Build a BundleSuggestion from a clique and co-activation data.
   *
   * Score is the average co-activation count across all pairs in the clique.
   * Session count is the total unique sessions where any pair co-activated.
   */
  private buildSuggestion(
    clique: string[],
    coActivations: SkillCoActivation[],
  ): BundleSuggestion {
    // Build a lookup for co-activation data
    const caMap = new Map<string, SkillCoActivation>();
    for (const ca of coActivations) {
      caMap.set(ca.skillPair.join(':'), ca);
    }

    let totalCount = 0;
    let pairCount = 0;
    const allSessions = new Set<string>();

    // Iterate all pairs in the clique
    for (let i = 0; i < clique.length; i++) {
      for (let j = i + 1; j < clique.length; j++) {
        const pair = [clique[i], clique[j]].sort().join(':');
        const ca = caMap.get(pair);
        if (ca) {
          totalCount += ca.coActivationCount;
          pairCount++;
          for (const sid of ca.sessions) {
            allSessions.add(sid);
          }
        }
      }
    }

    const avgScore = pairCount > 0 ? totalCount / pairCount : 0;

    return {
      skills: clique.sort(),
      coActivationScore: avgScore,
      sessionCount: allSessions.size,
    };
  }
}
