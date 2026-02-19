/**
 * Commons Charter schema, constitutional constraint encoding,
 * ratification logic, and immutability enforcement.
 *
 * The charter is a machine-readable YAML document with human-readable
 * explanations per clause (GOVR-01). It encodes four constitutional
 * constraints that are immutable after ratification (GOVR-02):
 *
 * 1. UBD inclusion regardless of contribution size
 * 2. No retroactive dividend reduction
 * 3. Commons cannot be privatized or enclosed
 * 4. Governance body dissolvable by supermajority
 */

import { z } from 'zod';
import yaml from 'js-yaml';
import { createHash } from 'node:crypto';
import { TimestampSchema } from '../types.js';

// ============================================================================
// CharterClauseSchema
// ============================================================================

/**
 * Validates individual charter clauses.
 *
 * Each clause has both legal text and a human-readable explanation
 * in plain language (GOVR-01 requirement).
 */
export const CharterClauseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  explanation: z.string().min(1),
  category: z.enum(['rights', 'obligations', 'governance', 'constitutional']),
  effective_date: TimestampSchema,
}).passthrough();

export type CharterClause = z.infer<typeof CharterClauseSchema>;

// ============================================================================
// ConstitutionalConstraintSchema
// ============================================================================

/** The 4 canonical constitutional constraint IDs (GOVR-02). */
export const CONSTITUTIONAL_CONSTRAINT_IDS = [
  'ubd-inclusion',
  'no-retroactive-reduction',
  'no-privatization',
  'supermajority-dissolution',
] as const;

/**
 * Validates constitutional constraints -- the four immutable rules
 * that cannot be altered even by governance vote.
 */
export const ConstitutionalConstraintSchema = z.object({
  id: z.enum(CONSTITUTIONAL_CONSTRAINT_IDS),
  clause_ref: z.string().min(1),
  description: z.string().min(1),
  enforceable: z.boolean(),
}).passthrough();

export type ConstitutionalConstraint = z.infer<typeof ConstitutionalConstraintSchema>;

// ============================================================================
// CharterVersionSchema
// ============================================================================

/** Validates semantic version strings (e.g., "1.0.0", "2.3.14"). */
export const CharterVersionSchema = z.string().regex(
  /^\d+\.\d+\.\d+$/,
  'Version must be semantic version format (e.g., 1.0.0)',
);

// ============================================================================
// CharterSchema
// ============================================================================

/**
 * Validates the full commons charter document.
 *
 * Enforces:
 * - Exactly 4 constitutional constraints
 * - No duplicate clause IDs
 * - All constraint clause_ref values reference existing clauses
 * - ratified_at required when ratified is true
 */
export const CharterSchema = z.object({
  version: CharterVersionSchema,
  title: z.string().min(1),
  preamble: z.string().min(1),
  clauses: z.array(CharterClauseSchema).min(1),
  constitutional_constraints: z.array(ConstitutionalConstraintSchema).length(4),
  ratified: z.boolean(),
  ratified_at: TimestampSchema.optional(),
  ratification_hash: z.string().optional(),
}).passthrough().refine(
  (charter) => {
    // No duplicate clause IDs
    const ids = charter.clauses.map((c) => c.id);
    return new Set(ids).size === ids.length;
  },
  { message: 'Charter contains duplicate clause IDs' },
).refine(
  (charter) => {
    // All constraint clause_ref values must reference existing clause IDs
    const clauseIds = new Set(charter.clauses.map((c) => c.id));
    return charter.constitutional_constraints.every((cc) => clauseIds.has(cc.clause_ref));
  },
  { message: 'Constitutional constraint clause_ref references non-existent clause' },
).refine(
  (charter) => {
    // If ratified, ratified_at must be present
    if (charter.ratified) {
      return charter.ratified_at !== undefined;
    }
    return true;
  },
  { message: 'Ratified charter must have ratified_at timestamp' },
);

export type Charter = z.infer<typeof CharterSchema>;

// ============================================================================
// COMMONS_CHARTER_YAML
// ============================================================================

/**
 * The default commons charter in YAML format.
 *
 * Contains 8 clauses covering UBD rights, dividend protections,
 * commons integrity, governance dissolution, contribution recognition,
 * transparency, dispute resolution, and amendment process.
 */
export const COMMONS_CHARTER_YAML = `
version: "1.0.0"
title: "AMIGA Commons Charter"
preamble: >
  We, the contributors to the AMIGA commons, establish this charter to
  ensure fair, transparent, and equitable governance of shared resources.
  This charter encodes immutable constitutional constraints that protect
  every contributor's fundamental rights within the commons.

clauses:
  - id: "clause-001"
    title: "Universal Basic Dividend"
    text: >
      Every contributor to the commons shall receive a base dividend
      allocation regardless of the size, frequency, or nature of their
      contribution. No minimum threshold of contribution shall be
      required for dividend eligibility.
    explanation: >
      This means that if you contribute anything at all to the commons,
      you receive a share of the dividends. There is no minimum bar --
      a single small fix counts just as much for eligibility as a major
      feature. The actual amount may vary based on weighting, but you
      always receive something.
    category: "constitutional"
    effective_date: "2026-01-01T00:00:00Z"

  - id: "clause-002"
    title: "Dividend Protection"
    text: >
      No dividend allocation that has been earned and recorded in the
      attribution ledger may be retroactively reduced, clawed back, or
      nullified. Past distributions are immutable historical facts.
    explanation: >
      Once you have earned a dividend and it appears in the ledger,
      nobody can take it away or reduce it after the fact. What you
      earned is yours permanently. Future dividends may change based on
      new contributions, but past ones are locked in.
    category: "constitutional"
    effective_date: "2026-01-01T00:00:00Z"

  - id: "clause-003"
    title: "Commons Integrity"
    text: >
      The commons and its resources shall not be privatized, enclosed,
      paywalled, or transferred to exclusive private ownership. The
      commons exists for the benefit of all contributors and must
      remain accessible to all.
    explanation: >
      The shared resources of the commons can never be taken private.
      No individual, company, or governance body can lock the commons
      behind a paywall or claim exclusive ownership. It stays open and
      accessible to everyone who contributes.
    category: "constitutional"
    effective_date: "2026-01-01T00:00:00Z"

  - id: "clause-004"
    title: "Governance Dissolution Right"
    text: >
      The governance body established by this charter may be dissolved
      by a supermajority vote (two-thirds or greater) of active
      contributors. Upon dissolution, a new governance structure must
      be established within 90 days.
    explanation: >
      If the governance body is not serving the community well, the
      contributors can vote to dissolve it. This requires a two-thirds
      supermajority. After dissolution, a new governance structure must
      be set up within 90 days to prevent a power vacuum.
    category: "constitutional"
    effective_date: "2026-01-01T00:00:00Z"

  - id: "clause-005"
    title: "Contribution Recognition"
    text: >
      All contributions shall be recorded in the attribution ledger
      with accurate metadata including contributor identity, timestamp,
      type of contribution, and dependency relationships. The ledger
      is the authoritative source of contribution history.
    explanation: >
      Every contribution you make is logged with full details -- who
      made it, when, what kind of work it was, and what it depends on.
      This ledger is the single source of truth for who did what.
    category: "obligations"
    effective_date: "2026-01-01T00:00:00Z"

  - id: "clause-006"
    title: "Transparency Requirement"
    text: >
      All governance decisions, weighting algorithm parameters, and
      dividend calculations shall be publicly documented and auditable.
      No governance action may be taken in secret.
    explanation: >
      Everything the governance body does must be out in the open.
      The formulas used to calculate dividends, the parameters that
      control weighting, and all governance decisions are public and
      can be independently verified by any contributor.
    category: "governance"
    effective_date: "2026-01-01T00:00:00Z"

  - id: "clause-007"
    title: "Dispute Resolution"
    text: >
      Any contributor may raise a dispute against a ledger entry,
      weighting calculation, or governance decision. Disputes shall be
      documented with evidence, reviewed by the governance layer, and
      resolved with a written conclusion. Algorithm adjustments
      resulting from disputes shall be applied prospectively.
    explanation: >
      If you think something is wrong -- a miscalculated weight, a
      missing contribution, or an unfair decision -- you can formally
      dispute it. Your dispute will be reviewed with evidence, and the
      governance body must provide a written conclusion. If the dispute
      reveals an algorithm error, the fix applies going forward.
    category: "rights"
    effective_date: "2026-01-01T00:00:00Z"

  - id: "clause-008"
    title: "Amendment Process"
    text: >
      Non-constitutional clauses of this charter may be amended by a
      simple majority vote of active contributors. Constitutional
      constraints (clauses referenced by constitutional_constraints)
      may not be amended or repealed under any circumstances.
    explanation: >
      Regular charter clauses can be changed by a simple majority vote.
      However, the four constitutional constraints (UBD inclusion,
      no retroactive reduction, no privatization, and dissolution
      rights) can never be changed or removed. They are permanent.
    category: "governance"
    effective_date: "2026-01-01T00:00:00Z"

constitutional_constraints:
  - id: "ubd-inclusion"
    clause_ref: "clause-001"
    description: "UBD inclusion regardless of contribution size"
    enforceable: true
  - id: "no-retroactive-reduction"
    clause_ref: "clause-002"
    description: "No retroactive dividend reduction"
    enforceable: true
  - id: "no-privatization"
    clause_ref: "clause-003"
    description: "Commons cannot be privatized or enclosed"
    enforceable: true
  - id: "supermajority-dissolution"
    clause_ref: "clause-004"
    description: "Governance body dissolvable by supermajority"
    enforceable: true

ratified: false
`.trim();

// ============================================================================
// parseCharter
// ============================================================================

/**
 * Parses a YAML string into a validated Charter object.
 *
 * @param yamlStr - YAML string containing a charter document
 * @returns Validated Charter object
 * @throws On malformed YAML or Zod validation failure
 */
export function parseCharter(yamlStr: string): Charter {
  const raw = yaml.load(yamlStr);
  return CharterSchema.parse(raw);
}

// ============================================================================
// ratifyCharter
// ============================================================================

/**
 * Ratifies a charter, making it immutable.
 *
 * Creates a deep copy with `ratified: true`, current timestamp as
 * `ratified_at`, and a SHA-256 hash of the pre-ratification content
 * as `ratification_hash`. The original charter is not mutated.
 *
 * @param charter - An unratified charter
 * @returns A new ratified charter object with hash seal
 * @throws If the charter is already ratified
 */
export function ratifyCharter(charter: Charter): Charter {
  if (charter.ratified) {
    throw new Error('Charter is already ratified');
  }

  const serialized = JSON.stringify(charter);
  const hash = createHash('sha256').update(serialized).digest('hex');

  const ratified: Charter = {
    ...structuredClone(charter),
    ratified: true,
    ratified_at: new Date().toISOString(),
    ratification_hash: hash,
  };

  return ratified;
}

// ============================================================================
// isRatified
// ============================================================================

/**
 * Checks whether a charter has been ratified.
 *
 * @param charter - Charter object to check
 * @returns true if the charter is ratified
 */
export function isRatified(charter: Charter): boolean {
  return charter.ratified === true;
}
