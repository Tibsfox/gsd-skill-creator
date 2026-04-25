/**
 * Integration tests for activation-steering surface (Phase 767).
 *
 * Covers:
 *   - public `steer()` flag-off vs flag-on behaviour;
 *   - `steerToward()` convenience wrapper;
 *   - `quickLinearityCheck()` on real-shaped data;
 *   - settings reader fail-closed semantics on a temp config.
 *
 * @module activation-steering/__tests__/integration
 */

import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildTarget,
  isActivationSteeringEnabled,
  quickLinearityCheck,
  steer,
  steerToward,
} from '../index.js';

describe('steer() integration', () => {
  it('flag-off: returns passthrough with disabled: true', () => {
    const v = [0.1, 0.2, 0.3, 0.4];
    const t = buildTarget('Researcher', 'Opus', v.length);
    const r = steer(v, 'Researcher', t, { forceEnabled: false });
    expect(r.disabled).toBe(true);
    expect(Array.from(r.vector)).toEqual(v);
    expect(r.deltaNorm).toBe(0);
  });

  it('flag-on: produces a non-zero delta toward the target', () => {
    const v = [0, 0, 0, 0, 0, 0, 0, 0];
    const t = buildTarget('Architect', 'Sonnet', v.length);
    const r = steer(v, 'Architect', t, { forceEnabled: true, gain: 0.5 });
    expect(r.disabled).toBe(false);
    expect(r.deltaNorm).toBeGreaterThan(0);
    // delta == gain * (target - 0) == 0.5 * target. Verify per-element.
    for (let i = 0; i < v.length; i++) {
      expect(r.delta[i]).toBeCloseTo(0.5 * t.vector[i]!, 12);
    }
  });

  it('throws on dim mismatch when enabled', () => {
    const v = [1, 2, 3];
    const t = buildTarget('Coordinator', 'Haiku', 8); // length 8 ≠ 3
    expect(() =>
      steer(v, 'Coordinator', t, { forceEnabled: true }),
    ).toThrow(/dim mismatch/);
  });

  it('flag-off passthrough does NOT check dim (zero work)', () => {
    const v = [1, 2, 3];
    const t = buildTarget('Coordinator', 'Haiku', 8);
    const r = steer(v, 'Coordinator', t, { forceEnabled: false });
    expect(r.disabled).toBe(true);
    expect(Array.from(r.vector)).toEqual(v);
  });
});

describe('steerToward() convenience wrapper', () => {
  it('builds a target and applies the controller in one call', () => {
    const v = [0.1, -0.1, 0.2, -0.2];
    const r = steerToward(v, 'Forger', 'Sonnet', { forceEnabled: true });
    expect(r.disabled).toBe(false);
    expect(r.targetLabel).toBe('forger@sonnet');
    expect(r.vector.length).toBe(v.length);
  });
});

describe('quickLinearityCheck()', () => {
  it('passes on linear data', () => {
    const samples = [];
    for (let i = 0; i < 10; i++) {
      samples.push({ x: [i], y: [3 * i + 2] });
    }
    const fit = quickLinearityCheck(samples, { threshold: 0.1 });
    expect(fit.withinThreshold).toBe(true);
  });

  it('fails on chaotic data', () => {
    const samples = [];
    for (let i = 0; i < 10; i++) {
      samples.push({ x: [i], y: [Math.sin(i * 9.81) * 100] });
    }
    const fit = quickLinearityCheck(samples, { threshold: 0.05 });
    expect(fit.withinThreshold).toBe(false);
  });
});

describe('settings reader fail-closed', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'as-cfg-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('returns false when settings file is missing', () => {
    const path = join(tmp, '.claude', 'gsd-skill-creator.json');
    expect(isActivationSteeringEnabled(path)).toBe(false);
  });

  it('returns false on malformed JSON', () => {
    const path = join(tmp, 'gsd-skill-creator.json');
    writeFileSync(path, '{not valid json');
    expect(isActivationSteeringEnabled(path)).toBe(false);
  });

  it('returns true when explicitly enabled', () => {
    mkdirSync(join(tmp, '.claude'), { recursive: true });
    const path = join(tmp, '.claude', 'gsd-skill-creator.json');
    writeFileSync(
      path,
      JSON.stringify({
        'gsd-skill-creator': {
          'upstream-intelligence': {
            'activation-steering': { enabled: true },
          },
        },
      }),
    );
    expect(isActivationSteeringEnabled(path)).toBe(true);
  });

  it('ignores enabled values that are not booleans', () => {
    const path = join(tmp, 'gsd-skill-creator.json');
    writeFileSync(
      path,
      JSON.stringify({
        'gsd-skill-creator': {
          'upstream-intelligence': {
            'activation-steering': { enabled: 'yes' },
          },
        },
      }),
    );
    expect(isActivationSteeringEnabled(path)).toBe(false);
  });
});
