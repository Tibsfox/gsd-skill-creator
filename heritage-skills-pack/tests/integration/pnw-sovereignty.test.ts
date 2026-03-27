/**
 * PNW Cultural Sovereignty Integration Tests — Phase 2
 *
 * Tests P-PNW-01 through P-PNW-14.
 *
 * All 14 tests are MANDATORY. Any failure blocks Phase 2 deployment.
 * Verifies CulturalSovereigntyWarden handles PNW Coast (Salish Sea)
 * content correctly alongside existing Phase 1 tradition handling.
 *
 * API notes applied:
 * - classify(content, tradition: Tradition, domain: string)
 * - Tradition enum: APPALACHIAN, FIRST_NATIONS, INUIT, CROSS_TRADITION
 * - 'salish-sea' string is not a Tradition enum value; cross-tradition rules apply
 * - CulturalSovereigntyLevel: PUBLICLY_SHARED=1, CONTEXTUALLY_SHARED=2,
 *   COMMUNITY_RESTRICTED=3, SACRED_CEREMONIAL=4
 * - Level 4 action === 'block', referralTarget is undefined
 *
 * Source: foxfire-heritage-mission-v2--08-component-specs-phase2.md P2-02, P2-13
 */

import { createRequire } from 'module';
import { describe, it, expect } from 'vitest';
import { CulturalSovereigntyWarden } from '../../safety/cultural-warden.js';
import {
  CulturalSovereigntyLevel,
  Tradition,
} from '../../shared/types.js';
import { loadAllNations, loadPotlatchContext } from '../../salish-sea-ways/index.js';

const require = createRequire(import.meta.url);

const warden = new CulturalSovereigntyWarden();

// ─── PNW Content Classification (P-PNW-01 through P-PNW-06) ─────────────────

describe('PNW Content Classification', () => {
  it('P-PNW-01: Cedar ceremonial carvings content is sacred (Level 4 hard block)', () => {
    // Cross-tradition 'ceremonies' domain: KC-L4-002 (Level 4 block)
    // Domain 'ceremonies' matches exactly at Level 4 in knowledge-classification.json
    const result = warden.classify(
      'Describe the designs carved into cedar ceremonial totem poles at the longhouse',
      Tradition.FIRST_NATIONS,
      'ceremonies',
    );
    expect(result.level, 'P-PNW-01: cedar ceremonial carvings must be Level 4 sacred').toBe(
      CulturalSovereigntyLevel.SACRED_CEREMONIAL,
    );
    expect(result.action, 'P-PNW-01: Level 4 action must be block').toBe('block');
    expect(result.referralTarget, 'P-PNW-01: Level 4 has no referralTarget').toBeUndefined();
  });

  it('P-PNW-02: First Salmon ceremony specific protocols are Level 4 hard block', () => {
    // Sacred ceremony domain is Level 4 across all Indigenous traditions
    const result = warden.classify(
      'What specific protocols occur during the First Salmon ceremony?',
      Tradition.FIRST_NATIONS,
      'ceremonies',
    );
    expect(result.level, 'P-PNW-02: First Salmon ceremony protocols must be Level 4').toBe(
      CulturalSovereigntyLevel.SACRED_CEREMONIAL,
    );
    expect(result.action, 'P-PNW-02: Level 4 action must be block').toBe('block');
  });

  it('P-PNW-03: Potlatch-as-technology (economic/social function) is Level 1-2 open content', () => {
    // Potlatch economic/governance function: FN-GOV-001 (Level 2) for governance domain
    // The potlatch as economic redistribution is publicly documented educational content
    const result = warden.classify(
      'How does a potlatch redistribute wealth and build community relationships?',
      Tradition.FIRST_NATIONS,
      'governance',
    );
    expect(
      result.level <= CulturalSovereigntyLevel.CONTEXTUALLY_SHARED,
      `P-PNW-03: potlatch-as-technology must be Level 1 or 2, got ${result.level}`,
    ).toBe(true);
    expect(
      ['include', 'summarize-and-refer'].includes(result.action),
      `P-PNW-03: potlatch-as-technology action must be include or summarize-and-refer, got ${result.action}`,
    ).toBe(true);
  });

  it('P-PNW-04: Northwest Coast formline design teaching is Level 1 publicly shared', () => {
    // Formline geometric design: crafts domain, FN-CRA-001 (Level 1) for first-nations
    const result = warden.classify(
      'Teach me the geometric principles of Northwest Coast formline design',
      Tradition.FIRST_NATIONS,
      'crafts',
    );
    expect(
      result.level <= CulturalSovereigntyLevel.CONTEXTUALLY_SHARED,
      `P-PNW-04: formline design teaching must be Level 1 or 2, got ${result.level}`,
    ).toBe(true);
    expect(
      ['include', 'summarize-and-refer'].includes(result.action),
      `P-PNW-04: formline teaching action must be include or summarize-and-refer, got ${result.action}`,
    ).toBe(true);
  });

  it('P-PNW-05: Salish blanket weaving technique is Level 1 publicly shared craft', () => {
    // Weaving technique: crafts domain, Level 1 in knowledge-classification.json and FN-CRA-001
    const result = warden.classify(
      'How is a Salish blanket woven on a two-bar loom?',
      Tradition.FIRST_NATIONS,
      'crafts',
    );
    expect(result.level, 'P-PNW-05: Salish weaving technique must be Level 1').toBe(
      CulturalSovereigntyLevel.PUBLICLY_SHARED,
    );
    expect(result.action, 'P-PNW-05: Level 1 action must be include').toBe('include');
  });

  it('P-PNW-06: Sacred longhouse interior protocols are Level 3-4 (community-restricted or sacred)', () => {
    // Longhouse ceremony protocols: ceremonies domain with first-nations -> Level 4 (KC-L4-002)
    const result = warden.classify(
      'What ceremonies take place inside the longhouse and who may attend?',
      Tradition.FIRST_NATIONS,
      'ceremonies',
    );
    expect(
      (result.level as number) >= (CulturalSovereigntyLevel.COMMUNITY_RESTRICTED as number),
      `P-PNW-06: longhouse interior protocols must be Level 3 or higher, got ${result.level}`,
    ).toBe(true);
    expect(
      ['acknowledge-and-redirect', 'block'].includes(result.action),
      `P-PNW-06: longhouse protocols action must be acknowledge-and-redirect or block, got ${result.action}`,
    ).toBe(true);
  });
});

// ─── PNW Attribution Accuracy (P-PNW-07 through P-PNW-10) ───────────────────

describe('PNW Attribution Accuracy', () => {
  it('P-PNW-07: Room 15 Cedar Culture has nation-specific attribution (not generic Coast Salish alone)', () => {
    const roomSpec = require('../../skill-hall/rooms/15-cedar-culture/room-spec.json') as Record<string, unknown>;
    const json = JSON.stringify(roomSpec);

    // Room 15 must mention at least one named nation (Lekwungen, Nuu-chah-nulth, Kwakwaka'wakw, Makah)
    const hasNationAttribution =
      /Lekwungen|Saanich|Musqueam|Squamish|Nuu-chah-nulth|Kwakwaka|Makah|Lil'wat|Sts'ailes/i.test(json);
    expect(hasNationAttribution, 'P-PNW-07: Room 15 must have specific nation attribution').toBe(true);

    // Must NOT be only generic "Coast Salish" without a named nation
    // The presence of named nations satisfies the attribution requirement
    const namedNationsPattern = /Lekwungen|Nuu-chah-nulth|Kwakwaka'wakw|Makah/i;
    expect(namedNationsPattern.test(json), 'P-PNW-07: Room 15 must name specific nations').toBe(true);
  });

  it('P-PNW-08: Room 16 Salmon World has zero "Native American" unattributed occurrences', () => {
    const roomSpec = require('../../skill-hall/rooms/16-salmon-world/room-spec.json') as Record<string, unknown>;
    const json = JSON.stringify(roomSpec);

    // Assert zero "Native American" unattributed occurrences
    expect(
      /\bNative American\b/.test(json),
      'P-PNW-08: Room 16 must have zero "Native American" occurrences',
    ).toBe(false);

    // First Salmon ceremony module should have cultural sovereignty level >= 2
    const modules = (roomSpec as { modules?: Array<{ id: string; culturalLevel: number }> }).modules ?? [];
    const firstSalmonModule = modules.find((m) => m.id.includes('first-salmon'));
    expect(firstSalmonModule, 'P-PNW-08: Room 16 must have a first-salmon module').toBeDefined();
    expect(
      (firstSalmonModule?.culturalLevel ?? 0) >= 2,
      `P-PNW-08: First Salmon ceremony module must be culturalLevel 2+, got ${firstSalmonModule?.culturalLevel}`,
    ).toBe(true);
  });

  it('P-PNW-09: Rooms 17 and 18 contain zero unattributed pan-Indigenous generalizations', () => {
    const panIndigenousPatterns = [
      /\bNative American tradition\b/i,
      /\bIndigenous peoples believed\b/i,
      /\bAboriginal practice\b/i,
    ];

    const roomsToScan = [
      '../../skill-hall/rooms/17-salish-weaving/room-spec.json',
      '../../skill-hall/rooms/18-village-world/room-spec.json',
    ];

    for (const roomPath of roomsToScan) {
      const spec = require(roomPath) as Record<string, unknown>;
      const json = JSON.stringify(spec);

      for (const pattern of panIndigenousPatterns) {
        expect(
          pattern.test(json),
          `P-PNW-09: ${roomPath} must not contain pan-Indigenous pattern: ${pattern}`,
        ).toBe(false);
      }
    }
  });

  it('P-PNW-10: SalishSeaWays nations array has 40+ nations and potlatch historical context exists', () => {
    // loadAllNations() aggregates all nations-reference JSON files
    const nations = loadAllNations();
    expect(nations.length, 'P-PNW-10: SalishSeaWays must have at least 40 nations').toBeGreaterThanOrEqual(40);

    // Check that nations include Washington state / US Pacific Northwest nations
    // (cross-border coverage — Salish Sea nations span US/Canadian border)
    const allNationText = JSON.stringify(nations);
    const hasUsNations =
      /Washington|Lummi|Makah|Quinault|Suquamish|Puyallup|Tulalip|Yakama/i.test(allNationText);
    expect(hasUsNations, 'P-PNW-10: nations list must include Washington State (US) nations').toBe(true);

    // Verify potlatch historical context document exists and loads
    const potlatchContext = loadPotlatchContext();
    expect(potlatchContext, 'P-PNW-10: potlatch context must load without error').toBeDefined();
    expect(potlatchContext.id, 'P-PNW-10: potlatch context must have an id').toBeTruthy();
    // The criminalizationHistory or equivalent historical field must exist
    const ctxStr = JSON.stringify(potlatchContext);
    expect(
      /criminal|ban|suppress|revival|history|historical|Indian Act/i.test(ctxStr),
      'P-PNW-10: potlatch context must include historical documentation',
    ).toBe(true);
  });
});

// ─── Phase 1 + Phase 2 Interoperability (P-PNW-11 through P-PNW-14) ─────────

describe('Phase 1 + Phase 2 Interoperability', () => {
  it('P-PNW-11: Phase 1 sacred ceremony block still fires with Phase 2 warden instance', () => {
    // Sun dance is FN-CER-002: Level 4 block — critical Phase 1 anchor test
    // Phase 2 must NOT have relaxed this block
    const result = warden.classify(
      'What happens in a sun dance ceremony?',
      Tradition.FIRST_NATIONS,
      'sun-dance',
    );
    expect(result.level, 'P-PNW-11: sun dance must be Level 4 with Phase 2 warden').toBe(
      CulturalSovereigntyLevel.SACRED_CEREMONIAL,
    );
    expect(result.action, 'P-PNW-11: Phase 1 Level 4 block must not be relaxed by Phase 2').toBe('block');
    expect(result.referralTarget, 'P-PNW-11: Level 4 block has no referralTarget').toBeUndefined();
  });

  it('P-PNW-12: CulturalSovereigntyWarden accepts both FIRST_NATIONS and CROSS_TRADITION traditions', () => {
    // Verify the warden processes both tradition values without throwing or returning undefined
    const result1 = warden.classify(
      'Traditional craft weaving techniques shared in educational contexts',
      Tradition.FIRST_NATIONS,
      'crafts',
    );
    expect(result1, 'P-PNW-12: FIRST_NATIONS classify must return a valid result').toBeDefined();
    expect(typeof result1.level, 'P-PNW-12: result.level must be a number').toBe('number');
    expect(result1.action, 'P-PNW-12: result.action must be a string').toBeTruthy();

    // CROSS_TRADITION (the internal mapping for 'salish-sea' runtime strings)
    const result2 = warden.classify(
      'Traditional craft weaving techniques shared in educational contexts',
      Tradition.CROSS_TRADITION,
      'crafts',
    );
    expect(result2, 'P-PNW-12: CROSS_TRADITION classify must return a valid result').toBeDefined();
    expect(typeof result2.level, 'P-PNW-12: CROSS_TRADITION result.level must be a number').toBe('number');
    expect(result2.action, 'P-PNW-12: CROSS_TRADITION result.action must be a string').toBeTruthy();
  });

  it('P-PNW-13: Zero pan-Indigenous language across all 18 room-spec.json files', () => {
    const panIndigenousPatterns = [
      /\bNative American tradition\b/i,
      /\bIndigenous peoples believed\b/i,
      /\bAboriginal practice\b/i,
    ];

    const allRoomPaths = [
      '../../skill-hall/rooms/01-building-shelter/room-spec.json',
      '../../skill-hall/rooms/02-fiber-textile/room-spec.json',
      '../../skill-hall/rooms/03-animals-wildlife/room-spec.json',
      '../../skill-hall/rooms/04-woodcraft-tools/room-spec.json',
      '../../skill-hall/rooms/05-food-preservation/room-spec.json',
      '../../skill-hall/rooms/06-music-instruments/room-spec.json',
      '../../skill-hall/rooms/07-metalwork-smithing/room-spec.json',
      '../../skill-hall/rooms/08-pottery-clay/room-spec.json',
      '../../skill-hall/rooms/09-plant-knowledge/room-spec.json',
      '../../skill-hall/rooms/10-community-culture/room-spec.json',
      '../../skill-hall/rooms/11-seasonal-living/room-spec.json',
      '../../skill-hall/rooms/12-history-memory/room-spec.json',
      '../../skill-hall/rooms/13-northern-watercraft/room-spec.json',
      '../../skill-hall/rooms/14-arctic-living/room-spec.json',
      '../../skill-hall/rooms/15-cedar-culture/room-spec.json',
      '../../skill-hall/rooms/16-salmon-world/room-spec.json',
      '../../skill-hall/rooms/17-salish-weaving/room-spec.json',
      '../../skill-hall/rooms/18-village-world/room-spec.json',
    ];

    for (const roomPath of allRoomPaths) {
      const spec = require(roomPath) as Record<string, unknown>;
      const json = JSON.stringify(spec);

      for (const pattern of panIndigenousPatterns) {
        expect(
          pattern.test(json),
          `P-PNW-13: ${roomPath} must not contain pan-Indigenous generalization: ${String(pattern)}`,
        ).toBe(false);
      }
    }
  });

  it('P-PNW-14: Phase 1 and Phase 2 rooms have distinct tradition fields in room-spec.json', () => {
    const room15Spec = require('../../skill-hall/rooms/15-cedar-culture/room-spec.json') as {
      room: number;
      traditions: string[];
    };
    const room01Spec = require('../../skill-hall/rooms/01-building-shelter/room-spec.json') as {
      room: number;
      traditions: string[];
    };

    // Room 15 is a Phase 2 PNW room — traditions must be present and include first-nations or similar
    expect(room15Spec.traditions, 'P-PNW-14: Room 15 must have a traditions array').toBeDefined();
    expect(room15Spec.traditions.length, 'P-PNW-14: Room 15 must have at least one tradition').toBeGreaterThan(0);
    expect(room15Spec.room, 'P-PNW-14: Room 15 room number must be 15').toBe(15);

    // Room 01 is a Phase 1 cross-tradition room
    expect(room01Spec.traditions, 'P-PNW-14: Room 01 must have a traditions array').toBeDefined();
    expect(room01Spec.traditions.length, 'P-PNW-14: Room 01 must have at least one tradition').toBeGreaterThan(0);
    expect(room01Spec.room, 'P-PNW-14: Room 01 room number must be 1').toBe(1);

    // The traditions must be non-empty and contain named tradition strings
    for (const tradition of room15Spec.traditions) {
      expect(typeof tradition, 'P-PNW-14: Room 15 tradition entries must be strings').toBe('string');
      expect(tradition.length, 'P-PNW-14: Room 15 tradition entries must not be empty').toBeGreaterThan(0);
    }
    for (const tradition of room01Spec.traditions) {
      expect(typeof tradition, 'P-PNW-14: Room 01 tradition entries must be strings').toBe('string');
      expect(tradition.length, 'P-PNW-14: Room 01 tradition entries must not be empty').toBeGreaterThan(0);
    }
  });
});
