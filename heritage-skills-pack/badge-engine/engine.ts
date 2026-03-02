/**
 * Trail Badge Engine — progression system, practice journal, and teach-it evaluation.
 *
 * Implements the state machine for badge tier advancement, the immutable practice journal
 * (no-guilt UX), and the "Can You Teach It?" evaluator for Keeper-tier verification.
 *
 * Uses Phase 2 types from `phase2-types.ts` — does not define new badge types.
 *
 * Design patterns follow the Skill Hall Framework (skill-hall/framework.ts):
 * - Constructor injection for testability
 * - Immutable data structures (PracticeJournal operations return new objects)
 * - JSON loaded via readFileSync + dirname(fileURLToPath(import.meta.url)) pattern
 *
 * @module heritage-skills-pack/badge-engine/engine
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BadgePath,
  BadgeTier,
  type HeritageBadge,
  type BadgeComponent,
  type PracticeJournal,
  type JournalEntry,
  type TraditionV2,
  type RoomNumberV2,
} from '../shared/phase2-types.js';

import { CulturalSovereigntyLevel } from '../shared/types.js';

// ─── Re-exports ───────────────────────────────────────────────────────────────

export {
  BadgePath,
  BadgeTier,
  CulturalSovereigntyLevel,
};

export type {
  HeritageBadge,
  BadgeComponent,
  PracticeJournal,
  JournalEntry,
  TraditionV2,
  RoomNumberV2,
};

// ─── Engine-Local Interfaces ──────────────────────────────────────────────────

/** Result of evaluating a learner's current tier eligibility for a badge. */
export interface TierEligibility {
  badgeId: string;
  /** null = no progress yet */
  currentTier: BadgeTier | null;
  /** null = already at KEEPER */
  nextTier: BadgeTier | null;
  canAdvance: boolean;
  /** reasons why advancement is blocked */
  blockers: string[];
}

/** Result of a "Can You Teach It?" evaluation at Keeper tier. */
export interface TeachItResult {
  badgeId: string;
  learnerId: string;
  passed: boolean;
  /** 0-100 */
  accuracyScore: number;
  /** 0-100 */
  completenessScore: number;
  /** 0-100 */
  culturalSensitivityScore: number;
  /** 0-100 */
  attributionScore: number;
  /** average of 4 dimensions */
  overallScore: number;
  feedback: string;
  /** any pan-Indigenous language found */
  culturalAttributionViolations: string[];
}

/** Summary of a badge path's progress for a learner. */
export interface PathProgress {
  path: BadgePath;
  /** badge IDs at any tier */
  badgesEarned: string[];
  /** null = no badges earned */
  highestTier: BadgeTier | null;
  /** has at least Keeper in this path */
  isEagleEligible: boolean;
}

/** Eagle-equivalent eligibility assessment. */
export interface EagleEligibility {
  isEligible: boolean;
  keeperPathsCount: number;
  heritageBookComplete: boolean;
  neighborsBadgeEarned: boolean;
  teachItComplete: boolean;
  missingCriteria: string[];
}

// ─── Tier Order ───────────────────────────────────────────────────────────────

const TIER_ORDER: BadgeTier[] = [
  BadgeTier.EXPLORER,
  BadgeTier.APPRENTICE,
  BadgeTier.JOURNEYMAN,
  BadgeTier.KEEPER,
];

function getTierIndex(tier: BadgeTier): number {
  return TIER_ORDER.indexOf(tier);
}

function getNextTier(tier: BadgeTier): BadgeTier | null {
  const idx = getTierIndex(tier);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1] ?? null;
}

// ─── BadgeEngine ──────────────────────────────────────────────────────────────

/**
 * Core badge state machine.
 *
 * Loads all badge data from JSON files at construction time. Provides methods
 * for querying badges, checking tier eligibility, tracking path progress, and
 * assessing Eagle-equivalent eligibility.
 *
 * @example
 * ```typescript
 * const engine = new BadgeEngine();
 * const badge = engine.getBadge('shelter-explorer-01');
 * const eligibility = engine.checkTierEligibility('user-1', 'shelter-apprentice-01', journal);
 * ```
 */
export class BadgeEngine {
  private badges: Map<string, HeritageBadge>;
  private pathRoomMapping: Record<string, { rooms: number[]; badgesByRoom: Record<string, string[]> }>;
  private prerequisiteGraph: Record<string, string[]>;
  private eagleCriteria: {
    keeperBadgesRequired: number;
    heritageBookRequired: boolean;
    neighborsBadgeRequired: boolean;
    teachItRequired: boolean;
  };

  constructor() {
    this.badges = new Map();
    this.pathRoomMapping = {};
    this.prerequisiteGraph = {};
    this.eagleCriteria = {
      keeperBadgesRequired: 3,
      heritageBookRequired: true,
      neighborsBadgeRequired: true,
      teachItRequired: true,
    };
    this.loadData();
  }

  /**
   * Load all JSON data files.
   *
   * Uses readFileSync with dirname(fileURLToPath(import.meta.url)) for reliable
   * path resolution in both development and installed contexts.
   */
  private loadData(): void {
    const dir = dirname(fileURLToPath(import.meta.url));

    try {
      const badgesRaw = readFileSync(join(dir, 'badge-definitions.json'), 'utf8');
      const badgesArray: HeritageBadge[] = JSON.parse(badgesRaw) as HeritageBadge[];
      for (const badge of badgesArray) {
        this.badges.set(badge.id, badge);
      }
    } catch (err) {
      throw new Error(`BadgeEngine: failed to load badge-definitions.json — ${String(err)}`);
    }

    try {
      const mappingRaw = readFileSync(join(dir, 'path-room-mapping.json'), 'utf8');
      this.pathRoomMapping = JSON.parse(mappingRaw) as Record<string, { rooms: number[]; badgesByRoom: Record<string, string[]> }>;
    } catch (err) {
      throw new Error(`BadgeEngine: failed to load path-room-mapping.json — ${String(err)}`);
    }

    try {
      const graphRaw = readFileSync(join(dir, 'badge-prerequisite-graph.json'), 'utf8');
      this.prerequisiteGraph = JSON.parse(graphRaw) as Record<string, string[]>;
    } catch (err) {
      throw new Error(`BadgeEngine: failed to load badge-prerequisite-graph.json — ${String(err)}`);
    }

    try {
      const eagleRaw = readFileSync(join(dir, 'eagle-equivalent-criteria.json'), 'utf8');
      const eagleData = JSON.parse(eagleRaw) as {
        criteria: {
          keeperBadgesRequired: number;
          heritageBookRequired: boolean;
          neighborsBadgeRequired: boolean;
          teachItRequired: boolean;
        };
      };
      this.eagleCriteria = eagleData.criteria;
    } catch (err) {
      throw new Error(`BadgeEngine: failed to load eagle-equivalent-criteria.json — ${String(err)}`);
    }
  }

  /**
   * Get a badge by ID.
   *
   * @param badgeId - The badge identifier.
   * @returns The HeritageBadge or undefined if not found.
   */
  getBadge(badgeId: string): HeritageBadge | undefined {
    return this.badges.get(badgeId);
  }

  /**
   * Get all badges associated with a room.
   *
   * Scans pathRoomMapping for any path where badgesByRoom[String(roomId)] exists.
   * Returns all badges matching those IDs.
   *
   * @param roomId - The room number (1-18).
   * @returns Array of HeritageBadge objects for that room.
   */
  getBadgesForRoom(roomId: RoomNumberV2): HeritageBadge[] {
    const roomKey = String(roomId);
    const badgeIds: string[] = [];

    for (const pathData of Object.values(this.pathRoomMapping)) {
      const roomBadges = pathData.badgesByRoom[roomKey];
      if (roomBadges) {
        badgeIds.push(...roomBadges);
      }
    }

    return badgeIds
      .map((id) => this.badges.get(id))
      .filter((b): b is HeritageBadge => b !== undefined);
  }

  /**
   * Get all badges for a badge path, sorted by tier order.
   *
   * @param path - The BadgePath to query.
   * @returns Array of HeritageBadge objects sorted explorer -> apprentice -> journeyman -> keeper.
   */
  getBadgesForPath(path: BadgePath): HeritageBadge[] {
    return [...this.badges.values()]
      .filter((b) => b.path === path)
      .sort((a, b) => getTierIndex(a.tier) - getTierIndex(b.tier));
  }

  /**
   * Check whether a learner can advance to the specified badge.
   *
   * Determines current tier from journal, checks prerequisites, and returns
   * TierEligibility with canAdvance=true only if all prerequisites are satisfied.
   *
   * @param learnerId - The learner identifier (for TeachItResult correlation).
   * @param badgeId   - The badge to check eligibility for.
   * @param journal   - The learner's PracticeJournal.
   * @returns TierEligibility assessment.
   */
  checkTierEligibility(learnerId: string, badgeId: string, journal: PracticeJournal): TierEligibility {
    const badge = this.badges.get(badgeId);
    if (!badge) {
      throw new Error(`BadgeEngine: unknown badge ID '${badgeId}'`);
    }

    // Determine current tier: find any badge earned that matches this badge's
    // path + progression. We check whether this exact badgeId is in badgesEarned,
    // or if any badge for the same path is earned.
    const earnedInPath = journal.badgesEarned.filter((id) => {
      const b = this.badges.get(id);
      return b !== undefined && b.path === badge.path;
    });

    let currentTier: BadgeTier | null = null;
    for (const earnedId of earnedInPath) {
      const earnedBadge = this.badges.get(earnedId);
      if (!earnedBadge) continue;
      if (currentTier === null || getTierIndex(earnedBadge.tier) > getTierIndex(currentTier)) {
        currentTier = earnedBadge.tier;
      }
    }

    // Determine next tier from the target badge's tier
    const nextTier = getNextTier(badge.tier);

    // Check prerequisites
    const requiredPrereqs = this.prerequisiteGraph[badgeId] ?? badge.prerequisites ?? [];
    const blockers: string[] = [];

    for (const prereqId of requiredPrereqs) {
      if (!journal.badgesEarned.includes(prereqId)) {
        blockers.push(`Prerequisite not earned: ${prereqId}`);
      }
    }

    return {
      badgeId,
      currentTier,
      nextTier,
      canAdvance: blockers.length === 0,
      blockers,
    };
  }

  /**
   * Get a summary of a learner's progress along a badge path.
   *
   * @param path    - The BadgePath to query.
   * @param journal - The learner's PracticeJournal.
   * @returns PathProgress summary.
   */
  getPathProgress(path: BadgePath, journal: PracticeJournal): PathProgress {
    const pathBadges = this.getBadgesForPath(path);
    const pathBadgeIds = new Set(pathBadges.map((b) => b.id));

    const badgesEarned = journal.badgesEarned.filter((id) => pathBadgeIds.has(id));

    let highestTier: BadgeTier | null = null;
    for (const earnedId of badgesEarned) {
      const badge = this.badges.get(earnedId);
      if (!badge) continue;
      if (highestTier === null || getTierIndex(badge.tier) > getTierIndex(highestTier)) {
        highestTier = badge.tier;
      }
    }

    return {
      path,
      badgesEarned,
      highestTier,
      isEagleEligible: highestTier === BadgeTier.KEEPER,
    };
  }

  /**
   * Assess whether a learner meets the Eagle-equivalent (Heritage Keeper) criteria.
   *
   * Checks: 3+ Keeper-tier paths, Heritage Book completion, Neighbors badge at
   * Apprentice or higher, and at least one Teach-It verification.
   *
   * @param journal              - The learner's PracticeJournal.
   * @param heritageBookComplete - Whether the learner has completed a Heritage Book.
   * @param teachItComplete      - Whether the learner has completed a Teach-It verification.
   * @returns EagleEligibility assessment.
   */
  assessEagleEligibility(
    journal: PracticeJournal,
    heritageBookComplete: boolean,
    teachItComplete: boolean,
  ): EagleEligibility {
    const missingCriteria: string[] = [];

    // Count paths with at least one Keeper-tier badge
    let keeperPathsCount = 0;
    for (const path of Object.values(BadgePath)) {
      const progress = this.getPathProgress(path, journal);
      if (progress.isEagleEligible) {
        keeperPathsCount++;
      }
    }

    if (keeperPathsCount < this.eagleCriteria.keeperBadgesRequired) {
      missingCriteria.push(
        `Need Keeper badges in ${this.eagleCriteria.keeperBadgesRequired} paths (currently ${keeperPathsCount})`,
      );
    }

    // Check Neighbors badge at Apprentice or higher
    const neighborsProgress = this.getPathProgress(BadgePath.NEIGHBORS, journal);
    const neighborsBadgeEarned =
      neighborsProgress.highestTier !== null &&
      getTierIndex(neighborsProgress.highestTier) >= getTierIndex(BadgeTier.APPRENTICE);

    if (!neighborsBadgeEarned) {
      missingCriteria.push(
        'Neighbors path requires at least Apprentice tier — social intelligence is not optional for Heritage Keeper recognition',
      );
    }

    if (!heritageBookComplete) {
      missingCriteria.push('Heritage Book project not completed (requires at least one community-reviewed chapter)');
    }

    if (!teachItComplete) {
      missingCriteria.push('Teach-It verification not completed (requires Keeper-level evaluation)');
    }

    const isEligible = missingCriteria.length === 0;

    return {
      isEligible,
      keeperPathsCount,
      heritageBookComplete,
      neighborsBadgeEarned,
      teachItComplete,
      missingCriteria,
    };
  }
}

// ─── PracticeJournalEngine ────────────────────────────────────────────────────

/**
 * Immutable Practice Journal operations.
 *
 * The Practice Journal is a no-guilt UX: entries are observations and practice
 * notes, not performance metrics. All operations return new journal objects
 * (functional/immutable update pattern).
 *
 * Entry types are first-class: observation, practice, reflection, sketch, and
 * teaching. No type is privileged for badge advancement.
 *
 * @example
 * ```typescript
 * const je = new PracticeJournalEngine();
 * let journal = je.createJournal('user-1');
 * journal = je.addEntry(journal, { type: 'observation', content: 'Saw a birch tree.' });
 * journal = je.recordBadgeEarned(journal, 'shelter-explorer-01');
 * ```
 */
export class PracticeJournalEngine {
  /**
   * Create a new empty PracticeJournal for a learner.
   *
   * No-guilt UX: journal starts empty, no performance pressure.
   */
  createJournal(userId: string): PracticeJournal {
    return {
      userId,
      entries: [],
      badgesEarned: [],
      currentPaths: [],
    };
  }

  /**
   * Add a journal entry. Returns a new PracticeJournal (immutable update).
   *
   * Entries are observations, practice notes, reflections, sketches, or
   * teaching demonstrations — no type is privileged.
   *
   * @param journal - The current journal state.
   * @param entry   - Entry data (without date — date is set automatically).
   * @returns New journal with the entry appended.
   */
  addEntry(journal: PracticeJournal, entry: Omit<JournalEntry, 'date'>): PracticeJournal {
    const newEntry: JournalEntry = {
      ...entry,
      date: new Date().toISOString(),
    };
    return {
      ...journal,
      entries: [...journal.entries, newEntry],
    };
  }

  /**
   * Record a badge as earned. Returns updated journal.
   *
   * Idempotent: earning the same badge twice has no effect.
   *
   * @param journal  - The current journal state.
   * @param badgeId  - The badge ID to record as earned.
   * @returns New journal with badgeId in badgesEarned (if not already present).
   */
  recordBadgeEarned(journal: PracticeJournal, badgeId: string): PracticeJournal {
    if (journal.badgesEarned.includes(badgeId)) return journal;
    return {
      ...journal,
      badgesEarned: [...journal.badgesEarned, badgeId],
    };
  }

  /**
   * Get all entries for a specific badge.
   *
   * @param journal  - The journal to query.
   * @param badgeId  - The badge ID to filter by.
   * @returns Array of JournalEntry objects with matching badgeId.
   */
  getEntriesForBadge(journal: PracticeJournal, badgeId: string): JournalEntry[] {
    return journal.entries.filter((e) => e.badgeId === badgeId);
  }

  /**
   * Get all entries for a specific room.
   *
   * @param journal - The journal to query.
   * @param roomId  - The room number (1-18) to filter by.
   * @returns Array of JournalEntry objects with matching roomId.
   */
  getEntriesForRoom(journal: PracticeJournal, roomId: RoomNumberV2): JournalEntry[] {
    return journal.entries.filter((e) => e.roomId === roomId);
  }

  /**
   * Get badge milestones as markers on the journal trail.
   *
   * Returns entries of type 'teaching' which signal Keeper-tier progress.
   * Teaching entries represent the moment a learner demonstrates they can
   * teach a skill — the Foxfire standard.
   *
   * @param journal - The journal to query.
   * @returns Array of JournalEntry objects with type 'teaching'.
   */
  getTeachingEntries(journal: PracticeJournal): JournalEntry[] {
    return journal.entries.filter((e) => e.type === 'teaching');
  }
}

// ─── TeachItEvaluator ─────────────────────────────────────────────────────────

/**
 * Evaluates "Can You Teach It?" submissions for Keeper-tier badges.
 *
 * Evaluation dimensions:
 * - accuracy: factual correctness (does the explanation avoid errors?)
 * - completeness: does it cover the badge's skill/story/relationship components?
 * - culturalSensitivity: does it use nation-specific attribution?
 * - attribution: are sources named specifically (not pan-Indigenous generics)?
 *
 * Critical rule: pan-Indigenous language ("Native American", "Indigenous peoples",
 * etc.) causes immediate passed=false regardless of other scores. The Heritage Skills
 * pack requires nation-specific attribution throughout.
 *
 * @example
 * ```typescript
 * const evaluator = new TeachItEvaluator();
 * const badge = engine.getBadge('shelter-keeper-01')!;
 * const result = evaluator.evaluate('user-1', 'shelter-keeper-01', badge,
 *   'The Haudenosaunee longhouse and the Appalachian cabin both...');
 * console.log(result.passed, result.overallScore);
 * ```
 */
export class TeachItEvaluator {
  /**
   * Evaluate a learner's teach-it submission for a Keeper-tier badge.
   *
   * @param learnerId  - Learner identifier
   * @param badgeId    - Badge ID being evaluated
   * @param badge      - The HeritageBadge being evaluated against
   * @param submission - The learner's teach-it text submission
   * @returns TeachItResult with scores and feedback
   */
  evaluate(
    learnerId: string,
    badgeId: string,
    badge: HeritageBadge,
    submission: string,
  ): TeachItResult {
    const accuracyScore = this.scoreAccuracy(submission, badge);
    const completenessScore = this.scoreCompleteness(submission, badge);
    const culturalSensitivityScore = this.scoreCulturalSensitivity(submission);
    const attributionScore = this.scoreAttribution(submission, badge);
    const overallScore = Math.round(
      (accuracyScore + completenessScore + culturalSensitivityScore + attributionScore) / 4,
    );
    const culturalAttributionViolations = this.detectPanIndigenousLanguage(submission);

    // pan-Indigenous language causes immediate failure
    const passed =
      overallScore >= 70 &&
      culturalSensitivityScore >= 60 &&
      culturalAttributionViolations.length === 0;

    return {
      badgeId,
      learnerId,
      passed,
      accuracyScore,
      completenessScore,
      culturalSensitivityScore,
      attributionScore,
      overallScore,
      feedback: this.buildFeedback(passed, overallScore, culturalAttributionViolations),
      culturalAttributionViolations,
    };
  }

  private scoreAccuracy(submission: string, badge: HeritageBadge): number {
    // Basic length check: substantive submissions are at least 100 chars
    if (submission.length < 50) return 10;
    if (submission.length < 100) return 40;

    // If submission references key terms from badge components
    const keyTerms = badge.components.flatMap((c) =>
      c.content.split(/\s+/).filter((w) => w.length > 5).slice(0, 5),
    );
    const found = keyTerms.filter((term) =>
      submission.toLowerCase().includes(term.toLowerCase()),
    ).length;
    const ratio = keyTerms.length > 0 ? found / keyTerms.length : 0;
    return Math.min(100, Math.round(40 + ratio * 60));
  }

  private scoreCompleteness(submission: string, badge: HeritageBadge): number {
    // Check if each component type is addressed
    const componentTypes = badge.components.map((c) => c.type);
    const typeKeywords: Record<string, string[]> = {
      story: ['story', 'history', 'tradition', 'practice', 'origin', 'cultural'],
      skill: ['technique', 'method', 'step', 'process', 'how', 'skill', 'build', 'make', 'construct'],
      relationship: ['connection', 'similar', 'different', 'compare', 'tradition', 'across', 'both'],
      reflection: ['mean', 'value', 'why', 'important', 'understand', 'learn', 'teach'],
    };
    const found = componentTypes.filter((type) => {
      const keywords = typeKeywords[type] ?? [];
      return keywords.some((kw) => submission.toLowerCase().includes(kw));
    }).length;
    return Math.round((found / componentTypes.length) * 100);
  }

  private scoreCulturalSensitivity(submission: string): number {
    const panIndigenousViolations = this.detectPanIndigenousLanguage(submission);
    if (panIndigenousViolations.length > 0) return 20;

    // Check for respectful framing
    const respectfulPatterns = [/nation\b/i, /\btribe\b.*\bspecific\b/i, /tradition of\b/i, /\bpeople\b/i];
    const respectfulCount = respectfulPatterns.filter((p) => p.test(submission)).length;
    return Math.min(100, 60 + respectfulCount * 10);
  }

  private scoreAttribution(submission: string, badge: HeritageBadge): number {
    // Check that traditions in the badge are referenced specifically
    const nationPatterns = [
      /Anishinaabe|Haudenosaunee|Inuit|Cree|Dene|Lummi|Saanich|Kwakwaka'wakw|Nuu-chah-nulth|Haida|Coast Salish/i,
      /Appalachian|Scots-Irish|German|African American/i,
      /Inuinnait|Yup'ik|Inupiat|Tlingit/i,
    ];
    const found = nationPatterns.filter((p) => p.test(submission)).length;
    if (found === 0 && badge.traditions.length > 0) return 30;
    return Math.min(100, 50 + found * 25);
  }

  /**
   * Detect pan-Indigenous language in a submission.
   *
   * Returns an array of violation labels. Any violations cause passed=false
   * and drive culturalSensitivityScore to 20.
   *
   * This mirrors the Cultural Sovereignty Warden's enforceNationAttribution()
   * method — generic pan-Indigenous language is never acceptable in the Heritage
   * Skills pack, including in learner submissions.
   */
  detectPanIndigenousLanguage(submission: string): string[] {
    const violations: string[] = [];
    const panIndigenousPatterns: Array<[RegExp, string]> = [
      [/\bnative american(s)?\b/gi, '"Native American(s)"'],
      [/\bindigenous peoples?\b/gi, '"Indigenous peoples/people"'],
      [/\ball indigenous\b/gi, '"all Indigenous"'],
      [/\bindians?\b(?!.*\bocean\b)/gi, '"Indian(s)" (non-specific use)'],
      [/\bnatives?\b(?!.*(plant|species|flora|fauna|language|speaker))/gi, '"Native(s)" (non-specific use)'],
    ];
    for (const [pattern, label] of panIndigenousPatterns) {
      // Reset lastIndex for global regexes to prevent stale state bugs
      pattern.lastIndex = 0;
      if (pattern.test(submission)) {
        violations.push(label);
      }
    }
    return violations;
  }

  private buildFeedback(passed: boolean, overallScore: number, violations: string[]): string {
    if (!passed) {
      const parts: string[] = [];
      if (overallScore < 70) {
        parts.push(`Overall score ${overallScore}/100 — Keeper tier requires 70+.`);
      }
      if (violations.length > 0) {
        parts.push(`Pan-Indigenous language found: ${violations.join(', ')}. Use specific nation names.`);
      }
      return parts.join(' ') + ' Review the badge components and try again.';
    }
    return `Teach-it verified: ${overallScore}/100. You have demonstrated Keeper-level understanding. Well done.`;
  }
}
