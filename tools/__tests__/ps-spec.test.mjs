/**
 * tools/__tests__/ps-spec.test.mjs — v1.49.666 cc-3 Phase 1 C02-C04 tests.
 *
 * Validates the international-PS catalog-card metadata schema via fixtures
 * covering Baudry (France/CNES) + Al-Saud (Saudi/KACST) + Acton (USA civilian
 * boundary) + Bartoe (USA civilian boundary), plus negative cases for each
 * constraint.
 */
import { describe, it, expect } from 'vitest';

import {
  PS_CARD_TEMPLATE_VERSION,
  PS_HARD_LIMITS,
  MISSION_ROLE_CLASSES,
  ISO_ALPHA3_RE,
  validatePsRecord,
  validatePsCollection,
} from '../catalog-card-template/ps-spec.mjs';

const baudry = {
  name: 'Patrick Baudry',
  name_variants: ['Patrick Pierre Roger Baudry'],
  mission_id: '1.120',
  crew_role: 'PS1',
  nationality: 'FRA',
  sponsoring_organization: 'CNES',
  mission_role_class: 'PS',
  payload_specialty: 'PVH cosmonaut-medical-program; postural-equilibrium experiments inherited from Soyuz T-6 backup crew',
  flight_count: 2,
  flight_career_total: 2,
};

const alSaud = {
  name: 'Sultan bin Salman Al-Saud',
  name_variants: ['Sultan bin Salman bin Abdulaziz Al-Saud'],
  mission_id: '1.120',
  crew_role: 'PS2',
  nationality: 'SAU',
  sponsoring_organization: 'KACST',
  mission_role_class: 'PS',
  payload_specialty: 'Arabsat-1B deployment representative; Arab-League consortium liaison',
  flight_count: 1,
  flight_career_total: 1,
  notes: 'Royal Saudi Air Force pilot; flight representative for Arabsat-1B; sponsoring agency canonicalized as KACST.',
};

const acton = {
  name: 'Loren Wilber Acton',
  mission_id: '1.121',
  crew_role: 'PS1',
  nationality: 'USA',
  sponsoring_organization: 'civilian-academic',
  mission_role_class: 'PS',
  payload_specialty: 'Spacelab-2 solar physics instrument operation (Lockheed Solar Optical Universal Polarimeter)',
  flight_count: 1,
  flight_career_total: 1,
};

const bartoe = {
  name: 'John-David Francis Bartoe',
  mission_id: '1.121',
  crew_role: 'PS2',
  nationality: 'USA',
  sponsoring_organization: 'civilian-academic',
  mission_role_class: 'PS',
  payload_specialty: 'Spacelab-2 ultraviolet spectrometer operation (Naval Research Laboratory High-Resolution Telescope and Spectrograph)',
  flight_count: 1,
  flight_career_total: 1,
};

describe('PS_CARD_TEMPLATE_VERSION', () => {
  it('exposes a version string', () => {
    expect(typeof PS_CARD_TEMPLATE_VERSION).toBe('string');
    expect(PS_CARD_TEMPLATE_VERSION).toMatch(/^\d+\.\d+/);
  });
});

describe('validatePsRecord — happy paths (4-PS fixture)', () => {
  it('validates Baudry (France/CNES) as PS1 on STS-51-G', () => {
    const r = validatePsRecord(baudry);
    expect(r.pass).toBe(true);
    expect(r.fieldViolations).toEqual([]);
    expect(r.forbiddenPatterns).toEqual([]);
    expect(r.missingRequired).toEqual([]);
    expect(r.enumViolations).toEqual([]);
    expect(r.byteCount).toBeGreaterThan(0);
    expect(r.byteCount).toBeLessThanOrEqual(PS_HARD_LIMITS.totalRecordBytes);
    expect(r.blockerMessage).toBe('');
  });

  it('validates Al-Saud (Saudi Arabia/KACST) as PS2 on STS-51-G', () => {
    const r = validatePsRecord(alSaud);
    expect(r.pass).toBe(true);
    expect(r.fieldViolations).toEqual([]);
    expect(r.enumViolations).toEqual([]);
    expect(r.blockerMessage).toBe('');
  });

  it('validates Acton (USA boundary case) as PS1 on STS-51-F', () => {
    const r = validatePsRecord(acton);
    expect(r.pass).toBe(true);
    expect(r.enumViolations).toEqual([]);
  });

  it('validates Bartoe (USA boundary case) as PS2 on STS-51-F', () => {
    const r = validatePsRecord(bartoe);
    expect(r.pass).toBe(true);
    expect(r.enumViolations).toEqual([]);
  });
});

describe('validatePsRecord — nationality field', () => {
  it('rejects lowercase nationality', () => {
    const r = validatePsRecord({ ...baudry, nationality: 'fra' });
    expect(r.pass).toBe(false);
    expect(r.enumViolations.join(' ')).toMatch(/nationality/);
  });

  it('rejects 2-letter nationality (ISO alpha-2)', () => {
    const r = validatePsRecord({ ...baudry, nationality: 'FR' });
    expect(r.pass).toBe(false);
    expect(r.enumViolations.join(' ')).toMatch(/alpha-3/);
  });

  it('rejects digit-containing nationality', () => {
    const r = validatePsRecord({ ...baudry, nationality: 'F1A' });
    expect(r.pass).toBe(false);
  });

  it('ISO_ALPHA3_RE accepts canonical codes', () => {
    expect(ISO_ALPHA3_RE.test('USA')).toBe(true);
    expect(ISO_ALPHA3_RE.test('FRA')).toBe(true);
    expect(ISO_ALPHA3_RE.test('SAU')).toBe(true);
    expect(ISO_ALPHA3_RE.test('CAN')).toBe(true);
  });
});

describe('validatePsRecord — mission_id format', () => {
  it('accepts canonical NASA degree numbers', () => {
    expect(validatePsRecord({ ...baudry, mission_id: '1.120' }).pass).toBe(true);
    expect(validatePsRecord({ ...baudry, mission_id: '1.5' }).pass).toBe(true);
    expect(validatePsRecord({ ...baudry, mission_id: '2.40' }).pass).toBe(true);
  });

  it('rejects non-degree strings', () => {
    const r = validatePsRecord({ ...baudry, mission_id: 'STS-51-G' });
    expect(r.pass).toBe(false);
    expect(r.enumViolations.join(' ')).toMatch(/mission_id/);
  });
});

describe('validatePsRecord — crew_role', () => {
  it('accepts PS<n>', () => {
    expect(validatePsRecord({ ...baudry, crew_role: 'PS1' }).pass).toBe(true);
    expect(validatePsRecord({ ...baudry, crew_role: 'PS3' }).pass).toBe(true);
  });

  it('accepts observer / scientist for cross-programme records', () => {
    expect(validatePsRecord({ ...baudry, crew_role: 'observer' }).pass).toBe(true);
    expect(validatePsRecord({ ...baudry, crew_role: 'scientist' }).pass).toBe(true);
  });

  it('rejects arbitrary role strings', () => {
    const r = validatePsRecord({ ...baudry, crew_role: 'guest' });
    expect(r.pass).toBe(false);
    expect(r.enumViolations.join(' ')).toMatch(/crew_role/);
  });
});

describe('validatePsRecord — mission_role_class enum', () => {
  it('accepts every enum value', () => {
    for (const c of MISSION_ROLE_CLASSES) {
      const r = validatePsRecord({ ...baudry, mission_role_class: c });
      expect(r.pass).toBe(true);
    }
  });

  it('rejects unknown class', () => {
    const r = validatePsRecord({ ...baudry, mission_role_class: 'tourist' });
    expect(r.pass).toBe(false);
    expect(r.enumViolations.join(' ')).toMatch(/mission_role_class/);
  });
});

describe('validatePsRecord — required fields', () => {
  it('flags missing name', () => {
    const r = validatePsRecord({ ...baudry, name: '' });
    expect(r.pass).toBe(false);
    expect(r.missingRequired).toContain('name');
  });

  it('flags missing sponsoring_organization', () => {
    const r = validatePsRecord({ ...baudry, sponsoring_organization: undefined });
    expect(r.pass).toBe(false);
    expect(r.missingRequired).toContain('sponsoring_organization');
  });

  it('flags multiple missing in single result', () => {
    const r = validatePsRecord({ mission_id: '1.120' });
    expect(r.pass).toBe(false);
    expect(r.missingRequired.length).toBeGreaterThanOrEqual(5);
  });

  it('rejects null record', () => {
    const r = validatePsRecord(null);
    expect(r.pass).toBe(false);
    expect(r.blockerMessage).toMatch(/not an object/);
  });
});

describe('validatePsRecord — character / byte limits', () => {
  it('flags over-length payload_specialty', () => {
    const longSpec = 'x'.repeat(PS_HARD_LIMITS.payloadSpecialtyChars + 1);
    const r = validatePsRecord({ ...baudry, payload_specialty: longSpec });
    expect(r.pass).toBe(false);
    expect(r.fieldViolations.some((v) => v.field === 'payload_specialty')).toBe(true);
  });

  it('flags over-length notes', () => {
    const longNotes = 'x'.repeat(PS_HARD_LIMITS.notesChars + 1);
    const r = validatePsRecord({ ...baudry, notes: longNotes });
    expect(r.pass).toBe(false);
    expect(r.fieldViolations.some((v) => v.field === 'notes')).toBe(true);
  });

  it('reports total record byte count', () => {
    const r = validatePsRecord(baudry);
    expect(r.byteCount).toBe(Buffer.byteLength(JSON.stringify(baudry), 'utf8'));
  });
});

describe('validatePsRecord — forbidden content in notes', () => {
  it('flags substrate-arc narrative', () => {
    const r = validatePsRecord({ ...baudry, notes: 'This is a substrate-arc anchor.' });
    expect(r.pass).toBe(false);
    expect(r.forbiddenPatterns.length).toBeGreaterThan(0);
  });

  it('flags lesson refs', () => {
    const r = validatePsRecord({ ...baudry, notes: 'See lesson #10345 for context.' });
    expect(r.pass).toBe(false);
    expect(r.forbiddenPatterns.length).toBeGreaterThan(0);
  });

  it('flags FA-N-N RESOLVED markers', () => {
    const r = validatePsRecord({ ...baudry, notes: 'FA-660-1 RESOLVED at v660.' });
    expect(r.pass).toBe(false);
    expect(r.forbiddenPatterns.length).toBeGreaterThan(0);
  });

  it('flags obs#N first-instance markers', () => {
    const r = validatePsRecord({ ...baudry, notes: 'FIRST-FRENCH obs#1 first-instance.' });
    expect(r.pass).toBe(false);
    expect(r.forbiddenPatterns.length).toBeGreaterThan(0);
  });

  it('accepts plain notes without forbidden patterns', () => {
    const r = validatePsRecord({ ...baudry, notes: 'Plain prose notes about role.' });
    expect(r.pass).toBe(true);
  });
});

describe('validatePsRecord — name_variants', () => {
  it('accepts up to maxNameVariants', () => {
    const variants = Array.from({ length: PS_HARD_LIMITS.maxNameVariants }, (_, i) => `Variant ${i}`);
    const r = validatePsRecord({ ...baudry, name_variants: variants });
    expect(r.pass).toBe(true);
  });

  it('flags too many name_variants', () => {
    const variants = Array.from({ length: PS_HARD_LIMITS.maxNameVariants + 1 }, (_, i) => `Variant ${i}`);
    const r = validatePsRecord({ ...baudry, name_variants: variants });
    expect(r.pass).toBe(false);
    expect(r.fieldViolations.some((v) => v.field === 'name_variants')).toBe(true);
  });

  it('flags non-string variant entry', () => {
    const r = validatePsRecord({ ...baudry, name_variants: ['ok', 42] });
    expect(r.pass).toBe(false);
    expect(r.fieldViolations.some((v) => v.field === 'name_variants[1]')).toBe(true);
  });
});

describe('validatePsCollection', () => {
  it('passes the full 4-PS fixture set', () => {
    const result = validatePsCollection([baudry, alSaud, acton, bartoe]);
    expect(result.pass).toBe(true);
    expect(result.failureCount).toBe(0);
    expect(result.results).toHaveLength(4);
  });

  it('aggregates failures across mixed records', () => {
    const broken = { ...baudry, nationality: 'fr' };
    const result = validatePsCollection([baudry, broken, alSaud]);
    expect(result.pass).toBe(false);
    expect(result.failureCount).toBe(1);
  });

  it('rejects non-array input', () => {
    const result = validatePsCollection('not-an-array');
    expect(result.pass).toBe(false);
    expect(result.failureCount).toBe(1);
  });
});

describe('blockerMessage format', () => {
  it('starts with [ps-card:BLOCKER]', () => {
    const r = validatePsRecord({ ...baudry, nationality: 'fr' });
    expect(r.blockerMessage).toMatch(/^\[ps-card:BLOCKER\]/);
  });

  it('includes name and mission id', () => {
    const r = validatePsRecord({ ...baudry, nationality: 'fr' });
    expect(r.blockerMessage).toMatch(/Patrick Baudry/);
    expect(r.blockerMessage).toMatch(/1\.120/);
  });

  it('is empty on pass', () => {
    expect(validatePsRecord(baudry).blockerMessage).toBe('');
  });
});
