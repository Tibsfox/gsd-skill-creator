/**
 * Tests for ICD validation suite and cross-reference checker.
 *
 * Covers:
 * - validateICD(): per-ICD meta + schemas consistency
 * - crossReferenceCheck(): agent registry + routing table cross-references
 * - validateAllICDs(): aggregate validation across all 4 ICDs
 * - Barrel index: ALL_ICD_META and schema re-exports
 */

import { describe, it, expect } from 'vitest';
import {
  validateICD,
  crossReferenceCheck,
  validateAllICDs,
} from '../icd/icd-validator.js';
import {
  ALL_ICD_META,
  ALL_ICD_SCHEMAS,
  ICD_01_SCHEMAS,
  ICD_02_SCHEMAS,
  ICD_03_SCHEMAS,
  ICD_04_SCHEMAS,
  ICD_01_META,
  ICD_02_META,
  ICD_03_META,
  ICD_04_META,
} from '../icd/index.js';

// ============================================================================
// validateICD()
// ============================================================================

describe('validateICD', () => {
  it('returns valid for ICD-01 with well-formed meta and schemas', () => {
    const result = validateICD(ICD_01_META, ICD_01_SCHEMAS);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid for ICD-02 with well-formed meta and schemas', () => {
    const result = validateICD(ICD_02_META, ICD_02_SCHEMAS);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid for ICD-03 with well-formed meta and schemas', () => {
    const result = validateICD(ICD_03_META, ICD_03_SCHEMAS);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid for ICD-04 with well-formed meta and schemas', () => {
    const result = validateICD(ICD_04_META, ICD_04_SCHEMAS);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports error when event_types do not match schema keys', () => {
    const badMeta = {
      id: 'ICD-BAD',
      name: 'Bad Interface',
      parties: ['MC-1', 'ME-1'] as const,
      event_types: ['MISSING_EVENT'] as const,
    };
    const result = validateICD(badMeta, ICD_01_SCHEMAS);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.message.includes('MISSING_EVENT'))).toBe(true);
  });

  it('reports error when parties is empty', () => {
    const badMeta = {
      id: 'ICD-EMPTY',
      name: 'Empty Parties',
      parties: [] as const,
      event_types: ['TELEMETRY_UPDATE'] as const,
    };
    const result = validateICD(badMeta, { TELEMETRY_UPDATE: ICD_01_SCHEMAS.TELEMETRY_UPDATE });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.toLowerCase().includes('parties'))).toBe(true);
  });

  it('validates that each schema has safeParse method', () => {
    const badSchemas = { BAD_EVENT: { notASchema: true } } as any;
    const meta = {
      id: 'ICD-NO-SCHEMA',
      name: 'No Schema',
      parties: ['MC-1'] as const,
      event_types: ['BAD_EVENT'] as const,
    };
    const result = validateICD(meta, badSchemas);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('safeParse'))).toBe(true);
  });
});

// ============================================================================
// crossReferenceCheck()
// ============================================================================

describe('crossReferenceCheck', () => {
  it('returns valid when all ICDs are consistent with agent registry and routing table', () => {
    const result = crossReferenceCheck(ALL_ICD_META, ALL_ICD_SCHEMAS);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports warnings for expected cross-cutting orphaned events', () => {
    const result = crossReferenceCheck(ALL_ICD_META, ALL_ICD_SCHEMAS);
    // RESOURCE_LOCK_REQ, RESOURCE_LOCK_ACK, SKILL_REQUEST, DIVIDEND_CALC_REQ are in routing table but not in ICDs
    expect(result.warnings.length).toBeGreaterThan(0);
    const warningMessages = result.warnings.map((w) => w.message).join(' ');
    expect(warningMessages).toContain('RESOURCE_LOCK_REQ');
    expect(warningMessages).toContain('SKILL_REQUEST');
  });

  it('detects when an ICD references a party not in any component', () => {
    const badMeta = [{
      id: 'ICD-BAD',
      name: 'Bad Party',
      parties: ['UNKNOWN-99'] as const,
      event_types: ['FAKE_EVENT'] as const,
    }];
    const badSchemas = { FAKE_EVENT: ICD_01_SCHEMAS.TELEMETRY_UPDATE };
    const result = crossReferenceCheck(badMeta, badSchemas);
    expect(result.errors.some((e) => e.message.includes('UNKNOWN-99'))).toBe(true);
  });

  it('detects when an event type has no routing table entry (as warning)', () => {
    const badMeta = [{
      id: 'ICD-NOROUTE',
      name: 'No Route',
      parties: ['MC-1', 'ME-1'] as const,
      event_types: ['NONEXISTENT_EVENT'] as const,
    }];
    const badSchemas = { NONEXISTENT_EVENT: ICD_01_SCHEMAS.TELEMETRY_UPDATE };
    const result = crossReferenceCheck(badMeta, badSchemas);
    expect(result.warnings.some((w) => w.message.includes('NONEXISTENT_EVENT'))).toBe(true);
  });

  it('verifies all ICD parties map to valid components', () => {
    const result = crossReferenceCheck(ALL_ICD_META, ALL_ICD_SCHEMAS);
    // All real ICDs use MC-1, ME-1, CE-1, GL-1 -- should have no party errors
    const partyErrors = result.errors.filter((e) => e.message.includes('party'));
    expect(partyErrors).toHaveLength(0);
  });
});

// ============================================================================
// validateAllICDs()
// ============================================================================

describe('validateAllICDs', () => {
  it('returns aggregate result with per-ICD validation and cross-reference', () => {
    const result = validateAllICDs();
    expect(result).toHaveProperty('icd_results');
    expect(result).toHaveProperty('cross_reference');
    expect(result).toHaveProperty('total_event_types');
    expect(result).toHaveProperty('total_errors');
    expect(result).toHaveProperty('total_warnings');
  });

  it('returns valid when all ICDs pass both checks', () => {
    const result = validateAllICDs();
    expect(result.valid).toBe(true);
    expect(result.total_errors).toBe(0);
  });

  it('reports correct total event types count', () => {
    const result = validateAllICDs();
    // ICD-01: 5, ICD-02: 1, ICD-03: 2, ICD-04: 2 = 10 total
    expect(result.total_event_types).toBe(10);
  });

  it('has warnings for cross-cutting orphaned events', () => {
    const result = validateAllICDs();
    expect(result.total_warnings).toBeGreaterThan(0);
  });

  it('has per-ICD results for all 4 ICDs', () => {
    const result = validateAllICDs();
    expect(Object.keys(result.icd_results)).toHaveLength(4);
    expect(result.icd_results).toHaveProperty('ICD-01');
    expect(result.icd_results).toHaveProperty('ICD-02');
    expect(result.icd_results).toHaveProperty('ICD-03');
    expect(result.icd_results).toHaveProperty('ICD-04');
  });
});

// ============================================================================
// Barrel index exports
// ============================================================================

describe('ALL_ICD_META', () => {
  it('exports array of all 4 ICD metadata objects', () => {
    expect(ALL_ICD_META).toHaveLength(4);
    const ids = ALL_ICD_META.map((m) => m.id);
    expect(ids).toContain('ICD-01');
    expect(ids).toContain('ICD-02');
    expect(ids).toContain('ICD-03');
    expect(ids).toContain('ICD-04');
  });
});

describe('ALL_ICD_SCHEMAS', () => {
  it('combines all ICD schema mappings', () => {
    // 5 + 1 + 2 + 2 = 10 event types
    expect(Object.keys(ALL_ICD_SCHEMAS)).toHaveLength(10);
    expect(ALL_ICD_SCHEMAS).toHaveProperty('TELEMETRY_UPDATE');
    expect(ALL_ICD_SCHEMAS).toHaveProperty('LEDGER_ENTRY');
    expect(ALL_ICD_SCHEMAS).toHaveProperty('GOVERNANCE_QUERY');
    expect(ALL_ICD_SCHEMAS).toHaveProperty('GOVERNANCE_RESPONSE');
    expect(ALL_ICD_SCHEMAS).toHaveProperty('LEDGER_READ');
    expect(ALL_ICD_SCHEMAS).toHaveProperty('DISPUTE_RECORD');
  });

  it('each entry has safeParse method', () => {
    for (const schema of Object.values(ALL_ICD_SCHEMAS)) {
      expect(typeof schema.safeParse).toBe('function');
    }
  });
});
