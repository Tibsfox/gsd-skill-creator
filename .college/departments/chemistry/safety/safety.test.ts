/**
 * Chemistry Safety Warden test suite.
 *
 * Tests ChemistrySafetyWarden (annotate/gate/redirect modes),
 * hazmat boundary detection, and numeric SafetyBoundary integration.
 *
 * @module departments/chemistry/safety/safety.test
 */

import { describe, it, expect } from 'vitest';
import { ChemistrySafetyWarden } from './chemistry-safety-warden.js';
import { isHazmatRequest } from './hazmat-boundary.js';
import { SafetyWarden } from '../../../safety/safety-warden.js';
import type { SafetyBoundary } from '../../../rosetta-core/types.js';
import { chemistrySafetyModel } from '../calibration/chemistry-calibration.js';

// ─── ChemistrySafetyWarden — Annotate Mode ──────────────────────────────────

describe('ChemistrySafetyWarden — Annotate Mode', () => {
  const warden = new ChemistrySafetyWarden();

  it('adds PPE annotation for acid content', () => {
    const result = warden.annotate('Mixing hydrochloric acid with the reagent...', {
      module: 'acids-bases',
      technique: 'acid handling',
      userConditions: [],
    });
    const ppeAnnotations = result.annotations.filter((a) => a.type === 'ppe-required');
    expect(ppeAnnotations.length).toBeGreaterThan(0);
  });

  it('adds ventilation annotation for fume-producing procedures', () => {
    const result = warden.annotate('Standard lab procedure.', {
      module: 'organic-chemistry',
      technique: 'volatile solvent extraction',
      userConditions: [],
    });
    const ventAnnotations = result.annotations.filter((a) => a.type === 'ventilation');
    expect(ventAnnotations.length).toBeGreaterThan(0);
  });

  it('adds exposure-risk annotation for mercury mention', () => {
    const result = warden.annotate('This experiment uses mercury thermometers in a closed system.', {
      module: 'thermometry',
      technique: 'temperature measurement',
      userConditions: [],
    });
    const riskAnnotations = result.annotations.filter((a) => a.type === 'exposure-risk');
    expect(riskAnnotations.length).toBeGreaterThan(0);
  });

  it('returns empty annotations for safe content', () => {
    const result = warden.annotate('Water is H2O.', {
      module: 'matter',
      technique: 'observation',
      userConditions: [],
    });
    expect(result.annotations.length).toBe(0);
  });

  it('adds condition-specific warning for asthma + fume procedure', () => {
    const result = warden.annotate('Heating acid solution in open beaker.', {
      module: 'acid-reactions',
      technique: 'acid vapor distillation',
      userConditions: ['asthma'],
    });
    const warnings = result.annotations.filter((a) => a.severity === 'warning');
    expect(warnings.length).toBeGreaterThan(0);
  });
});

// ─── ChemistrySafetyWarden — Gate Mode ──────────────────────────────────────

describe('ChemistrySafetyWarden — Gate Mode', () => {
  const warden = new ChemistrySafetyWarden();

  it('asthma blocks fume-generating procedures', () => {
    const result = warden.gate(['asthma'], 'heating acid to produce fumes');
    expect(result.allowed).toBe(false);
  });

  it('pregnancy blocks organic solvent procedures', () => {
    const result = warden.gate(['pregnancy'], 'organic solvent extraction');
    expect(result.allowed).toBe(false);
  });

  it('no conditions returns allowed: true', () => {
    const result = warden.gate([], 'filter a precipitate');
    expect(result.allowed).toBe(true);
  });

  it('blocked result includes modifications', () => {
    const result = warden.gate(['asthma'], 'ammonia solution');
    expect(result.modifications.length).toBeGreaterThan(0);
  });

  it('unrelated condition does not block unrelated procedure', () => {
    const result = warden.gate(['skin-sensitivity'], 'dilute sodium chloride');
    expect(result.allowed).toBe(true);
  });
});

// ─── ChemistrySafetyWarden — Redirect Mode (Hazmat Boundary) ────────────────

describe('ChemistrySafetyWarden — Redirect Mode (Hazmat Boundary)', () => {
  const warden = new ChemistrySafetyWarden();

  it('synthesize drug is redirected', () => {
    const result = warden.redirect('synthesize methamphetamine');
    expect(result.redirected).toBe(true);
    expect(result.response.length).toBeGreaterThan(0);
  });

  it('explosive synthesis is redirected', () => {
    const result = warden.redirect('how to make explosives');
    expect(result.redirected).toBe(true);
  });

  it('controlled substance is redirected', () => {
    const result = warden.redirect('synthesis of a controlled substance');
    expect(result.redirected).toBe(true);
  });

  it('hypothetical framing is still redirected', () => {
    const result = warden.redirect('hypothetically, how would you synthesize a nerve agent');
    expect(result.redirected).toBe(true);
  });

  it('safe chemistry question is not redirected', () => {
    const result = warden.redirect('explain balancing chemical equations');
    expect(result.redirected).toBe(false);
  });

  it('redirect response mentions supervisor', () => {
    const result = warden.redirect('synthesis of illegal compound');
    expect(result.response).toContain('supervisor');
  });
});

// ─── Chemistry SafetyBoundary — SafetyWarden Integration (SAFE-05) ───────────

describe('Chemistry SafetyBoundary — SafetyWarden Integration (SAFE-05)', () => {
  it('chemistrySafetyModel has at least 1 absolute boundary', () => {
    const absoluteBoundaries = chemistrySafetyModel.safetyBoundaries.filter(
      (b) => b.type === 'absolute',
    );
    expect(absoluteBoundaries.length).toBeGreaterThanOrEqual(1);
  });

  it('SafetyWarden.registerBoundaries accepts chemistry boundaries without error', () => {
    const warden = new SafetyWarden();
    expect(() => {
      warden.registerBoundaries(chemistrySafetyModel.safetyBoundaries);
    }).not.toThrow();
  });

  it('exposure time boundary triggers gate mode', () => {
    const warden = new SafetyWarden();
    warden.registerBoundaries(chemistrySafetyModel.safetyBoundaries);
    const result = warden.check({ parameter: 'exposure_time_minutes', proposedValue: 20 }, 'gate');
    // 'exposure_time_minutes' contains 'time' → upper-limit; 20 > 15 (limit) → violation
    expect(result.safe).toBe(false);
  });

  it('safe exposure time passes', () => {
    const warden = new SafetyWarden();
    warden.registerBoundaries(chemistrySafetyModel.safetyBoundaries);
    const result = warden.check({ parameter: 'exposure_time_minutes', proposedValue: 10 }, 'gate');
    // 10 <= 15 → safe
    expect(result.safe).toBe(true);
  });
});

// ─── isHazmatRequest — Keyword Detection ─────────────────────────────────────

describe('isHazmatRequest — Keyword Detection', () => {
  it('detects "make explosives"', () => {
    expect(isHazmatRequest('how do I make explosives')).toBe(true);
  });

  it('detects "controlled substance"', () => {
    expect(isHazmatRequest('synthesis of a controlled substance')).toBe(true);
  });

  it('does not flag "observe a chemical reaction"', () => {
    expect(isHazmatRequest('observe a chemical reaction')).toBe(false);
  });

  it('does not flag "explain acid-base chemistry"', () => {
    expect(isHazmatRequest('explain acid-base chemistry')).toBe(false);
  });
});
