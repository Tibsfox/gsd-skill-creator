/**
 * CF-M6-07 defaults + frontmatter validation tests.
 */

import { describe, it, expect } from 'vitest';
import { resolveSensoria, serializeSensoria, DEFAULT_SENSORIA } from '../frontmatter.js';

describe('resolveSensoria — CF-M6-07 defaults for skills without explicit block', () => {
  it('returns DEFAULT_SENSORIA when raw is null', () => {
    const r = resolveSensoria(null);
    expect(r.block).toEqual(DEFAULT_SENSORIA);
    expect(r.source).toBe('default');
    expect(r.warnings).toEqual([]);
  });

  it('returns DEFAULT_SENSORIA when raw is undefined', () => {
    const r = resolveSensoria(undefined);
    expect(r.block).toEqual(DEFAULT_SENSORIA);
    expect(r.source).toBe('default');
  });

  it('documented defaults: K_H=5.0, K_L=0.5, R_T_init=1.0, theta=0.05, disabled=false', () => {
    expect(DEFAULT_SENSORIA.K_H).toBe(5.0);
    expect(DEFAULT_SENSORIA.K_L).toBe(0.5);
    expect(DEFAULT_SENSORIA.R_T_init).toBe(1.0);
    expect(DEFAULT_SENSORIA.theta).toBe(0.05);
    expect(DEFAULT_SENSORIA.disabled).toBe(false);
  });
});

describe('resolveSensoria — explicit values', () => {
  it('accepts a fully-specified block', () => {
    const r = resolveSensoria({ K_H: 10, K_L: 0.1, R_T_init: 2, theta: 0.1, disabled: false });
    expect(r.source).toBe('explicit');
    expect(r.block.K_H).toBe(10);
    expect(r.block.K_L).toBe(0.1);
    expect(r.block.R_T_init).toBe(2);
    expect(r.block.theta).toBe(0.1);
    expect(r.block.disabled).toBe(false);
  });

  it('partial block fills missing fields from defaults', () => {
    const r = resolveSensoria({ K_H: 20 });
    expect(r.source).toBe('partial');
    expect(r.block.K_H).toBe(20);
    expect(r.block.K_L).toBe(DEFAULT_SENSORIA.K_L);
    expect(r.block.theta).toBe(DEFAULT_SENSORIA.theta);
  });

  it('disabled: true short-circuits flag', () => {
    const r = resolveSensoria({ disabled: true });
    expect(r.block.disabled).toBe(true);
  });
});

describe('resolveSensoria — validation warnings', () => {
  it('rejects non-object raw with warning', () => {
    const r = resolveSensoria('not-an-object');
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.block).toEqual(DEFAULT_SENSORIA);
  });

  it('rejects array with warning', () => {
    const r = resolveSensoria([1, 2, 3]);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('rejects negative K_H and falls back to default', () => {
    const r = resolveSensoria({ K_H: -1 });
    expect(r.warnings.some(w => w.includes('K_H'))).toBe(true);
    expect(r.block.K_H).toBe(DEFAULT_SENSORIA.K_H);
  });

  it('rejects non-number theta', () => {
    const r = resolveSensoria({ theta: 'high' });
    expect(r.warnings.some(w => w.includes('theta'))).toBe(true);
    expect(r.block.theta).toBe(DEFAULT_SENSORIA.theta);
  });

  it('rejects NaN and Infinity', () => {
    const r = resolveSensoria({ K_L: NaN, R_T_init: Infinity });
    expect(r.warnings.some(w => w.includes('K_L'))).toBe(true);
    expect(r.warnings.some(w => w.includes('R_T_init'))).toBe(true);
  });

  it('warns when K_H < K_L (inverted receptor)', () => {
    const r = resolveSensoria({ K_H: 0.1, K_L: 10 });
    expect(r.warnings.some(w => w.includes('K_H') && w.includes('K_L'))).toBe(true);
  });

  it('rejects non-boolean disabled', () => {
    const r = resolveSensoria({ disabled: 'yes' });
    expect(r.warnings.some(w => w.includes('disabled'))).toBe(true);
    expect(r.block.disabled).toBe(false);
  });
});

describe('serializeSensoria', () => {
  it('emits all fields in non-compact mode', () => {
    const out = serializeSensoria({ ...DEFAULT_SENSORIA });
    expect(out).toHaveProperty('K_H');
    expect(out).toHaveProperty('K_L');
    expect(out).toHaveProperty('R_T_init');
    expect(out).toHaveProperty('theta');
  });

  it('omits default-valued fields in compact mode', () => {
    const out = serializeSensoria({ ...DEFAULT_SENSORIA }, true);
    expect(Object.keys(out).length).toBe(0);
  });

  it('compact mode preserves non-default fields', () => {
    const out = serializeSensoria({ ...DEFAULT_SENSORIA, K_H: 99 }, true);
    expect(out.K_H).toBe(99);
    expect(out).not.toHaveProperty('K_L');
  });
});
