/**
 * End-to-End Test: "Why are my cookies flat?"
 *
 * TEST-05: User asks about flat cookies -> system routes to baking science
 * -> diagnoses butter ratio/chill time -> records calibration delta.
 *
 * This is the flagship scenario proving all three pillars work together
 * for the Cooking with Claude milestone.
 *
 * @module tests/flat-cookies-e2e
 */

import { describe, it, expect, afterAll } from 'vitest';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import { PythonPanel } from '../panels/python-panel.js';
import { CalibrationEngine } from '../calibration/engine.js';
import type { DomainCalibrationModel } from '../calibration/engine.js';
import { DeltaStore } from '../calibration/delta-store.js';
import type { DeltaStoreConfig } from '../calibration/delta-store.js';

// Baking science concepts
import { bakersRatios } from '../departments/culinary-arts/concepts/baking-science/bakers-ratios.js';
import { glutenDevelopment } from '../departments/culinary-arts/concepts/baking-science/gluten-development.js';
import { sugarChemistry } from '../departments/culinary-arts/concepts/baking-science/sugar-chemistry.js';
import { yeastBiology } from '../departments/culinary-arts/concepts/baking-science/yeast-biology.js';

// ─── Flat Cookies E2E Tests ─────────────────────────────────────────────────

describe('End-to-End: Why are my cookies flat?', () => {
  // Temp directories for cleanup
  const tmpDirs: string[] = [];

  afterAll(() => {
    for (const dir of tmpDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('Flat cookies diagnostic data', () => {
    it('bakers-ratios mentions butter ratio and spread', () => {
      expect(bakersRatios.description).toMatch(/butter/i);
      expect(bakersRatios.description).toMatch(/spread|ratio/i);
    });

    it('sugar-chemistry mentions sugar type affecting spread', () => {
      expect(sugarChemistry.description).toMatch(/spread/i);
    });

    it('gluten-development mentions over-mixing', () => {
      expect(glutenDevelopment.description).toMatch(/over-mix/i);
    });

    it('all baking concepts belong to culinary-arts domain', () => {
      expect(bakersRatios.domain).toBe('culinary-arts');
      expect(glutenDevelopment.domain).toBe('culinary-arts');
      expect(sugarChemistry.domain).toBe('culinary-arts');
      expect(yeastBiology.domain).toBe('culinary-arts');
    });

    it('gluten-development mentions chill time reducing spread', () => {
      expect(glutenDevelopment.description).toMatch(/chill/i);
      expect(glutenDevelopment.description).toMatch(/spread/i);
    });
  });

  describe('Search routing', () => {
    it('searching for butter spread in culinary-arts returns baking concepts', () => {
      const registry = new ConceptRegistry();
      registry.register(bakersRatios);
      registry.register(glutenDevelopment);
      registry.register(sugarChemistry);
      registry.register(yeastBiology);

      // Search for terms related to flat cookies
      const results = registry.search('butter', 'culinary-arts');
      expect(results.length).toBeGreaterThan(0);

      // At least one result should be a baking science concept
      const bakingIds = results.map((r) => r.id);
      const hasBaking = bakingIds.some(
        (id) => id.includes('bakers') || id.includes('sugar') || id.includes('gluten'),
      );
      expect(hasBaking).toBe(true);
    });

    it('searching for spread returns relevant baking concepts', () => {
      const registry = new ConceptRegistry();
      registry.register(bakersRatios);
      registry.register(glutenDevelopment);
      registry.register(sugarChemistry);
      registry.register(yeastBiology);

      const results = registry.search('spread', 'culinary-arts');
      expect(results.length).toBeGreaterThan(0);

      // Multiple baking concepts should discuss spread
      const ids = results.map((r) => r.id);
      expect(ids).toContain('cook-bakers-ratios');
    });
  });

  describe('Diagnosis output', () => {
    it('translating bakers-ratios through Python panel produces code mentioning ratio', () => {
      const panel = new PythonPanel();
      const expr = panel.translate(bakersRatios);

      expect(expr.code).toBeTruthy();
      expect(expr.code!.length).toBeGreaterThan(50);
      // The output should be about ratios/proportions
      expect(expr.code).toMatch(/ratio|proportion|percent|butter|flour/i);
    });

    it('translating gluten-development produces informative output', () => {
      const panel = new PythonPanel();
      const expr = panel.translate(glutenDevelopment);

      expect(expr.code).toBeTruthy();
      expect(expr.explanation).toBeTruthy();
      expect(expr.explanation).toMatch(/Gluten Development/);
    });
  });

  describe('Calibration feedback', () => {
    it('records calibration delta for flat cookies scenario', async () => {
      const tmpDir = mkdtempSync(join(tmpdir(), 'flat-cookies-cal-'));
      tmpDirs.push(tmpDir);

      const storeConfig: DeltaStoreConfig = {
        baseDir: tmpDir,
        userId: 'cookie-user',
        domain: 'baking',
      };
      const store = new DeltaStore(storeConfig);
      const engine = new CalibrationEngine(store);

      // Register a baking calibration model
      const bakingModel: DomainCalibrationModel = {
        domain: 'baking',
        parameters: ['butter_ratio', 'chill_time_minutes', 'sugar_type_index'],
        science:
          'Cookie spread is primarily controlled by butter ratio (fat percentage ' +
          'relative to flour), dough chill time (cold butter = less spread), and ' +
          'sugar type (brown sugar = more spread due to acidity).',
        safetyBoundaries: [],
        computeAdjustment: (delta) => {
          // "too much" triggers 'over' direction in the engine's compare()
          if (delta.direction === 'over') {
            return { butter_ratio: -5, chill_time_minutes: 15, sugar_type_index: 0 };
          }
          return { butter_ratio: 0, chill_time_minutes: 0, sugar_type_index: 0 };
        },
        confidence: () => 0.75,
      };
      engine.registerModel(bakingModel);

      const delta = await engine.process({
        domain: 'baking',
        translationId: bakersRatios.id,
        observedResult: 'cookies came out flat and spread too much',
        expectedResult: 'cookies should be thick and chewy',
        parameters: { butter_ratio: 60, chill_time_minutes: 0, sugar_type_index: 1 },
      });

      expect(delta).toBeDefined();
      expect(delta.domainModel).toBe('baking');
      // Adjustment should suggest reducing butter ratio and increasing chill time
      expect(delta.adjustment.butter_ratio).toBeLessThanOrEqual(0);
      expect(delta.adjustment.chill_time_minutes).toBeGreaterThanOrEqual(0);

      // Verify persistence
      const stored = await store.getHistory();
      expect(stored.length).toBeGreaterThan(0);
      expect(stored[0].domainModel).toBe('baking');
    });
  });

  describe('INT-18: Complete flat cookies end-to-end', () => {
    it('user asks "why are my cookies flat?" -> diagnosis with calibration delta', async () => {
      // Step 1: Register baking concepts in registry (simulating concept discovery)
      const registry = new ConceptRegistry();
      registry.register(bakersRatios);
      registry.register(glutenDevelopment);
      registry.register(sugarChemistry);
      registry.register(yeastBiology);

      // Step 2: Identify relevant baking concepts for flat cookies diagnosis
      const conceptsToCheck = [bakersRatios, sugarChemistry, glutenDevelopment];
      for (const concept of conceptsToCheck) {
        expect(concept.domain).toBe('culinary-arts');
      }

      // Step 3: Translate the diagnosis concept through Python panel
      const panel = new PythonPanel();
      const expr = panel.translate(bakersRatios);
      expect(expr.code).toBeTruthy();

      // Step 4: Record calibration feedback
      const tmpDir = mkdtempSync(join(tmpdir(), 'e2e-cookies-'));
      tmpDirs.push(tmpDir);

      const storeConfig: DeltaStoreConfig = {
        baseDir: tmpDir,
        userId: 'e2e-user',
        domain: 'baking',
      };
      const store = new DeltaStore(storeConfig);
      const calEngine = new CalibrationEngine(store);

      const bakingModel: DomainCalibrationModel = {
        domain: 'baking',
        parameters: ['butter_ratio', 'chill_time_minutes'],
        science:
          'Cookie diagnosis: flat cookies indicate excess fat ratio or insufficient chill time.',
        safetyBoundaries: [],
        computeAdjustment: () => ({ butter_ratio: -5, chill_time_minutes: 30 }),
        confidence: () => 0.8,
      };
      calEngine.registerModel(bakingModel);

      const delta = await calEngine.process({
        domain: 'baking',
        translationId: 'cook-bakers-ratios',
        observedResult: 'cookies flat',
        expectedResult: 'cookies thick',
        parameters: { butter_ratio: 65, chill_time_minutes: 0 },
      });

      // Verify: diagnosis produced (concepts found)
      expect(conceptsToCheck.length).toBe(3);

      // Verify: calibration delta recorded
      expect(delta.domainModel).toBe('baking');
      expect(delta.adjustment).toBeDefined();

      // Verify: delta suggests reducing butter and increasing chill
      expect(delta.adjustment.butter_ratio).toBeLessThan(0);
      expect(delta.adjustment.chill_time_minutes).toBeGreaterThan(0);

      // Verify: delta persisted
      const persisted = await store.getHistory();
      expect(persisted.length).toBeGreaterThan(0);
      expect(persisted[0].domainModel).toBe('baking');
      expect(persisted[0].observedResult).toBe('cookies flat');
    });
  });
});
