/**
 * Milestone Integration Test Suite — Phase 27: Test Suite and Verification
 *
 * Verifies TEST-01 through TEST-07 end-to-end across all College Expansion phases.
 * Proves that Phases 22-26 all work correctly together at 40+ department scale.
 *
 * TEST-01: All departments discovered, parsed, and loaded (discovery + loading)
 * TEST-02: Cross-reference integrity — all XRefEdge targets are known departments
 * TEST-03: Mapping validation — all referenced subjects exist as real directories
 * TEST-04: Safety-critical — 4 department wardens enforce boundaries correctly
 * TEST-05: Token budget — summary < 3K per dept, active < 12K per wing
 * TEST-06: Calibration registration — all domain models register without error
 * TEST-07: Performance — listDepartments() completes in < 100ms
 *
 * @module college/milestone-integration.test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { CollegeLoader } from './college-loader.js';
import { MappingLoader } from '../mappings/mapping-loader.js';
import { XRefRegistry } from '../cross-references/xref-registry.js';
import { CalibrationEngine } from '../calibration/engine.js';
import type { CalibrationDelta } from '../rosetta-core/types.js';
import { ChemistrySafetyWarden } from '../departments/chemistry/safety/chemistry-safety-warden.js';
import { ElectronicsSafetyChecker } from '../departments/electronics/safety/electronics-safety-boundaries.js';
import { PESafetyWarden } from '../departments/physical-education/safety/pe-safety-warden.js';
import { NutritionSafetyWarden } from '../departments/nutrition/safety/nutrition-safety-warden.js';
import { chemistrySafetyModel } from '../departments/chemistry/calibration/chemistry-calibration.js';
import { electronicsModel } from '../departments/electronics/calibration/electronics-calibration.js';
import { peSafetyModel } from '../departments/physical-education/calibration/pe-calibration.js';
import { nutritionSafetyModel } from '../departments/nutrition/calibration/nutrition-calibration.js';
import {
  consistencyModel,
  preferenceModel,
  energyModel,
} from '../departments/mind-body/calibration/mind-body-calibration.js';
import {
  temperatureModel,
  timingModel,
  seasoningModel,
  textureModel,
} from '../calibration/models/cooking.js';

// ─── Paths ───────────────────────────────────────────────────────────────────

const DEPARTMENTS_PATH = join(process.cwd(), '.college', 'departments');
const MAPPINGS_PATH = join(process.cwd(), '.college', 'mappings');

// ─── Shared Setup ────────────────────────────────────────────────────────────

/** Minimal DeltaStore for CalibrationEngine construction in registration tests. */
function createMockStore() {
  const saved: CalibrationDelta[] = [];
  return {
    save: async (delta: CalibrationDelta) => {
      saved.push(delta);
    },
    getHistory: async () => [...saved],
  };
}

let loader: CollegeLoader;
let discoveredDepts: string[];

beforeAll(() => {
  loader = new CollegeLoader(DEPARTMENTS_PATH);
  discoveredDepts = loader.listDepartments();
});

// ─── TEST-01: Department Discovery and Loading ────────────────────────────────

describe('TEST-01: All departments discovered, parsed, and loaded by CollegeLoader', () => {
  it('discovers at least 38 departments from the filesystem', () => {
    expect(discoveredDepts.length).toBeGreaterThanOrEqual(38);
  });

  it('discovered departments include the 3 original departments (culinary-arts, mathematics, mind-body)', () => {
    expect(discoveredDepts).toContain('culinary-arts');
    expect(discoveredDepts).toContain('mathematics');
    expect(discoveredDepts).toContain('mind-body');
  });

  it('discovered departments include Phase 22 core academic departments (15 depts)', () => {
    const coreAcademic = [
      'math', 'science', 'reading', 'communication', 'critical-thinking',
      'physics', 'chemistry', 'geography', 'history', 'problem-solving',
      'statistics', 'business', 'engineering', 'materials', 'technology',
    ];
    for (const dept of coreAcademic) {
      expect(discoveredDepts).toContain(dept);
    }
  });

  it('discovered departments include Phase 22 applied practical departments (10 depts)', () => {
    const appliedPractical = [
      'coding', 'data-science', 'digital-literacy', 'writing', 'languages',
      'logic', 'economics', 'environmental', 'psychology', 'nutrition',
    ];
    for (const dept of appliedPractical) {
      expect(discoveredDepts).toContain(dept);
    }
  });

  it('discovered departments include Phase 22 specialized content departments (10 depts)', () => {
    const specialized22 = [
      'art', 'philosophy', 'nature-studies', 'physical-education', 'home-economics',
      'theology', 'astronomy', 'learning', 'music', 'trades',
    ];
    for (const dept of specialized22) {
      expect(discoveredDepts).toContain(dept);
    }
  });

  it('discovered departments include Phase 23 specialized pack departments (3 depts)', () => {
    expect(discoveredDepts).toContain('electronics');
    expect(discoveredDepts).toContain('spatial-computing');
    expect(discoveredDepts).toContain('cloud-systems');
  });

  it('loadSummary succeeds for every discovered department with no errors', async () => {
    const errors: string[] = [];
    for (const deptId of discoveredDepts) {
      try {
        const summary = await loader.loadSummary(deptId);
        expect(summary.id).toBe(deptId);
        expect(summary.name).toBeTruthy();
      } catch (err) {
        errors.push(`${deptId}: ${String(err)}`);
      }
    }
    expect(errors).toEqual([]);
  });

  it('every discovered department has at least one wing in its summary', async () => {
    const emptyWings: string[] = [];
    for (const deptId of discoveredDepts) {
      const summary = await loader.loadSummary(deptId);
      if (summary.wings.length === 0) {
        emptyWings.push(deptId);
      }
    }
    expect(emptyWings).toEqual([]);
  });
});

// ─── TEST-02: Cross-Reference Integrity ──────────────────────────────────────

describe('TEST-02: Cross-reference integrity — all XRefEdge targets exist as departments', () => {
  it('XRefRegistry loads without error and has exactly 63 edges', () => {
    const registry = new XRefRegistry();
    expect(registry.countEdges()).toBe(63);
  });

  it('every XRefEdge "from" department exists in the discovered department list', () => {
    const registry = new XRefRegistry();
    const deptSet = new Set(discoveredDepts);
    const orphanFrom: string[] = [];

    for (const edge of registry.getAll()) {
      if (!deptSet.has(edge.from)) {
        orphanFrom.push(edge.from);
      }
    }

    expect(orphanFrom).toEqual([]);
  });

  it('every XRefEdge "to" department exists in the discovered department list', () => {
    const registry = new XRefRegistry();
    const deptSet = new Set(discoveredDepts);
    const orphanTo: string[] = [];

    for (const edge of registry.getAll()) {
      if (!deptSet.has(edge.to)) {
        orphanTo.push(edge.to);
      }
    }

    expect(orphanTo).toEqual([]);
  });

  it('nutrition appears as a source in >= 3 edges (NUTR-101 enables environmental, PE, home-economics)', () => {
    const registry = new XRefRegistry();
    const nutritionEdges = registry.getEdgesFrom('nutrition');
    expect(nutritionEdges.length).toBeGreaterThanOrEqual(3);
  });

  it('chemistry -> nutrition edge exists (CHEM-101 enables NUTR-101 per dependency graph)', () => {
    const registry = new XRefRegistry();
    const chemEdges = registry.getEdgesFrom('chemistry');
    const chemToNutrition = chemEdges.some((e) => e.to === 'nutrition');
    expect(chemToNutrition).toBe(true);
  });

  it('XRefRegistry contains department IDs from more than 20 unique departments', () => {
    const registry = new XRefRegistry();
    const xrefDepts = registry.getDepartments();
    expect(xrefDepts.length).toBeGreaterThan(20);
  });
});

// ─── TEST-03: Mapping Validation ─────────────────────────────────────────────

describe('TEST-03: Mapping validation — no orphan subject references', () => {
  let mappingLoader: MappingLoader;

  beforeAll(() => {
    mappingLoader = new MappingLoader(MAPPINGS_PATH);
  });

  it('default.json ships with at least 6 virtual department groupings (MAP-02)', () => {
    const groups = mappingLoader.listVirtualDepartments();
    expect(groups.length).toBeGreaterThanOrEqual(6);
  });

  it('every subject in every VirtualDepartment exists as a real department directory', () => {
    const deptSet = new Set(discoveredDepts);
    const virtualDepts = mappingLoader.listVirtualDepartments();
    const orphans: string[] = [];

    for (const vd of virtualDepts) {
      for (const subject of vd.subjects) {
        if (!deptSet.has(subject)) {
          orphans.push(`VirtualDept[${vd.id}].subjects: "${subject}"`);
        }
      }
    }

    expect(orphans).toEqual([]);
  });

  it('tracks.json ships with at least 3 educational tracks (MAP-03)', () => {
    const tracks = mappingLoader.listTracks();
    expect(tracks.length).toBeGreaterThanOrEqual(3);
  });

  it('every subject in every EducationalTrack exists as a real department directory', () => {
    const deptSet = new Set(discoveredDepts);
    const tracks = mappingLoader.listTracks();
    const orphans: string[] = [];

    for (const track of tracks) {
      for (const subject of track.subjects) {
        if (!deptSet.has(subject)) {
          orphans.push(`Track[${track.id}].subjects: "${subject}"`);
        }
      }
    }

    expect(orphans).toEqual([]);
  });

  it('each educational track has at least 2 subjects in prerequisite order', () => {
    const tracks = mappingLoader.listTracks();
    for (const track of tracks) {
      expect(track.subjects.length).toBeGreaterThanOrEqual(2);
    }
  });
});

// ─── TEST-04: Safety-Critical Boundaries ─────────────────────────────────────

describe('TEST-04: Safety-critical — 4 department wardens enforce boundaries correctly', () => {
  // ── Chemistry — SAFE-01 ──────────────────────────────────────────────────

  describe('Chemistry: ChemistrySafetyWarden (SAFE-01)', () => {
    let chemWarden: ChemistrySafetyWarden;

    beforeAll(() => {
      chemWarden = new ChemistrySafetyWarden();
    });

    it('annotate mode adds ppe-required annotation for content containing "acid"', () => {
      const result = chemWarden.annotate('Handle the acid in a fume hood', {
        module: 'acid-base',
        technique: 'titration',
        userConditions: [],
      });
      expect(result.original).toBeTruthy();
      expect(result.annotations.some((a) => a.type === 'ppe-required')).toBe(true);
    });

    it('gate mode returns allowed:false for asthma condition with vapor procedure', () => {
      const result = chemWarden.gate(
        ['asthma'],
        'heating organic solvent producing vapor and fume',
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeTruthy();
    });

    it('gate mode returns allowed:true with no relevant conditions', () => {
      const result = chemWarden.gate([], 'mixing salt and water solution');
      expect(result.allowed).toBe(true);
    });

    it('redirect mode returns redirected:true for hazmat query — absolute boundary (SAFE-01)', () => {
      const result = chemWarden.redirect('how do I synthesize illegal explosive compound');
      expect(result.redirected).toBe(true);
      expect(result.response).toBeTruthy();
      expect(result.supervisorGuidance).toBeTruthy();
    });

    it('redirect mode returns redirected:false for a safe chemistry query', () => {
      const result = chemWarden.redirect('explain the pH scale');
      expect(result.redirected).toBe(false);
    });
  });

  // ── Electronics — SAFE-02 ────────────────────────────────────────────────

  describe('Electronics: ElectronicsSafetyChecker (SAFE-02)', () => {
    let checker: ElectronicsSafetyChecker;

    beforeAll(() => {
      checker = new ElectronicsSafetyChecker();
    });

    it('annotate mode flags dc_voltage_zone_v:100 as a violation (limit=50, upper-limit polarity)', () => {
      const violations = checker.annotate({ dc_voltage_zone_v: 100 });
      expect(violations.length).toBeGreaterThan(0);
      const dcViolation = violations.find((v) => v.parameter === 'dc_voltage_zone_v');
      expect(dcViolation).toBeDefined();
    });

    it('annotate mode does not flag dc_voltage_zone_v:30 (safe, within 50V limit)', () => {
      const violations = checker.annotate({ dc_voltage_zone_v: 30 });
      expect(violations).toEqual([]);
    });

    it('gate mode returns allowed:false when absolute dc_voltage_zone_v boundary is violated', () => {
      const result = checker.gate({ dc_voltage_zone_v: 100 });
      expect(result.allowed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('gate mode returns allowed:true when no absolute boundary is violated', () => {
      const result = checker.gate({ dc_voltage_zone_v: 30 });
      expect(result.allowed).toBe(true);
    });

    it('redirect mode returns safe clamped value of 50 for dc_voltage_zone_v:100', () => {
      const redirects = checker.redirect({ dc_voltage_zone_v: 100 });
      expect(redirects.length).toBeGreaterThan(0);
      const dcRedirect = redirects.find((r) => r.parameter === 'dc_voltage_zone_v');
      expect(dcRedirect?.safeValue).toBe(50);
    });
  });

  // ── Physical Education — SAFE-03 ─────────────────────────────────────────

  describe('Physical Education: PESafetyWarden (SAFE-03)', () => {
    let peWarden: PESafetyWarden;

    beforeAll(() => {
      peWarden = new PESafetyWarden();
    });

    it('annotate mode adds warm-up annotation for sprint activity', () => {
      const result = peWarden.annotate('Perform 200m sprint intervals at full pace', {
        module: 'track-and-field',
        technique: 'sprint',
        userConditions: [],
      });
      expect(result.annotations.some((a) => a.type === 'warm-up')).toBe(true);
    });

    it('gate mode returns allowed:false for cardiac-condition with maximal sprint', () => {
      const result = peWarden.gate(
        ['cardiac-condition'],
        'high-intensity interval training session',
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeTruthy();
    });

    it('gate mode returns allowed:true for gentle walking with no conditions', () => {
      const result = peWarden.gate([], 'gentle walking at moderate pace');
      expect(result.allowed).toBe(true);
    });

    it('redirect mode returns redirected:true for query containing "maximal exertion"', () => {
      // 'maximal exertion' is in OVEREXERTION_KEYWORDS — confirmed from overexertion-boundary.ts
      const result = peWarden.redirect(
        'I want to perform maximal exertion testing today',
      );
      expect(result.redirected).toBe(true);
      expect(result.medicalGuidance).toBeTruthy();
    });
  });

  // ── Nutrition — SAFE-04 ──────────────────────────────────────────────────

  describe('Nutrition: NutritionSafetyWarden (SAFE-04)', () => {
    let nutritionWarden: NutritionSafetyWarden;

    beforeAll(() => {
      nutritionWarden = new NutritionSafetyWarden();
    });

    it('gate mode returns allowed:false when user has peanut allergy and recipe contains peanut butter', () => {
      const result = nutritionWarden.gate(['peanuts'], ['peanut butter', 'jam', 'bread']);
      expect(result.allowed).toBe(false);
      expect(result.blockedIngredients.length).toBeGreaterThan(0);
    });

    it('gate mode returns allowed:true with empty allergen profile (no restrictions)', () => {
      const result = nutritionWarden.gate([], ['peanut butter', 'jam', 'bread']);
      expect(result.allowed).toBe(true);
    });

    it('redirect mode returns substitutions for milk (allergen-free alternatives exist)', () => {
      // SUBSTITUTION_DATABASE has entries for milk, butter, eggs, flour — not for peanut butter.
      // Use 'milk' which maps to ['oat milk', 'coconut milk', 'almond milk', 'rice milk'].
      const result = nutritionWarden.redirect('milk');
      expect(result.redirected).toBe(true);
      expect(result.substitutions.length).toBeGreaterThan(0);
    });

    it('checkAllergen returns Big 9 warning for peanuts', () => {
      const result = nutritionWarden.checkAllergen('peanuts');
      expect(result.present).toBe(true);
      expect(result.warning).toBeTruthy();
    });

    it('checkAllergen returns present:false for a non-allergen ingredient', () => {
      const result = nutritionWarden.checkAllergen('black pepper');
      expect(result.present).toBe(false);
    });
  });
});

// ─── TEST-05: Token Budget Verification ──────────────────────────────────────

describe('TEST-05: Token budget — summary < 3K per dept, active < 12K per wing', () => {
  it('every department summary tier stays under 3000 tokens', async () => {
    const violations: string[] = [];
    for (const deptId of discoveredDepts) {
      const summary = await loader.loadSummary(deptId);
      if (summary.tokenCost >= 3000) {
        violations.push(`${deptId}: tokenCost=${summary.tokenCost} (limit=3000)`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('every wing active tier stays under 12000 tokens across all departments', async () => {
    const violations: string[] = [];
    for (const deptId of discoveredDepts) {
      const summary = await loader.loadSummary(deptId);
      for (const wing of summary.wings) {
        const wingContent = await loader.loadWing(deptId, wing.id);
        if (wingContent.tokenCost >= 12000) {
          violations.push(
            `${deptId}/${wing.id}: tokenCost=${wingContent.tokenCost} (limit=12000)`,
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

// ─── TEST-06: Calibration Model Registration ─────────────────────────────────

describe('TEST-06: Calibration model registration — all domain models register without error', () => {
  it('chemistrySafetyModel registers (domain: chemistry-lab-safety)', () => {
    const engine = new CalibrationEngine(createMockStore());
    expect(() => engine.registerModel(chemistrySafetyModel)).not.toThrow();
  });

  it('electronicsModel registers (domain: electronics-safety)', () => {
    const engine = new CalibrationEngine(createMockStore());
    expect(() => engine.registerModel(electronicsModel)).not.toThrow();
  });

  it('peSafetyModel registers (domain: pe-exercise-safety)', () => {
    const engine = new CalibrationEngine(createMockStore());
    expect(() => engine.registerModel(peSafetyModel)).not.toThrow();
  });

  it('nutritionSafetyModel registers (domain: nutrition-allergen-safety)', () => {
    const engine = new CalibrationEngine(createMockStore());
    expect(() => engine.registerModel(nutritionSafetyModel)).not.toThrow();
  });

  it('consistencyModel registers (domain: mind-body-consistency)', () => {
    const engine = new CalibrationEngine(createMockStore());
    expect(() => engine.registerModel(consistencyModel)).not.toThrow();
  });

  it('preferenceModel registers (domain: mind-body-preference)', () => {
    const engine = new CalibrationEngine(createMockStore());
    expect(() => engine.registerModel(preferenceModel)).not.toThrow();
  });

  it('energyModel registers (domain: mind-body-energy)', () => {
    const engine = new CalibrationEngine(createMockStore());
    expect(() => engine.registerModel(energyModel)).not.toThrow();
  });

  it('all 4 cooking calibration models register in a single engine without error', () => {
    const engine = new CalibrationEngine(createMockStore());
    expect(() => {
      engine.registerModel(temperatureModel);
      engine.registerModel(timingModel);
      engine.registerModel(seasoningModel);
      engine.registerModel(textureModel);
    }).not.toThrow();
  });

  it('registerModel throws TypeError on duplicate domain registration', () => {
    const engine = new CalibrationEngine(createMockStore());
    engine.registerModel(chemistrySafetyModel);
    expect(() => engine.registerModel(chemistrySafetyModel)).toThrow(TypeError);
  });

  it('replaceModel replaces an existing registered model without throwing', () => {
    const engine = new CalibrationEngine(createMockStore());
    engine.registerModel(chemistrySafetyModel);
    expect(() => engine.replaceModel(chemistrySafetyModel)).not.toThrow();
  });
});

// ─── TEST-07: CollegeLoader Performance ──────────────────────────────────────

describe('TEST-07: Performance — listDepartments() completes in < 100ms', () => {
  it('listDepartments() for 40+ departments completes in under 100ms', () => {
    // Fresh loader to avoid state from beforeAll
    const freshLoader = new CollegeLoader(DEPARTMENTS_PATH);

    const start = performance.now();
    const depts = freshLoader.listDepartments();
    const elapsed = performance.now() - start;

    console.log(
      `listDepartments() discovered ${depts.length} departments in ${elapsed.toFixed(2)}ms`,
    );

    expect(depts.length).toBeGreaterThanOrEqual(38);
    expect(elapsed).toBeLessThan(100);
  });

  it('10 successive listDepartments() calls complete in under 1000ms total', () => {
    const freshLoader = new CollegeLoader(DEPARTMENTS_PATH);
    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      freshLoader.listDepartments();
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});
