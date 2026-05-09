/**
 * SCRIBE Build-Out v1.49.621 — Component 09 substrate-conformance test.
 *
 * Parses the migration SQL CHECK constraints on prov_node.node_type and
 * prov_edge.relation; diffs the extracted literals against the TS unions
 * exported from src/scribe/types/prov.ts (NODE_TYPES, PROV_RELATIONS).
 *
 * The SQL is the source-of-truth — if SQL CHECK changes, the TS unions
 * MUST be updated in the same commit. This test fires the alarm.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { NODE_TYPES, PROV_RELATIONS } from '../../../types/prov.js';

const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..', '..');
const MIGRATION_SQL = resolve(
  REPO_ROOT,
  'examples/cartridges/retrieval-provenance/migrations/001-init.postgres.sql',
);

/** Extract a SQL CHECK literal list of the form `IN ('a','b',...)` for the
 * given column name. Tolerates inline `--` comments and multi-line layout. */
function extractCheckLiterals(sql: string, column: string): string[] {
  // Find the column declaration block ending at NULL,/CHECK,/comma boundary.
  // Strategy: locate "<column>" then find the next "CHECK (...)" parenthetical.
  const colIdx = sql.indexOf(column);
  if (colIdx === -1) {
    throw new Error(`column ${column} not found in migration SQL`);
  }
  const slice = sql.slice(colIdx);
  // Match CHECK (relation IN ( ... )) — the inner parens may contain
  // arbitrary newlines + comments + literals.
  const match = slice.match(/CHECK\s*\([^)]*IN\s*\(([\s\S]*?)\)\s*\)/);
  if (!match) {
    throw new Error(`no CHECK ... IN (...) clause found near column ${column}`);
  }
  const inner = match[1];
  // Strip SQL line comments (`-- ...`) before tokenising.
  const stripped = inner.replace(/--[^\n]*/g, '');
  // Extract single-quoted string literals.
  const literals: string[] = [];
  const literalRe = /'([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = literalRe.exec(stripped)) !== null) {
    literals.push(m[1]);
  }
  return literals;
}

describe('substrate-conformance: prov closed-set parity (SQL ↔ TS)', () => {
  const sql = readFileSync(MIGRATION_SQL, 'utf8');

  it('node_type SQL CHECK literals match NODE_TYPES exactly (set equality)', () => {
    const sqlLiterals = extractCheckLiterals(sql, 'node_type');
    const sqlSet = new Set(sqlLiterals);
    const tsSet = new Set(NODE_TYPES);

    // Set equality both directions.
    for (const v of sqlSet) {
      expect(tsSet.has(v as typeof NODE_TYPES[number])).toBe(true);
    }
    for (const v of tsSet) {
      expect(sqlSet.has(v)).toBe(true);
    }
    expect(sqlLiterals.length).toBe(NODE_TYPES.length);
  });

  it('relation SQL CHECK literals match PROV_RELATIONS exactly (set equality)', () => {
    const sqlLiterals = extractCheckLiterals(sql, 'relation');
    const sqlSet = new Set(sqlLiterals);
    const tsSet = new Set(PROV_RELATIONS);

    for (const v of sqlSet) {
      expect(tsSet.has(v as typeof PROV_RELATIONS[number])).toBe(true);
    }
    for (const v of tsSet) {
      expect(sqlSet.has(v)).toBe(true);
    }
    expect(sqlLiterals.length).toBe(PROV_RELATIONS.length);
  });

  it('NODE_TYPES contains the 6 PROV-O classes (snapshot-style)', () => {
    expect([...NODE_TYPES].sort()).toEqual(
      ['Activity', 'Agent', 'Bundle', 'Collection', 'Entity', 'Plan'].sort(),
    );
  });

  it('PROV_RELATIONS contains exactly 15 entries (7 PROV-O starting-point + 8 extended)', () => {
    // Substrate decision §6.2: 7 PROV-O starting-point properties
    // (wasGeneratedBy, used, wasInformedBy, wasDerivedFrom,
    // wasAttributedTo, wasAssociatedWith, actedOnBehalfOf) +
    // 8 PROV-O extended properties used by SCRIBE
    // (wasInfluencedBy, hadMember, wasRevisionOf, wasQuotationFrom,
    // specializationOf, alternateOf, hadPlan, hadActivity).
    expect(PROV_RELATIONS.length).toBe(15);
  });
});
