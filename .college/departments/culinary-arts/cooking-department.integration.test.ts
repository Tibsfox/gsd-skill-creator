import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { CollegeLoader } from '../../college/college-loader.js';
import { TrySessionRunner } from '../../college/try-session-runner.js';
import { CalibrationEngine } from '../../calibration/engine.js';
import { registerCookingModels } from './calibration/cooking-calibration.js';
import type { CalibrationDelta } from '../../rosetta-core/types.js';

// Direct imports for SC3 -- CollegeLoader regex parser truncates descriptions
// with escaped quotes, so we import concepts directly for description checks
import { bakersRatios } from './concepts/baking-science/bakers-ratios.js';
import { glutenDevelopment } from './concepts/baking-science/gluten-development.js';
import { sugarChemistry } from './concepts/baking-science/sugar-chemistry.js';

// Direct imports for SC5 calibration model safety boundary verification
import {
  temperatureModel,
  timingModel,
  seasoningModel,
  textureModel,
} from '../../calibration/models/cooking.js';

const DEPARTMENTS_PATH = join(process.cwd(), '.college', 'departments');

function createMockStore() {
  const deltas: CalibrationDelta[] = [];
  return {
    deltas,
    async save(delta: CalibrationDelta) { deltas.push(delta); },
    async getHistory() { return deltas; },
  };
}

describe('Cooking Department Integration', () => {
  let loader: CollegeLoader;

  beforeAll(() => {
    loader = new CollegeLoader(DEPARTMENTS_PATH);
  });

  // ─── SC1: All 7 wings load with 3+ concepts ────────────────────────────────

  describe('SC1: All 7 wings load with at least 3 concepts each', () => {
    const wings = [
      { id: 'food-science', minConcepts: 6 },
      { id: 'thermodynamics', minConcepts: 4 },
      { id: 'nutrition', minConcepts: 3 },
      { id: 'technique', minConcepts: 3 },
      { id: 'baking-science', minConcepts: 4 },
      { id: 'food-safety', minConcepts: 4 },
      { id: 'home-economics', minConcepts: 4 },
    ];

    for (const { id, minConcepts } of wings) {
      it(`${id} wing loads with ${minConcepts} concepts`, async () => {
        const wing = await loader.loadWing('culinary-arts', id);
        expect(wing.concepts.length).toBeGreaterThanOrEqual(3);
        expect(wing.concepts.length).toBe(minConcepts);
      });
    }
  });

  // ─── SC2: Calibration models produce correct adjustments ────────────────────

  describe('SC2: Calibration models produce correct adjustments', () => {
    it('temperature model: overdone -> negative oven_temp adjustment', async () => {
      const engine = new CalibrationEngine(createMockStore());
      registerCookingModels(engine);
      const result = await engine.process({
        domain: 'cooking-temperature',
        translationId: 'sc2-temp',
        observedResult: 'overdone, burnt',
        expectedResult: 'properly cooked',
        parameters: { oven_temp: 425 },
      });
      expect(result.adjustment.oven_temp).toBeLessThan(0);
    });

    it('timing model: undercooked -> positive cook_time adjustment', async () => {
      const engine = new CalibrationEngine(createMockStore());
      registerCookingModels(engine);
      const result = await engine.process({
        domain: 'cooking-timing',
        translationId: 'sc2-time',
        observedResult: 'undercooked, raw center',
        expectedResult: 'cooked through',
        parameters: { cook_time: 30 },
      });
      expect(result.adjustment.cook_time).toBeGreaterThan(0);
    });

    it('seasoning model: bland -> positive salt_amount adjustment', async () => {
      const engine = new CalibrationEngine(createMockStore());
      registerCookingModels(engine);
      const result = await engine.process({
        domain: 'cooking-seasoning',
        translationId: 'sc2-season',
        observedResult: 'too little flavor, under-seasoned',
        expectedResult: 'well seasoned',
        parameters: { salt_amount: 5 },
      });
      expect(result.adjustment.salt_amount).toBeGreaterThan(0);
    });

    it('texture model: too dry -> adjustments present', async () => {
      const engine = new CalibrationEngine(createMockStore());
      registerCookingModels(engine);
      const result = await engine.process({
        domain: 'cooking-texture',
        translationId: 'sc2-texture',
        observedResult: 'too dry, overcooked',
        expectedResult: 'moist and tender',
        parameters: { heat_level: 400 },
      });
      expect(Object.keys(result.adjustment).length).toBeGreaterThan(0);
    });
  });

  // ─── SC3: Flat cookies diagnosis ──────────────────────────────────────────

  describe('SC3: Baking Science concepts ground the flat cookies diagnosis', () => {
    it('concepts contain butter ratio, chill time, and spread diagnostic data', async () => {
      // Use direct imports because CollegeLoader regex truncates descriptions with escaped quotes
      const allDescriptions = [bakersRatios, glutenDevelopment, sugarChemistry]
        .map(c => c.description).join(' ');

      // Butter ratio causing spread
      expect(allDescriptions).toMatch(/butter/i);
      expect(allDescriptions).toMatch(/spread/i);

      // Chill time / cold butter
      expect(allDescriptions).toMatch(/chill|cold butter/i);

      // Over-mixing / gluten
      expect(allDescriptions).toMatch(/over-mix/i);
    });

    it('CollegeLoader loads baking-science wing with 4 concepts', async () => {
      const wing = await loader.loadWing('culinary-arts', 'baking-science');
      expect(wing.concepts.length).toBe(4);
    });
  });

  // ─── SC4: First meal try-session completes ────────────────────────────────

  describe('SC4: First meal try-session completes from start to finish', () => {
    it('loadSession succeeds and session has 6 steps', async () => {
      const runner = await TrySessionRunner.loadSession(loader, 'culinary-arts', 'first-meal');
      const state = runner.getState();
      expect(state.sessionId).toBe('first-meal');
      expect(state.totalSteps).toBe(6);
      expect(state.status).toBe('active');
    });

    it('completing all steps reaches completed status', async () => {
      const runner = await TrySessionRunner.loadSession(loader, 'culinary-arts', 'first-meal');

      // Complete all 6 steps
      for (let i = 0; i < 6; i++) {
        runner.completeStep();
      }

      const state = runner.getState();
      expect(state.status).toBe('completed');
      expect(state.stepsCompleted.every(Boolean)).toBe(true);
    });

    it('session explores concepts from at least 4 different wings', async () => {
      const runner = await TrySessionRunner.loadSession(loader, 'culinary-arts', 'first-meal');

      // Complete all steps to track all concepts
      for (let i = 0; i < 6; i++) {
        runner.completeStep();
      }

      const explored = runner.getConceptsExplored();
      // Map concepts to wings
      const wingMap: Record<string, string> = {
        'cook-temperature-danger-zone': 'food-safety',
        'cook-safe-storage-times': 'food-safety',
        'cook-cross-contamination': 'food-safety',
        'cook-allergen-management': 'food-safety',
        'cook-wet-heat-methods': 'technique',
        'cook-dry-heat-methods': 'technique',
        'cook-combination-methods': 'technique',
        'cook-starch-gelatinization': 'food-science',
        'cook-maillard-reaction': 'food-science',
        'cook-macronutrient-roles': 'nutrition',
        'cook-preparation-nutrition': 'nutrition',
        'cook-meal-planning': 'home-economics',
      };

      const wingsExplored = new Set<string>();
      for (const conceptId of explored) {
        if (wingMap[conceptId]) {
          wingsExplored.add(wingMap[conceptId]);
        }
      }
      expect(wingsExplored.size).toBeGreaterThanOrEqual(4);
    });
  });

  // ─── SC5: Safety boundary awareness per wing ─────────────────────────────

  describe('SC5: Each wing has at least one calibration-related safety boundary', () => {
    it('all 4 calibration models have absolute safety boundaries', () => {
      const models = [temperatureModel, timingModel, seasoningModel, textureModel];
      for (const model of models) {
        const absoluteBoundaries = model.safetyBoundaries.filter(
          (b: { type: string }) => b.type === 'absolute',
        );
        expect(
          absoluteBoundaries.length,
          `${model.domain} should have absolute safety boundaries`,
        ).toBeGreaterThanOrEqual(1);
      }
    });

    it('food-safety wing contains safety concepts directly', async () => {
      const wing = await loader.loadWing('culinary-arts', 'food-safety');
      expect(wing.concepts.length).toBeGreaterThanOrEqual(4);
      const ids = wing.concepts.map(c => c.id);
      expect(ids).toContain('cook-temperature-danger-zone');
    });

    it('each non-safety wing connects to safety within 2 hops', async () => {
      // Build a concept relationship graph for all wings
      const allWingIds = ['food-science', 'thermodynamics', 'nutrition', 'technique', 'baking-science', 'home-economics'];
      const safetyIds = new Set([
        'cook-temperature-danger-zone', 'cook-cross-contamination',
        'cook-safe-storage-times', 'cook-allergen-management',
      ]);

      // Build adjacency map from all wings
      const adjacency = new Map<string, string[]>();
      for (const wingId of [...allWingIds, 'food-safety']) {
        const wing = await loader.loadWing('culinary-arts', wingId);
        for (const concept of wing.concepts) {
          const targets = concept.relationships.map(r => r.targetId);
          adjacency.set(concept.id, targets);
        }
      }

      // For each wing, check if any concept reaches a safety concept within 2 hops
      for (const wingId of allWingIds) {
        const wing = await loader.loadWing('culinary-arts', wingId);
        let reachesSafety = false;

        for (const concept of wing.concepts) {
          // 1-hop
          const hop1 = concept.relationships.map(r => r.targetId);
          if (hop1.some(id => safetyIds.has(id))) { reachesSafety = true; break; }

          // 2-hop
          for (const mid of hop1) {
            const hop2 = adjacency.get(mid) || [];
            if (hop2.some(id => safetyIds.has(id))) { reachesSafety = true; break; }
          }
          if (reachesSafety) break;
        }

        expect(
          reachesSafety,
          `Wing ${wingId} should reach a safety concept within 2 hops`,
        ).toBe(true);
      }
    });
  });

  // ─── Token compliance ─────────────────────────────────────────────────────

  describe('Token compliance', () => {
    it('culinary-arts summary is under 3000 tokens', async () => {
      const summary = await loader.loadSummary('culinary-arts');
      expect(summary.tokenCost).toBeLessThan(3000);
    });
  });
});
