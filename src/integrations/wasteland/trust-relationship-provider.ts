/**
 * Trust Relationship Data Provider — DoltHub-backed storage for
 * interpersonal trust connections and character sheets.
 *
 * Privacy invariant: The social graph is NEVER public. These tables
 * store encrypted/hashed relationship data per-instance. The DoltHub
 * commons repo does NOT contain relationship rows — only the schema.
 * Each clone stores its own relationships locally.
 *
 * Schema design:
 *   trust_contracts — time-bound wrappers (TTL, type, expiry)
 *   trust_relationships — bilateral connections between rigs
 *   character_sheets — explicit consent layer (what a rig shares)
 *
 * Follows the EscalationDataProvider pattern from trust-escalation.ts.
 *
 * @module trust-relationship-provider
 */

import { sqlEscape } from './sql-escape.js';
import { assertUTC } from './utc.js';
import { RIGS_DDL } from './trust-escalation.js';
import type { DoltClient } from './dolthub-client.js';
import type {
  TrustVector,
  TrustContractType,
  TrustContract,
  TrustRelationship,
  CharacterSheet,
} from './trust-relationship.js';
import {
  computeVector,
  isContractActive,
  aggregateTrustStrength,
} from './trust-relationship.js';

// ============================================================================
// Schema DDL
// ============================================================================

/**
 * SQL DDL for the trust_contracts table.
 *
 * Stores time-bound contract wrappers. The contract governs duration;
 * the relationship stores the trust vectors.
 */
export const TRUST_CONTRACTS_DDL = `
CREATE TABLE IF NOT EXISTS trust_contracts (
  id            VARCHAR(48) PRIMARY KEY,
  type          VARCHAR(16) NOT NULL,
  ttl_seconds   INT DEFAULT NULL,
  created_at    DATETIME NOT NULL,
  expires_at    DATETIME DEFAULT NULL,
  auto_renew    BOOLEAN NOT NULL DEFAULT FALSE,
  renewal_count INT NOT NULL DEFAULT 0
);`.trim();

/**
 * SQL DDL for the trust_relationships table.
 *
 * Each row is one directional relationship pair with asymmetric vectors.
 * The visibility column controls who can query it — enforced at the
 * application layer, not the database layer (privacy by design).
 *
 * IMPORTANT: This table lives in the LOCAL clone only. It is never
 * pushed to the DoltHub commons upstream. The schema can be shared;
 * the data cannot.
 */
export const TRUST_RELATIONSHIPS_DDL = `
CREATE TABLE IF NOT EXISTS trust_relationships (
  contract_id     VARCHAR(48) NOT NULL,
  from_handle     VARCHAR(64) NOT NULL,
  to_handle       VARCHAR(64) NOT NULL,
  from_time       FLOAT NOT NULL,
  from_depth      FLOAT NOT NULL,
  to_time         FLOAT NOT NULL,
  to_depth        FLOAT NOT NULL,
  from_label      VARCHAR(128) DEFAULT NULL,
  to_label        VARCHAR(128) DEFAULT NULL,
  visibility      VARCHAR(8) NOT NULL DEFAULT 'private',
  PRIMARY KEY (contract_id),
  INDEX idx_from (from_handle),
  INDEX idx_to (to_handle),
  CONSTRAINT chk_visibility CHECK (visibility IN ('private', 'mutual'))
);`.trim();

/**
 * SQL DDL for the character_sheets table.
 *
 * Stores what a rig chooses to share — the consent layer. One row per
 * rig. customFields and visibleSkills are stored as JSON.
 */
export const CHARACTER_SHEETS_DDL = `
CREATE TABLE IF NOT EXISTS character_sheets (
  handle                VARCHAR(64) PRIMARY KEY,
  display_name          VARCHAR(128) NOT NULL,
  icon                  VARCHAR(32) DEFAULT NULL,
  bio                   TEXT DEFAULT NULL,
  home_camp             VARCHAR(64) DEFAULT NULL,
  reputation_visibility VARCHAR(8) NOT NULL DEFAULT 'summary',
  visible_skills        JSON NOT NULL DEFAULT '[]',
  custom_fields         JSON NOT NULL DEFAULT '{}',
  updated_at            DATETIME NOT NULL,
  CONSTRAINT chk_rep_vis CHECK (reputation_visibility IN ('full', 'summary', 'minimal'))
);`.trim();

/**
 * Return all three DDL statements as a single script.
 */
export function generateSchemaDDL(): string {
  return [
    '-- Trust System Schema (local-only — never push to upstream)',
    '',
    '-- Rigs table (anchor — participant identity)',
    '',
    RIGS_DDL,
    '',
    TRUST_CONTRACTS_DDL,
    '',
    TRUST_RELATIONSHIPS_DDL,
    '',
    CHARACTER_SHEETS_DDL,
  ].join('\n');
}

// ============================================================================
// Data Provider Interface
// ============================================================================

/** Data provider for trust relationships (dependency injection). */
export interface TrustRelationshipDataProvider {
  /** Store a trust relationship (contract + vectors). */
  saveRelationship(rel: TrustRelationship): Promise<void>;

  /** Remove a trust relationship by contract ID. */
  removeRelationship(contractId: string): Promise<void>;

  /** Get all relationships for a rig (both directions). */
  getRelationshipsForRig(handle: string): Promise<TrustRelationship[]>;

  /** Get all relationships between two specific rigs. */
  getRelationshipsBetween(handleA: string, handleB: string): Promise<TrustRelationship[]>;

  /** Save or update a character sheet. */
  saveCharacterSheet(sheet: CharacterSheet): Promise<void>;

  /** Get a character sheet by handle. Returns null if none exists. */
  getCharacterSheet(handle: string): Promise<CharacterSheet | null>;

  /**
   * Compute the aggregate interpersonal trust strength for a rig.
   * This is the average magnitude of active trust vectors pointing
   * toward this rig — suitable for feeding into escalation context.
   */
  getAggregateTrustStrength(handle: string): Promise<number>;
}

// ============================================================================
// Row-to-Domain Mappers
// ============================================================================

/** Parse a relationship row from DoltHub into domain objects. */
function rowToRelationship(
  contractRow: Record<string, string>,
  relRow: Record<string, string>,
): TrustRelationship {
  const fromVector = computeVector(
    parseFloat(relRow.from_time ?? '0'),
    parseFloat(relRow.from_depth ?? '0'),
  );
  const toVector = computeVector(
    parseFloat(relRow.to_time ?? '0'),
    parseFloat(relRow.to_depth ?? '0'),
  );

  const contract: TrustContract = {
    id: contractRow.id,
    type: contractRow.type as TrustContractType,
    ttl: contractRow.ttl_seconds ? parseInt(contractRow.ttl_seconds, 10) : null,
    createdAt: contractRow.created_at,
    expiresAt: contractRow.expires_at || null,
    autoRenew: contractRow.auto_renew === '1' || contractRow.auto_renew === 'true',
    renewalCount: contractRow.renewal_count ? parseInt(contractRow.renewal_count, 10) : 0,
  };

  return {
    from: relRow.from_handle,
    to: relRow.to_handle,
    fromVector,
    toVector,
    contract,
    fromLabel: relRow.from_label || null,
    toLabel: relRow.to_label || null,
    visibility: (relRow.visibility as 'private' | 'mutual') ?? 'private',
  };
}

/** Parse a character sheet row from DoltHub into domain object. */
function rowToCharacterSheet(row: Record<string, string>): CharacterSheet {
  let visibleSkills: string[] = [];
  let customFields: Record<string, string> = {};

  try {
    visibleSkills = JSON.parse(row.visible_skills ?? '[]');
  } catch { /* default to empty */ }

  try {
    customFields = JSON.parse(row.custom_fields ?? '{}');
  } catch { /* default to empty */ }

  return {
    handle: row.handle,
    displayName: row.display_name,
    icon: row.icon || null,
    bio: row.bio || null,
    homeCamp: row.home_camp || null,
    reputationVisibility: (row.reputation_visibility as 'full' | 'summary' | 'minimal') ?? 'summary',
    visibleSkills,
    customFields,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// DoltHub-backed Provider
// ============================================================================

/**
 * Create a TrustRelationshipDataProvider backed by a DoltClient.
 *
 * All queries use the client's generateSQL() for SEC-02 compliance.
 * All writes go through the local Dolt clone (never REST — writes
 * are local-only by design).
 */
export function createDoltHubTrustProvider(
  client: DoltClient,
): TrustRelationshipDataProvider {
  return {
    async saveRelationship(rel: TrustRelationship): Promise<void> {
      const contractSQL = client.generateSQL(
        `INSERT INTO trust_contracts (id, type, ttl_seconds, created_at, expires_at, auto_renew, renewal_count)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE type = VALUES(type), ttl_seconds = VALUES(ttl_seconds),
           expires_at = VALUES(expires_at), auto_renew = VALUES(auto_renew),
           renewal_count = VALUES(renewal_count)`,
        [
          rel.contract.id,
          rel.contract.type,
          rel.contract.ttl !== null ? String(rel.contract.ttl) : '',
          rel.contract.createdAt,
          rel.contract.expiresAt ?? '',
          rel.contract.autoRenew ? '1' : '0',
          String(rel.contract.renewalCount),
        ],
      );

      const relSQL = client.generateSQL(
        `INSERT INTO trust_relationships
           (contract_id, from_handle, to_handle, from_time, from_depth,
            to_time, to_depth, from_label, to_label, visibility)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE from_time = VALUES(from_time), from_depth = VALUES(from_depth),
           to_time = VALUES(to_time), to_depth = VALUES(to_depth),
           from_label = VALUES(from_label), to_label = VALUES(to_label),
           visibility = VALUES(visibility)`,
        [
          rel.contract.id,
          rel.from,
          rel.to,
          String(rel.fromVector.sharedTime),
          String(rel.fromVector.sharedDepth),
          String(rel.toVector.sharedTime),
          String(rel.toVector.sharedDepth),
          rel.fromLabel ?? '',
          rel.toLabel ?? '',
          rel.visibility,
        ],
      );

      await client.execute(contractSQL);
      await client.execute(relSQL);
    },

    async removeRelationship(contractId: string): Promise<void> {
      const escaped = sqlEscape(contractId);
      await client.execute(`DELETE FROM trust_relationships WHERE contract_id = '${escaped}'`);
      await client.execute(`DELETE FROM trust_contracts WHERE id = '${escaped}'`);
    },

    async getRelationshipsForRig(handle: string): Promise<TrustRelationship[]> {
      const escaped = sqlEscape(handle);
      const { rows } = await client.query(
        `SELECT r.*, c.id as c_id, c.type as c_type, c.ttl_seconds as c_ttl,
                c.created_at as c_created, c.expires_at as c_expires,
                c.auto_renew as c_auto_renew, c.renewal_count as c_renewal_count
         FROM trust_relationships r
         JOIN trust_contracts c ON r.contract_id = c.id
         WHERE r.from_handle = '${escaped}' OR r.to_handle = '${escaped}'
         ORDER BY c.created_at DESC`,
      );

      return rows.map(row => rowToRelationship(
        {
          id: row.c_id ?? row.contract_id,
          type: row.c_type,
          ttl_seconds: row.c_ttl,
          created_at: row.c_created,
          expires_at: row.c_expires,
          auto_renew: row.c_auto_renew,
          renewal_count: row.c_renewal_count,
        },
        row,
      ));
    },

    async getRelationshipsBetween(handleA: string, handleB: string): Promise<TrustRelationship[]> {
      const a = sqlEscape(handleA);
      const b = sqlEscape(handleB);
      const { rows } = await client.query(
        `SELECT r.*, c.id as c_id, c.type as c_type, c.ttl_seconds as c_ttl,
                c.created_at as c_created, c.expires_at as c_expires,
                c.auto_renew as c_auto_renew, c.renewal_count as c_renewal_count
         FROM trust_relationships r
         JOIN trust_contracts c ON r.contract_id = c.id
         WHERE (r.from_handle = '${a}' AND r.to_handle = '${b}')
            OR (r.from_handle = '${b}' AND r.to_handle = '${a}')
         ORDER BY c.created_at DESC`,
      );

      return rows.map(row => rowToRelationship(
        {
          id: row.c_id ?? row.contract_id,
          type: row.c_type,
          ttl_seconds: row.c_ttl,
          created_at: row.c_created,
          expires_at: row.c_expires,
          auto_renew: row.c_auto_renew,
          renewal_count: row.c_renewal_count,
        },
        row,
      ));
    },

    async saveCharacterSheet(sheet: CharacterSheet): Promise<void> {
      assertUTC(sheet.updatedAt, 'character_sheets.updated_at');
      const sql = client.generateSQL(
        `INSERT INTO character_sheets
           (handle, display_name, icon, bio, home_camp,
            reputation_visibility, visible_skills, custom_fields, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE display_name = VALUES(display_name),
           icon = VALUES(icon), bio = VALUES(bio), home_camp = VALUES(home_camp),
           reputation_visibility = VALUES(reputation_visibility),
           visible_skills = VALUES(visible_skills), custom_fields = VALUES(custom_fields),
           updated_at = VALUES(updated_at)`,
        [
          sheet.handle,
          sheet.displayName,
          sheet.icon ?? '',
          sheet.bio ?? '',
          sheet.homeCamp ?? '',
          sheet.reputationVisibility,
          JSON.stringify(sheet.visibleSkills),
          JSON.stringify(sheet.customFields),
          sheet.updatedAt,
        ],
      );
      await client.execute(sql);
    },

    async getCharacterSheet(handle: string): Promise<CharacterSheet | null> {
      const escaped = sqlEscape(handle);
      const { rows } = await client.query(
        `SELECT * FROM character_sheets WHERE handle = '${escaped}'`,
      );
      if (rows.length === 0) return null;
      return rowToCharacterSheet(rows[0]);
    },

    async getAggregateTrustStrength(handle: string): Promise<number> {
      const rels = await this.getRelationshipsForRig(handle);
      const now = new Date();
      const active = rels.filter(r => isContractActive(r.contract, now));
      return aggregateTrustStrength(handle, active, now);
    },
  };
}

// ============================================================================
// Escalation Bridge
// ============================================================================

/**
 * Compute an interpersonal trust bonus for the escalation engine.
 *
 * A rig with many deep, mutual relationships is demonstrating real
 * community participation. This bonus can be added as additional
 * evidence when evaluating Sapling → Old Growth escalation.
 *
 * Returns a score from 0 to 1:
 *   0.0 — no interpersonal trust connections
 *   0.5 — moderate connections (some relationships, decent magnitude)
 *   1.0 — deeply embedded in the community web (many strong mutual ties)
 *
 * The score considers:
 *   - aggregate trust strength (how much others trust this rig)
 *   - number of unique active connections
 *   - average harmony (how mutual the trust is)
 */
export function computeEscalationBonus(
  aggregateStrength: number,
  activeConnectionCount: number,
  averageHarmony: number,
): number {
  if (activeConnectionCount === 0) return 0;

  // Strength component: aggregate trust magnitude (already 0–1)
  const strengthScore = Math.min(1, aggregateStrength);

  // Breadth component: diminishing returns on connection count
  // 1 connection = 0.2, 3 = 0.5, 5 = 0.67, 10 = 0.83
  const breadthScore = 1 - (1 / (1 + activeConnectionCount * 0.25));

  // Mutuality component: average harmony (already 0–1)
  const mutualityScore = Math.min(1, averageHarmony);

  // Weighted combination: strength matters most, breadth second, mutuality third
  return (strengthScore * 0.5) + (breadthScore * 0.3) + (mutualityScore * 0.2);
}

// ============================================================================
// SQL Generation Utilities
// ============================================================================

/**
 * Generate an INSERT SQL statement for a trust relationship.
 * Useful for generating migration scripts or audit trails.
 */
export function relationshipToSQL(rel: TrustRelationship): string {
  const c = rel.contract;
  const lines: string[] = [
    `-- Trust: ${rel.from} ↔ ${rel.to} (${c.type}${c.autoRenew ? ', auto-renew' : ''})`,
    `INSERT INTO trust_contracts (id, type, ttl_seconds, created_at, expires_at, auto_renew, renewal_count)`,
    `VALUES ('${sqlEscape(c.id)}', '${sqlEscape(c.type)}', ${c.ttl !== null ? c.ttl : 'NULL'}, '${sqlEscape(c.createdAt)}', ${c.expiresAt ? `'${sqlEscape(c.expiresAt)}'` : 'NULL'}, ${c.autoRenew ? 1 : 0}, ${c.renewalCount});`,
    '',
    `INSERT INTO trust_relationships (contract_id, from_handle, to_handle, from_time, from_depth, to_time, to_depth, from_label, to_label, visibility)`,
    `VALUES ('${sqlEscape(c.id)}', '${sqlEscape(rel.from)}', '${sqlEscape(rel.to)}', ${rel.fromVector.sharedTime}, ${rel.fromVector.sharedDepth}, ${rel.toVector.sharedTime}, ${rel.toVector.sharedDepth}, ${rel.fromLabel ? `'${sqlEscape(rel.fromLabel)}'` : 'NULL'}, ${rel.toLabel ? `'${sqlEscape(rel.toLabel)}'` : 'NULL'}, '${sqlEscape(rel.visibility)}');`,
  ];
  return lines.join('\n');
}

/**
 * Generate an INSERT SQL statement for a character sheet.
 */
export function characterSheetToSQL(sheet: CharacterSheet): string {
  const lines: string[] = [
    `-- Character sheet: ${sheet.handle} (${sheet.displayName})`,
    `INSERT INTO character_sheets (handle, display_name, icon, bio, home_camp, reputation_visibility, visible_skills, custom_fields, updated_at)`,
    `VALUES ('${sqlEscape(sheet.handle)}', '${sqlEscape(sheet.displayName)}', ${sheet.icon ? `'${sqlEscape(sheet.icon)}'` : 'NULL'}, ${sheet.bio ? `'${sqlEscape(sheet.bio)}'` : 'NULL'}, ${sheet.homeCamp ? `'${sqlEscape(sheet.homeCamp)}'` : 'NULL'}, '${sqlEscape(sheet.reputationVisibility)}', '${sqlEscape(JSON.stringify(sheet.visibleSkills))}', '${sqlEscape(JSON.stringify(sheet.customFields))}', '${sqlEscape(sheet.updatedAt)}');`,
  ];
  return lines.join('\n');
}
