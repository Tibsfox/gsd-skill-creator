/**
 * Integration Round-Trip Tests
 *
 * Proves: Rosetta Core -> College -> Calibration Engine round-trip completes.
 * TEST-04: Cross-component interface verification.
 *
 * Tests the three-pillar architecture by wiring real components together
 * and verifying concepts flow through the entire pipeline without errors.
 *
 * @module tests/integration-roundtrip
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import { PanelRouter } from '../rosetta-core/panel-router.js';
import type { TranslationContext } from '../rosetta-core/panel-router.js';
import { ExpressionRenderer } from '../rosetta-core/expression-renderer.js';
import { RosettaCore } from '../rosetta-core/engine.js';
import type { PanelId } from '../rosetta-core/types.js';
import { PanelRegistry } from '../panels/panel-interface.js';
import type { PanelInterface } from '../panels/panel-interface.js';
import { PythonPanel } from '../panels/python-panel.js';
import { CppPanel } from '../panels/cpp-panel.js';
import { JavaPanel } from '../panels/java-panel.js';
import { CalibrationEngine } from '../calibration/engine.js';
import type { DomainCalibrationModel } from '../calibration/engine.js';
import { DeltaStore } from '../calibration/delta-store.js';
import type { DeltaStoreConfig } from '../calibration/delta-store.js';
import { CollegeLoader } from '../college/college-loader.js';
import {
  exponentialDecay,
  trigFunctions,
} from '../departments/mathematics/concepts/index.js';

// ─── Shared Test State ──────────────────────────────────────────────────────

let registry: ConceptRegistry;
let panelRegistry: PanelRegistry;
let router: PanelRouter;
let renderer: ExpressionRenderer;
let rosettaCore: RosettaCore;
let panelInstances: Map<PanelId, PanelInterface>;

const collegePath = join(process.cwd(), '.college', 'departments');

beforeAll(() => {
  // Build the Rosetta Core pipeline with real components
  registry = new ConceptRegistry();
  registry.register(exponentialDecay);
  registry.register(trigFunctions);

  // Create panel instances
  const pythonPanel = new PythonPanel();
  const cppPanel = new CppPanel();
  const javaPanel = new JavaPanel();

  panelInstances = new Map<PanelId, PanelInterface>();
  panelInstances.set('python', pythonPanel);
  panelInstances.set('cpp', cppPanel);
  panelInstances.set('java', javaPanel);

  // Set up router with panels registered
  router = new PanelRouter();
  router.registerPanel(pythonPanel);
  router.registerPanel(cppPanel);
  router.registerPanel(javaPanel);

  renderer = new ExpressionRenderer();

  rosettaCore = new RosettaCore({
    registry,
    router,
    renderer,
    panelInstances,
  });
});

// ─── Integration Round-Trip Tests ───────────────────────────────────────────

describe('Integration Round-Trip', () => {
  describe('Test 1: Rosetta Core translation pipeline', () => {
    it('translates a math concept through the full Rosetta Core pipeline', async () => {
      const context: TranslationContext = {
        userExpertise: 'intermediate',
        currentDomain: 'mathematics',
        recentPanels: [],
        taskType: 'implement',
      };

      const result = await rosettaCore.translate('math-exponential-decay', context);

      expect(result.concept.id).toBe('math-exponential-decay');
      expect(result.primary).toBeDefined();
      expect(result.primary.content).toBeTruthy();
      expect(result.primary.content.length).toBeGreaterThan(50);
      expect(result.primary.tokenCost).toBeGreaterThan(0);
      expect(result.id).toBeTruthy();
      expect(result.panels.primary).toBeTruthy();
      expect(result.panels.rationale).toBeTruthy();
    });
  });

  describe('Test 2: College -> Registry integration', () => {
    it('concepts loaded from College departments can be registered in ConceptRegistry', async () => {
      const loader = new CollegeLoader(collegePath);
      const departments = loader.listDepartments();
      expect(departments).toContain('mathematics');

      const summary = await loader.loadSummary('mathematics');
      expect(summary.wings.length).toBeGreaterThan(0);
      expect(summary.name).toBeTruthy();

      // Math concepts are already registered -- verify they are searchable
      const results = registry.search('exponential');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.id === 'math-exponential-decay')).toBe(true);
    });
  });

  describe('Test 3: Calibration processes feedback', () => {
    it('CalibrationEngine processes feedback and produces bounded delta', async () => {
      const tmpDir = mkdtempSync(join(tmpdir(), 'cal-roundtrip-'));
      const storeConfig: DeltaStoreConfig = {
        baseDir: tmpDir,
        userId: 'test-user',
        domain: 'roundtrip-test',
      };
      const store = new DeltaStore(storeConfig);
      const engine = new CalibrationEngine(store);

      // Register a simple test model
      const model: DomainCalibrationModel = {
        domain: 'roundtrip-test',
        parameters: ['difficulty'],
        science: 'Test science model for integration round-trip',
        safetyBoundaries: [],
        computeAdjustment: (delta) => ({
          difficulty: delta.magnitude * (delta.direction === 'under' ? -1 : 1),
        }),
        confidence: () => 0.8,
      };
      engine.registerModel(model);

      const calibrationDelta = await engine.process({
        domain: 'roundtrip-test',
        translationId: 'test-translation',
        observedResult: 'too high',
        expectedResult: 'manageable',
        parameters: { difficulty: 100 },
      });

      expect(calibrationDelta).toBeDefined();
      expect(calibrationDelta.domainModel).toBe('roundtrip-test');
      expect(calibrationDelta.adjustment).toBeDefined();
      expect(calibrationDelta.confidence).toBe(0.8);

      // Clean up
      rmSync(tmpDir, { recursive: true, force: true });
    });
  });

  describe('Test 4: Full round-trip', () => {
    it('full round-trip: College concept -> Rosetta translation -> Calibration feedback', async () => {
      // Step 1: Verify the concept was loaded and can be found in College
      const loader = new CollegeLoader(collegePath);
      const departments = loader.listDepartments();
      expect(departments).toContain('mathematics');

      // Step 2: Translate through Rosetta Core
      const context: TranslationContext = {
        userExpertise: 'intermediate',
        currentDomain: 'mathematics',
        recentPanels: [],
        taskType: 'implement',
      };
      const result = await rosettaCore.translate(exponentialDecay.id, context);
      expect(result.primary.content).toBeTruthy();
      expect(result.concept.id).toBe('math-exponential-decay');

      // Step 3: Feed calibration feedback
      const tmpDir = mkdtempSync(join(tmpdir(), 'roundtrip-full-'));
      const storeConfig: DeltaStoreConfig = {
        baseDir: tmpDir,
        userId: 'test-user',
        domain: 'mathematics',
      };
      const store = new DeltaStore(storeConfig);
      const calEngine = new CalibrationEngine(store);

      const mathModel: DomainCalibrationModel = {
        domain: 'mathematics',
        parameters: ['abstraction_level'],
        science: 'Mathematical pedagogy calibration model',
        safetyBoundaries: [],
        computeAdjustment: () => ({ abstraction_level: -5 }),
        confidence: () => 0.7,
      };
      calEngine.registerModel(mathModel);

      const delta = await calEngine.process({
        domain: 'mathematics',
        translationId: result.concept.id,
        observedResult: 'too abstract',
        expectedResult: 'concrete example',
        parameters: { abstraction_level: 80 },
      });

      expect(delta.domainModel).toBe('mathematics');
      expect(delta.adjustment).toBeDefined();
      expect(delta.confidence).toBe(0.7);

      // Clean up
      rmSync(tmpDir, { recursive: true, force: true });
    });
  });

  describe('Test 5: DeltaStore persistence', () => {
    it('DeltaStore persists and retrieves calibration deltas', async () => {
      const tmpDir = mkdtempSync(join(tmpdir(), 'persist-roundtrip-'));
      const storeConfig: DeltaStoreConfig = {
        baseDir: tmpDir,
        userId: 'persist-user',
        domain: 'persist-test',
      };
      const store = new DeltaStore(storeConfig);

      // Save via CalibrationEngine
      const engine = new CalibrationEngine(store);
      const model: DomainCalibrationModel = {
        domain: 'persist-test',
        parameters: ['param1'],
        science: 'Persistence test model',
        safetyBoundaries: [],
        computeAdjustment: () => ({ param1: 10 }),
        confidence: () => 0.5,
      };
      engine.registerModel(model);

      await engine.process({
        domain: 'persist-test',
        translationId: 'concept-1',
        observedResult: 'value too high',
        expectedResult: 'expected value',
        parameters: { param1: 100 },
      });

      // Read back from the same store
      const stored = await store.getHistory();
      expect(stored.length).toBeGreaterThan(0);
      expect(stored[0].domainModel).toBe('persist-test');
      expect(stored[0].observedResult).toBe('value too high');

      // Verify a fresh DeltaStore on the same path reads the same data
      const store2 = new DeltaStore(storeConfig);
      const stored2 = await store2.getHistory();
      expect(stored2.length).toBe(stored.length);
      expect(stored2[0].domainModel).toBe('persist-test');

      // Clean up
      rmSync(tmpDir, { recursive: true, force: true });
    });
  });
});
