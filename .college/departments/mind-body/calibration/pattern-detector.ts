/**
 * Pattern Detector -- identifies practice patterns from journal data.
 *
 * Detects 5 pattern types:
 * 1. Consistency: user practices at regular times
 * 2. Preference: user returns to certain modules more often
 * 3. Avoidance: user rarely or never uses available modules
 * 4. Energy: specific modules correlate with higher post-session energy
 * 5. Growth: progressive improvement in duration or engagement
 *
 * Minimum 5 entries required before pattern detection activates.
 * Each pattern carries a confidence score (0-1) and a suggestion.
 *
 * @module departments/mind-body/calibration/pattern-detector
 */

import type { JournalEntry, MindBodyWingId } from '../types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** The five types of practice patterns the system detects. */
export type PatternType = 'consistency' | 'preference' | 'avoidance' | 'energy' | 'growth';

/** A detected pattern with confidence score and actionable suggestion. */
export interface DetectedPattern {
  type: PatternType;
  confidence: number;
  description: string;
  suggestion: string;
}

// ─── All Available Modules ──────────────────────────────────────────────────

const ALL_MODULES: MindBodyWingId[] = [
  'breath', 'meditation', 'yoga', 'pilates',
  'martial-arts', 'tai-chi', 'relaxation', 'philosophy',
];

// ─── PatternDetector ────────────────────────────────────────────────────────

/**
 * Analyzes journal entries to detect practice patterns.
 *
 * Requires a minimum of 5 entries before producing any patterns.
 * All detected patterns include a confidence score and a constructive
 * suggestion -- never guilt-based language.
 */
export class PatternDetector {
  /** Minimum entries required before detection activates. */
  private static readonly MIN_ENTRIES = 5;

  /**
   * Detect all patterns present in the given journal entries.
   * Returns an empty array if fewer than MIN_ENTRIES are provided.
   */
  detectPatterns(entries: JournalEntry[]): DetectedPattern[] {
    if (entries.length < PatternDetector.MIN_ENTRIES) {
      return [];
    }

    const patterns: DetectedPattern[] = [];

    const consistency = this.detectConsistency(entries);
    if (consistency) patterns.push(consistency);

    const preference = this.detectPreference(entries);
    if (preference) patterns.push(preference);

    const avoidance = this.detectAvoidance(entries);
    if (avoidance) patterns.push(avoidance);

    const energy = this.detectEnergy(entries);
    if (energy) patterns.push(energy);

    const growth = this.detectGrowth(entries);
    if (growth) patterns.push(growth);

    return patterns;
  }

  // ─── Consistency ────────────────────────────────────────────────────────

  /**
   * Detect whether the user practices at consistent times.
   * Analyzes day-of-week distribution for clustering.
   */
  private detectConsistency(entries: JournalEntry[]): DetectedPattern | null {
    // Analyze day-of-week distribution
    const dayCounts = new Map<number, number>();
    for (const entry of entries) {
      const day = entry.date.getDay();
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    }

    // Check if entries cluster on certain days
    const totalDays = dayCounts.size;
    if (totalDays === 0) return null;

    // Find the most common day(s)
    const maxCount = Math.max(...dayCounts.values());
    const avgCount = entries.length / 7;

    // Confidence based on how concentrated the entries are
    const concentration = maxCount / entries.length;
    const confidence = Math.min(1, concentration * 1.5);

    if (confidence < 0.3) return null;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const topDays = [...dayCounts.entries()]
      .filter(([, count]) => count >= avgCount)
      .sort((a, b) => b[1] - a[1])
      .map(([day]) => dayNames[day]);

    return {
      type: 'consistency',
      confidence,
      description: `Practice tends to happen on ${topDays.join(', ')}.`,
      suggestion: `Consider scheduling sessions on ${topDays.join(' and ')} for a regular rhythm.`,
    };
  }

  // ─── Preference ─────────────────────────────────────────────────────────

  /**
   * Detect which modules the user gravitates toward.
   */
  private detectPreference(entries: JournalEntry[]): DetectedPattern | null {
    const moduleCounts = this.countModules(entries);
    if (moduleCounts.size === 0) return null;

    const sorted = [...moduleCounts.entries()].sort((a, b) => b[1] - a[1]);
    const [topModule, topCount] = sorted[0];
    const totalModuleUses = [...moduleCounts.values()].reduce((a, b) => a + b, 0);

    const dominance = topCount / totalModuleUses;
    const confidence = Math.min(1, dominance * 2);

    if (confidence < 0.3) return null;

    const moduleName = this.moduleName(topModule);
    const relatedModules = this.relatedModules(topModule);

    return {
      type: 'preference',
      confidence,
      description: `${moduleName} is the most practiced module (${topCount} sessions).`,
      suggestion: relatedModules.length > 0
        ? `Deepen ${moduleName} practice, and explore related ${relatedModules.join(', ')}.`
        : `Continue deepening ${moduleName} practice.`,
    };
  }

  // ─── Avoidance ──────────────────────────────────────────────────────────

  /**
   * Detect modules the user has never or rarely practiced.
   * Suggestion is always constructive -- never nagging.
   */
  private detectAvoidance(entries: JournalEntry[]): DetectedPattern | null {
    const moduleCounts = this.countModules(entries);
    const usedModules = new Set(moduleCounts.keys());

    const unusedModules = ALL_MODULES.filter((m) => !usedModules.has(m));
    if (unusedModules.length === 0) return null;

    // Confidence based on how many entries we have (more entries = more confident
    // that unused modules are genuinely avoided, not just not-yet-tried)
    const confidence = Math.min(1, entries.length / 15);
    if (confidence < 0.3) return null;

    const names = unusedModules.slice(0, 3).map((m) => this.moduleName(m));

    // Find the user's favorite module for weaving suggestion
    const sorted = [...moduleCounts.entries()].sort((a, b) => b[1] - a[1]);
    const favoriteName = sorted.length > 0 ? this.moduleName(sorted[0][0]) : 'your practice';

    return {
      type: 'avoidance',
      confidence,
      description: `${names.join(', ')} ${names.length === 1 ? 'has' : 'have'} not appeared in practice yet.`,
      suggestion: `Brief ${names[0].toLowerCase()} moments can be woven into ${favoriteName.toLowerCase()} sessions.`,
    };
  }

  // ─── Energy ─────────────────────────────────────────────────────────────

  /**
   * Detect which modules correlate with the highest post-session energy.
   */
  private detectEnergy(entries: JournalEntry[]): DetectedPattern | null {
    // Aggregate energy-after scores per module
    const moduleEnergy = new Map<MindBodyWingId, number[]>();
    for (const entry of entries) {
      for (const mod of entry.modules) {
        if (!moduleEnergy.has(mod)) moduleEnergy.set(mod, []);
        moduleEnergy.get(mod)!.push(entry.energyAfter);
      }
    }

    if (moduleEnergy.size < 2) return null;

    // Compute average energy per module
    const averages = new Map<MindBodyWingId, number>();
    for (const [mod, scores] of moduleEnergy) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      averages.set(mod, avg);
    }

    const sorted = [...averages.entries()].sort((a, b) => b[1] - a[1]);
    const [bestModule, bestAvg] = sorted[0];
    const [worstModule, worstAvg] = sorted[sorted.length - 1];

    const spread = bestAvg - worstAvg;
    if (spread < 0.5) return null;

    const confidence = Math.min(1, spread / 2);

    return {
      type: 'energy',
      confidence,
      description: `Energy tends to be higher after ${this.moduleName(bestModule)} sessions (avg ${bestAvg.toFixed(1)}).`,
      suggestion: `On low-energy days, ${this.moduleName(bestModule).toLowerCase()} may be a good choice.`,
    };
  }

  // ─── Growth ─────────────────────────────────────────────────────────────

  /**
   * Detect progressive improvement -- increasing session durations over time.
   */
  private detectGrowth(entries: JournalEntry[]): DetectedPattern | null {
    if (entries.length < PatternDetector.MIN_ENTRIES) return null;

    // Sort by date ascending
    const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Compare first half average duration to second half
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const avgFirst = firstHalf.reduce((s, e) => s + e.durationMinutes, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, e) => s + e.durationMinutes, 0) / secondHalf.length;

    if (avgSecond <= avgFirst) return null;

    const growthRate = (avgSecond - avgFirst) / avgFirst;
    const confidence = Math.min(1, growthRate * 2);

    if (confidence < 0.2) return null;

    return {
      type: 'growth',
      confidence,
      description: `Session duration has increased from avg ${Math.round(avgFirst)} min to ${Math.round(avgSecond)} min.`,
      suggestion: 'The practice is deepening. Consider exploring the next progression level.',
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private countModules(entries: JournalEntry[]): Map<MindBodyWingId, number> {
    const counts = new Map<MindBodyWingId, number>();
    for (const entry of entries) {
      for (const mod of entry.modules) {
        counts.set(mod, (counts.get(mod) || 0) + 1);
      }
    }
    return counts;
  }

  private moduleName(id: MindBodyWingId): string {
    const names: Record<MindBodyWingId, string> = {
      'breath': 'Breath',
      'meditation': 'Meditation',
      'yoga': 'Yoga',
      'pilates': 'Pilates',
      'martial-arts': 'Martial Arts',
      'tai-chi': 'Tai Chi',
      'relaxation': 'Relaxation',
      'philosophy': 'Philosophy',
    };
    return names[id] || id;
  }

  private relatedModules(id: MindBodyWingId): string[] {
    const relations: Partial<Record<MindBodyWingId, MindBodyWingId[]>> = {
      'tai-chi': ['martial-arts', 'meditation'],
      'yoga': ['pilates', 'breath'],
      'meditation': ['breath', 'philosophy'],
      'martial-arts': ['tai-chi', 'meditation'],
      'pilates': ['yoga', 'breath'],
      'breath': ['meditation', 'yoga'],
      'relaxation': ['meditation', 'breath'],
      'philosophy': ['meditation'],
    };
    return (relations[id] || []).map((m) => this.moduleName(m));
  }
}
