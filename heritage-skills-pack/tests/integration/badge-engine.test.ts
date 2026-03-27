/**
 * Badge Engine Integration Tests — Phase 2
 *
 * Tests B-BADGE-01 through B-BADGE-10, B-RETRO-01 through B-RETRO-06.
 *
 * All 16 tests are MANDATORY. Any failure blocks Phase 2 deployment.
 * Verifies badge progression logic, cross-tradition paths, PracticeJournal,
 * Keeper verification, and Badge Retrofit coverage for all 18 rooms.
 *
 * API notes applied:
 * - BadgeEngine: class with getBadge(), getBadgesForRoom(), getBadgesForPath(),
 *   checkTierEligibility(), getPathProgress(), assessEagleEligibility()
 * - PracticeJournalEngine: class with createJournal(), addEntry(), recordBadgeEarned()
 * - TeachItEvaluator: class with evaluate(learnerId, badgeId, badge, submission)
 * - BadgePath, BadgeTier: enums from phase2-types.ts
 *
 * Source: foxfire-heritage-mission-v2--08-component-specs-phase2.md P2-04, P2-10
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import {
  BadgeEngine,
  PracticeJournalEngine,
  TeachItEvaluator,
  BadgePath,
  BadgeTier,
} from '../../badge-engine/engine.js';
import type { HeritageBadge } from '../../badge-engine/engine.js';

const require = createRequire(import.meta.url);

const engine = new BadgeEngine();
const journalEngine = new PracticeJournalEngine();
const teachItEvaluator = new TeachItEvaluator();

// ─── Cross-Tradition Badge Paths (B-BADGE-01 through B-BADGE-10) ────────────

describe('Cross-Tradition Badge Paths', () => {
  it('B-BADGE-01: badge-definitions.json has 55 badges across exactly 12 badge paths', () => {
    const badgeData = require('../../badge-engine/badge-definitions.json') as HeritageBadge[];
    expect(badgeData.length, 'B-BADGE-01: must have exactly 55 badge definitions').toBe(55);

    // Collect all distinct badge paths
    const pathsPresent = new Set(badgeData.map((b) => b.path));
    expect(pathsPresent.size, 'B-BADGE-01: must have exactly 12 distinct badge paths').toBe(12);

    // The 12 expected paths
    const expectedPaths = [
      BadgePath.SHELTER, BadgePath.FOOD, BadgePath.FIBER, BadgePath.WATERCRAFT,
      BadgePath.PLANT, BadgePath.TOOL, BadgePath.MUSIC, BadgePath.NEIGHBORS,
      BadgePath.HERITAGE,
      'cedar', 'salmon', 'weaving', // Phase 2 paths
    ];
    // All standard BadgePath values must be present
    for (const path of [BadgePath.SHELTER, BadgePath.FOOD, BadgePath.FIBER, BadgePath.WATERCRAFT,
      BadgePath.PLANT, BadgePath.TOOL, BadgePath.MUSIC, BadgePath.NEIGHBORS, BadgePath.HERITAGE]) {
      expect(pathsPresent.has(path), `B-BADGE-01: path '${path}' must be present`).toBe(true);
    }
    // Phase 2 paths must be present
    expect(pathsPresent.has('cedar'), 'B-BADGE-01: cedar path must be present').toBe(true);
    expect(pathsPresent.has('salmon'), 'B-BADGE-01: salmon path must be present').toBe(true);
    expect(pathsPresent.has('weaving'), 'B-BADGE-01: weaving path must be present').toBe(true);
    void expectedPaths; // suppress unused warning
  });

  it('B-BADGE-02: Shelter badge path connects Room 01 (log cabin) and Room 14 (igloo) cross-tradition', () => {
    // Shelter path: Room 01 (Explorer, Apprentice, Keeper) + Room 14 (Journeyman)
    const shelterBadges = engine.getBadgesForPath(BadgePath.SHELTER);
    expect(shelterBadges.length, 'B-BADGE-02: shelter path must have badges').toBeGreaterThan(0);

    // Room 01 has shelter explorer badge (log cabin — Appalachian tradition)
    const room01Badges = engine.getBadgesForRoom(1);
    const room01ShelterBadges = room01Badges.filter((b) => b.path === BadgePath.SHELTER);
    expect(room01ShelterBadges.length, 'B-BADGE-02: Room 01 must have shelter path badges').toBeGreaterThan(0);

    // Room 14 has shelter journeyman badge (igloo — Inuit tradition)
    const room14Badges = engine.getBadgesForRoom(14);
    const room14ShelterBadges = room14Badges.filter((b) => b.path === BadgePath.SHELTER);
    expect(room14ShelterBadges.length, 'B-BADGE-02: Room 14 must have shelter path badges (igloo journeyman)').toBeGreaterThan(0);

    // Explorer tier must be available in Room 01 (for first entry into the shelter path)
    const explorerBadge = room01ShelterBadges.find((b) => b.tier === BadgeTier.EXPLORER);
    expect(explorerBadge, 'B-BADGE-02: Room 01 must have Explorer tier shelter badge').toBeDefined();

    // Journeyman tier must be available in Room 14 (cross-tradition progression via igloo)
    const journeymanBadge = room14ShelterBadges.find((b) => b.tier === BadgeTier.JOURNEYMAN);
    expect(journeymanBadge, 'B-BADGE-02: Room 14 must have Journeyman tier shelter badge (igloo engineering)').toBeDefined();
  });

  it('B-BADGE-03: Cedar path has badges at Explorer, Apprentice, and Journeyman tiers for Room 15 content', () => {
    // getBadgesForPath works directly against badge-definitions for any path value
    const cedarBadges = engine.getBadgesForPath('cedar' as BadgePath);
    expect(cedarBadges.length, 'B-BADGE-03: cedar path must have badge definitions').toBeGreaterThan(0);

    // Cedar badges must be for Room 15
    const cedarRoom15Badges = cedarBadges.filter((b) => b.roomId === 15);
    expect(cedarRoom15Badges.length, 'B-BADGE-03: cedar path badges must be assigned to Room 15').toBeGreaterThan(0);

    // Explorer, Apprentice, and Journeyman tiers must be present
    const tiers = cedarBadges.map((b) => b.tier);
    expect(tiers, 'B-BADGE-03: cedar path must have Explorer tier').toContain(BadgeTier.EXPLORER);
    expect(tiers, 'B-BADGE-03: cedar path must have Apprentice tier').toContain(BadgeTier.APPRENTICE);
    expect(tiers, 'B-BADGE-03: cedar path must have Journeyman tier').toContain(BadgeTier.JOURNEYMAN);
  });

  it('B-BADGE-04: Salmon path has badges at Explorer and Apprentice tiers for Room 16 content', () => {
    // getBadgesForPath works directly against badge-definitions for any path value
    const salmonBadges = engine.getBadgesForPath('salmon' as BadgePath);
    expect(salmonBadges.length, 'B-BADGE-04: salmon path must have badge definitions').toBeGreaterThan(0);

    // Salmon badges must be for Room 16
    const salmonRoom16Badges = salmonBadges.filter((b) => b.roomId === 16);
    expect(salmonRoom16Badges.length, 'B-BADGE-04: salmon path badges must be assigned to Room 16').toBeGreaterThan(0);

    const tiers = salmonBadges.map((b) => b.tier);
    expect(tiers, 'B-BADGE-04: salmon path must have Explorer tier').toContain(BadgeTier.EXPLORER);
    expect(tiers, 'B-BADGE-04: salmon path must have Apprentice tier').toContain(BadgeTier.APPRENTICE);
  });

  it('B-BADGE-05: Weaving path has badges at Explorer and Apprentice tiers for Room 17 content', () => {
    // getBadgesForPath works directly against badge-definitions for any path value
    const weavingBadges = engine.getBadgesForPath('weaving' as BadgePath);
    expect(weavingBadges.length, 'B-BADGE-05: weaving path must have badge definitions').toBeGreaterThan(0);

    // Weaving badges must be for Room 17
    const weavingRoom17Badges = weavingBadges.filter((b) => b.roomId === 17);
    expect(weavingRoom17Badges.length, 'B-BADGE-05: weaving path badges must be assigned to Room 17').toBeGreaterThan(0);

    const tiers = weavingBadges.map((b) => b.tier);
    expect(tiers, 'B-BADGE-05: weaving path must have Explorer tier').toContain(BadgeTier.EXPLORER);
    expect(tiers, 'B-BADGE-05: weaving path must have Apprentice tier').toContain(BadgeTier.APPRENTICE);
  });

  it('B-BADGE-06: Room 18 Village World has neighbors path badges with potlatch/conflict resolution content', () => {
    // Room 18 is mapped in neighbors path via path-room-mapping.json
    const room18Badges = engine.getBadgesForRoom(18);
    expect(room18Badges.length, 'B-BADGE-06: Room 18 must have badge definitions via neighbors path').toBeGreaterThan(0);

    const neighborsBadges = room18Badges.filter((b) => b.path === BadgePath.NEIGHBORS);
    expect(neighborsBadges.length, 'B-BADGE-06: Room 18 must have neighbors path badges').toBeGreaterThan(0);

    // Verify badges have potlatch, conflict resolution, or emotional intelligence content
    const allContent = neighborsBadges
      .flatMap((b) => b.components)
      .map((c) => c.content)
      .join(' ');
    expect(
      /potlatch|conflict|resolution|emotional|condolence|restoration|Salish|compensation/i.test(allContent),
      'B-BADGE-06: Room 18 neighbors badges must contain potlatch, conflict resolution, or SEL content',
    ).toBe(true);
  });

  it('B-BADGE-07: Keeper tier requires TeachItEvaluator — poor submission fails verification', () => {
    // The educational contract: mastery must be demonstrated, not just accumulated.
    // TeachItEvaluator.evaluate() returns passed=false for:
    //   - Overall score < 70, OR
    //   - Cultural sensitivity score < 60, OR
    //   - Pan-Indigenous language detected
    const keeperBadge = engine.getBadge('shelter-keeper-01');
    expect(keeperBadge, 'B-BADGE-07: shelter-keeper-01 badge must exist').toBeDefined();
    expect(keeperBadge!.tier, 'B-BADGE-07: shelter-keeper-01 must be Keeper tier').toBe(BadgeTier.KEEPER);

    // A trivially short submission fails Keeper verification
    const failResult = teachItEvaluator.evaluate(
      'test-learner-07',
      'shelter-keeper-01',
      keeperBadge!,
      'Shelters are used for housing.',
    );
    expect(failResult.passed, 'B-BADGE-07: trivial submission must fail TeachIt verification').toBe(false);
    expect(failResult.overallScore, 'B-BADGE-07: trivial submission must score below 70').toBeLessThan(70);

    // A submission with pan-Indigenous language also fails
    const panIndigenousResult = teachItEvaluator.evaluate(
      'test-learner-07',
      'shelter-keeper-01',
      keeperBadge!,
      'Indigenous peoples traditionally built shelters using natural materials from their environment. Native Americans used these techniques across their cultures.',
    );
    expect(panIndigenousResult.passed, 'B-BADGE-07: pan-Indigenous language must fail TeachIt').toBe(false);
    expect(
      panIndigenousResult.culturalAttributionViolations.length,
      'B-BADGE-07: pan-Indigenous violations must be detected',
    ).toBeGreaterThan(0);
  });

  it('B-BADGE-08: PracticeJournalEngine accepts all 5 entry types', () => {
    let journal = journalEngine.createJournal('test-learner-08');
    expect(journal.entries.length, 'B-BADGE-08: new journal must start empty').toBe(0);

    // Add one entry of each type
    journal = journalEngine.addEntry(journal, {
      type: 'observation',
      content: 'Observed a traditional dugout canoe in use on the inlet.',
    });
    journal = journalEngine.addEntry(journal, {
      type: 'practice',
      content: 'Practiced cedar bark stripping technique for 30 minutes.',
    });
    journal = journalEngine.addEntry(journal, {
      type: 'reflection',
      content: 'What does the Law of the Bark mean for how I approach the cedar?',
    });
    journal = journalEngine.addEntry(journal, {
      type: 'sketch',
      content: 'Sketched the two vertical score cuts for bark harvesting.',
    });
    journal = journalEngine.addEntry(journal, {
      type: 'teaching',
      content: 'Explained bark harvesting techniques to another learner at the cedar grove.',
    });

    expect(journal.entries.length, 'B-BADGE-08: must have 5 entries after adding one of each type').toBe(5);

    // Verify all 5 types are recorded and retrievable
    const entryTypes = journal.entries.map((e) => e.type);
    expect(entryTypes, 'B-BADGE-08: observation entry must be recorded').toContain('observation');
    expect(entryTypes, 'B-BADGE-08: practice entry must be recorded').toContain('practice');
    expect(entryTypes, 'B-BADGE-08: reflection entry must be recorded').toContain('reflection');
    expect(entryTypes, 'B-BADGE-08: sketch entry must be recorded').toContain('sketch');
    expect(entryTypes, 'B-BADGE-08: teaching entry must be recorded').toContain('teaching');
  });

  it('B-BADGE-09: Cross-tradition badge path traversal — Room 01 Explorer unlocks Room 15 Apprentice path', () => {
    // Simulate a learner who earned Room 01 shelter-explorer-01
    let journal = journalEngine.createJournal('test-learner-09');
    journal = journalEngine.recordBadgeEarned(journal, 'shelter-explorer-01');

    // Check eligibility for shelter-apprentice-01 (Room 01 apprentice)
    const apprenticeEligibility = engine.checkTierEligibility('test-learner-09', 'shelter-apprentice-01', journal);
    expect(apprenticeEligibility.canAdvance, 'B-BADGE-09: Room 01 Explorer allows Apprentice advancement').toBe(true);
    expect(apprenticeEligibility.blockers.length, 'B-BADGE-09: no blockers for Apprentice with Explorer earned').toBe(0);

    // The cedar path (Room 15) badges have no prerequisite on shelter badges
    // cedar-apprentice-01 requires cedar-explorer-01
    const cedarApprenticeEligibility = engine.checkTierEligibility('test-learner-09', 'cedar-apprentice-01', journal);
    // Without cedar-explorer-01, cedar-apprentice-01 is blocked
    expect(
      cedarApprenticeEligibility.canAdvance,
      'B-BADGE-09: cedar Apprentice is blocked without cedar Explorer',
    ).toBe(false);

    // Now earn cedar-explorer-01 (Room 15 Explorer)
    journal = journalEngine.recordBadgeEarned(journal, 'cedar-explorer-01');
    const cedarApprenticeEligibility2 = engine.checkTierEligibility('test-learner-09', 'cedar-apprentice-01', journal);
    expect(
      cedarApprenticeEligibility2.canAdvance,
      'B-BADGE-09: cedar Apprentice is unlocked once cedar Explorer is earned',
    ).toBe(true);
  });

  it('B-BADGE-10: BadgeEngine accepts both Tradition enum and TraditionV2 string in badge traditions field', () => {
    // Verify that badge definitions with TraditionV2 union types load and query without error
    // Badge traditions field uses TraditionV2 which includes both Tradition enum values and 'salish-sea'
    const cedarBadge = engine.getBadge('cedar-explorer-01');
    expect(cedarBadge, 'B-BADGE-10: cedar-explorer-01 must exist').toBeDefined();
    expect(Array.isArray(cedarBadge!.traditions), 'B-BADGE-10: badge traditions must be an array').toBe(true);
    expect(cedarBadge!.traditions.length, 'B-BADGE-10: cedar badge must have at least one tradition').toBeGreaterThan(0);

    // The badge engine must return cedar badges for Phase 2 Room 15 via getBadgesForPath
    // (path-room-mapping.json maps Phase 2 rooms through existing paths: watercraft, plant, tool)
    const cedarPathBadgesForRoom15 = engine.getBadgesForPath('cedar' as BadgePath).filter((b) => b.roomId === 15);
    expect(cedarPathBadgesForRoom15.length, 'B-BADGE-10: cedar path must have badges for Room 15').toBeGreaterThan(0);
    const salmonPathBadgesForRoom16 = engine.getBadgesForPath('salmon' as BadgePath).filter((b) => b.roomId === 16);
    expect(salmonPathBadgesForRoom16.length, 'B-BADGE-10: salmon path must have badges for Room 16').toBeGreaterThan(0);

    // All badge operations must complete without TypeScript/runtime errors
    const cedarPathBadges = engine.getBadgesForPath('cedar' as BadgePath);
    expect(cedarPathBadges.length, 'B-BADGE-10: getBadgesForPath("cedar") must return badges').toBeGreaterThan(0);
  });
});

// ─── Badge Retrofit Compatibility (B-RETRO-01 through B-RETRO-06) ────────────

describe('Badge Retrofit Compatibility', () => {
  it('B-RETRO-01: All 14 Phase 1 rooms have at least one badge definition', () => {
    for (let roomId = 1; roomId <= 14; roomId++) {
      const roomBadges = engine.getBadgesForRoom(roomId);
      expect(
        roomBadges.length,
        `B-RETRO-01: Room ${roomId} must have at least one badge definition (retrofit complete)`,
      ).toBeGreaterThan(0);
    }
  });

  it('B-RETRO-02: Room 05 Food Preservation badge retrofit maps to badge path definitions', () => {
    const room5Badges = engine.getBadgesForRoom(5);
    expect(room5Badges.length, 'B-RETRO-02: Room 05 must have badge definitions').toBeGreaterThan(0);

    // All Room 05 badges should belong to the food path
    const foodPathBadges = room5Badges.filter((b) => b.path === BadgePath.FOOD);
    expect(foodPathBadges.length, 'B-RETRO-02: Room 05 must have food path badges').toBeGreaterThan(0);

    // Explorer tier must be available (retrofit means entry-level badge exists)
    const explorerBadge = foodPathBadges.find((b) => b.tier === BadgeTier.EXPLORER);
    expect(explorerBadge, 'B-RETRO-02: Room 05 must have food Explorer badge').toBeDefined();

    // Retrofit mapping file must exist and reference Room 05
    const retrofitMapping = require('../../badge-engine/badge-retrofit-mapping.json') as {
      roomMappings: Array<{ roomId: number; badgeIds: string[] }>;
    };
    const room5Mapping = retrofitMapping.roomMappings.find((r) => r.roomId === 5);
    expect(room5Mapping, 'B-RETRO-02: badge-retrofit-mapping must include Room 05').toBeDefined();
    expect(room5Mapping!.badgeIds.length, 'B-RETRO-02: Room 05 retrofit must map to badge IDs').toBeGreaterThan(0);
  });

  it('B-RETRO-03: Room 09 Plant Knowledge badge definitions exist with prerequisites for safety', () => {
    const room9Badges = engine.getBadgesForRoom(9);
    expect(room9Badges.length, 'B-RETRO-03: Room 09 must have badge definitions').toBeGreaterThan(0);

    // Plant path must be present
    const plantBadges = room9Badges.filter((b) => b.path === BadgePath.PLANT);
    expect(plantBadges.length, 'B-RETRO-03: Room 09 must have plant path badges').toBeGreaterThan(0);

    // The prerequisite chain: Apprentice requires Explorer (enforced via badge graph)
    // This means you cannot jump to Apprentice without Explorer — safety is gated
    const apprenticeBadge = plantBadges.find((b) => b.tier === BadgeTier.APPRENTICE);
    expect(apprenticeBadge, 'B-RETRO-03: Room 09 must have plant Apprentice badge').toBeDefined();
    expect(
      apprenticeBadge!.prerequisites.length,
      'B-RETRO-03: plant Apprentice must have prerequisites (safety-gated progression)',
    ).toBeGreaterThan(0);

    // Explorer is the prerequisite for Apprentice — ensuring progressive safety exposure
    const explorerBadge = plantBadges.find((b) => b.tier === BadgeTier.EXPLORER);
    expect(explorerBadge, 'B-RETRO-03: Room 09 must have plant Explorer badge').toBeDefined();
    expect(
      apprenticeBadge!.prerequisites.includes(explorerBadge!.id),
      'B-RETRO-03: plant Apprentice must require plant Explorer as prerequisite',
    ).toBe(true);
  });

  it('B-RETRO-04: Room 14 Arctic Living badges connect to shelter path and food arctic path', () => {
    const room14Badges = engine.getBadgesForRoom(14);
    expect(room14Badges.length, 'B-RETRO-04: Room 14 must have badge definitions').toBeGreaterThan(0);

    // Room 14 has shelter-journeyman-01 (igloo engineering) and food arctic badges
    const paths = new Set(room14Badges.map((b) => b.path));
    expect(paths.has(BadgePath.SHELTER), 'B-RETRO-04: Room 14 must have shelter path badge (igloo journeyman)').toBe(true);
    expect(paths.has(BadgePath.FOOD), 'B-RETRO-04: Room 14 must have food path badge (arctic food)').toBe(true);

    // Journeyman tier in shelter path requires prior shelter badges (earned in Room 01)
    const journeymanBadge = room14Badges.find(
      (b) => b.path === BadgePath.SHELTER && b.tier === BadgeTier.JOURNEYMAN,
    );
    expect(journeymanBadge, 'B-RETRO-04: Room 14 must have shelter Journeyman badge').toBeDefined();
    expect(
      journeymanBadge!.prerequisites.length,
      'B-RETRO-04: shelter Journeyman must have prerequisites (from Room 01)',
    ).toBeGreaterThan(0);
  });

  it('B-RETRO-05: Badge paths cover 9+ categories across the complete set', () => {
    const badgeData = require('../../badge-engine/badge-definitions.json') as HeritageBadge[];
    const pathsPresent = new Set(badgeData.map((b) => b.path));

    // The 9 core badge categories from Phase 1 + Phase 2
    // shelter, food, fiber, watercraft, plant, tool, music, neighbors, heritage
    const coreCategories = [
      BadgePath.SHELTER,   // building/shelter
      BadgePath.FOOD,      // food preservation
      BadgePath.FIBER,     // fiber/textile
      BadgePath.WATERCRAFT, // watercraft
      BadgePath.PLANT,     // plant knowledge
      BadgePath.TOOL,      // woodcraft/tools
      BadgePath.MUSIC,     // music
      BadgePath.NEIGHBORS, // community/neighbors
      BadgePath.HERITAGE,  // heritage documentation
    ];

    for (const category of coreCategories) {
      expect(
        pathsPresent.has(category),
        `B-RETRO-05: category '${category}' must be represented in badge definitions`,
      ).toBe(true);
    }

    // Plus Phase 2 paths: cedar, salmon, weaving
    expect(pathsPresent.has('cedar'), 'B-RETRO-05: cedar path must be present (Phase 2)').toBe(true);
    expect(pathsPresent.has('salmon'), 'B-RETRO-05: salmon path must be present (Phase 2)').toBe(true);
    expect(pathsPresent.has('weaving'), 'B-RETRO-05: weaving path must be present (Phase 2)').toBe(true);

    // Total: at least 9 distinct categories
    expect(pathsPresent.size, 'B-RETRO-05: must have at least 9 distinct badge path categories').toBeGreaterThanOrEqual(9);
  });

  it('B-RETRO-06: End-to-end Explorer badge award for Room 03 Animals/Wildlife (heritage path)', () => {
    // Room 03 uses the heritage path for animals
    const room3Badges = engine.getBadgesForRoom(3);
    expect(room3Badges.length, 'B-RETRO-06: Room 03 must have badge definitions').toBeGreaterThan(0);

    // Find the Explorer badge for Room 03
    const room3Explorer = room3Badges.find((b) => b.tier === BadgeTier.EXPLORER);
    expect(room3Explorer, 'B-RETRO-06: Room 03 must have an Explorer tier badge').toBeDefined();

    // Create a journal and simulate completing Explorer by recording a practice entry
    let journal = journalEngine.createJournal('test-learner-retro-06');
    journal = journalEngine.addEntry(journal, {
      type: 'observation',
      roomId: 3,
      badgeId: room3Explorer!.id,
      content: 'Observed white-tailed deer track patterns in soft mud near the creek.',
    });
    journal = journalEngine.addEntry(journal, {
      type: 'practice',
      roomId: 3,
      badgeId: room3Explorer!.id,
      content: 'Practiced identifying 5 common track types: deer, raccoon, fox, rabbit, turkey.',
    });

    // Check eligibility for Explorer (no prerequisites required)
    const eligibility = engine.checkTierEligibility('test-learner-retro-06', room3Explorer!.id, journal);
    expect(eligibility.canAdvance, 'B-RETRO-06: Room 03 Explorer badge must be eligible with no prerequisites').toBe(true);
    expect(eligibility.blockers.length, 'B-RETRO-06: no blockers for Explorer badge').toBe(0);

    // Award the badge
    journal = journalEngine.recordBadgeEarned(journal, room3Explorer!.id);
    expect(
      journal.badgesEarned.includes(room3Explorer!.id),
      'B-RETRO-06: Explorer badge must be recorded in journal after award',
    ).toBe(true);

    // Verify the badge status — eligible learner now has Explorer recorded
    const progress = engine.getPathProgress(room3Explorer!.path, journal);
    expect(progress.badgesEarned.length, 'B-RETRO-06: path progress must show badge earned').toBeGreaterThan(0);
    expect(progress.highestTier, 'B-RETRO-06: highest tier must be Explorer').toBe(BadgeTier.EXPLORER);
  });
});
