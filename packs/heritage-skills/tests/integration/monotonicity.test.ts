/**
 * Safety Monotonicity Tests — Phase 2
 *
 * Tests MONO-01 through MONO-10.
 *
 * All 10 tests are MANDATORY. Safety monotonicity failure is a CRITICAL
 * deployment blocker — no child component may relax a parent safety boundary.
 *
 * Verifies that Phase 2 additions (marine domain, PNW rooms, badge engine,
 * reconnecting pathway) have NOT relaxed any of the existing Phase 1
 * safety domains or Phase 1 cultural sovereignty classifications.
 *
 * Source: foxfire-heritage-mission-v2--08-component-specs-phase2.md P2-12
 *         ROADMAP.md Phase 39 success criterion 1
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { SafetyWarden } from '../../safety/warden.js';
import { CulturalSovereigntyWarden } from '../../safety/cultural-warden.js';
import {
  SafetyDomain,
  CulturalSovereigntyLevel,
  Tradition,
} from '../../shared/types.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const safetyWarden = new SafetyWarden();
const culturalWarden = new CulturalSovereigntyWarden();

/** Recursively collect all JSON files under a directory (excluding node_modules). */
function collectJsonFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...collectJsonFiles(fullPath));
    } else if (entry.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

// ─── Safety Rule Monotonicity (MONO-01 through MONO-06) ─────────────────────

describe('Safety Rule Monotonicity', () => {
  it('MONO-01: water bath canning CRITICAL rule still fires after Phase 2 (no food safety regression)', () => {
    // The single most important monotonicity check: if Phase 2 accidentally suppressed FOOD domain
    // CRITICAL rules, this would be a life-safety regression (botulism risk).
    // FOOD-001 pattern: low-acid + water-bath combination triggers CRITICAL rule
    const result = safetyWarden.evaluate(
      'How to water bath can low-acid green beans at home',
      SafetyDomain.FOOD,
    );
    expect(
      result.canProceed,
      'MONO-01: water bath canning CRITICAL rule must still fire — life-safety regression if absent',
    ).toBe(false);
    const allMessages = result.annotations.map((a) => a.message).join(' ');
    expect(
      /botulism|pressure.?can|water.?bath|low.?acid|USDA|NCHFP/i.test(allMessages),
      'MONO-01: annotation must mention botulism risk, pressure canning, or official food safety source',
    ).toBe(true);
  });

  it('MONO-02: plant identification CRITICAL rule still fires after Phase 2 (no plant safety regression)', () => {
    // PLANT domain CRITICAL rule: plant identification from text alone is not safe.
    const result = safetyWarden.evaluate(
      'Is this white-flowered plant by the creek edible?',
      SafetyDomain.PLANT,
    );
    expect(
      result.canProceed,
      'MONO-02: plant ID CRITICAL rule must still fire — hemlock/toxic look-alike protection',
    ).toBe(false);
    const allMessages = result.annotations.map((a) => a.message).join(' ');
    expect(
      /poison|toxic|hemlock|identification|field.?guide|expert|deadly/i.test(allMessages),
      'MONO-02: annotation must mention toxicity, hemlock, or expert identification requirement',
    ).toBe(true);
  });

  it('MONO-03: Arctic CO rule still fires after Phase 2 (no arctic survival safety regression)', () => {
    // ARCTIC_SURVIVAL domain CRITICAL rule: enclosed shelter + fire = CO risk
    const result = safetyWarden.evaluate(
      'Light qulliq inside igloo without vent hole',
      SafetyDomain.ARCTIC_SURVIVAL,
    );
    expect(
      result.canProceed,
      'MONO-03: Arctic CO rule must still fire — carbon monoxide protection intact',
    ).toBe(false);
    const allMessages = result.annotations.map((a) => a.message).join(' ');
    expect(
      /ventilat|CO|carbon|monoxide/i.test(allMessages),
      'MONO-03: annotation must mention ventilation, CO, or carbon monoxide',
    ).toBe(true);
  });

  it('MONO-04: MARINE domain does NOT interfere with FOOD domain safety rules', () => {
    // The MARINE domain must NOT override or suppress FOOD CRITICAL rules.
    // Evaluating low-acid water bath canning content with MARINE domain should return STANDARD
    // (no marine rules match food preservation — domains are independent).
    // FOOD-001 pattern: requires "low-acid" + "water-bath" combination
    const foodContent = 'Low-acid water bath canning at home — is it safe?';
    const marineResult = safetyWarden.evaluate(foodContent, SafetyDomain.MARINE);
    // MARINE domain has no food preservation rules — returns STANDARD (no match)
    expect(marineResult.domain, 'MONO-04: evaluation domain must be MARINE').toBe(SafetyDomain.MARINE);
    expect(marineResult.annotations.length, 'MONO-04: MARINE domain must have no annotations for food content').toBe(0);

    // FOOD domain still independently catches the same content — proves no suppression
    const foodResult = safetyWarden.evaluate(foodContent, SafetyDomain.FOOD);
    expect(foodResult.canProceed, 'MONO-04: FOOD domain must still catch unsafe low-acid water bath canning').toBe(false);

    // Domain isolation confirmed: MARINE returns STANDARD, FOOD returns CRITICAL block
    expect(marineResult.canProceed, 'MONO-04: MARINE must not block food preservation content').toBe(true);
    expect(foodResult.canProceed, 'MONO-04: FOOD must block unsafe low-acid water bath canning').toBe(false);
  });

  it('MONO-05: Phase 2 room JSON files (rooms 15-18) contain no safety override/relaxation fields', () => {
    // Safety monotonicity: no Phase 2 file may relax safety levels established in Phase 1
    const forbiddenFields = [
      'overrideSafetyLevel',
      'suppressDomain',
      'bypassGate',
      'safetyOverride',
      'disableSafety',
      'ignoreSafety',
      'skipSafetyCheck',
    ];

    const phase2RoomDirs = [
      join(__dirname, '../../skill-hall/rooms/15-cedar-culture'),
      join(__dirname, '../../skill-hall/rooms/16-salmon-world'),
      join(__dirname, '../../skill-hall/rooms/17-salish-weaving'),
      join(__dirname, '../../skill-hall/rooms/18-village-world'),
    ];

    for (const roomDir of phase2RoomDirs) {
      const jsonFiles = collectJsonFiles(roomDir);
      for (const jsonFile of jsonFiles) {
        const content = readFileSync(jsonFile, 'utf-8');
        for (const forbiddenField of forbiddenFields) {
          expect(
            content.includes(forbiddenField),
            `MONO-05: ${jsonFile} must not contain safety relaxation field '${forbiddenField}'`,
          ).toBe(false);
        }
      }
    }
  });

  it('MONO-06: All 10 safety domains are active after Phase 2 — SafetyWarden processes all without error', () => {
    // Verify SafetyDomain enum has exactly 10 values (Phase 1 had 9, Phase 2 added MARINE)
    const domainValues = Object.values(SafetyDomain);
    expect(domainValues.length, 'MONO-06: SafetyDomain must have exactly 10 values').toBe(10);

    // Each domain must include MARINE
    expect(domainValues, 'MONO-06: MARINE domain must be present in SafetyDomain enum').toContain(SafetyDomain.MARINE);

    // All 10 domains must process benign content without throwing
    const benignContent = 'How do I learn about traditional heritage skills safely?';
    for (const domain of domainValues) {
      const result = safetyWarden.evaluate(benignContent, domain as SafetyDomain);
      expect(
        result,
        `MONO-06: SafetyWarden.evaluate must complete without error for domain ${domain}`,
      ).toBeDefined();
      expect(
        result.domain,
        `MONO-06: evaluation domain must match requested domain ${domain}`,
      ).toBe(domain);
    }
  });
});

// ─── Cultural Sovereignty Monotonicity (MONO-07 through MONO-10) ─────────────

describe('Cultural Sovereignty Monotonicity', () => {
  it('MONO-07: Phase 1 Level 4 ceremony block still intact — generic ceremony domain with first-nations', () => {
    // Phase 1 anchor test: if Phase 2 relaxed 'ceremony' domain handling, this fails.
    // The 'ceremony' domain has no exact rule match — falls to 'general' which has Level 4 (KC-L4-001).
    const result = culturalWarden.classify(
      'Describe the sweat lodge ceremony protocols',
      Tradition.FIRST_NATIONS,
      'ceremony',
    );
    expect(
      (result.level as number),
      'MONO-07: ceremony domain must classify at Level 4 via general rule fallback',
    ).toBe(CulturalSovereigntyLevel.SACRED_CEREMONIAL as number);
    expect(result.action, 'MONO-07: Level 4 action must be block').toBe('block');
  });

  it('MONO-08: Phase 1 Level 4 sacred-drumming block still intact after Phase 2', () => {
    // FN-MUS-002: sacred-drumming is Level 4 for first-nations
    // Phase 2 must not have changed this classification
    const result = culturalWarden.classify(
      'What are the sacred drumming songs of the Cree used in ceremony?',
      Tradition.FIRST_NATIONS,
      'sacred-drumming',
    );
    expect(
      (result.level as number),
      'MONO-08: sacred-drumming must remain Level 4 (not relaxed by Phase 2)',
    ).toBe(CulturalSovereigntyLevel.SACRED_CEREMONIAL as number);
    expect(result.action, 'MONO-08: Level 4 action must be block').toBe('block');
    expect(result.referralTarget, 'MONO-08: Level 4 block must have no referralTarget').toBeUndefined();
  });

  it('MONO-09: salish-sea tradition gets equivalent Level 4 protection for ceremony content', () => {
    // PNW content must receive the same Level 4 protection as first-nations content.
    // 'salish-sea' as tradition string maps to CROSS_TRADITION at runtime.
    // Cross-tradition 'ceremony' domain has no exact match -> falls to 'general' -> Level 4 (KC-L4-001).
    const result = culturalWarden.classify(
      'Cedar ceremonial carvings meaning',
      // At runtime, 'salish-sea' falls to CROSS_TRADITION in switch, returning cross-tradition rules
      'salish-sea' as unknown as Tradition,
      'ceremony',
    );
    expect(
      (result.level as number),
      'MONO-09: salish-sea + ceremony domain must classify at Level 4 (equivalent protection)',
    ).toBe(CulturalSovereigntyLevel.SACRED_CEREMONIAL as number);
    expect(result.action, 'MONO-09: Level 4 action must be block').toBe('block');
  });

  it('MONO-10: Phase 2 room JSON files (rooms 15-18) contain no cultural level override or relaxation fields', () => {
    // Cultural sovereignty monotonicity: no Phase 2 file may reduce sovereign protection levels
    const forbiddenFields = [
      'culturalLevelOverride',
      'reducedProtection',
      'allowLevel4',
      'bypassCultural',
      'overrideCultural',
      'suppressCultural',
      'culturalBypass',
    ];

    const phase2RoomDirs = [
      join(__dirname, '../../skill-hall/rooms/15-cedar-culture'),
      join(__dirname, '../../skill-hall/rooms/16-salmon-world'),
      join(__dirname, '../../skill-hall/rooms/17-salish-weaving'),
      join(__dirname, '../../skill-hall/rooms/18-village-world'),
    ];

    for (const roomDir of phase2RoomDirs) {
      const jsonFiles = collectJsonFiles(roomDir);
      for (const jsonFile of jsonFiles) {
        const content = readFileSync(jsonFile, 'utf-8');
        for (const forbiddenField of forbiddenFields) {
          expect(
            content.includes(forbiddenField),
            `MONO-10: ${jsonFile} must not contain cultural sovereignty relaxation field '${forbiddenField}'`,
          ).toBe(false);
        }
      }
    }
  });
});
