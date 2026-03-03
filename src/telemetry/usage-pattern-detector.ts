/**
 * UsagePatternDetector — analyzes accumulated telemetry events and produces
 * a structured report of skill health patterns.
 *
 * Reads from EventStore; produces PatternDetectionResult.
 * Returns PatternInsufficient when fewer than minimumSessions are present.
 *
 * Privacy: operates only on skill names, scores, and session IDs — never
 * on user message content.
 */

import type { EventStore } from './event-store.js';
import type {
  PatternDetectionResult,
  PatternReport,
  PatternInsufficient,
  SkillPatternEntry,
  PatternDetectorConfig,
} from './types.js';

const DEFAULT_CONFIG: Required<PatternDetectorConfig> = {
  minimumSessions: 10,
  deadSkillSessionThreshold: 30,
  budgetCasualtyMinSessions: 5,
  budgetCasualtySkipRate: 0.5,
  correctionMagnetMinLoads: 5,
  correctionMagnetRate: 0.3,
  scoreDriftMinEvents: 10,
  scoreDriftMinDrop: 0.15,
  loadNeverActivateMinLoads: 5,
  loadNeverActivateMinScore: 0.5,
};

interface SkillAccumulator {
  scoredSessions: Set<string>;
  scoredScores: number[];
  loadedSessions: Set<string>;
  skippedSessions: Set<string>;
  correctionSessions: Set<string>;
  scoredEventsChronological: Array<{ timestamp: string; score: number }>;
}

export class UsagePatternDetector {
  private config: Required<PatternDetectorConfig>;

  constructor(
    private store: EventStore,
    config?: PatternDetectorConfig,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze all events in the store and return a PatternDetectionResult.
   *
   * Returns PatternInsufficient if fewer than minimumSessions are present.
   * Returns PatternReport otherwise.
   */
  async analyze(): Promise<PatternDetectionResult> {
    const events = await this.store.read();

    // Step 1: count distinct sessions across all events
    const allSessionIds = new Set<string>();
    for (const event of events) {
      allSessionIds.add(event.sessionId);
    }
    const totalSessions = allSessionIds.size;

    // Step 2: minimum session gate (PTRN-07)
    if (totalSessions < this.config.minimumSessions) {
      const result: PatternInsufficient = {
        type: 'insufficient',
        sessionCount: totalSessions,
        minimumRequired: this.config.minimumSessions,
        message: `Pattern detection requires at least ${this.config.minimumSessions} sessions. Current: ${totalSessions} session(s). Collect more usage data and try again.`,
      };
      return result;
    }

    // Step 3: build per-skill stats in one pass
    const accMap = new Map<string, SkillAccumulator>();

    const getOrCreate = (skillName: string): SkillAccumulator => {
      let acc = accMap.get(skillName);
      if (!acc) {
        acc = {
          scoredSessions: new Set<string>(),
          scoredScores: [],
          loadedSessions: new Set<string>(),
          skippedSessions: new Set<string>(),
          correctionSessions: new Set<string>(),
          scoredEventsChronological: [],
        };
        accMap.set(skillName, acc);
      }
      return acc;
    };

    for (const event of events) {
      if (event.type === 'skill-scored') {
        const acc = getOrCreate(event.skillName);
        acc.scoredSessions.add(event.sessionId);
        acc.scoredScores.push(event.score);
        acc.scoredEventsChronological.push({ timestamp: event.timestamp, score: event.score });
      } else if (event.type === 'skill-loaded') {
        const acc = getOrCreate(event.skillName);
        acc.loadedSessions.add(event.sessionId);
      } else if (event.type === 'skill-budget-skipped') {
        const acc = getOrCreate(event.skillName);
        acc.skippedSessions.add(event.sessionId);
      } else if (event.type === 'skill-correction') {
        const acc = getOrCreate(event.skillName);
        acc.correctionSessions.add(event.sessionId);
      }
    }

    // Step 4: build SkillPatternEntry[] from accumulators
    const analyzedSkills: SkillPatternEntry[] = [];
    for (const [skillName, acc] of accMap) {
      const sessionCount = acc.scoredSessions.size;
      const loadCount = acc.loadedSessions.size;
      const budgetSkipCount = acc.skippedSessions.size;
      const avgScore =
        acc.scoredScores.length > 0
          ? acc.scoredScores.reduce((sum, s) => sum + s, 0) / acc.scoredScores.length
          : 0;
      const loadRate = totalSessions > 0 ? loadCount / totalSessions : 0;
      const budgetSkipRate = sessionCount > 0 ? budgetSkipCount / sessionCount : 0;

      analyzedSkills.push({
        skillName,
        sessionCount,
        loadCount,
        budgetSkipCount,
        avgScore,
        loadRate,
        budgetSkipRate,
      });
    }

    // Step 5: dead skill detection (PTRN-02)
    // Only fires when totalSessions >= deadSkillSessionThreshold
    const deadSkills: string[] = [];
    if (totalSessions >= this.config.deadSkillSessionThreshold) {
      for (const entry of analyzedSkills) {
        const hasScored = entry.sessionCount > 0;
        const hasPresence = entry.loadCount > 0 || entry.budgetSkipCount > 0;
        if (!hasScored && hasPresence) {
          deadSkills.push(entry.skillName);
        }
      }
    }

    // Step 6: high-value detection (PTRN-01)
    // Sort skills with loadCount > 0 by loadRate × avgScore descending
    const loadedSkills = analyzedSkills.filter(e => e.loadCount > 0);
    loadedSkills.sort((a, b) => b.loadRate * b.avgScore - a.loadRate * a.avgScore);
    const topN = Math.max(1, Math.ceil(loadedSkills.length * 0.1));
    const highValueSkills = loadedSkills.slice(0, topN).map(e => e.skillName);

    // Step 7: budget casualty detection (PTRN-03)
    const budgetCasualties: string[] = [];
    for (const entry of analyzedSkills) {
      if (
        entry.sessionCount >= this.config.budgetCasualtyMinSessions &&
        entry.budgetSkipRate > this.config.budgetCasualtySkipRate
      ) {
        budgetCasualties.push(entry.skillName);
      }
    }

    // Step 8: correction magnet detection (PTRN-04)
    const correctionMagnets: string[] = [];
    for (const [skillName, acc] of accMap) {
      const loadCount = acc.loadedSessions.size;
      if (loadCount >= this.config.correctionMagnetMinLoads) {
        const correctionRate = acc.correctionSessions.size / loadCount;
        if (correctionRate > this.config.correctionMagnetRate) {
          correctionMagnets.push(skillName);
        }
      }
    }

    // Step 9: score drift detection (PTRN-05)
    const scoreDriftSkills: string[] = [];
    for (const [skillName, acc] of accMap) {
      const chronological = [...acc.scoredEventsChronological].sort(
        (a, b) => a.timestamp.localeCompare(b.timestamp)
      );
      if (chronological.length < this.config.scoreDriftMinEvents) continue;

      const mid = Math.floor(chronological.length / 2);
      const earlyHalf = chronological.slice(0, mid);
      const recentHalf = chronological.slice(mid);

      const earlyAvg = earlyHalf.reduce((s, e) => s + e.score, 0) / earlyHalf.length;
      const recentAvg = recentHalf.reduce((s, e) => s + e.score, 0) / recentHalf.length;

      if (recentAvg < earlyAvg * (1 - this.config.scoreDriftMinDrop)) {
        scoreDriftSkills.push(skillName);
      }
    }

    // Step 10: load-but-never-activate detection (PTRN-06)
    const loadNeverActivateSkills: string[] = [];
    for (const [skillName, acc] of accMap) {
      if (acc.loadedSessions.size < this.config.loadNeverActivateMinLoads) continue;
      if (acc.correctionSessions.size > 0) continue; // had corrections = was activated
      const hasHighScore = acc.scoredEventsChronological.some(
        e => e.score >= this.config.loadNeverActivateMinScore
      );
      if (hasHighScore) continue; // scored well = was relevant
      loadNeverActivateSkills.push(skillName);
    }

    const report: PatternReport = {
      type: 'report',
      totalSessions,
      analyzedSkills,
      highValueSkills,
      deadSkills,
      budgetCasualties,
      correctionMagnets,
      scoreDriftSkills,
      loadNeverActivateSkills,
    };

    return report;
  }
}
