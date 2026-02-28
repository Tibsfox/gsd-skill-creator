/**
 * TDD tests for commons charter schema, constitutional constraints,
 * ratification logic, and immutability enforcement.
 */

import { describe, it, expect } from 'vitest';
import {
  CharterClauseSchema,
  ConstitutionalConstraintSchema,
  CharterSchema,
  CharterVersionSchema,
  CONSTITUTIONAL_CONSTRAINT_IDS,
  COMMONS_CHARTER_YAML,
  parseCharter,
  ratifyCharter,
  isRatified,
} from '../charter.js';

// ============================================================================
// CharterClauseSchema
// ============================================================================

describe('CharterClauseSchema', () => {
  it('accepts a valid clause with all required fields', () => {
    const clause = {
      id: 'clause-001',
      title: 'Universal Basic Dividend',
      text: 'All contributors receive a base dividend regardless of contribution size.',
      explanation: 'This means every person who contributes anything gets a share, no matter how small their contribution.',
      category: 'rights',
      effective_date: '2026-01-01T00:00:00Z',
    };
    const result = CharterClauseSchema.safeParse(clause);
    expect(result.success).toBe(true);
  });

  it('rejects a clause missing explanation (human-readable requirement)', () => {
    const clause = {
      id: 'clause-002',
      title: 'Some clause',
      text: 'Legal text here.',
      category: 'obligations',
      effective_date: '2026-01-01T00:00:00Z',
    };
    const result = CharterClauseSchema.safeParse(clause);
    expect(result.success).toBe(false);
  });

  it('rejects a clause with empty text', () => {
    const clause = {
      id: 'clause-003',
      title: 'Empty text clause',
      text: '',
      explanation: 'This clause has empty text.',
      category: 'governance',
      effective_date: '2026-01-01T00:00:00Z',
    };
    const result = CharterClauseSchema.safeParse(clause);
    expect(result.success).toBe(false);
  });

  it('accepts all valid category values', () => {
    for (const category of ['rights', 'obligations', 'governance', 'constitutional'] as const) {
      const clause = {
        id: `clause-cat-${category}`,
        title: `Category ${category}`,
        text: 'Valid clause text.',
        explanation: 'Human-readable explanation.',
        category,
        effective_date: '2026-01-01T00:00:00Z',
      };
      const result = CharterClauseSchema.safeParse(clause);
      expect(result.success).toBe(true);
    }
  });
});

// ============================================================================
// ConstitutionalConstraintSchema
// ============================================================================

describe('ConstitutionalConstraintSchema', () => {
  it('accepts a valid constitutional constraint with canonical ID', () => {
    const constraint = {
      id: 'ubd-inclusion',
      clause_ref: 'clause-001',
      description: 'UBD inclusion regardless of contribution size.',
      enforceable: true,
    };
    const result = ConstitutionalConstraintSchema.safeParse(constraint);
    expect(result.success).toBe(true);
  });

  it('exports all 4 canonical constraint IDs', () => {
    expect(CONSTITUTIONAL_CONSTRAINT_IDS).toEqual([
      'ubd-inclusion',
      'no-retroactive-reduction',
      'no-privatization',
      'supermajority-dissolution',
    ]);
  });

  it('rejects an unknown constraint ID', () => {
    const constraint = {
      id: 'unknown-constraint',
      clause_ref: 'clause-001',
      description: 'Unknown constraint.',
      enforceable: true,
    };
    const result = ConstitutionalConstraintSchema.safeParse(constraint);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// CharterSchema
// ============================================================================

describe('CharterSchema', () => {
  const makeValidCharter = () => ({
    version: '1.0.0',
    title: 'Commons Charter',
    preamble: 'We the contributors...',
    clauses: [
      {
        id: 'clause-001',
        title: 'UBD Rights',
        text: 'All contributors receive base dividend.',
        explanation: 'Everyone gets a share.',
        category: 'constitutional',
        effective_date: '2026-01-01T00:00:00Z',
      },
      {
        id: 'clause-002',
        title: 'Dividend Protection',
        text: 'No retroactive reduction of dividends.',
        explanation: 'Your share cannot be reduced after the fact.',
        category: 'constitutional',
        effective_date: '2026-01-01T00:00:00Z',
      },
      {
        id: 'clause-003',
        title: 'Commons Integrity',
        text: 'Commons cannot be privatized or enclosed.',
        explanation: 'The commons stays public forever.',
        category: 'constitutional',
        effective_date: '2026-01-01T00:00:00Z',
      },
      {
        id: 'clause-004',
        title: 'Dissolution Right',
        text: 'Governance body dissolvable by supermajority.',
        explanation: 'If enough people agree, governance can be dissolved.',
        category: 'constitutional',
        effective_date: '2026-01-01T00:00:00Z',
      },
    ],
    constitutional_constraints: [
      { id: 'ubd-inclusion', clause_ref: 'clause-001', description: 'UBD inclusion', enforceable: true },
      { id: 'no-retroactive-reduction', clause_ref: 'clause-002', description: 'No retroactive reduction', enforceable: true },
      { id: 'no-privatization', clause_ref: 'clause-003', description: 'No privatization', enforceable: true },
      { id: 'supermajority-dissolution', clause_ref: 'clause-004', description: 'Supermajority dissolution', enforceable: true },
    ],
    ratified: false,
  });

  it('accepts a valid charter with all required fields', () => {
    const charter = makeValidCharter();
    const result = CharterSchema.safeParse(charter);
    expect(result.success).toBe(true);
  });

  it('rejects a charter with fewer than 4 constitutional constraints', () => {
    const charter = makeValidCharter();
    charter.constitutional_constraints = charter.constitutional_constraints.slice(0, 3);
    const result = CharterSchema.safeParse(charter);
    expect(result.success).toBe(false);
  });

  it('rejects a charter with duplicate clause IDs', () => {
    const charter = makeValidCharter();
    charter.clauses[1].id = charter.clauses[0].id; // duplicate
    const result = CharterSchema.safeParse(charter);
    expect(result.success).toBe(false);
  });

  it('validates all clause_ref in constraints reference existing clause IDs', () => {
    const charter = makeValidCharter();
    charter.constitutional_constraints[0].clause_ref = 'nonexistent-clause';
    const result = CharterSchema.safeParse(charter);
    expect(result.success).toBe(false);
  });

  it('accepts valid semver version strings', () => {
    expect(CharterVersionSchema.safeParse('1.0.0').success).toBe(true);
    expect(CharterVersionSchema.safeParse('2.3.14').success).toBe(true);
    expect(CharterVersionSchema.safeParse('not-semver').success).toBe(false);
  });
});

// ============================================================================
// COMMONS_CHARTER_YAML
// ============================================================================

describe('COMMONS_CHARTER_YAML', () => {
  it('is a string constant containing valid YAML', () => {
    expect(typeof COMMONS_CHARTER_YAML).toBe('string');
    expect(COMMONS_CHARTER_YAML.length).toBeGreaterThan(0);
  });

  it('parseCharter returns a valid CharterSchema object', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const result = CharterSchema.safeParse(charter);
    expect(result.success).toBe(true);
  });

  it('contains all 4 constitutional constraint IDs', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const constraintIds = charter.constitutional_constraints.map((c: { id: string }) => c.id);
    for (const id of CONSTITUTIONAL_CONSTRAINT_IDS) {
      expect(constraintIds).toContain(id);
    }
  });

  it('every clause has a non-empty explanation field', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    for (const clause of charter.clauses) {
      expect(clause.explanation).toBeTruthy();
      expect(clause.explanation.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// parseCharter
// ============================================================================

describe('parseCharter', () => {
  it('parses valid YAML and returns Zod-validated charter', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    expect(charter.version).toBeDefined();
    expect(charter.clauses.length).toBeGreaterThan(0);
  });

  it('throws with Zod validation error on invalid YAML content', () => {
    const invalidYaml = `
version: "1.0.0"
title: "Bad Charter"
preamble: "Missing stuff"
clauses: []
constitutional_constraints: []
ratified: false
`;
    expect(() => parseCharter(invalidYaml)).toThrow();
  });

  it('throws on malformed YAML', () => {
    expect(() => parseCharter('{{{{ not yaml ::::')).toThrow();
  });
});

// ============================================================================
// ratifyCharter / isRatified
// ============================================================================

describe('ratifyCharter / isRatified', () => {
  it('isRatified returns false for unratified charter', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    expect(isRatified(charter)).toBe(false);
  });

  it('ratifyCharter returns charter with ratified=true, ratified_at, and ratification_hash', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const ratified = ratifyCharter(charter);
    expect(ratified.ratified).toBe(true);
    expect(ratified.ratified_at).toBeDefined();
    expect(ratified.ratification_hash).toBeDefined();
    expect(typeof ratified.ratification_hash).toBe('string');
    expect(ratified.ratification_hash!.length).toBe(64); // SHA-256 hex
  });

  it('isRatified returns true for ratified charter', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const ratified = ratifyCharter(charter);
    expect(isRatified(ratified)).toBe(true);
  });

  it('ratifyCharter throws on already ratified charter', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const ratified = ratifyCharter(charter);
    expect(() => ratifyCharter(ratified)).toThrow('Charter is already ratified');
  });

  it('ratification hash is deterministic (same input produces same hash)', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    // Hash is based on JSON.stringify of pre-ratification content, which is deterministic
    const hash1 = ratifyCharter(charter).ratification_hash;
    const hash2 = ratifyCharter(charter).ratification_hash;
    expect(hash1).toBe(hash2);
  });
});
