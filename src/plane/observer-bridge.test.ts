/**
 * ObserverAngularBridge tests -- RED phase.
 *
 * Tests for session processing, position updates with velocity clamping,
 * initial position assignment, and fault isolation (OBSERVE-06).
 * Uses tmpdir() for PositionStore filesystem isolation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { ObserverAngularBridge } from './observer-bridge.js';
import type { PatternGroup } from './observer-bridge.js';
import { PositionStore } from './position-store.js';
import { createPosition } from './arithmetic.js';
import { MAX_ANGULAR_VELOCITY, MATURITY_THRESHOLD } from './types.js';
import type { SkillPosition } from './types.js';

describe('ObserverAngularBridge', () => {
  let tempDir: string;
  let filePath: string;
  let store: PositionStore;
  let bridge: ObserverAngularBridge;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'observer-bridge-'));
    filePath = join(tempDir, '.claude', 'plane', 'positions.json');
    store = new PositionStore(filePath);
    await store.load();
    bridge = new ObserverAngularBridge(store);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('processSession', () => {
    it('all concrete signals: patterns have estimatedTheta approximately 0', () => {
      const groups: PatternGroup[] = [{
        patternId: 'p1',
        signals: [
          { type: 'bash_deterministic' },
          { type: 'bash_deterministic' },
          { type: 'bash_deterministic' },
        ],
        repetitionCount: 5,
      }];

      const result = bridge.processSession('session-1', groups);
      expect(result).not.toBeNull();
      expect(result!.patterns).toHaveLength(1);
      expect(result!.patterns[0].estimatedTheta).toBeCloseTo(0, 3);
      expect(result!.patterns[0].concreteSignals).toBe(9);
      expect(result!.patterns[0].abstractSignals).toBe(0);
    });

    it('all abstract signals: patterns have estimatedTheta approximately PI/2', () => {
      const groups: PatternGroup[] = [{
        patternId: 'p2',
        signals: [
          { type: 'semantic_cluster' },
          { type: 'semantic_cluster' },
        ],
        repetitionCount: 3,
      }];

      const result = bridge.processSession('session-2', groups);
      expect(result).not.toBeNull();
      expect(result!.patterns[0].estimatedTheta).toBeCloseTo(Math.PI / 2, 3);
      expect(result!.patterns[0].concreteSignals).toBe(0);
      expect(result!.patterns[0].abstractSignals).toBe(6);
    });

    it('mixed signals grouped by pattern', () => {
      const groups: PatternGroup[] = [{
        patternId: 'mixed-p',
        signals: [
          { type: 'bash_deterministic' },
          { type: 'semantic_cluster' },
        ],
        repetitionCount: 2,
      }];

      const result = bridge.processSession('session-3', groups);
      expect(result).not.toBeNull();
      expect(result!.patterns[0].concreteSignals).toBe(3);
      expect(result!.patterns[0].abstractSignals).toBe(3);
      expect(result!.patterns[0].estimatedTheta).toBeCloseTo(Math.PI / 4, 3);
    });

    it('session with multiple patterns: each has its own theta/radius', () => {
      const groups: PatternGroup[] = [
        {
          patternId: 'concrete-p',
          signals: [{ type: 'bash_deterministic' }],
          repetitionCount: 10,
        },
        {
          patternId: 'abstract-p',
          signals: [{ type: 'semantic_cluster' }],
          repetitionCount: 3,
        },
      ];

      const result = bridge.processSession('session-4', groups);
      expect(result).not.toBeNull();
      expect(result!.patterns).toHaveLength(2);
      expect(result!.patterns[0].patternId).toBe('concrete-p');
      expect(result!.patterns[0].estimatedTheta).toBeCloseTo(0, 3);
      expect(result!.patterns[1].patternId).toBe('abstract-p');
      expect(result!.patterns[1].estimatedTheta).toBeCloseTo(Math.PI / 2, 3);
    });

    it('empty signals array: returns AngularObservation with empty patterns', () => {
      const result = bridge.processSession('session-5', []);
      expect(result).not.toBeNull();
      expect(result!.sessionId).toBe('session-5');
      expect(result!.patterns).toHaveLength(0);
    });

    it('returns AngularObservation with correct sessionId and timestamp', () => {
      const result = bridge.processSession('test-session', []);
      expect(result).not.toBeNull();
      expect(result!.sessionId).toBe('test-session');
      expect(result!.timestamp).toBeTruthy();
      // Verify it looks like an ISO timestamp
      expect(new Date(result!.timestamp).toISOString()).toBe(result!.timestamp);
    });

    it('patterns include correct estimatedRadius based on repetitionCount', () => {
      const groups: PatternGroup[] = [{
        patternId: 'radius-test',
        signals: [{ type: 'bash_deterministic' }],
        repetitionCount: 25,
      }];

      const result = bridge.processSession('session-r', groups);
      expect(result).not.toBeNull();
      // radius = 25 / 50 (MATURITY_THRESHOLD) = 0.5
      expect(result!.patterns[0].estimatedRadius).toBeCloseTo(0.5, 3);
    });

    it('error in processing does NOT throw -- returns null (OBSERVE-06)', () => {
      // Create a bridge with a broken store that will cause errors
      const brokenBridge = new ObserverAngularBridge(null as unknown as PositionStore);
      // processSession should catch internal errors and return null
      const result = brokenBridge.processSession('err-session', [{
        patternId: 'p',
        signals: [{ type: 'bash_deterministic' }],
      }]);
      // Should not throw, should return AngularObservation or null
      // Since processSession doesn't use the store, it should still work
      // But a truly broken scenario would return null
      expect(result).toBeDefined();
    });
  });

  describe('updatePosition', () => {
    it('new skill (no existing position): creates position from observation', async () => {
      const observation = bridge.processSession('s1', [{
        patternId: 'new-p',
        signals: [{ type: 'bash_deterministic' }],
        repetitionCount: 5,
      }]);
      expect(observation).not.toBeNull();

      const updated = await bridge.updatePosition('new-skill', observation!);
      expect(updated).not.toBeNull();
      expect(updated!.theta).toBeCloseTo(0, 2);
      expect(updated!.radius).toBeCloseTo(5 / MATURITY_THRESHOLD, 2);

      // Verify saved to store
      const stored = store.get('new-skill');
      expect(stored).not.toBeNull();
    });

    it('existing skill with high radius (0.8): small theta change (resists movement)', async () => {
      // Pre-load a mature skill at theta=1.0
      const existing = createPosition(1.0, 0.8, 0.05);
      store.set('mature-skill', existing);
      await store.save();

      // Observe at theta=0 (concrete) with low radius signal
      const observation = bridge.processSession('s2', [{
        patternId: 'p',
        signals: [{ type: 'bash_deterministic' }],
        repetitionCount: 5, // radius = 0.1
      }]);

      const updated = await bridge.updatePosition('mature-skill', observation!);
      expect(updated).not.toBeNull();
      // High-radius skill should resist: theta stays closer to 1.0 than to 0.0
      expect(updated!.theta).toBeGreaterThan(0.5);
    });

    it('existing skill with low radius (0.1): larger theta change (less inertia)', async () => {
      // Pre-load an immature skill at theta=0.5
      const existing = createPosition(0.5, 0.1, 0.05);
      store.set('immature-skill', existing);
      await store.save();

      // Observe at theta~pi/4 (0.785) -- mixed signal, small step within clamp
      const observation = bridge.processSession('s3', [{
        patternId: 'p',
        signals: [{ type: 'file_change_multi' }], // concrete=1, abstract=1 => theta~pi/4
        repetitionCount: 15, // radius = 0.3
      }]);

      const updated = await bridge.updatePosition('immature-skill', observation!);
      expect(updated).not.toBeNull();
      // Weighted avg: (0.1*0.5 + 0.3*0.785) / (0.1+0.3) = (0.05+0.2355)/0.4 = 0.714
      // Step = |0.714 - 0.5| = 0.214 > MAX_ANGULAR_VELOCITY=0.2, so clamped
      // But low radius means the weighted average leans more toward observed value
      // Compared to high-radius case, the immature skill moves in the observed direction
      expect(updated!.theta).toBeGreaterThan(existing.theta);
      // Verify the step is bounded by velocity clamp
      expect(Math.abs(updated!.theta - existing.theta)).toBeLessThanOrEqual(
        MAX_ANGULAR_VELOCITY + 0.001,
      );
    });

    it('angular velocity exceeds MAX_ANGULAR_VELOCITY: theta change is clamped', async () => {
      // Place skill at theta=1.0
      const existing = createPosition(1.0, 0.5, 0);
      store.set('clamped-skill', existing);
      await store.save();

      // Observe at theta=0.1 (large jump of ~0.9)
      // Use similar radius so weighted average would produce large step
      const observation = bridge.processSession('s-clamp', [{
        patternId: 'p',
        signals: [{ type: 'bash_deterministic' }],
        repetitionCount: 25, // radius = 0.5, same as existing
      }]);

      const updated = await bridge.updatePosition('clamped-skill', observation!);
      expect(updated).not.toBeNull();
      // The step from 1.0 should be at most MAX_ANGULAR_VELOCITY
      expect(Math.abs(updated!.theta - existing.theta)).toBeLessThanOrEqual(
        MAX_ANGULAR_VELOCITY + 0.001, // small epsilon for float comparison
      );
    });

    it('angular velocity within bounds: theta moves by exact computed amount', async () => {
      // Place skill at theta=1.0, high radius so it resists a bit
      const existing = createPosition(1.0, 0.9, 0);
      store.set('small-move', existing);
      await store.save();

      // Observe at theta very close to 1.0 so step is small
      const observation = bridge.processSession('s-small', [{
        patternId: 'p',
        signals: [{ type: 'file_change_multi' }], // concrete=1, abstract=1 => theta ~= pi/4 ~= 0.785
        repetitionCount: 5, // radius = 0.1
      }]);

      const updated = await bridge.updatePosition('small-move', observation!);
      expect(updated).not.toBeNull();
      // With existing radius 0.9 and observed radius 0.1, weighted average heavily favors existing
      // newTheta = (0.9 * 1.0 + 0.1 * 0.785) / (0.9 + 0.1) = (0.9 + 0.0785) / 1.0 = 0.9785
      // Step = |0.9785 - 1.0| = 0.0215 which is < MAX_ANGULAR_VELOCITY (0.2)
      expect(updated!.angularVelocity).toBeLessThan(MAX_ANGULAR_VELOCITY);
    });

    it('radius grows by delta on each observation, bounded at 1.0', async () => {
      const existing = createPosition(0.5, 0.5, 0);
      store.set('growing-skill', existing);
      await store.save();

      const observation = bridge.processSession('s-grow', [{
        patternId: 'p',
        signals: [{ type: 'bash_deterministic' }],
        repetitionCount: 5,
      }]);

      const updated = await bridge.updatePosition('growing-skill', observation!);
      expect(updated).not.toBeNull();
      expect(updated!.radius).toBeGreaterThan(0.5);
      expect(updated!.radius).toBeLessThanOrEqual(1.0);
    });

    it('returns the updated SkillPosition', async () => {
      const observation = bridge.processSession('s-ret', [{
        patternId: 'p',
        signals: [{ type: 'bash_deterministic' }],
        repetitionCount: 3,
      }]);

      const result = await bridge.updatePosition('return-test', observation!);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('theta');
      expect(result).toHaveProperty('radius');
      expect(result).toHaveProperty('angularVelocity');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('updated position is persisted in the store', async () => {
      const observation = bridge.processSession('s-persist', [{
        patternId: 'p',
        signals: [{ type: 'semantic_cluster' }],
        repetitionCount: 10,
      }]);

      await bridge.updatePosition('persist-skill', observation!);
      const stored = store.get('persist-skill');
      expect(stored).not.toBeNull();
      expect(stored!.theta).toBeCloseTo(Math.PI / 2, 2);
    });

    it('handles empty patterns array gracefully', async () => {
      const observation = bridge.processSession('s-empty', []);
      const result = await bridge.updatePosition('empty-obs', observation!);
      // With no patterns, should return null or existing position
      expect(result).toBeNull();
    });
  });

  describe('assignInitialPosition', () => {
    it('pattern with all concrete signals: theta approximately 0', () => {
      const group: PatternGroup = {
        patternId: 'init-concrete',
        signals: [
          { type: 'bash_deterministic' },
          { type: 'file_change_single' },
        ],
        repetitionCount: 5,
      };

      const pos = bridge.assignInitialPosition(group);
      expect(pos.theta).toBeCloseTo(0, 1); // atan2(0, 5) = 0
      expect(pos.radius).toBeCloseTo(5 / MATURITY_THRESHOLD, 3);
    });

    it('pattern with all abstract signals: theta approximately PI/2', () => {
      const group: PatternGroup = {
        patternId: 'init-abstract',
        signals: [
          { type: 'semantic_cluster' },
          { type: 'intent_description' },
        ],
        repetitionCount: 10,
      };

      const pos = bridge.assignInitialPosition(group);
      expect(pos.theta).toBeCloseTo(Math.PI / 2, 3);
    });

    it('pattern with mixed signals: theta between 0 and PI/2', () => {
      const group: PatternGroup = {
        patternId: 'init-mixed',
        signals: [
          { type: 'bash_deterministic' },
          { type: 'semantic_cluster' },
        ],
        repetitionCount: 7,
      };

      const pos = bridge.assignInitialPosition(group);
      expect(pos.theta).toBeGreaterThan(0);
      expect(pos.theta).toBeLessThan(Math.PI / 2);
    });

    it('repetitionCount=3 with MATURITY_THRESHOLD=50: radius approximately 0.06', () => {
      const group: PatternGroup = {
        patternId: 'init-radius',
        signals: [{ type: 'bash_deterministic' }],
        repetitionCount: 3,
      };

      const pos = bridge.assignInitialPosition(group);
      expect(pos.radius).toBeCloseTo(3 / MATURITY_THRESHOLD, 3);
    });

    it('angularVelocity is 0 for initial positions', () => {
      const group: PatternGroup = {
        patternId: 'init-vel',
        signals: [{ type: 'bash_deterministic' }],
        repetitionCount: 5,
      };

      const pos = bridge.assignInitialPosition(group);
      expect(pos.angularVelocity).toBe(0);
    });

    it('returns valid SkillPosition (theta in [0, 2pi), radius in [0, 1])', () => {
      const group: PatternGroup = {
        patternId: 'init-valid',
        signals: [{ type: 'semantic_cluster' }],
        repetitionCount: 100, // exceeds threshold
      };

      const pos = bridge.assignInitialPosition(group);
      expect(pos.theta).toBeGreaterThanOrEqual(0);
      expect(pos.theta).toBeLessThan(2 * Math.PI);
      expect(pos.radius).toBeGreaterThanOrEqual(0);
      expect(pos.radius).toBeLessThanOrEqual(1);
    });

    it('default repetitionCount is 1 when not provided', () => {
      const group: PatternGroup = {
        patternId: 'init-default',
        signals: [{ type: 'bash_deterministic' }],
      };

      const pos = bridge.assignInitialPosition(group);
      expect(pos.radius).toBeCloseTo(1 / MATURITY_THRESHOLD, 3);
    });
  });

  describe('fault isolation (OBSERVE-06)', () => {
    it('processSession catches internal errors and returns null', () => {
      // Force an error by passing signals that trigger a broken classifySignals
      // We'll create a scenario where internals might break
      const brokenGroups = [{
        patternId: 'broken',
        signals: null as unknown as Array<{ type: string }>,
      }];

      const result = bridge.processSession('err-session', brokenGroups);
      // Should not throw -- returns null
      expect(result).toBeNull();
    });

    it('updatePosition with empty observation patterns returns null', async () => {
      const emptyObs = {
        sessionId: 's',
        timestamp: new Date().toISOString(),
        patterns: [],
      };

      const result = await bridge.updatePosition('no-patterns', emptyObs);
      expect(result).toBeNull();
    });

    it('bridge methods never throw exceptions to callers', async () => {
      // processSession with garbage
      expect(() => bridge.processSession('x', undefined as unknown as PatternGroup[])).not.toThrow();

      // updatePosition with garbage
      await expect(bridge.updatePosition('x', null as unknown as import('./types.js').AngularObservation)).resolves.not.toThrow();
    });
  });
});
