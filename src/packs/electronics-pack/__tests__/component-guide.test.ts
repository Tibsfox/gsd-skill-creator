/**
 * Component Selection Guide Tests
 *
 * Tests for typed component arrays and lookup functions providing
 * practical component selection guidance for learners.
 *
 * Phase 511 Plan 01 -- ELEC-08
 */

import { describe, it, expect } from 'vitest';
import {
  RESISTOR_TYPES,
  CAPACITOR_TYPES,
  SEMICONDUCTOR_PACKAGES,
  selectResistorType,
  selectCapacitorType,
  selectPackage,
} from '../shared/component-guide.js';

// ---------------------------------------------------------------------------
// Resistor Types -- Structure
// ---------------------------------------------------------------------------

describe('RESISTOR_TYPES', () => {
  it('has at least 5 entries', () => {
    expect(RESISTOR_TYPES.length).toBeGreaterThanOrEqual(5);
  });

  it('each entry has name, tolerance, tempCoefficient, applications, avoid', () => {
    for (const r of RESISTOR_TYPES) {
      expect(r.name).toBeDefined();
      expect(typeof r.name).toBe('string');
      expect(typeof r.tolerance).toBe('string');
      expect(typeof r.tempCoefficient).toBe('string');
      expect(Array.isArray(r.applications)).toBe(true);
      expect(Array.isArray(r.avoid)).toBe(true);
    }
  });

  it('includes Carbon Film, Metal Film, Wirewound, Thick Film SMD, Thin Film Precision', () => {
    const names = RESISTOR_TYPES.map((r) => r.name);
    expect(names).toContain('Carbon Film');
    expect(names).toContain('Metal Film');
    expect(names).toContain('Wirewound');
    expect(names).toContain('Thick Film SMD');
    expect(names).toContain('Thin Film Precision');
  });

  it('every type has at least one application and one avoid entry', () => {
    for (const r of RESISTOR_TYPES) {
      expect(
        r.applications.length,
        `${r.name} should have at least one application`,
      ).toBeGreaterThanOrEqual(1);
      expect(
        r.avoid.length,
        `${r.name} should have at least one avoid entry`,
      ).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Capacitor Types -- Structure
// ---------------------------------------------------------------------------

describe('CAPACITOR_TYPES', () => {
  it('has at least 5 entries', () => {
    expect(CAPACITOR_TYPES.length).toBeGreaterThanOrEqual(5);
  });

  it('each entry has name, dielectric, capacitanceRange, voltageRange, applications, avoid', () => {
    for (const c of CAPACITOR_TYPES) {
      expect(c.name).toBeDefined();
      expect(typeof c.name).toBe('string');
      expect(typeof c.dielectric).toBe('string');
      expect(typeof c.capacitanceRange).toBe('string');
      expect(typeof c.voltageRange).toBe('string');
      expect(Array.isArray(c.applications)).toBe(true);
      expect(Array.isArray(c.avoid)).toBe(true);
    }
  });

  it('includes Ceramic (MLCC), Electrolytic (Aluminum), Film (Polyester), Tantalum, Mica', () => {
    const names = CAPACITOR_TYPES.map((c) => c.name);
    expect(names).toContain('Ceramic (MLCC)');
    expect(names).toContain('Electrolytic (Aluminum)');
    expect(names).toContain('Film (Polyester)');
    expect(names).toContain('Tantalum');
    expect(names).toContain('Mica');
  });
});

// ---------------------------------------------------------------------------
// Semiconductor Packages -- Structure
// ---------------------------------------------------------------------------

describe('SEMICONDUCTOR_PACKAGES', () => {
  it('has at least 5 entries', () => {
    expect(SEMICONDUCTOR_PACKAGES.length).toBeGreaterThanOrEqual(5);
  });

  it('each entry has name, pinCount, maxPower, thermalResistance, applications', () => {
    for (const p of SEMICONDUCTOR_PACKAGES) {
      expect(p.name).toBeDefined();
      expect(typeof p.name).toBe('string');
      expect(typeof p.pinCount).toBe('number');
      expect(typeof p.maxPower).toBe('number');
      expect(typeof p.thermalResistance).toBe('string');
      expect(Array.isArray(p.applications)).toBe(true);
    }
  });

  it('includes TO-92, TO-220, SOT-23, DIP-8, SOIC-8', () => {
    const names = SEMICONDUCTOR_PACKAGES.map((p) => p.name);
    expect(names).toContain('TO-92');
    expect(names).toContain('TO-220');
    expect(names).toContain('SOT-23');
    expect(names).toContain('DIP-8');
    expect(names).toContain('SOIC-8');
  });
});

// ---------------------------------------------------------------------------
// Lookup Functions
// ---------------------------------------------------------------------------

describe('selectResistorType', () => {
  it('"precision" returns Metal Film and Thin Film', () => {
    const results = selectResistorType('precision');
    const names = results.map((r) => r.name);
    expect(names).toContain('Metal Film');
    expect(names).toContain('Thin Film Precision');
  });

  it('"general" returns Carbon Film', () => {
    const results = selectResistorType('general');
    const names = results.map((r) => r.name);
    expect(names).toContain('Carbon Film');
  });
});

describe('selectCapacitorType', () => {
  it('"decoupling" returns Ceramic', () => {
    const results = selectCapacitorType('decoupling');
    const names = results.map((r) => r.name);
    expect(names).toContain('Ceramic (MLCC)');
  });

  it('"audio" returns Film', () => {
    const results = selectCapacitorType('audio');
    const names = results.map((r) => r.name);
    expect(names).toContain('Film (Polyester)');
  });
});

describe('selectPackage', () => {
  it('0.5W returns packages including TO-220', () => {
    const results = selectPackage(0.5);
    const names = results.map((p) => p.name);
    expect(names).toContain('TO-220');
  });

  it('0.1W returns TO-92 and SOT-23', () => {
    const results = selectPackage(0.1);
    const names = results.map((p) => p.name);
    expect(names).toContain('TO-92');
    expect(names).toContain('SOT-23');
  });
});
