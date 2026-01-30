import { SessionObservation } from '../types/observation.js';

export interface SkillCoActivation {
  skillPair: [string, string];  // Alphabetically sorted for consistency
  coActivationCount: number;
  sessions: string[];           // Session IDs where both were active
  firstSeen: number;            // Timestamp of first co-activation
  lastSeen: number;             // Timestamp of most recent
}

export interface CoActivationConfig {
  minCoActivations: number;     // Minimum times to report (default 3)
  recencyDays: number;          // Only consider sessions within N days (default 14)
}

export const DEFAULT_COACTIVATION_CONFIG: CoActivationConfig = {
  minCoActivations: 3,
  recencyDays: 14,
};

/**
 * CoActivationTracker detects when skills frequently activate together.
 * This data feeds the cluster detection system for agent suggestions.
 */
export class CoActivationTracker {
  private config: CoActivationConfig;

  constructor(config?: Partial<CoActivationConfig>) {
    this.config = { ...DEFAULT_COACTIVATION_CONFIG, ...config };
  }

  /**
   * Analyze session observations for co-activation patterns
   * Returns pairs of skills that frequently activate together
   */
  analyze(sessions: SessionObservation[]): SkillCoActivation[] {
    const coActivationMap = new Map<string, SkillCoActivation>();
    const cutoff = Date.now() - this.config.recencyDays * 24 * 60 * 60 * 1000;

    // Filter to recent sessions
    const recentSessions = sessions.filter(s => s.startTime >= cutoff);

    for (const session of recentSessions) {
      const skills = session.activeSkills || [];
      if (skills.length < 2) continue;

      // Generate all pairs (combinations, not permutations)
      for (let i = 0; i < skills.length; i++) {
        for (let j = i + 1; j < skills.length; j++) {
          // Sort alphabetically for consistent key
          const pair = [skills[i], skills[j]].sort() as [string, string];
          const key = pair.join(':');

          if (!coActivationMap.has(key)) {
            coActivationMap.set(key, {
              skillPair: pair,
              coActivationCount: 0,
              sessions: [],
              firstSeen: session.startTime,
              lastSeen: session.startTime,
            });
          }

          const entry = coActivationMap.get(key)!;
          entry.coActivationCount++;
          entry.sessions.push(session.sessionId);
          entry.firstSeen = Math.min(entry.firstSeen, session.startTime);
          entry.lastSeen = Math.max(entry.lastSeen, session.startTime);
        }
      }
    }

    // Filter by threshold and sort by count descending
    return Array.from(coActivationMap.values())
      .filter(ca => ca.coActivationCount >= this.config.minCoActivations)
      .sort((a, b) => b.coActivationCount - a.coActivationCount);
  }

  /**
   * Get co-activation score for a specific skill pair (0-1)
   * Higher score = more consistent co-activation
   */
  getCoActivationScore(
    skillA: string,
    skillB: string,
    sessions: SessionObservation[]
  ): number {
    const pair = [skillA, skillB].sort();
    const key = pair.join(':');

    // Analyze all sessions to find this pair
    const results = this.analyze(sessions);
    const found = results.find(ca => ca.skillPair.join(':') === key);

    if (!found) return 0;

    // Score based on frequency and recency
    const recentSessions = sessions.filter(
      s => s.startTime >= Date.now() - this.config.recencyDays * 24 * 60 * 60 * 1000
    );
    const maxPossible = Math.max(recentSessions.length, 1);
    const frequencyScore = found.coActivationCount / maxPossible;

    // Recency boost (last seen within 3 days gets full boost)
    const daysSinceLastSeen =
      (Date.now() - found.lastSeen) / (24 * 60 * 60 * 1000);
    const recencyBoost = Math.max(
      0,
      1 - daysSinceLastSeen / this.config.recencyDays
    );

    return Math.min(1, frequencyScore * 0.7 + recencyBoost * 0.3);
  }

  /**
   * Get all skills that frequently co-activate with a given skill
   */
  getRelatedSkills(
    skillName: string,
    sessions: SessionObservation[]
  ): Array<{ skill: string; count: number }> {
    const results = this.analyze(sessions);
    const related: Array<{ skill: string; count: number }> = [];

    for (const ca of results) {
      if (ca.skillPair.includes(skillName)) {
        const other = ca.skillPair.find(s => s !== skillName)!;
        related.push({ skill: other, count: ca.coActivationCount });
      }
    }

    return related.sort((a, b) => b.count - a.count);
  }
}
