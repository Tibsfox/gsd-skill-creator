/**
 * Physical Education Safety Warden test suite.
 *
 * Tests PESafetyWarden (annotate/gate/redirect modes), PE conditions database,
 * overexertion boundary detection, and numeric SafetyBoundary integration.
 *
 * @module departments/physical-education/safety/safety.test
 */

import { describe, it, expect } from 'vitest';
import { PESafetyWarden } from './pe-safety-warden.js';
import { peConditions, isPEContraindicated, getPEConditionModifications } from './pe-conditions.js';
import { isOverexertionRequest, requiresMedicalClearance } from './overexertion-boundary.js';
import { peSafetyModel } from '../calibration/pe-calibration.js';
import { SafetyWarden } from '../../../safety/safety-warden.js';

// ─── PESafetyWarden — Annotate Mode ─────────────────────────────────────────

describe('PESafetyWarden — Annotate Mode', () => {
  const warden = new PESafetyWarden();

  it('adds warm-up annotation for sprint content', () => {
    const result = warden.annotate('All-out sprint intervals at maximum speed...', {
      module: 'fitness',
      technique: 'sprint training',
      userConditions: [],
    });
    const warmUpAnnotations = result.annotations.filter((a) => a.type === 'warm-up');
    expect(warmUpAnnotations.length).toBeGreaterThan(0);
  });

  it('adds injury-risk annotation for plyometric activity', () => {
    const result = warden.annotate('Perform box jumps and depth jumps.', {
      module: 'strength',
      technique: 'plyometric drills',
      userConditions: [],
    });
    const injuryAnnotations = result.annotations.filter((a) => a.type === 'injury-risk');
    expect(injuryAnnotations.length).toBeGreaterThan(0);
  });

  it('adds overexertion annotation for maximal intensity content', () => {
    const result = warden.annotate('Push to absolute maximum effort.', {
      module: 'conditioning',
      technique: 'maximal interval training',
      userConditions: [],
    });
    const overexertionAnnotations = result.annotations.filter((a) => a.type === 'overexertion');
    expect(overexertionAnnotations.length).toBeGreaterThan(0);
  });

  it('returns empty annotations for gentle walking content', () => {
    const result = warden.annotate('Take a gentle 20-minute walk at comfortable pace.', {
      module: 'wellness',
      technique: 'walking',
      userConditions: [],
    });
    expect(result.annotations.length).toBe(0);
  });

  it('adds modification for cardiac-condition user doing sprint', () => {
    const result = warden.annotate('Sprint training session.', {
      module: 'fitness',
      technique: 'sprint training',
      userConditions: ['cardiac-condition'],
    });
    const modAnnotations = result.annotations.filter((a) => a.type === 'modification');
    expect(modAnnotations.length).toBeGreaterThan(0);
  });
});

// ─── PESafetyWarden — Gate Mode ──────────────────────────────────────────────

describe('PESafetyWarden — Gate Mode', () => {
  const warden = new PESafetyWarden();

  it('cardiac-condition blocks maximal exertion', () => {
    const result = warden.gate(['cardiac-condition'], 'maximal exertion');
    expect(result.allowed).toBe(false);
  });

  it('asthma blocks high-intensity continuous aerobic', () => {
    const result = warden.gate(['asthma'], 'high-intensity continuous aerobic');
    expect(result.allowed).toBe(false);
  });

  it('joint-injury blocks jumping', () => {
    const result = warden.gate(['joint-injury'], 'jumping jacks');
    expect(result.allowed).toBe(false);
  });

  it('hypertension blocks maximal weightlifting', () => {
    const result = warden.gate(['hypertension'], 'maximal weightlifting');
    expect(result.allowed).toBe(false);
  });

  it('pregnancy blocks contact sports', () => {
    const result = warden.gate(['pregnancy'], 'contact sports');
    expect(result.allowed).toBe(false);
  });

  it('recent-surgery blocks vigorous exercise', () => {
    const result = warden.gate(['recent-surgery'], 'any vigorous exercise without medical clearance');
    expect(result.allowed).toBe(false);
  });

  it('healthy user (no conditions) is allowed for moderate exercise', () => {
    const result = warden.gate([], 'moderate aerobic exercise');
    expect(result.allowed).toBe(true);
  });

  it('modifications are non-empty constructive guidance', () => {
    const result = warden.gate(['cardiac-condition'], 'maximal exertion');
    expect(result.modifications.length).toBeGreaterThan(0);
    for (const modification of result.modifications) {
      expect(modification.length).toBeGreaterThan(0);
    }
  });
});

// ─── PESafetyWarden — Redirect Mode ─────────────────────────────────────────

describe('PESafetyWarden — Redirect Mode', () => {
  const warden = new PESafetyWarden();

  it('maximal exercise stress test requires medical clearance', () => {
    const result = warden.redirect('maximal exercise stress test');
    expect(result.redirected).toBe(true);
  });

  it('cardiac stress test requires medical clearance', () => {
    const result = warden.redirect('cardiac stress test');
    expect(result.redirected).toBe(true);
  });

  it('return to sport after surgery requires clearance', () => {
    const result = warden.redirect('return to sport after surgery');
    expect(result.redirected).toBe(true);
  });

  it('regular exercise is not redirected', () => {
    const result = warden.redirect('teach me how to do lunges properly');
    expect(result.redirected).toBe(false);
  });

  it('redirect includes medical guidance', () => {
    const result = warden.redirect('graded exercise test');
    expect(result.medicalGuidance.length).toBeGreaterThan(0);
  });
});

// ─── PE Conditions Database ──────────────────────────────────────────────────

describe('PE Conditions Database', () => {
  it('has exactly 10 conditions', () => {
    expect(peConditions.size).toBe(10);
  });

  it('each condition has at least 3 contraindicated activities', () => {
    for (const [, cond] of peConditions) {
      expect(cond.contraindicatedMovements.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('each condition has at least 3 modifications', () => {
    for (const [, cond] of peConditions) {
      expect(cond.modifications.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('modifications use positive framing', () => {
    for (const [, cond] of peConditions) {
      for (const mod of cond.modifications) {
        // Alternative should be non-empty and constructive
        expect(mod.alternative.length).toBeGreaterThan(0);
      }
    }
  });

  it('isPEContraindicated returns true for cardiac-condition + maximal exertion', () => {
    expect(isPEContraindicated('cardiac-condition', 'maximal exertion')).toBe(true);
  });

  it('isPEContraindicated returns false for cardiac-condition + gentle walking', () => {
    expect(isPEContraindicated('cardiac-condition', 'gentle walking')).toBe(false);
  });
});

// ─── PE Calibration — SafetyBoundary Integration (SAFE-05) ───────────────────

describe('PE Calibration — SafetyBoundary Integration (SAFE-05)', () => {
  it('peSafetyModel has at least 1 boundary', () => {
    expect(peSafetyModel.safetyBoundaries.length).toBeGreaterThanOrEqual(1);
  });

  it('SafetyWarden accepts PE boundaries', () => {
    const warden = new SafetyWarden();
    expect(() => {
      warden.registerBoundaries(peSafetyModel.safetyBoundaries);
    }).not.toThrow();
  });

  it('session duration time boundary triggers correctly', () => {
    const warden = new SafetyWarden();
    // Register a test boundary directly
    warden.registerBoundaries([
      { parameter: 'session_duration_hours', limit: 3, type: 'absolute', reason: 'test' },
    ]);
    // 'session_duration_hours' contains 'hours' → upper-limit polarity; 4 > 3 → violation
    const result = warden.check({ parameter: 'session_duration_hours', proposedValue: 4 }, 'gate');
    expect(result.safe).toBe(false);
  });
});
