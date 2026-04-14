/**
 * Tests for the Trail Badge Engine.
 *
 * Covers: BadgeEngine (data loading, room/path queries, tier eligibility, path
 * progress, Eagle eligibility), PracticeJournalEngine (journal operations,
 * immutability, no-guilt UX), TeachItEvaluator (evaluation dimensions, pan-
 * Indigenous language detection), and badge data integrity checks.
 *
 * Pattern follows heritage-skills-pack/skill-hall/framework.test.ts:
 * describe/it/expect, no async.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeAll } from 'vitest';

import {
  BadgeEngine,
  PracticeJournalEngine,
  TeachItEvaluator,
  BadgePath,
  BadgeTier,
} from './engine.js';

import type {
  PracticeJournal,
  HeritageBadge,
} from './engine.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));

function loadBadgesJson(): HeritageBadge[] {
  const raw = readFileSync(join(__dir, 'badge-definitions.json'), 'utf8');
  return JSON.parse(raw) as HeritageBadge[];
}

function emptyJournal(userId: string = 'test-learner'): PracticeJournal {
  return {
    userId,
    entries: [],
    badgesEarned: [],
    currentPaths: [],
  };
}

function journalWith(badgesEarned: string[]): PracticeJournal {
  return {
    userId: 'test-learner',
    entries: [],
    badgesEarned: [...badgesEarned],
    currentPaths: [],
  };
}

// ─── BadgeEngine — data loading ───────────────────────────────────────────────

describe('BadgeEngine — data loading', () => {
  let engine: BadgeEngine;

  beforeAll(() => {
    engine = new BadgeEngine();
  });

  it('loads badge definitions without error', () => {
    expect(engine).toBeDefined();
  });

  it('has at least 18 badges loaded', () => {
    const shelterBadges = engine.getBadgesForPath(BadgePath.SHELTER);
    const foodBadges = engine.getBadgesForPath(BadgePath.FOOD);
    const fiberBadges = engine.getBadgesForPath(BadgePath.FIBER);
    const watercraftBadges = engine.getBadgesForPath(BadgePath.WATERCRAFT);
    const plantBadges = engine.getBadgesForPath(BadgePath.PLANT);
    const toolBadges = engine.getBadgesForPath(BadgePath.TOOL);
    const musicBadges = engine.getBadgesForPath(BadgePath.MUSIC);
    const neighborsBadges = engine.getBadgesForPath(BadgePath.NEIGHBORS);
    const heritageBadges = engine.getBadgesForPath(BadgePath.HERITAGE);

    const total = shelterBadges.length + foodBadges.length + fiberBadges.length +
      watercraftBadges.length + plantBadges.length + toolBadges.length +
      musicBadges.length + neighborsBadges.length + heritageBadges.length;

    expect(total).toBeGreaterThanOrEqual(18);
  });

  it('all 9 paths are represented in loaded badges', () => {
    const paths = Object.values(BadgePath);
    for (const path of paths) {
      const badges = engine.getBadgesForPath(path);
      expect(badges.length).toBeGreaterThan(0);
    }
  });

  it('getBadge returns shelter-explorer-01', () => {
    const badge = engine.getBadge('shelter-explorer-01');
    expect(badge).toBeDefined();
    expect(badge!.id).toBe('shelter-explorer-01');
    expect(badge!.tier).toBe(BadgeTier.EXPLORER);
    expect(badge!.path).toBe(BadgePath.SHELTER);
  });

  it('getBadge returns undefined for unknown id', () => {
    const badge = engine.getBadge('nonexistent-badge-999');
    expect(badge).toBeUndefined();
  });
});

// ─── BadgeEngine — room and path queries ─────────────────────────────────────

describe('BadgeEngine — room and path queries', () => {
  let engine: BadgeEngine;

  beforeAll(() => {
    engine = new BadgeEngine();
  });

  it('getBadgesForRoom(1) returns at least 1 badge', () => {
    const badges = engine.getBadgesForRoom(1);
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('getBadgesForRoom(1) includes shelter path badges', () => {
    const badges = engine.getBadgesForRoom(1);
    const shelterBadge = badges.find((b) => b.path === BadgePath.SHELTER);
    expect(shelterBadge).toBeDefined();
  });

  it('getBadgesForRoom(10) returns at least 1 badge', () => {
    const badges = engine.getBadgesForRoom(10);
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('getBadgesForRoom(10) includes neighbors or heritage path badges', () => {
    const badges = engine.getBadgesForRoom(10);
    const hasNeighborsOrHeritage = badges.some(
      (b) => b.path === BadgePath.NEIGHBORS || b.path === BadgePath.HERITAGE,
    );
    expect(hasNeighborsOrHeritage).toBe(true);
  });

  it('getBadgesForRoom(999) returns empty array', () => {
    const badges = engine.getBadgesForRoom(999 as never);
    expect(badges).toEqual([]);
  });

  it('getBadgesForPath(BadgePath.SHELTER) returns shelter badges only', () => {
    const badges = engine.getBadgesForPath(BadgePath.SHELTER);
    expect(badges.length).toBeGreaterThan(0);
    for (const badge of badges) {
      expect(badge.path).toBe(BadgePath.SHELTER);
    }
  });

  it('getBadgesForPath returns badges sorted by tier — first badge is explorer tier', () => {
    const badges = engine.getBadgesForPath(BadgePath.SHELTER);
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0]!.tier).toBe(BadgeTier.EXPLORER);
  });

  it('getBadgesForPath(BadgePath.NEIGHBORS) includes Keeper tier', () => {
    const badges = engine.getBadgesForPath(BadgePath.NEIGHBORS);
    const keeper = badges.find((b) => b.tier === BadgeTier.KEEPER);
    expect(keeper).toBeDefined();
  });
});

// ─── BadgeEngine — tier eligibility ──────────────────────────────────────────

describe('BadgeEngine — tier eligibility', () => {
  let engine: BadgeEngine;

  beforeAll(() => {
    engine = new BadgeEngine();
  });

  it('returns canAdvance:true for shelter-explorer-01 with no prerequisites', () => {
    const journal = emptyJournal();
    const eligibility = engine.checkTierEligibility('test-learner', 'shelter-explorer-01', journal);
    expect(eligibility.canAdvance).toBe(true);
    expect(eligibility.blockers).toHaveLength(0);
  });

  it('returns canAdvance:false for shelter-apprentice-01 when explorer not earned', () => {
    const journal = emptyJournal();
    const eligibility = engine.checkTierEligibility('test-learner', 'shelter-apprentice-01', journal);
    expect(eligibility.canAdvance).toBe(false);
  });

  it('returns canAdvance:true for shelter-apprentice-01 when explorer is earned', () => {
    const journal = journalWith(['shelter-explorer-01']);
    const eligibility = engine.checkTierEligibility('test-learner', 'shelter-apprentice-01', journal);
    expect(eligibility.canAdvance).toBe(true);
  });

  it('blockers list is empty when all prerequisites met', () => {
    const journal = journalWith(['shelter-explorer-01']);
    const eligibility = engine.checkTierEligibility('test-learner', 'shelter-apprentice-01', journal);
    expect(eligibility.blockers).toHaveLength(0);
  });

  it('blockers list has entries when prerequisites missing', () => {
    const journal = emptyJournal();
    const eligibility = engine.checkTierEligibility('test-learner', 'shelter-apprentice-01', journal);
    expect(eligibility.blockers.length).toBeGreaterThan(0);
    expect(eligibility.blockers[0]).toContain('shelter-explorer-01');
  });

  it('throws for unknown badge ID', () => {
    const journal = emptyJournal();
    expect(() =>
      engine.checkTierEligibility('test-learner', 'nonexistent-badge', journal),
    ).toThrow();
  });

  it('neighbors-keeper-01 requires all three prerequisite badges', () => {
    // Only partial prerequisites — missing journeyman
    const journal = journalWith(['neighbors-explorer-01', 'neighbors-apprentice-01']);
    const eligibility = engine.checkTierEligibility('test-learner', 'neighbors-keeper-01', journal);
    expect(eligibility.canAdvance).toBe(false);
    expect(eligibility.blockers.some((b) => b.includes('neighbors-journeyman-01'))).toBe(true);
  });

  it('neighbors-keeper-01 can advance when all prerequisites met', () => {
    const journal = journalWith([
      'neighbors-explorer-01',
      'neighbors-apprentice-01',
      'neighbors-journeyman-01',
    ]);
    const eligibility = engine.checkTierEligibility('test-learner', 'neighbors-keeper-01', journal);
    expect(eligibility.canAdvance).toBe(true);
  });
});

// ─── BadgeEngine — path progress ─────────────────────────────────────────────

describe('BadgeEngine — path progress', () => {
  let engine: BadgeEngine;

  beforeAll(() => {
    engine = new BadgeEngine();
  });

  it('returns null highestTier when no badges earned in path', () => {
    const journal = emptyJournal();
    const progress = engine.getPathProgress(BadgePath.SHELTER, journal);
    expect(progress.highestTier).toBeNull();
    expect(progress.badgesEarned).toHaveLength(0);
  });

  it('returns explorer highestTier when explorer badge earned', () => {
    const journal = journalWith(['shelter-explorer-01']);
    const progress = engine.getPathProgress(BadgePath.SHELTER, journal);
    expect(progress.highestTier).toBe(BadgeTier.EXPLORER);
  });

  it('returns apprentice highestTier when both explorer and apprentice earned', () => {
    const journal = journalWith(['shelter-explorer-01', 'shelter-apprentice-01']);
    const progress = engine.getPathProgress(BadgePath.SHELTER, journal);
    expect(progress.highestTier).toBe(BadgeTier.APPRENTICE);
  });

  it('isEagleEligible is false without keeper tier', () => {
    const journal = journalWith(['shelter-explorer-01', 'shelter-apprentice-01']);
    const progress = engine.getPathProgress(BadgePath.SHELTER, journal);
    expect(progress.isEagleEligible).toBe(false);
  });

  it('isEagleEligible is true when keeper tier earned', () => {
    const journal = journalWith(['shelter-keeper-01']);
    const progress = engine.getPathProgress(BadgePath.SHELTER, journal);
    expect(progress.isEagleEligible).toBe(true);
  });

  it('badgesEarned only includes badges from the queried path', () => {
    const journal = journalWith(['shelter-explorer-01', 'food-explorer-01']);
    const progress = engine.getPathProgress(BadgePath.SHELTER, journal);
    expect(progress.badgesEarned).toContain('shelter-explorer-01');
    expect(progress.badgesEarned).not.toContain('food-explorer-01');
  });
});

// ─── BadgeEngine — Eagle eligibility ─────────────────────────────────────────

describe('BadgeEngine — Eagle eligibility', () => {
  let engine: BadgeEngine;

  beforeAll(() => {
    engine = new BadgeEngine();
  });

  it('not eligible with no keeper badges', () => {
    const journal = emptyJournal();
    const eagle = engine.assessEagleEligibility(journal, false, false);
    expect(eagle.isEligible).toBe(false);
    expect(eagle.keeperPathsCount).toBe(0);
  });

  it('not eligible with fewer than 3 keeper paths', () => {
    const journal = journalWith(['shelter-keeper-01', 'food-keeper-01']);
    const eagle = engine.assessEagleEligibility(journal, true, true);
    expect(eagle.isEligible).toBe(false);
    expect(eagle.keeperPathsCount).toBeLessThan(3);
  });

  it('missingCriteria lists specific requirements when not met', () => {
    const journal = emptyJournal();
    const eagle = engine.assessEagleEligibility(journal, false, false);
    expect(eagle.missingCriteria.length).toBeGreaterThan(0);
  });

  it('neighbors badge requirement reflected in missingCriteria when neighbors not earned', () => {
    const journal = emptyJournal();
    const eagle = engine.assessEagleEligibility(journal, true, true);
    const neighborsMessage = eagle.missingCriteria.find((c) =>
      c.toLowerCase().includes('neighbors'),
    );
    expect(neighborsMessage).toBeDefined();
  });

  it('eligible when 3 keeper paths, heritage book, neighbors apprentice, and teach-it complete', () => {
    const journal = journalWith([
      'shelter-keeper-01',
      'food-keeper-01',
      'fiber-keeper-01',
      'neighbors-apprentice-01',
    ]);
    const eagle = engine.assessEagleEligibility(journal, true, true);
    expect(eagle.isEligible).toBe(true);
    expect(eagle.missingCriteria).toHaveLength(0);
  });

  it('neighborsBadgeEarned is false when only neighbors-explorer-01 is earned', () => {
    const journal = journalWith(['neighbors-explorer-01']);
    const eagle = engine.assessEagleEligibility(journal, true, true);
    expect(eagle.neighborsBadgeEarned).toBe(false);
  });

  it('neighborsBadgeEarned is true when neighbors-apprentice-01 is earned', () => {
    const journal = journalWith(['neighbors-apprentice-01']);
    const eagle = engine.assessEagleEligibility(journal, true, true);
    expect(eagle.neighborsBadgeEarned).toBe(true);
  });
});

// ─── PracticeJournalEngine — journal operations ───────────────────────────────

describe('PracticeJournalEngine — journal operations', () => {
  let je: PracticeJournalEngine;

  beforeAll(() => {
    je = new PracticeJournalEngine();
  });

  it('createJournal returns empty journal with given userId', () => {
    const journal = je.createJournal('learner-42');
    expect(journal.userId).toBe('learner-42');
  });

  it('createJournal entries array is empty', () => {
    const journal = je.createJournal('learner-1');
    expect(journal.entries).toHaveLength(0);
  });

  it('createJournal badgesEarned array is empty', () => {
    const journal = je.createJournal('learner-1');
    expect(journal.badgesEarned).toHaveLength(0);
  });

  it('createJournal currentPaths array is empty', () => {
    const journal = je.createJournal('learner-1');
    expect(journal.currentPaths).toHaveLength(0);
  });

  it('addEntry returns new journal (immutable — original unchanged)', () => {
    const original = je.createJournal('learner-1');
    const updated = je.addEntry(original, {
      type: 'observation',
      content: 'Observed a birch tree stand in autumn.',
    });
    expect(updated).not.toBe(original);
    expect(original.entries).toHaveLength(0);
    expect(updated.entries).toHaveLength(1);
  });

  it('addEntry populates date field as ISO string', () => {
    const journal = je.createJournal('learner-1');
    const updated = je.addEntry(journal, { type: 'practice', content: 'Practiced saddle notch.' });
    expect(updated.entries[0]!.date).toBeTruthy();
    expect(() => new Date(updated.entries[0]!.date)).not.toThrow();
    // Should be a valid ISO date
    expect(updated.entries[0]!.date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('addEntry type is preserved', () => {
    const journal = je.createJournal('learner-1');
    const updated = je.addEntry(journal, { type: 'sketch', content: 'Sketched dovetail notch geometry.' });
    expect(updated.entries[0]!.type).toBe('sketch');
  });

  it('addEntry badgeId is preserved when provided', () => {
    const journal = je.createJournal('learner-1');
    const updated = je.addEntry(journal, {
      type: 'reflection',
      content: 'Reflected on shelter traditions.',
      badgeId: 'shelter-explorer-01',
    });
    expect(updated.entries[0]!.badgeId).toBe('shelter-explorer-01');
  });

  it('recordBadgeEarned adds badge to list', () => {
    const journal = je.createJournal('learner-1');
    const updated = je.recordBadgeEarned(journal, 'shelter-explorer-01');
    expect(updated.badgesEarned).toContain('shelter-explorer-01');
  });

  it('recordBadgeEarned is idempotent — second call does not duplicate', () => {
    const journal = je.createJournal('learner-1');
    const once = je.recordBadgeEarned(journal, 'shelter-explorer-01');
    const twice = je.recordBadgeEarned(once, 'shelter-explorer-01');
    expect(twice.badgesEarned.filter((id) => id === 'shelter-explorer-01')).toHaveLength(1);
  });

  it('getEntriesForBadge returns only entries with matching badgeId', () => {
    let journal = je.createJournal('learner-1');
    journal = je.addEntry(journal, {
      type: 'observation',
      content: 'General observation',
    });
    journal = je.addEntry(journal, {
      type: 'practice',
      content: 'Shelter practice',
      badgeId: 'shelter-explorer-01',
    });
    journal = je.addEntry(journal, {
      type: 'reflection',
      content: 'Food reflection',
      badgeId: 'food-explorer-01',
    });

    const shelterEntries = je.getEntriesForBadge(journal, 'shelter-explorer-01');
    expect(shelterEntries).toHaveLength(1);
    expect(shelterEntries[0]!.badgeId).toBe('shelter-explorer-01');
  });

  it('getEntriesForRoom returns only entries with matching roomId', () => {
    let journal = je.createJournal('learner-1');
    journal = je.addEntry(journal, { type: 'observation', content: 'Room 1 entry', roomId: 1 });
    journal = je.addEntry(journal, { type: 'observation', content: 'Room 5 entry', roomId: 5 });
    journal = je.addEntry(journal, { type: 'observation', content: 'No room' });

    const room1Entries = je.getEntriesForRoom(journal, 1);
    expect(room1Entries).toHaveLength(1);
    expect(room1Entries[0]!.content).toBe('Room 1 entry');
  });

  it('getTeachingEntries returns only type:teaching entries', () => {
    let journal = je.createJournal('learner-1');
    journal = je.addEntry(journal, { type: 'observation', content: 'Not a teaching entry.' });
    journal = je.addEntry(journal, { type: 'teaching', content: 'Taught shelter techniques.' });
    journal = je.addEntry(journal, { type: 'reflection', content: 'Not a teaching entry either.' });
    journal = je.addEntry(journal, { type: 'teaching', content: 'Taught knot tying.' });

    const teachingEntries = je.getTeachingEntries(journal);
    expect(teachingEntries).toHaveLength(2);
    for (const e of teachingEntries) {
      expect(e.type).toBe('teaching');
    }
  });
});

// ─── TeachItEvaluator — evaluation ───────────────────────────────────────────

describe('TeachItEvaluator — evaluation', () => {
  let evaluator: TeachItEvaluator;
  let engine: BadgeEngine;
  let shelterBadge: HeritageBadge;

  beforeAll(() => {
    evaluator = new TeachItEvaluator();
    engine = new BadgeEngine();
    const badge = engine.getBadge('shelter-explorer-01');
    if (!badge) throw new Error('shelter-explorer-01 not found');
    shelterBadge = badge;
  });

  it('returns passed:false for empty submission', () => {
    const result = evaluator.evaluate('learner-1', 'shelter-explorer-01', shelterBadge, '');
    expect(result.passed).toBe(false);
  });

  it('returns passed:false for very short submission (< 50 chars)', () => {
    const result = evaluator.evaluate('learner-1', 'shelter-explorer-01', shelterBadge, 'Short.');
    expect(result.passed).toBe(false);
  });

  it('returns culturalAttributionViolations when "Native American" used', () => {
    const result = evaluator.evaluate(
      'learner-1',
      'shelter-explorer-01',
      shelterBadge,
      'Native Americans built shelters from many different materials depending on their region.',
    );
    expect(result.culturalAttributionViolations.length).toBeGreaterThan(0);
    expect(result.culturalAttributionViolations[0]).toContain('Native American');
  });

  it('returns passed:false when pan-Indigenous language detected even if other scores are high', () => {
    const longSubmission =
      'Native Americans used log cabin notch geometry in their building traditions. ' +
      'The dovetail notch and saddle notch are self-locking due to the compression geometry. ' +
      'The Haudenosaunee longhouse and Appalachian cabin both use timber framing techniques ' +
      'refined over generations. The relationship between the builder and the land shapes ' +
      'the construction method, which is why Indigenous peoples developed region-specific solutions.';
    const result = evaluator.evaluate('learner-1', 'shelter-explorer-01', shelterBadge, longSubmission);
    expect(result.passed).toBe(false);
    expect(result.culturalAttributionViolations.length).toBeGreaterThan(0);
  });

  it('culturalSensitivityScore is below 60 when pan-Indigenous language used', () => {
    const result = evaluator.evaluate(
      'learner-1',
      'shelter-explorer-01',
      shelterBadge,
      'Native Americans built shelters.',
    );
    expect(result.culturalSensitivityScore).toBeLessThan(60);
  });

  it('returns passed:true for substantive nation-specific submission over 200 chars', () => {
    const submission =
      'The Haudenosaunee longhouse reflects clan structure: multiple families share the central fire. ' +
      'The Appalachian cabin reflects the frontier family economy: a single main room with a loft. ' +
      'The Inuit snow house (igloo) uses the dome geometry to maximize insulation while minimizing ' +
      'surface area. Each shelter tradition answers the same question — how do we stay warm and dry — ' +
      'using the materials and knowledge available in that specific environment. The saddle notch used ' +
      'in Appalachian log construction is self-draining and demonstrates how tradition encodes engineering.';
    const result = evaluator.evaluate('learner-1', 'shelter-explorer-01', shelterBadge, submission);
    expect(result.passed).toBe(true);
    expect(result.culturalAttributionViolations).toHaveLength(0);
  });

  it('feedback string is non-empty', () => {
    const result = evaluator.evaluate('learner-1', 'shelter-explorer-01', shelterBadge, 'Short text.');
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  it('overallScore is average of 4 dimension scores', () => {
    const submission =
      'The Haudenosaunee longhouse and the Appalachian log cabin both demonstrate how shelter ' +
      'design is shaped by available materials, climate, and community structure. The saddle notch ' +
      'and dovetail notch are specific techniques that encode engineering wisdom about water drainage ' +
      'and structural load. Comparing dome vs. rectangular forms reveals different priorities: a dome ' +
      'minimizes heat loss, while a rectangle is easier to expand. Understanding these traditions ' +
      'means understanding the relationship between the builder and the specific land they inhabit.';
    const result = evaluator.evaluate('learner-1', 'shelter-explorer-01', shelterBadge, submission);
    const expected = Math.round(
      (result.accuracyScore + result.completenessScore + result.culturalSensitivityScore + result.attributionScore) / 4,
    );
    expect(result.overallScore).toBe(expected);
  });

  it('detectPanIndigenousLanguage triggers on "Indigenous peoples"', () => {
    const submission =
      'Indigenous peoples developed many different shelter forms across North America.';
    const result = evaluator.evaluate('learner-1', 'shelter-explorer-01', shelterBadge, submission);
    expect(result.culturalAttributionViolations.length).toBeGreaterThan(0);
    expect(result.culturalAttributionViolations.some((v) => v.includes('Indigenous'))).toBe(true);
  });

  it('passed:false with feedback mentioning pan-Indigenous language when violation present', () => {
    const result = evaluator.evaluate(
      'learner-1',
      'shelter-explorer-01',
      shelterBadge,
      'Native American traditions are varied.',
    );
    expect(result.passed).toBe(false);
    expect(result.feedback).toContain('Pan-Indigenous language');
  });
});

// ─── Badge data integrity ─────────────────────────────────────────────────────

describe('Badge data integrity', () => {
  let badges: HeritageBadge[];

  beforeAll(() => {
    badges = loadBadgesJson();
  });

  it('all badges have required fields: id, path, title, icon, traditions, tier, prerequisites, roomId, components', () => {
    for (const badge of badges) {
      expect(badge.id).toBeTruthy();
      expect(badge.path).toBeTruthy();
      expect(badge.title).toBeTruthy();
      expect(badge.icon).toBeTruthy();
      expect(Array.isArray(badge.traditions)).toBe(true);
      expect(badge.tier).toBeTruthy();
      expect(Array.isArray(badge.prerequisites)).toBe(true);
      expect(badge.roomId).toBeDefined();
      expect(Array.isArray(badge.components)).toBe(true);
    }
  });

  it('Explorer-tier badges have exactly 2 components', () => {
    const explorers = badges.filter((b) => b.tier === BadgeTier.EXPLORER);
    expect(explorers.length).toBeGreaterThan(0);
    for (const badge of explorers) {
      expect(badge.components).toHaveLength(2);
    }
  });

  it('Apprentice-tier badges have exactly 4 components', () => {
    const apprentices = badges.filter((b) => b.tier === BadgeTier.APPRENTICE);
    expect(apprentices.length).toBeGreaterThan(0);
    for (const badge of apprentices) {
      expect(badge.components).toHaveLength(4);
    }
  });

  it('Journeyman-tier badges have exactly 4 components', () => {
    const journeymen = badges.filter((b) => b.tier === BadgeTier.JOURNEYMAN);
    expect(journeymen.length).toBeGreaterThan(0);
    for (const badge of journeymen) {
      expect(badge.components).toHaveLength(4);
    }
  });

  it('Keeper-tier badges have exactly 4 components', () => {
    const keepers = badges.filter((b) => b.tier === BadgeTier.KEEPER);
    expect(keepers.length).toBeGreaterThan(0);
    for (const badge of keepers) {
      expect(badge.components).toHaveLength(4);
    }
  });

  it('Keeper-tier badges have a reflection component with interactiveElement: teach-it-verification', () => {
    const keepers = badges.filter((b) => b.tier === BadgeTier.KEEPER);
    expect(keepers.length).toBeGreaterThan(0);
    for (const badge of keepers) {
      const teachItComponent = badge.components.find(
        (c) => c.type === 'reflection' && c.interactiveElement === 'teach-it-verification',
      );
      expect(teachItComponent).toBeDefined();
    }
  });

  it('all component types are valid values: story skill relationship reflection', () => {
    const validTypes = new Set(['story', 'skill', 'relationship', 'reflection']);
    for (const badge of badges) {
      for (const component of badge.components) {
        expect(validTypes.has(component.type)).toBe(true);
      }
    }
  });

  it('Explorer-tier badge components follow story-then-skill order', () => {
    const explorers = badges.filter((b) => b.tier === BadgeTier.EXPLORER);
    for (const badge of explorers) {
      expect(badge.components[0]!.type).toBe('story');
      expect(badge.components[1]!.type).toBe('skill');
    }
  });

  it('no pan-Indigenous language in any badge component content', () => {
    const panIndigenousPatterns = [
      /\bnative american(s)?\b/gi,
      /\bindigenous peoples?\b/gi,
      /\ball indigenous\b/gi,
    ];
    for (const badge of badges) {
      for (const component of badge.components) {
        for (const pattern of panIndigenousPatterns) {
          pattern.lastIndex = 0;
          const match = pattern.test(component.content);
          if (match) {
            throw new Error(
              `Pan-Indigenous language found in badge ${badge.id}, component "${component.title}": matched ${pattern}`,
            );
          }
        }
      }
    }
    // If we reach here, no violations were found
    expect(true).toBe(true);
  });

  it('all badges have at least one tradition listed', () => {
    for (const badge of badges) {
      expect(badge.traditions.length).toBeGreaterThan(0);
    }
  });

  it('all badge roomIds are within valid range 1-18', () => {
    for (const badge of badges) {
      expect(badge.roomId).toBeGreaterThanOrEqual(1);
      expect(badge.roomId).toBeLessThanOrEqual(18);
    }
  });

  it('required badge IDs are present: shelter-explorer-01, shelter-apprentice-01, watercraft-explorer-01, neighbors-explorer-01, neighbors-keeper-01', () => {
    const required = [
      'shelter-explorer-01',
      'shelter-apprentice-01',
      'watercraft-explorer-01',
      'neighbors-explorer-01',
      'neighbors-keeper-01',
    ];
    const ids = new Set(badges.map((b) => b.id));
    for (const id of required) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('all 9 paths have at least one Explorer and one Apprentice badge', () => {
    const paths = Object.values(BadgePath);
    for (const path of paths) {
      const pathBadges = badges.filter((b) => b.path === path);
      const hasExplorer = pathBadges.some((b) => b.tier === BadgeTier.EXPLORER);
      const hasApprentice = pathBadges.some((b) => b.tier === BadgeTier.APPRENTICE);
      expect(hasExplorer).toBe(true);
      expect(hasApprentice).toBe(true);
    }
  });
});
