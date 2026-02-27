import { describe, it, expect } from 'vitest';
import type {
  ComplexNumber,
  Orbit,
  FixedPoint,
  FixedPointClassification,
  JuliaConfig,
  SkillDynamics,
  TopologicalProperty,
  ChangeType,
} from '../../src/holomorphic/types';

/* ------------------------------------------------------------------ */
/*  Type conformance tests                                              */
/* ------------------------------------------------------------------ */

describe('Holomorphic Dynamics — Shared Types', () => {
  it('ComplexNumber has re and im fields', () => {
    const z: ComplexNumber = { re: 3, im: 4 };
    expect(z.re).toBe(3);
    expect(z.im).toBe(4);
  });

  it('Orbit has z0, points, escaped, escapeTime, period', () => {
    const orbit: Orbit = {
      z0: { re: 0.5, im: 0.5 },
      points: [{ re: 0.5, im: 0.5 }, { re: 0, im: 1 }],
      escaped: false,
      escapeTime: null,
      period: 2,
    };
    expect(orbit.z0.re).toBe(0.5);
    expect(orbit.points).toHaveLength(2);
    expect(orbit.escaped).toBe(false);
    expect(orbit.escapeTime).toBeNull();
    expect(orbit.period).toBe(2);
  });

  it('FixedPoint has z, multiplier, classification, period', () => {
    const fp: FixedPoint = {
      z: { re: 0, im: 0 },
      multiplier: { re: 0, im: 0 },
      classification: 'superattracting',
      period: 1,
    };
    expect(fp.z.re).toBe(0);
    expect(fp.multiplier.re).toBe(0);
    expect(fp.classification).toBe('superattracting');
    expect(fp.period).toBe(1);
  });

  it('FixedPointClassification covers all 5 types', () => {
    const types: FixedPointClassification[] = [
      'superattracting',
      'attracting',
      'repelling',
      'rationally_indifferent',
      'irrationally_indifferent',
    ];
    expect(types).toHaveLength(5);
  });

  it('JuliaConfig has c, bounds, resolution, maxIter, escapeRadius', () => {
    const config: JuliaConfig = {
      c: { re: -0.7, im: 0.27 },
      bounds: { xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
      resolution: { width: 800, height: 600 },
      maxIter: 100,
      escapeRadius: 2,
    };
    expect(config.c.re).toBe(-0.7);
    expect(config.bounds.xMin).toBe(-2);
    expect(config.resolution.width).toBe(800);
    expect(config.maxIter).toBe(100);
    expect(config.escapeRadius).toBe(2);
  });

  it('SkillDynamics has position, multiplier, classification, fatouDomain, iterationHistory, convergenceRate', () => {
    const sd: SkillDynamics = {
      position: { theta: Math.PI / 4, radius: 0.8 },
      multiplier: { re: 0.5, im: 0.3 },
      classification: 'attracting',
      fatouDomain: true,
      iterationHistory: [{ re: 0.5, im: 0.5 }],
      convergenceRate: 0.58,
    };
    expect(sd.position.theta).toBeCloseTo(Math.PI / 4);
    expect(sd.position.radius).toBe(0.8);
    expect(sd.fatouDomain).toBe(true);
    expect(sd.convergenceRate).toBeCloseTo(0.58);
  });

  it('TopologicalProperty has name, holds, proof_sketch, relevance', () => {
    const tp: TopologicalProperty = {
      name: 'compact',
      holds: true,
      proof_sketch: 'Closed and bounded subset of ℂ',
      relevance: 'Julia sets are always compact',
    };
    expect(tp.name).toBe('compact');
    expect(tp.holds).toBe(true);
    expect(tp.proof_sketch).toBeDefined();
    expect(tp.relevance).toContain('compact');
  });

  it('TopologicalProperty proof_sketch is optional', () => {
    const tp: TopologicalProperty = {
      name: 'connected',
      holds: false,
      relevance: 'Mandelbrot set is connected',
    };
    expect(tp.proof_sketch).toBeUndefined();
  });

  it('ChangeType enum includes all holomorphic classifications', () => {
    const types: ChangeType[] = [
      'convergent',
      'divergent',
      'periodic',
      'chaotic',
    ];
    expect(types).toHaveLength(4);
  });

  it('Orbit points array can be empty', () => {
    const orbit: Orbit = {
      z0: { re: 10, im: 10 },
      points: [],
      escaped: true,
      escapeTime: 0,
      period: null,
    };
    expect(orbit.points).toHaveLength(0);
    expect(orbit.escaped).toBe(true);
    expect(orbit.period).toBeNull();
  });

  it('JuliaConfig bounds define a valid rectangle', () => {
    const config: JuliaConfig = {
      c: { re: 0, im: 0 },
      bounds: { xMin: -2, xMax: 2, yMin: -1.5, yMax: 1.5 },
      resolution: { width: 100, height: 100 },
      maxIter: 50,
      escapeRadius: 2,
    };
    expect(config.bounds.xMax).toBeGreaterThan(config.bounds.xMin);
    expect(config.bounds.yMax).toBeGreaterThan(config.bounds.yMin);
  });
});
