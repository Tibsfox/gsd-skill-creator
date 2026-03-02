/**
 * Electronics Safety Checker test suite.
 *
 * Tests ELECTRONICS_SAFETY_BOUNDARIES definitions, ElectronicsSafetyChecker
 * (annotate/gate/redirect modes), and SafetyWarden integration (SAFE-02, SAFE-05).
 *
 * @module departments/electronics/safety/safety.test
 */

import { describe, it, expect } from 'vitest';
import { ElectronicsSafetyChecker, ELECTRONICS_SAFETY_BOUNDARIES } from './electronics-safety-boundaries.js';
import { SafetyWarden } from '../../../safety/safety-warden.js';
import { electronicsModel } from '../calibration/electronics-calibration.js';

// ─── ELECTRONICS_SAFETY_BOUNDARIES — Boundary Definitions ────────────────────

describe('ELECTRONICS_SAFETY_BOUNDARIES — Boundary Definitions', () => {
  it('has 6 boundary definitions', () => {
    expect(ELECTRONICS_SAFETY_BOUNDARIES.length).toBe(6);
  });

  it('dc_voltage_zone_v is absolute with limit 50', () => {
    const boundary = ELECTRONICS_SAFETY_BOUNDARIES.find((b) => b.parameter === 'dc_voltage_zone_v');
    expect(boundary).toBeDefined();
    expect(boundary?.type).toBe('absolute');
    expect(boundary?.limit).toBe(50);
  });

  it('body_current_zone_ma is absolute with limit 10', () => {
    const boundary = ELECTRONICS_SAFETY_BOUNDARIES.find((b) => b.parameter === 'body_current_zone_ma');
    expect(boundary).toBeDefined();
    expect(boundary?.type).toBe('absolute');
    expect(boundary?.limit).toBe(10);
  });

  it('all boundaries have non-empty reason strings', () => {
    for (const boundary of ELECTRONICS_SAFETY_BOUNDARIES) {
      expect(boundary.reason.length).toBeGreaterThan(0);
    }
  });
});

// ─── ElectronicsSafetyChecker — Annotate Mode ────────────────────────────────

describe('ElectronicsSafetyChecker — Annotate Mode', () => {
  const checker = new ElectronicsSafetyChecker();

  it('flags DC voltage above 50V as unsafe', () => {
    const results = checker.annotate({ dc_voltage_zone_v: 120 });
    const dcResult = results.find((r) => r.parameter === 'dc_voltage_zone_v');
    expect(dcResult).toBeDefined();
    expect(dcResult?.result.safe).toBe(false);
  });

  it('passes DC voltage at or below 50V', () => {
    const results = checker.annotate({ dc_voltage_zone_v: 48 });
    expect(results.length).toBe(0);
  });

  it('flags AC voltage above 25V', () => {
    const results = checker.annotate({ ac_voltage_rms_zone_v: 30 });
    const acResult = results.find((r) => r.parameter === 'ac_voltage_rms_zone_v');
    expect(acResult).toBeDefined();
    expect(acResult?.result.safe).toBe(false);
  });

  it('flags capacitor discharge above 0.1J', () => {
    const results = checker.annotate({ capacitor_discharge_zone_joules: 0.5 });
    const capResult = results.find((r) => r.parameter === 'capacitor_discharge_zone_joules');
    expect(capResult).toBeDefined();
    expect(capResult?.result.safe).toBe(false);
  });
});

// ─── ElectronicsSafetyChecker — Gate Mode ────────────────────────────────────

describe('ElectronicsSafetyChecker — Gate Mode', () => {
  const checker = new ElectronicsSafetyChecker();

  it('blocks operation when DC voltage exceeds 50V', () => {
    const result = checker.gate({ dc_voltage_zone_v: 120 });
    expect(result.allowed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('allows operation when DC voltage is 48V', () => {
    const result = checker.gate({ dc_voltage_zone_v: 48 });
    expect(result.allowed).toBe(true);
  });

  it('blocks when body current exceeds 10mA', () => {
    const result = checker.gate({ body_current_zone_ma: 15 });
    expect(result.allowed).toBe(false);
  });

  it('allows when body current is 5mA', () => {
    const result = checker.gate({ body_current_zone_ma: 5 });
    expect(result.allowed).toBe(true);
  });

  it('blocks high-energy capacitor discharge', () => {
    const result = checker.gate({ capacitor_discharge_zone_joules: 0.5 });
    expect(result.allowed).toBe(false);
  });
});

// ─── ElectronicsSafetyChecker — Redirect Mode ────────────────────────────────

describe('ElectronicsSafetyChecker — Redirect Mode', () => {
  const checker = new ElectronicsSafetyChecker();

  it('returns safeValue 50 for DC voltage 120V', () => {
    const results = checker.redirect({ dc_voltage_zone_v: 120 });
    const dcResult = results.find((r) => r.parameter === 'dc_voltage_zone_v');
    expect(dcResult).toBeDefined();
    expect(dcResult?.safeValue).toBe(50);
  });

  it('returns safeValue 25 for AC voltage 240V', () => {
    const results = checker.redirect({ ac_voltage_rms_zone_v: 240 });
    const acResult = results.find((r) => r.parameter === 'ac_voltage_rms_zone_v');
    expect(acResult).toBeDefined();
    expect(acResult?.safeValue).toBe(25);
  });

  it('returns empty array when all params are safe', () => {
    const results = checker.redirect({ dc_voltage_zone_v: 12 });
    expect(results.length).toBe(0);
  });
});

// ─── Electronics Calibration — SafetyBoundary Registration (SAFE-05) ─────────

describe('Electronics Calibration — SafetyBoundary Registration (SAFE-05)', () => {
  it('electronicsModel safetyBoundaries is non-empty', () => {
    expect(electronicsModel.safetyBoundaries.length).toBeGreaterThanOrEqual(1);
  });

  it('SafetyWarden accepts electronics model boundaries', () => {
    const warden = new SafetyWarden();
    expect(() => {
      warden.registerBoundaries(electronicsModel.safetyBoundaries);
    }).not.toThrow();
  });
});
