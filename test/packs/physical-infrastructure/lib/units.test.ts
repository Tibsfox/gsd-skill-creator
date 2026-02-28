import { describe, it, expect } from 'vitest';
import {
  convert,
  convertTemperature,
  assertSameDomain,
  UNIT_REGISTRY,
} from '../../../../skills/physical-infrastructure/lib/units.js';
import type { DimensionalValue } from '../../../../skills/physical-infrastructure/lib/units.js';

describe('Length conversions', () => {
  it('converts inches to meters: 1 in = 0.0254 m', () => {
    const r = convert(1, 'in', 'm');
    expect(r.value).toBeCloseTo(0.0254, 6);
    expect(r.unit).toBe('m');
    expect(r.dimension).toBe('length');
  });

  it('converts feet to meters: 1 ft = 0.3048 m', () => {
    expect(convert(1, 'ft', 'm').value).toBeCloseTo(0.3048, 6);
  });

  it('converts meters to feet: round-trip closes', () => {
    const toFt = convert(1, 'm', 'ft').value;
    const back = convert(toFt, 'ft', 'm').value;
    expect(back).toBeCloseTo(1.0, 9);
  });

  it('converts millimeters to inches: 25.4 mm = 1 in', () => {
    expect(convert(25.4, 'mm', 'in').value).toBeCloseTo(1.0, 6);
  });

  it('converts centimeters to meters: 100 cm = 1 m', () => {
    expect(convert(100, 'cm', 'm').value).toBeCloseTo(1.0, 9);
  });
});

describe('Pressure conversions', () => {
  it('converts PSI to Pa: 1 PSI = 6894.76 Pa', () => {
    expect(convert(1, 'PSI', 'Pa').value).toBeCloseTo(6894.76, 1);
  });

  it('converts kPa to PSI: 100 kPa = 14.504 PSI', () => {
    expect(convert(100, 'kPa', 'PSI').value).toBeCloseTo(14.504, 2);
  });

  it('converts bar to PSI: 1 bar = 14.504 PSI', () => {
    expect(convert(1, 'bar', 'PSI').value).toBeCloseTo(14.504, 2);
  });

  it('round-trip PSI -> Pa -> PSI closes', () => {
    const pa = convert(50, 'PSI', 'Pa').value;
    expect(convert(pa, 'Pa', 'PSI').value).toBeCloseTo(50.0, 6);
  });

  it('converts MPa to kPa: 1 MPa = 1000 kPa', () => {
    expect(convert(1, 'MPa', 'kPa').value).toBeCloseTo(1000, 6);
  });
});

describe('Temperature conversions', () => {
  it('converts 0C to 32F', () => {
    expect(convertTemperature(0, 'C', 'F').value).toBeCloseTo(32, 6);
  });

  it('converts 100C to 212F', () => {
    expect(convertTemperature(100, 'C', 'F').value).toBeCloseTo(212, 6);
  });

  it('converts -40C to -40F (crossover point)', () => {
    expect(convertTemperature(-40, 'C', 'F').value).toBeCloseTo(-40, 6);
  });

  it('converts 20C to 293.15 K', () => {
    expect(convertTemperature(20, 'C', 'K').value).toBeCloseTo(293.15, 4);
  });

  it('round-trip C -> F -> C closes', () => {
    const f = convertTemperature(37, 'C', 'F').value;
    expect(convertTemperature(f, 'F', 'C').value).toBeCloseTo(37.0, 8);
  });

  it('temperature dimension is "temperature"', () => {
    expect(convertTemperature(20, 'C', 'F').dimension).toBe('temperature');
  });

  it('converts 0 K to -273.15 C', () => {
    expect(convertTemperature(0, 'K', 'C').value).toBeCloseTo(-273.15, 4);
  });

  it('converts 491.67 R to 273.15 K', () => {
    expect(convertTemperature(491.67, 'R', 'K').value).toBeCloseTo(273.15, 1);
  });
});

describe('Flow rate conversions', () => {
  it('converts GPM to m3/s: 1 GPM = 6.30902e-5 m3/s', () => {
    expect(convert(1, 'GPM', 'm3/s').value).toBeCloseTo(6.30902e-5, 9);
  });

  it('converts L/min to m3/s: 1 L/min = 1.66667e-5 m3/s', () => {
    expect(convert(1, 'L/min', 'm3/s').value).toBeCloseTo(1.66667e-5, 9);
  });

  it('converts GPM to L/min: 1 GPM = 3.78541 L/min', () => {
    expect(convert(1, 'GPM', 'L/min').value).toBeCloseTo(3.78541, 4);
  });

  it('round-trip GPM -> m3/s -> GPM closes', () => {
    const si = convert(10, 'GPM', 'm3/s').value;
    expect(convert(si, 'm3/s', 'GPM').value).toBeCloseTo(10.0, 6);
  });

  it('converts L/s to m3/s: 1 L/s = 0.001 m3/s', () => {
    expect(convert(1, 'L/s', 'm3/s').value).toBeCloseTo(0.001, 9);
  });
});

describe('Power conversions', () => {
  it('converts BTU/hr to watts: 1 BTU/hr = 0.293071 W', () => {
    expect(convert(1, 'BTU/hr', 'W').value).toBeCloseTo(0.293071, 4);
  });

  it('converts tons of refrigeration to kW: 1 ton = 3.51685 kW', () => {
    expect(convert(1, 'ton', 'kW').value).toBeCloseTo(3.51685, 3);
  });

  it('converts HP to watts: 1 HP = 745.7 W', () => {
    expect(convert(1, 'HP', 'W').value).toBeCloseTo(745.7, 1);
  });

  it('converts kW to BTU/hr: 1 kW = 3412.14 BTU/hr', () => {
    expect(convert(1, 'kW', 'BTU/hr').value).toBeCloseTo(3412.14, 1);
  });

  it('round-trip kW -> BTU/hr -> kW closes', () => {
    const btu = convert(5, 'kW', 'BTU/hr').value;
    expect(convert(btu, 'BTU/hr', 'kW').value).toBeCloseTo(5.0, 6);
  });

  it('converts MW to kW: 1 MW = 1000 kW', () => {
    expect(convert(1, 'MW', 'kW').value).toBeCloseTo(1000, 6);
  });
});

describe('Mass conversions', () => {
  it('converts lb to kg: 1 lb = 0.453592 kg', () => {
    expect(convert(1, 'lb', 'kg').value).toBeCloseTo(0.453592, 5);
  });

  it('round-trip kg -> lb -> kg closes', () => {
    const lb = convert(100, 'kg', 'lb').value;
    expect(convert(lb, 'lb', 'kg').value).toBeCloseTo(100, 6);
  });

  it('converts grams to kg: 1000 g = 1 kg', () => {
    expect(convert(1000, 'g', 'kg').value).toBeCloseTo(1.0, 9);
  });
});

describe('Energy conversions', () => {
  it('converts kWh to J: 1 kWh = 3.6e6 J', () => {
    expect(convert(1, 'kWh', 'J').value).toBeCloseTo(3.6e6, 0);
  });

  it('converts BTU to J: 1 BTU = 1055.06 J', () => {
    expect(convert(1, 'BTU', 'J').value).toBeCloseTo(1055.06, 1);
  });

  it('converts kJ to J: 1 kJ = 1000 J', () => {
    expect(convert(1, 'kJ', 'J').value).toBeCloseTo(1000, 6);
  });
});

describe('Domain mismatch detection', () => {
  it('throws when converting pressure unit to length unit', () => {
    expect(() => convert(1, 'PSI', 'm')).toThrow();
  });

  it('throws when converting flow rate to pressure', () => {
    expect(() => convert(1, 'GPM', 'PSI')).toThrow();
  });

  it('throws with descriptive message mentioning dimensions', () => {
    expect(() => convert(1, 'PSI', 'm')).toThrow(/incompatible dimensions/i);
  });

  it('throws for unknown unit', () => {
    expect(() => convert(1, 'quarts_per_fortnight', 'm')).toThrow(/unknown unit/i);
  });

  it('assertSameDomain throws when dimensions differ', () => {
    const pressure: DimensionalValue = { value: 100, unit: 'PSI', dimension: 'pressure' };
    const length: DimensionalValue = { value: 5, unit: 'm', dimension: 'length' };
    expect(() => assertSameDomain(pressure, length)).toThrow();
  });

  it('assertSameDomain does not throw when dimensions match', () => {
    const p1: DimensionalValue = { value: 100, unit: 'PSI', dimension: 'pressure' };
    const p2: DimensionalValue = { value: 689.5, unit: 'kPa', dimension: 'pressure' };
    expect(() => assertSameDomain(p1, p2)).not.toThrow();
  });
});

describe('DimensionalValue structure', () => {
  it('convert returns DimensionalValue with value, unit, dimension', () => {
    const r = convert(100, 'kPa', 'PSI');
    expect(r).toHaveProperty('value');
    expect(r).toHaveProperty('unit', 'PSI');
    expect(r).toHaveProperty('dimension', 'pressure');
  });

  it('UNIT_REGISTRY is an object with at least 20 unit entries', () => {
    expect(Object.keys(UNIT_REGISTRY).length).toBeGreaterThanOrEqual(20);
  });

  it('convert preserves the correct dimension tag through conversion', () => {
    expect(convert(1, 'GPM', 'L/min').dimension).toBe('flow_rate_volumetric');
    expect(convert(1, 'HP', 'kW').dimension).toBe('power');
    expect(convert(1, 'lb', 'kg').dimension).toBe('mass');
  });
});
