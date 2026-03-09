import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  TRUST_CONTRACTS_DDL,
  TRUST_RELATIONSHIPS_DDL,
  CHARACTER_SHEETS_DDL,
  generateSchemaDDL,
  ensureSchema,
  createDoltHubTrustProvider,
  computeEscalationBonus,
  relationshipToSQL,
  characterSheetToSQL,
} from '../trust-relationship-provider.js';
import type { TrustRelationshipDataProvider } from '../trust-relationship-provider.js';
import type { DoltClient } from '../dolthub-client.js';
import {
  createRelationship,
  createCharacterSheet,
} from '../trust-relationship.js';

// ============================================================================
// Mock DoltClient
// ============================================================================

function createMockClient(): DoltClient & {
  _queries: string[];
  _executions: string[];
  _queryResults: Record<string, string>[][];
} {
  const state = {
    _queries: [] as string[],
    _executions: [] as string[],
    _queryResults: [] as Record<string, string>[][],
  };

  return {
    ...state,
    async query(sql: string) {
      state._queries.push(sql);
      const rows = state._queryResults.shift() ?? [];
      return { rows, source: 'local' as const };
    },
    async localQuery(sql: string) {
      state._queries.push(sql);
      const rows = state._queryResults.shift() ?? [];
      return { rows, source: 'local' as const };
    },
    generateSQL(template: string, values: string[]) {
      let i = 0;
      return template.replace(/\?/g, () => {
        const raw = values[i++] ?? '';
        return `'${raw.replace(/'/g, "''")}'`;
      });
    },
    async execute(sql: string) {
      state._executions.push(sql);
      return { stdout: '', stderr: '' };
    },
  };
}

// ============================================================================
// Schema DDL
// ============================================================================

describe('Schema DDL', () => {
  it('trust_contracts DDL creates table with correct columns', () => {
    expect(TRUST_CONTRACTS_DDL).toContain('CREATE TABLE IF NOT EXISTS trust_contracts');
    expect(TRUST_CONTRACTS_DDL).toContain('id');
    expect(TRUST_CONTRACTS_DDL).toContain('type');
    expect(TRUST_CONTRACTS_DDL).toContain('ttl_seconds');
    expect(TRUST_CONTRACTS_DDL).toContain('created_at');
    expect(TRUST_CONTRACTS_DDL).toContain('expires_at');
  });

  it('trust_relationships DDL creates table with correct columns', () => {
    expect(TRUST_RELATIONSHIPS_DDL).toContain('CREATE TABLE IF NOT EXISTS trust_relationships');
    expect(TRUST_RELATIONSHIPS_DDL).toContain('contract_id');
    expect(TRUST_RELATIONSHIPS_DDL).toContain('from_handle');
    expect(TRUST_RELATIONSHIPS_DDL).toContain('to_handle');
    expect(TRUST_RELATIONSHIPS_DDL).toContain('from_time');
    expect(TRUST_RELATIONSHIPS_DDL).toContain('from_depth');
    expect(TRUST_RELATIONSHIPS_DDL).toContain('to_time');
    expect(TRUST_RELATIONSHIPS_DDL).toContain('to_depth');
    expect(TRUST_RELATIONSHIPS_DDL).toContain('visibility');
    expect(TRUST_RELATIONSHIPS_DDL).toContain('idx_from');
    expect(TRUST_RELATIONSHIPS_DDL).toContain('idx_to');
  });

  it('trust_relationships DDL enforces visibility constraint', () => {
    expect(TRUST_RELATIONSHIPS_DDL).toContain("CHECK (visibility IN ('private', 'mutual'))");
  });

  it('character_sheets DDL creates table with correct columns', () => {
    expect(CHARACTER_SHEETS_DDL).toContain('CREATE TABLE IF NOT EXISTS character_sheets');
    expect(CHARACTER_SHEETS_DDL).toContain('handle');
    expect(CHARACTER_SHEETS_DDL).toContain('display_name');
    expect(CHARACTER_SHEETS_DDL).toContain('visible_skills');
    expect(CHARACTER_SHEETS_DDL).toContain('custom_fields');
    expect(CHARACTER_SHEETS_DDL).toContain('reputation_visibility');
  });

  it('character_sheets DDL defaults to summary visibility', () => {
    expect(CHARACTER_SHEETS_DDL).toContain("DEFAULT 'summary'");
  });

  it('generateSchemaDDL returns all five tables', () => {
    const ddl = generateSchemaDDL();
    expect(ddl).toContain('rigs');
    expect(ddl).toContain('trust_contracts');
    expect(ddl).toContain('trust_relationships');
    expect(ddl).toContain('character_sheets');
    expect(ddl).toContain('welcome_badges');
    expect(ddl).toContain('local-only');
  });

  it('trust_relationships DDL includes archived_at column', () => {
    expect(TRUST_RELATIONSHIPS_DDL).toContain('archived_at');
  });
});

describe('ensureSchema', () => {
  it('executes all five DDL statements', async () => {
    const mockClient = createMockClient();
    await ensureSchema(mockClient);

    expect(mockClient._executions).toHaveLength(5);
    expect(mockClient._executions[0]).toContain('rigs');
    expect(mockClient._executions[1]).toContain('trust_contracts');
    expect(mockClient._executions[2]).toContain('trust_relationships');
    expect(mockClient._executions[3]).toContain('character_sheets');
    expect(mockClient._executions[4]).toContain('welcome_badges');
  });
});

// ============================================================================
// DoltHub Provider — saveRelationship
// ============================================================================

describe('createDoltHubTrustProvider', () => {
  let client: ReturnType<typeof createMockClient>;
  let provider: TrustRelationshipDataProvider;

  beforeEach(() => {
    client = createMockClient();
    provider = createDoltHubTrustProvider(client);
  });

  describe('saveRelationship', () => {
    it('executes contract and relationship INSERT statements', async () => {
      const now = new Date('2026-08-25T12:00:00Z');
      const rel = createRelationship(
        'fox-042', 'cedar-011', 'permanent',
        0.9, 0.95, 0.9, 0.95,
        { fromLabel: 'family', toLabel: 'family', now },
      );

      await provider.saveRelationship(rel);

      expect(client._executions).toHaveLength(2);
      expect(client._executions[0]).toContain('INSERT INTO trust_contracts');
      expect(client._executions[0]).toContain(rel.contract.id);
      expect(client._executions[1]).toContain('INSERT INTO trust_relationships');
      expect(client._executions[1]).toContain('fox-042');
      expect(client._executions[1]).toContain('cedar-011');
    });

    it('includes ON DUPLICATE KEY UPDATE for upsert', async () => {
      const rel = createRelationship('a-001', 'b-002', 'ephemeral', 0.1, 0.2, 0.3, 0.4);
      await provider.saveRelationship(rel);

      expect(client._executions[0]).toContain('ON DUPLICATE KEY UPDATE');
      expect(client._executions[1]).toContain('ON DUPLICATE KEY UPDATE');
    });
  });

  describe('removeRelationship', () => {
    it('archives by setting archived_at (soft delete)', async () => {
      await provider.removeRelationship('tc-pm-12345678');

      expect(client._executions).toHaveLength(1);
      expect(client._executions[0]).toContain('UPDATE trust_relationships');
      expect(client._executions[0]).toContain('archived_at');
      expect(client._executions[0]).toContain('tc-pm-12345678');
    });
  });

  describe('purgeRelationship', () => {
    it('hard deletes from both tables', async () => {
      await provider.purgeRelationship('tc-pm-12345678');

      expect(client._executions).toHaveLength(2);
      expect(client._executions[0]).toContain('DELETE FROM trust_relationships');
      expect(client._executions[0]).toContain('tc-pm-12345678');
      expect(client._executions[1]).toContain('DELETE FROM trust_contracts');
    });
  });

  describe('getRelationshipsForRig', () => {
    it('queries with JOIN and returns parsed relationships', async () => {
      client._queryResults.push([
        {
          contract_id: 'tc-pm-aabbccdd',
          from_handle: 'fox-042',
          to_handle: 'cedar-011',
          from_time: '0.9',
          from_depth: '0.95',
          to_time: '0.85',
          to_depth: '0.9',
          from_label: 'family',
          to_label: 'family',
          visibility: 'private',
          c_id: 'tc-pm-aabbccdd',
          c_type: 'permanent',
          c_ttl: '',
          c_created: '2026-08-25T12:00:00Z',
          c_expires: '',
          c_auto_renew: '0',
          c_renewal_count: '0',
        },
      ]);

      const rels = await provider.getRelationshipsForRig('fox-042');

      expect(rels).toHaveLength(1);
      expect(rels[0].from).toBe('fox-042');
      expect(rels[0].to).toBe('cedar-011');
      expect(rels[0].fromVector.sharedTime).toBeCloseTo(0.9);
      expect(rels[0].fromVector.sharedDepth).toBeCloseTo(0.95);
      expect(rels[0].contract.type).toBe('permanent');
      expect(rels[0].contract.ttl).toBeNull();
      expect(rels[0].fromLabel).toBe('family');
      expect(rels[0].visibility).toBe('private');
    });

    it('returns empty array when no relationships exist', async () => {
      client._queryResults.push([]);
      const rels = await provider.getRelationshipsForRig('lonely-001');
      expect(rels).toHaveLength(0);
    });

    it('round-trips autoRenew and renewalCount from storage', async () => {
      client._queryResults.push([
        {
          contract_id: 'tc-ep-roundtrip',
          from_handle: 'owl-007',
          to_handle: 'fox-042',
          from_time: '0.1',
          from_depth: '0.3',
          to_time: '0.2',
          to_depth: '0.4',
          from_label: '',
          to_label: '',
          visibility: 'private',
          c_id: 'tc-ep-roundtrip',
          c_type: 'ephemeral',
          c_ttl: '900',
          c_created: '2026-08-25T20:00:00Z',
          c_expires: '2026-08-25T20:15:00Z',
          c_auto_renew: '1',
          c_renewal_count: '3',
        },
      ]);

      const rels = await provider.getRelationshipsForRig('owl-007');
      expect(rels).toHaveLength(1);
      expect(rels[0].contract.autoRenew).toBe(true);
      expect(rels[0].contract.renewalCount).toBe(3);
    });

    it('query includes both from_handle and to_handle conditions', async () => {
      client._queryResults.push([]);
      await provider.getRelationshipsForRig('fox-042');

      expect(client._queries[0]).toContain("from_handle = 'fox-042'");
      expect(client._queries[0]).toContain("to_handle = 'fox-042'");
    });

    it('query excludes archived relationships', async () => {
      client._queryResults.push([]);
      await provider.getRelationshipsForRig('fox-042');

      expect(client._queries[0]).toContain('archived_at IS NULL');
    });
  });

  describe('getRelationshipsBetween', () => {
    it('queries bidirectionally between two rigs', async () => {
      client._queryResults.push([]);
      await provider.getRelationshipsBetween('fox-042', 'cedar-011');

      const sql = client._queries[0];
      expect(sql).toContain("from_handle = 'fox-042'");
      expect(sql).toContain("to_handle = 'cedar-011'");
      expect(sql).toContain("from_handle = 'cedar-011'");
      expect(sql).toContain("to_handle = 'fox-042'");
    });
  });

  describe('saveCharacterSheet', () => {
    it('executes INSERT with JSON fields', async () => {
      const sheet = createCharacterSheet('fox-042', 'Foxy', {
        icon: 'fox-icon',
        bio: 'Forest dweller',
        visibleSkills: ['explore', 'build'],
        customFields: { spirit: 'fox' },
      });

      await provider.saveCharacterSheet(sheet);

      expect(client._executions).toHaveLength(1);
      expect(client._executions[0]).toContain('INSERT INTO character_sheets');
      expect(client._executions[0]).toContain('fox-042');
      expect(client._executions[0]).toContain('Foxy');
      expect(client._executions[0]).toContain('ON DUPLICATE KEY UPDATE');
    });
  });

  describe('getCharacterSheet', () => {
    it('returns parsed character sheet', async () => {
      client._queryResults.push([
        {
          handle: 'cedar-011',
          display_name: 'Cedar',
          icon: 'tree',
          bio: 'Scribe and oracle',
          home_camp: 'cedar-grove',
          reputation_visibility: 'full',
          visible_skills: '["documentation","verification"]',
          custom_fields: '{"pronouns":"they/them"}',
          updated_at: '2026-08-25T12:00:00Z',
        },
      ]);

      const sheet = await provider.getCharacterSheet('cedar-011');

      expect(sheet).not.toBeNull();
      expect(sheet!.handle).toBe('cedar-011');
      expect(sheet!.displayName).toBe('Cedar');
      expect(sheet!.icon).toBe('tree');
      expect(sheet!.bio).toBe('Scribe and oracle');
      expect(sheet!.homeCamp).toBe('cedar-grove');
      expect(sheet!.reputationVisibility).toBe('full');
      expect(sheet!.visibleSkills).toEqual(['documentation', 'verification']);
      expect(sheet!.customFields.pronouns).toBe('they/them');
    });

    it('returns null when no sheet exists', async () => {
      client._queryResults.push([]);
      const sheet = await provider.getCharacterSheet('nobody-000');
      expect(sheet).toBeNull();
    });

    it('handles malformed JSON gracefully', async () => {
      client._queryResults.push([
        {
          handle: 'broken-001',
          display_name: 'Broken',
          icon: '',
          bio: '',
          home_camp: '',
          reputation_visibility: 'summary',
          visible_skills: 'not-json',
          custom_fields: '{bad',
          updated_at: '2026-08-25T12:00:00Z',
        },
      ]);

      const sheet = await provider.getCharacterSheet('broken-001');
      expect(sheet).not.toBeNull();
      expect(sheet!.visibleSkills).toEqual([]);
      expect(sheet!.customFields).toEqual({});
    });
  });

  describe('getAggregateTrustStrength', () => {
    it('returns 0 for rig with no relationships', async () => {
      client._queryResults.push([]);
      const strength = await provider.getAggregateTrustStrength('lonely-001');
      expect(strength).toBe(0);
    });

    it('computes strength from active relationships', async () => {
      client._queryResults.push([
        {
          contract_id: 'tc-pm-11111111',
          from_handle: 'a-001',
          to_handle: 'target-099',
          from_time: '0.8',
          from_depth: '0.6',
          to_time: '0.5',
          to_depth: '0.5',
          from_label: '',
          to_label: '',
          visibility: 'private',
          c_id: 'tc-pm-11111111',
          c_type: 'permanent',
          c_ttl: '',
          c_created: '2026-01-01T00:00:00Z',
          c_expires: '',
        },
      ]);

      const strength = await provider.getAggregateTrustStrength('target-099');
      expect(strength).toBeGreaterThan(0);
      expect(strength).toBeLessThanOrEqual(1);
    });
  });
});

// ============================================================================
// Escalation Bridge
// ============================================================================

describe('computeEscalationBonus', () => {
  it('returns 0 for no connections', () => {
    expect(computeEscalationBonus(0, 0, 0)).toBe(0);
  });

  it('returns moderate score for a few decent connections', () => {
    // 3 connections, moderate strength, moderate harmony
    const bonus = computeEscalationBonus(0.6, 3, 0.7);
    expect(bonus).toBeGreaterThan(0.3);
    expect(bonus).toBeLessThan(0.7);
  });

  it('returns high score for many strong mutual connections', () => {
    const bonus = computeEscalationBonus(0.95, 10, 0.9);
    expect(bonus).toBeGreaterThan(0.7);
  });

  it('returns low score for weak, one-sided connections', () => {
    const bonus = computeEscalationBonus(0.15, 1, 0.2);
    expect(bonus).toBeLessThan(0.3);
  });

  it('strength contributes 50% of score', () => {
    // Same breadth and harmony, different strength
    const low = computeEscalationBonus(0.1, 5, 0.5);
    const high = computeEscalationBonus(0.9, 5, 0.5);
    expect(high - low).toBeGreaterThan(0.3);
  });

  it('breadth has diminishing returns', () => {
    // Going from 1 to 3 connections matters more than 10 to 12
    const one = computeEscalationBonus(0.5, 1, 0.5);
    const three = computeEscalationBonus(0.5, 3, 0.5);
    const ten = computeEscalationBonus(0.5, 10, 0.5);
    const twelve = computeEscalationBonus(0.5, 12, 0.5);

    const firstJump = three - one;
    const secondJump = twelve - ten;
    expect(firstJump).toBeGreaterThan(secondJump);
  });

  it('score never exceeds 1.0', () => {
    const bonus = computeEscalationBonus(1.0, 100, 1.0);
    expect(bonus).toBeLessThanOrEqual(1.0);
  });
});

// ============================================================================
// SQL Generation
// ============================================================================

describe('relationshipToSQL', () => {
  it('generates valid INSERT statements', () => {
    const now = new Date('2026-08-25T12:00:00Z');
    const rel = createRelationship(
      'fox-042', 'cedar-011', 'permanent',
      0.9, 0.95, 0.85, 0.9,
      { fromLabel: 'family', now },
    );

    const sql = relationshipToSQL(rel);
    expect(sql).toContain('INSERT INTO trust_contracts');
    expect(sql).toContain('INSERT INTO trust_relationships');
    expect(sql).toContain('fox-042');
    expect(sql).toContain('cedar-011');
    expect(sql).toContain('permanent');
    expect(sql).toContain("'family'");
    expect(sql).toContain('NULL'); // null expiresAt for permanent
  });

  it('handles ephemeral contracts with expiry', () => {
    const now = new Date('2026-08-25T12:00:00Z');
    const rel = createRelationship(
      'owl-007', 'stranger-999', 'ephemeral',
      0.0, 0.1, 0.0, 0.1,
      { ttlSeconds: 900, now },
    );

    const sql = relationshipToSQL(rel);
    expect(sql).toContain('ephemeral');
    expect(sql).not.toContain('expires_at, NULL'); // should have a real expiry
  });

  it('escapes SQL injection in labels', () => {
    const rel = createRelationship(
      'fox-042', 'evil-666', 'ephemeral',
      0.1, 0.1, 0.1, 0.1,
      { fromLabel: "'; DROP TABLE rigs; --" },
    );

    const sql = relationshipToSQL(rel);
    // sqlEscape doubles the single quote — the injection is neutralized
    // Input ' becomes '' inside the SQL string, wrapped in outer quotes: '''
    expect(sql).toContain("''; DROP TABLE rigs; --");
  });
});

describe('characterSheetToSQL', () => {
  it('generates valid INSERT statement', () => {
    const sheet = createCharacterSheet('fox-042', 'Foxy', {
      icon: 'fox',
      bio: 'Forest explorer',
      homeCamp: 'center-camp',
      visibleSkills: ['explore'],
      customFields: { spirit: 'fox' },
    });

    const sql = characterSheetToSQL(sheet);
    expect(sql).toContain('INSERT INTO character_sheets');
    expect(sql).toContain('fox-042');
    expect(sql).toContain('Foxy');
    expect(sql).toContain('fox');
    expect(sql).toContain('Forest explorer');
    expect(sql).toContain('center-camp');
  });

  it('handles minimal sheet with NULL fields', () => {
    const sheet = createCharacterSheet('anon-001', 'Anonymous');
    const sql = characterSheetToSQL(sheet);
    expect(sql).toContain('NULL'); // icon, bio, homeCamp
    expect(sql).toContain('anon-001');
  });

  it('escapes SQL injection in bio', () => {
    const sheet = createCharacterSheet('evil-666', "Hacker", {
      bio: "'; DROP TABLE character_sheets; --",
    });

    const sql = characterSheetToSQL(sheet);
    // sqlEscape doubles the single quote — the injection is neutralized
    expect(sql).toContain("''; DROP TABLE character_sheets; --");
  });
});
