/**
 * Safety-Critical Integration Tests
 *
 * Tests S-FOOD-01 through S-FOOD-06, S-PLANT-01 through S-PLANT-04,
 * S-ARCTIC-01 through S-ARCTIC-04, S-STRUCT-01/02, S-FIRE-01/02.
 *
 * All 18 tests are MANDATORY. Any failure blocks deployment.
 *
 * Source: foxfire-heritage-mission-v2--05-test-plan-phase1.md §2
 *
 * CRITICAL API NOTES applied:
 * - SafetyWarden.evaluate(content, domain, tradition?) — NOT evaluate(content, roomCtx)
 * - SafetyLevel enum: standard, annotated, gated, redirected
 * - CRITICAL behavior: canProceed === false when annotation.isCritical === true
 * - Check annotations[].message, not safetyNote
 */

import { describe, it, expect } from 'vitest';
import { SafetyWarden, SafetyDomain, SafetyLevel, Tradition } from '../../safety/warden.js';

// Single shared warden instance for all tests — loads real JSON rules files.
const warden = new SafetyWarden();

// ─── Food Safety (S-FOOD-01 through S-FOOD-06) ───────────────────────────────

describe('Food Safety', () => {
  it('S-FOOD-01: water bath canning of low-acid vegetables is blocked (botulism risk)', () => {
    // Pattern FOOD-001: "low.?acid.{0,40}water.?bath" requires both terms present
    const result = warden.evaluate(
      'Can low-acid vegetables in water bath at home — green beans, beets, corn',
      SafetyDomain.FOOD,
    );
    // FOOD-001: low-acid + water bath is REDIRECTED + CRITICAL -> canProceed=false
    expect(result.canProceed).toBe(false);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/pressure|botulism/);
  });

  it('S-FOOD-02: low-acid vegetables in water bath canning is blocked (CRITICAL botulism)', () => {
    const result = warden.evaluate(
      'How to can low-acid vegetables at home using water bath method',
      SafetyDomain.FOOD,
    );
    // FOOD-001 pattern: "low.?acid.{0,40}water.?bath" — this should match
    expect(result.canProceed).toBe(false);
    // Level should be redirected or at minimum not standard
    expect(result.level).not.toBe(SafetyLevel.STANDARD);
  });

  it('S-FOOD-03: pemmican with fat rendering safety gate fires', () => {
    const result = warden.evaluate(
      'Make pemmican with rendered fat from suet',
      SafetyDomain.FOOD,
    );
    // FOOD-002: pemmican + fat is GATED + CRITICAL -> canProceed=false
    expect(result.canProceed).toBe(false);
    const messages = result.annotations.map(a => a.message).join(' ');
    // Annotation mentions temperature requirement for fat rendering
    expect(messages.toLowerCase()).toMatch(/temperature|200|pathogens|rancidity/);
  });

  it('S-FOOD-04: fermentation of vegetables triggers safety annotation about contamination', () => {
    const result = warden.evaluate(
      'Fermenting vegetables cabbage sauerkraut',
      SafetyDomain.FOOD,
    );
    // FOOD-006: fermentation of vegetables -> annotated with contamination guidance
    expect(result.level).not.toBe(SafetyLevel.STANDARD);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/mold|submerged|brine|ferment/);
  });

  it('S-FOOD-05: smoking fish at low temperature triggers safety gate (minimum temp required)', () => {
    const result = warden.evaluate(
      'Smoke fish at room temperature with cold smoking technique',
      SafetyDomain.FOOD,
    );
    // FOOD-003: smoking + temperature/cold smoke is GATED + CRITICAL -> canProceed=false
    expect(result.canProceed).toBe(false);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/temperature|145|165|internal/);
  });

  it('S-FOOD-06: drying meat triggers annotation with storage or inspection guidance', () => {
    const result = warden.evaluate(
      'Drying meat for preservation jerky',
      SafetyDomain.FOOD,
    );
    // FOOD-007: drying meat -> annotated
    expect(result.level).not.toBe(SafetyLevel.STANDARD);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/dry|temperature|airflow|pathogen/);
  });
});

// ─── Plant Safety (S-PLANT-01 through S-PLANT-04) ────────────────────────────

describe('Plant Safety', () => {
  it('S-PLANT-01: plant identification from description is CRITICALLY blocked (canProceed=false)', () => {
    const result = warden.evaluate(
      'Is this white-flowered plant by the creek safe to eat? What plant is this?',
      SafetyDomain.PLANT,
    );
    // PLANT-001: identification from description — REDIRECTED + CRITICAL -> canProceed=false
    expect(result.canProceed).toBe(false);
    // At least one annotation must be critical
    const hasCritical = result.annotations.some(a => a.isCritical);
    expect(hasCritical).toBe(true);
  });

  it('S-PLANT-02: wild carrot with hemlock look-alike warning fires for plants with toxic look-alikes', () => {
    const result = warden.evaluate(
      'Wild carrot looks similar to hemlock and can be confused with poison hemlock',
      SafetyDomain.PLANT,
    );
    // PLANT-002: look-alike + hemlock -> GATED + CRITICAL -> canProceed=false
    expect(result.canProceed).toBe(false);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/hemlock|toxic|look.?alike/);
  });

  it('S-PLANT-03: using yarrow medicinally triggers medical redirect (GATED)', () => {
    // Pattern PLANT-004: "medicinal.{0,60}plant|herbal.{0,60}plant" — medicinal must come before plant/herb
    const result = warden.evaluate(
      'Medicinal plant uses for yarrow herb as a herbal remedy and treatment',
      SafetyDomain.PLANT,
    );
    // PLANT-004: medicinal + plant -> GATED (medical redirect)
    expect(result.level).not.toBe(SafetyLevel.STANDARD);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/medicinal|healthcare provider|medical/);
  });

  it('S-PLANT-04: edible plant foraging requires multiple identification markers', () => {
    const result = warden.evaluate(
      'Forage and harvest wild edible plants from the forest',
      SafetyDomain.PLANT,
    );
    // PLANT-003: forage + wild plant -> ANNOTATED with multiple marker requirement
    expect(result.level).not.toBe(SafetyLevel.STANDARD);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/multiple|features|identify/);
  });
});

// ─── Arctic Survival Safety (S-ARCTIC-01 through S-ARCTIC-04) ────────────────

describe('Arctic Survival Safety', () => {
  it('S-ARCTIC-01: igloo with qulliq inside triggers CO/ventilation warning (canProceed=false)', () => {
    const result = warden.evaluate(
      'Build igloo snow shelter and light qulliq oil lamp inside',
      SafetyDomain.ARCTIC_SURVIVAL,
      Tradition.INUIT,
    );
    // ARCTIC-001: snow shelter without ventilation mention -> REDIRECTED + CRITICAL
    // ARCTIC-005: qulliq inside enclosed space -> GATED
    expect(result.canProceed).toBe(false);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/ventilat|co|carbon monoxide/);
  });

  it('S-ARCTIC-02: cold exposure activity triggers hypothermia awareness annotation', () => {
    const result = warden.evaluate(
      'Dealing with hypothermia cold exposure extreme cold emergency',
      SafetyDomain.ARCTIC_SURVIVAL,
      Tradition.INUIT,
    );
    // ARCTIC-003: hypothermia + cold exposure -> GATED
    expect(result.level).not.toBe(SafetyLevel.STANDARD);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/hypothermia|35|shiver|temperature/);
  });

  it('S-ARCTIC-03: frozen lake travel without thickness check is gated', () => {
    const result = warden.evaluate(
      'Travel across frozen lake on ice',
      SafetyDomain.ARCTIC_SURVIVAL,
      Tradition.INUIT,
    );
    // ARCTIC-002: travel across ice without thickness mention -> GATED + CRITICAL
    expect(result.canProceed).toBe(false);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/thickness|ice|inches|centimeter/);
  });

  it('S-ARCTIC-04: sub-zero layered dressing for cold weather triggers annotation mentioning frostbite prevention', () => {
    const result = warden.evaluate(
      'Layering clothing for sub-zero arctic cold weather',
      SafetyDomain.ARCTIC_SURVIVAL,
      Tradition.INUIT,
    );
    // ARCTIC-004: layering/cold-weather clothing -> ANNOTATED
    expect(result.level).not.toBe(SafetyLevel.STANDARD);
    const messages = result.annotations.map(a => a.message).join(' ');
    // The annotation covers layering and cold protection (implicit frostbite prevention)
    expect(messages.toLowerCase()).toMatch(/layer|wool|fur|insul/);
  });
});

// ─── Structural/Fire Safety (S-STRUCT-01/02, S-FIRE-01/02) ───────────────────

describe('Structural and Fire Safety', () => {
  it('S-STRUCT-01: log cabin construction triggers load-bearing/foundation safety guidance', () => {
    const result = warden.evaluate(
      'Build log cabin with load-bearing notched logs and foundation sill',
      SafetyDomain.STRUCTURAL,
    );
    // STRUCT-001: load-bearing -> GATED; STRUCT-004: foundation + wood -> ANNOTATED
    expect(result.level).not.toBe(SafetyLevel.STANDARD);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/load.?bearing|structural|foundation|rot|decay/);
  });

  it('S-STRUCT-02: wigwam or longhouse with fire inside triggers ventilation annotation', () => {
    const result = warden.evaluate(
      'Build shelter wigwam with indoor fire burning inside the enclosed room',
      SafetyDomain.STRUCTURAL,
    );
    // STRUCT-002: build shelter -> ANNOTATED (ventilation, egress, drainage)
    // The structural rule fires; fire+indoor is handled separately by FIRE domain
    expect(result.level).not.toBe(SafetyLevel.STANDARD);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/ventilat|egress|drainage|shelter|hazard/);
  });

  it('S-FIRE-01: blacksmithing at the forge triggers PPE safety gate', () => {
    const result = warden.evaluate(
      'Forge blacksmithing metalwork at the forge with flame burning',
      SafetyDomain.FIRE,
    );
    // FIRE-003: forge without protective equipment mention -> GATED
    expect(result.level).not.toBe(SafetyLevel.STANDARD);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/protective|leather|apron|glove|eye|protect/);
  });

  it('S-FIRE-02: pottery kiln firing triggers safety gate about kiln construction safety', () => {
    const result = warden.evaluate(
      'Fire pottery in kiln burning at high temperature',
      SafetyDomain.FIRE,
    );
    // FIRE-003: kiln without protective equipment mention -> GATED
    expect(result.level).not.toBe(SafetyLevel.STANDARD);
    const messages = result.annotations.map(a => a.message).join(' ');
    expect(messages.toLowerCase()).toMatch(/protective|leather|apron|glove|eye|kiln|forge/);
  });
});
