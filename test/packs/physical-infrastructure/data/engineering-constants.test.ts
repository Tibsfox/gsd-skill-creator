import { describe, it, expect } from 'vitest';
import {
  NPS_PIPE_SIZES,
  NEC_310_16_AMPACITY,
  FLUID_PROPERTIES,
  MATERIAL_PROPERTIES,
  getPipeSize,
  getAmpacity,
  getFluidProperty,
} from '../../../../skills/physical-infrastructure/data/engineering-constants.js';

describe('NPS_PIPE_SIZES', () => {
  it('NPS 2" Schedule 40 has correct OD and ID', () => {
    const pipe = getPipeSize('2', '40') as { od_in: number; id_in: number };
    expect(pipe.od_in).toBeCloseTo(2.375, 3);
    expect(pipe.id_in).toBeCloseTo(2.067, 3);
  });

  it('NPS 4" Schedule 80 has correct OD and ID', () => {
    const pipe = getPipeSize('4', '80') as { od_in: number; id_in: number };
    expect(pipe.od_in).toBeCloseTo(4.500, 3);
    expect(pipe.id_in).toBeCloseTo(3.826, 3);
  });

  it('NPS 6" Schedule 40 has correct OD and ID', () => {
    const pipe = getPipeSize('6', '40') as { od_in: number; id_in: number };
    expect(pipe.od_in).toBeCloseTo(6.625, 3);
    expect(pipe.id_in).toBeCloseTo(6.065, 3);
  });

  it('NPS 8" Schedule 40 has correct OD and ID', () => {
    const pipe = getPipeSize('8', '40') as { od_in: number; id_in: number };
    expect(pipe.od_in).toBeCloseTo(8.625, 3);
    expect(pipe.id_in).toBeCloseTo(7.981, 3);
  });

  it('NPS 1/2" Schedule 40 has correct ID', () => {
    const pipe = getPipeSize('0.5', '40') as { id_in: number };
    expect(pipe.id_in).toBeCloseTo(0.622, 3);
  });

  it('NPS 3" Schedule 40 has correct OD and ID', () => {
    const pipe = getPipeSize('3', '40') as { od_in: number; id_in: number };
    expect(pipe.od_in).toBeCloseTo(3.500, 3);
    expect(pipe.id_in).toBeCloseTo(3.068, 3);
  });

  it('NPS 1" Schedule 80 has correct ID', () => {
    const pipe = getPipeSize('1', '80') as { id_in: number };
    expect(pipe.id_in).toBeCloseTo(0.957, 3);
  });

  it('NPS pipe size table covers at least 9 nominal sizes', () => {
    expect(Object.keys(NPS_PIPE_SIZES).length).toBeGreaterThanOrEqual(9);
  });

  it('throws for unknown NPS size', () => {
    expect(() => getPipeSize('99', '40')).toThrow();
  });

  it('throws for unknown schedule', () => {
    expect(() => getPipeSize('2', '160')).toThrow();
  });
});

describe('NEC_310_16_AMPACITY (copper)', () => {
  it('12 AWG copper at 60C is 20 amps', () => {
    expect(getAmpacity('12', 60)).toBe(20);
  });

  it('8 AWG copper at 75C is 50 amps', () => {
    expect(getAmpacity('8', 75)).toBe(50);
  });

  it('4 AWG copper at 90C is 95 amps', () => {
    expect(getAmpacity('4', 90)).toBe(95);
  });

  it('2/0 AWG copper at 75C is 175 amps', () => {
    expect(getAmpacity('2/0', 75)).toBe(175);
  });

  it('4/0 AWG copper at 90C is 260 amps', () => {
    expect(getAmpacity('4/0', 90)).toBe(260);
  });

  it('500 kcmil copper at 75C is 380 amps', () => {
    expect(getAmpacity('500', 75)).toBe(380);
  });

  it('14 AWG copper at 60C is 15 amps', () => {
    expect(getAmpacity('14', 60)).toBe(15);
  });

  it('1/0 AWG copper at 90C is 170 amps', () => {
    expect(getAmpacity('1/0', 90)).toBe(170);
  });

  it('250 kcmil copper at 75C is 255 amps', () => {
    expect(getAmpacity('250', 75)).toBe(255);
  });

  it('ampacity table covers at least 18 conductor sizes', () => {
    expect(Object.keys(NEC_310_16_AMPACITY).length).toBeGreaterThanOrEqual(18);
  });

  it('throws for unknown AWG size', () => {
    expect(() => getAmpacity('99', 75)).toThrow();
  });
});

describe('FLUID_PROPERTIES', () => {
  it('water density at standard conditions is ~999 kg/m3', () => {
    const prop = getFluidProperty('water', 'density_kg_m3') as number;
    expect(prop).toBeCloseTo(999.0, 0);
  });

  it('water specific heat is ~4.187 kJ/(kg*K)', () => {
    const prop = getFluidProperty('water', 'specificHeat_kJ_kgK') as number;
    expect(prop).toBeCloseTo(4.187, 2);
  });

  it('water dynamic viscosity is ~1.12e-3 Pa*s', () => {
    const prop = getFluidProperty('water', 'dynamicViscosity_Pa_s') as number;
    expect(prop).toBeCloseTo(1.12e-3, 4);
  });

  it('water thermal conductivity is ~0.605 W/(m*K)', () => {
    const prop = getFluidProperty('water', 'thermalConductivity_W_mK') as number;
    expect(prop).toBeCloseTo(0.605, 3);
  });

  it('chilled water dynamic viscosity is ~1.38e-3 Pa*s', () => {
    const prop = getFluidProperty('chilled-water', 'dynamicViscosity_Pa_s') as number;
    expect(prop).toBeCloseTo(1.38e-3, 4);
  });

  it('chilled water specific heat is ~4.195 kJ/(kg*K)', () => {
    const prop = getFluidProperty('chilled-water', 'specificHeat_kJ_kgK') as number;
    expect(prop).toBeCloseTo(4.195, 2);
  });

  it('30% propylene glycol density is ~1036 kg/m3', () => {
    const prop = getFluidProperty('glycol-30pct', 'density_kg_m3') as number;
    expect(prop).toBeCloseTo(1036, 0);
  });

  it('30% propylene glycol specific heat is ~3.85 kJ/(kg*K)', () => {
    const prop = getFluidProperty('glycol-30pct', 'specificHeat_kJ_kgK') as number;
    expect(prop).toBeCloseTo(3.85, 1);
  });

  it('FLUID_PROPERTIES has at least 3 fluid types', () => {
    expect(Object.keys(FLUID_PROPERTIES).length).toBeGreaterThanOrEqual(3);
  });

  it('throws for unknown fluid', () => {
    expect(() => getFluidProperty('mercury', 'density_kg_m3')).toThrow();
  });
});

describe('MATERIAL_PROPERTIES', () => {
  it('carbon steel A53 yield strength is 241 MPa', () => {
    expect((MATERIAL_PROPERTIES as Record<string, { yieldStrength_MPa: number }>)['carbon-steel-A53'].yieldStrength_MPa).toBeCloseTo(241, 0);
  });

  it('carbon steel A53 tensile strength is 414 MPa', () => {
    expect((MATERIAL_PROPERTIES as Record<string, { tensileStrength_MPa: number }>)['carbon-steel-A53'].tensileStrength_MPa).toBeCloseTo(414, 0);
  });

  it('carbon steel A53 density is 7850 kg/m3', () => {
    expect((MATERIAL_PROPERTIES as Record<string, { density_kg_m3: number }>)['carbon-steel-A53'].density_kg_m3).toBeCloseTo(7850, 0);
  });

  it('304 stainless tensile strength is 517 MPa', () => {
    expect((MATERIAL_PROPERTIES as Record<string, { tensileStrength_MPa: number }>)['stainless-304'].tensileStrength_MPa).toBeCloseTo(517, 0);
  });

  it('304 stainless yield strength is 207 MPa', () => {
    expect((MATERIAL_PROPERTIES as Record<string, { yieldStrength_MPa: number }>)['stainless-304'].yieldStrength_MPa).toBeCloseTo(207, 0);
  });

  it('copper Type L thermal conductivity is ~391 W/(m*K)', () => {
    expect((MATERIAL_PROPERTIES as Record<string, { thermalConductivity_W_mK: number }>)['copper-type-L'].thermalConductivity_W_mK).toBeCloseTo(391, 0);
  });

  it('copper Type L tensile strength is 207 MPa', () => {
    expect((MATERIAL_PROPERTIES as Record<string, { tensileStrength_MPa: number }>)['copper-type-L'].tensileStrength_MPa).toBeCloseTo(207, 0);
  });

  it('MATERIAL_PROPERTIES has at least 3 material types', () => {
    expect(Object.keys(MATERIAL_PROPERTIES).length).toBeGreaterThanOrEqual(3);
  });
});
