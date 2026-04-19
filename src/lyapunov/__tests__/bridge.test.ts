/**
 * MB-1 — Bridge tests: flag-off byte-identity (SC-MB1-01) + flag-on path.
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEFAULT_SENSORIA } from '../../sensoria/frontmatter.js';
import { DesensitisationStore } from '../../sensoria/desensitisation.js';
import type { DesensitisationState, SensoriaBlock } from '../../types/sensoria.js';
import {
  computeLyapunovKH,
  applyLyapunovKHInPlace,
} from '../desensitisation-bridge.js';
import { readLyapunovEnabledFlag } from '../settings.js';

describe('readLyapunovEnabledFlag — default OFF', () => {
  it('returns false when settings file is missing', () => {
    const missing = join(tmpdir(), 'does-not-exist', 'nope.json');
    expect(readLyapunovEnabledFlag(missing)).toBe(false);
  });

  it('returns false when flag is absent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mb1-flag-'));
    const path = join(dir, 'settings.json');
    writeFileSync(path, JSON.stringify({ 'gsd-skill-creator': { sensoria: {} } }));
    try {
      expect(readLyapunovEnabledFlag(path)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns true only when explicitly opted in', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mb1-flag-'));
    const path = join(dir, 'settings.json');
    writeFileSync(path, JSON.stringify({
      'gsd-skill-creator': { sensoria: { lyapunov: { enabled: true } } },
    }));
    try {
      expect(readLyapunovEnabledFlag(path)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns false when flag is truthy but not === true', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mb1-flag-'));
    const path = join(dir, 'settings.json');
    writeFileSync(path, JSON.stringify({
      'gsd-skill-creator': { sensoria: { lyapunov: { enabled: 'yes' } } },
    }));
    try {
      expect(readLyapunovEnabledFlag(path)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns false on malformed JSON', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mb1-flag-'));
    const path = join(dir, 'settings.json');
    writeFileSync(path, '{not json');
    try {
      expect(readLyapunovEnabledFlag(path)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('computeLyapunovKH — flag-off byte-identity (SC-MB1-01)', () => {
  const block: SensoriaBlock = { ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1 };
  const state: DesensitisationState = {
    skillId: 'skill-a',
    integratedDose: 0,
    effectiveK_H: 8,
    lastUpdateTs: 1000,
    fadeCount: 0,
  };

  it('flag-off → { applied: false }, no computation surfaced', () => {
    const r = computeLyapunovKH({
      state,
      block,
      dose: 1,
      observedRate: 1,
      teachingDeclaredRate: 0.5,
      nowMs: 2000,
      tractability: 'tractable',
      enabled: false,
    });
    expect(r.applied).toBe(false);
    expect(r.newEffectiveKH).toBeUndefined();
    expect(r.adaptation).toBeUndefined();
  });

  it('SC-MB1-01 — 50-session fixture: DesensitisationStore unchanged when flag off', () => {
    // Capture the ad-hoc rule's trajectory across 50 sessions.
    const ref = new DesensitisationStore();
    const refTrace: number[] = [];
    let t = 1000;
    for (let i = 0; i < 50; i += 1) {
      t += 1000;
      const { effectiveK_H } = ref.recordActivation('skill-a', block, 1, block.R_T_init, t);
      refTrace.push(effectiveK_H);
    }

    // Now run the "same" 50 sessions with a parallel store; the bridge is
    // invoked with flag-off, which is a no-op — the parallel store's trajectory
    // must match the reference exactly.
    const parallel = new DesensitisationStore();
    const parallelTrace: number[] = [];
    let t2 = 1000;
    for (let i = 0; i < 50; i += 1) {
      t2 += 1000;
      const snap = parallel.getOrInit('skill-a', block, t2);
      const bridge = computeLyapunovKH({
        state: snap,
        block,
        dose: 1,
        observedRate: 1,
        teachingDeclaredRate: 0.5,
        nowMs: t2,
        tractability: 'tractable',
        enabled: false,
      });
      expect(bridge.applied).toBe(false);
      const { effectiveK_H } = parallel.recordActivation('skill-a', block, 1, block.R_T_init, t2);
      parallelTrace.push(effectiveK_H);
    }

    expect(parallelTrace).toEqual(refTrace);
  });
});

describe('computeLyapunovKH — flag-on Lyapunov path', () => {
  const block: SensoriaBlock = { ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1 };
  const state: DesensitisationState = {
    skillId: 'skill-b',
    integratedDose: 0,
    effectiveK_H: 10,
    lastUpdateTs: 1000,
    fadeCount: 0,
  };

  it('applies adaptation when enabled=true', () => {
    const r = computeLyapunovKH({
      state,
      block,
      dose: 1,
      observedRate: 1.0,
      teachingDeclaredRate: 0.5, // e > 0 → K_H should decrease
      nowMs: 2000,
      tractability: 'tractable',
      enabled: true,
      stepSize: 1.0,
    });
    expect(r.applied).toBe(true);
    expect(r.newEffectiveKH).toBeDefined();
    expect(r.newEffectiveKH!).toBeLessThanOrEqual(10);
    expect(r.newEffectiveKH!).toBeGreaterThanOrEqual(block.K_L); // floor
    expect(r.adaptation).toBeDefined();
    expect(r.tractabilityGain).toBe(1.0);
  });

  it('tractability scaling propagates to bridge output', () => {
    const shared = {
      state,
      block,
      dose: 1,
      observedRate: 1.0,
      teachingDeclaredRate: 0.5,
      nowMs: 2000,
      enabled: true,
      stepSize: 1.0,
    };
    const rT = computeLyapunovKH({ ...shared, tractability: 'tractable' });
    const rU = computeLyapunovKH({ ...shared, tractability: 'unknown' });
    const rC = computeLyapunovKH({ ...shared, tractability: 'coin-flip' });
    expect(rT.tractabilityGain).toBe(1.0);
    expect(rU.tractabilityGain).toBe(0.6);
    expect(rC.tractabilityGain).toBe(0.3);
    // Coin-flip update magnitude should be ≤ 0.3× tractable (CF-MB1-02).
    const magT = Math.abs(rT.adaptation!.deltaKHRaw);
    const magC = Math.abs(rC.adaptation!.deltaKHRaw);
    expect(magC).toBeLessThanOrEqual(magT * 0.3 + 1e-12);
  });

  it('respects K_L floor on extreme error', () => {
    const r = computeLyapunovKH({
      state: { ...state, effectiveK_H: block.K_L },
      block,
      dose: 1000,
      observedRate: 1000,
      teachingDeclaredRate: 0,
      nowMs: 2000,
      tractability: 'tractable',
      enabled: true,
      stepSize: 10,
    });
    expect(r.applied).toBe(true);
    expect(r.newEffectiveKH!).toBeGreaterThanOrEqual(block.K_L);
  });

  it('never exceeds target K_H ceiling', () => {
    const r = computeLyapunovKH({
      state: { ...state, effectiveK_H: 9.99 },
      block,
      dose: 100,
      observedRate: 0,
      teachingDeclaredRate: 100, // large negative e pushes up
      nowMs: 2000,
      tractability: 'tractable',
      enabled: true,
      stepSize: 10,
    });
    expect(r.newEffectiveKH!).toBeLessThanOrEqual(block.K_H);
  });
});

describe('applyLyapunovKHInPlace — mutates state only when flag on', () => {
  const block: SensoriaBlock = { ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1 };

  it('flag-off → state unchanged', () => {
    const state: DesensitisationState = {
      skillId: 'x',
      integratedDose: 0,
      effectiveK_H: 8,
      lastUpdateTs: 1000,
      fadeCount: 0,
    };
    const before = { ...state };
    const r = applyLyapunovKHInPlace(state, {
      block,
      dose: 1,
      observedRate: 1,
      teachingDeclaredRate: 0.5,
      nowMs: 2000,
      tractability: 'tractable',
      enabled: false,
    });
    expect(r.applied).toBe(false);
    expect(state).toEqual(before);
  });

  it('flag-on → state mutated with new effectiveK_H', () => {
    const state: DesensitisationState = {
      skillId: 'y',
      integratedDose: 0,
      effectiveK_H: 8,
      lastUpdateTs: 1000,
      fadeCount: 0,
    };
    const r = applyLyapunovKHInPlace(state, {
      block,
      dose: 1,
      observedRate: 1,
      teachingDeclaredRate: 0.5,
      nowMs: 2000,
      tractability: 'tractable',
      enabled: true,
      stepSize: 1.0,
    });
    expect(r.applied).toBe(true);
    expect(state.effectiveK_H).toBe(r.newEffectiveKH);
    expect(state.lastUpdateTs).toBe(2000);
  });
});
