/**
 * Trust Tier Escalation Engine — w-wl-003
 *
 * Rules engine for promoting rigs through trust tiers based on
 * stamp accumulation, completion quality, and time-in-tier requirements.
 *
 * Trust tiers (MVR Protocol Section 7.3):
 *   0 (Outsider)    → Read-only
 *   1 (Registered)  → Can post, claim, complete
 *   2 (Contributor) → Can validate and issue stamps
 *   3 (Maintainer)  → Can manage trust levels, merge PRs
 *
 * Escalation rules:
 *   0 → 1: Automatic on registration (handled by register operation)
 *   1 → 2: 3+ stamps received, avg quality >= 3.0, 7+ days registered
 *   2 → 3: 10+ stamps received, 5+ stamps issued, avg quality >= 4.0,
 *           30+ days at level 2, requires maintainer approval flag
 */

import { sqlEscape } from './sql-escape.js';
import { normalizeToUTC } from './utc.js';

// ============================================================================
// Schema DDL
// ============================================================================

/**
 * SQL DDL for the rigs table.
 *
 * A rig is a participant in the forest. The rigs table is the anchor —
 * stamps, relationships, character sheets, and badges all hang off the
 * handle. trust_level starts at 1 (Registered) on arrival and never
 * decreases. rig_uuid is stored internally for federation deduplication
 * but is never surfaced as the participant's identity.
 */
export const RIGS_DDL = `
CREATE TABLE IF NOT EXISTS rigs (
  handle                 VARCHAR(64) PRIMARY KEY,
  rig_uuid               VARCHAR(36) DEFAULT NULL,
  trust_level            INT NOT NULL DEFAULT 1,
  rig_type               VARCHAR(16) NOT NULL DEFAULT 'participant',
  registered_at          DATETIME NOT NULL,
  trust_level_changed_at DATETIME DEFAULT NULL,
  last_seen              DATETIME DEFAULT NULL,
  display_name           VARCHAR(128) DEFAULT NULL
);`.trim();

// ============================================================================
// Types
// ============================================================================

/** Rig record relevant to escalation */
export interface RigRecord {
  handle: string;
  trust_level: number;
  rig_type: string;
  registered_at: string | null;
}

/** Stamp summary for a rig */
export interface StampSummary {
  stampsReceived: number;
  stampsIssued: number;
  avgQualityReceived: number;
  avgReliabilityReceived: number;
  avgCreativityReceived: number;
  uniqueValidators: number;
  latestStampAt: string | null;
}

/** Completion summary for a rig */
export interface CompletionSummary {
  totalCompletions: number;
  validatedCompletions: number;
  pendingCompletions: number;
}

/** Escalation rule definition */
export interface EscalationRule {
  fromLevel: number;
  toLevel: number;
  criteria: EscalationCriterion[];
}

/** Single criterion within an escalation rule */
export interface EscalationCriterion {
  name: string;
  description: string;
  evaluate: (context: EscalationContext) => CriterionResult;
}

/** Context passed to criterion evaluators */
export interface EscalationContext {
  rig: RigRecord;
  stamps: StampSummary;
  completions: CompletionSummary;
  now: Date;
  trustLevelChangedAt: string | null;
  /**
   * Interpersonal trust bonus (0–1). Optional.
   * Used as tiebreaker for borderline 2→3 cases.
   * Helps borderline rigs but never blocks anyone who earned it through stamps alone.
   */
  escalationBonus?: number;
}

/** Result of evaluating a single criterion */
export interface CriterionResult {
  met: boolean;
  actual: string;
  required: string;
}

/** Full escalation evaluation for a rig */
export interface EscalationEvaluation {
  handle: string;
  currentLevel: number;
  targetLevel: number;
  eligible: boolean;
  criteria: Array<{
    name: string;
    description: string;
    met: boolean;
    actual: string;
    required: string;
  }>;
  recommendation: string;
  /** Interpersonal trust bonus (0–1). Informational — not factored into eligibility. */
  escalationBonus?: number;
}

/** Result of a batch escalation scan */
export interface EscalationScanResult {
  eligible: EscalationEvaluation[];
  notEligible: EscalationEvaluation[];
  errors: Array<{ handle: string; error: string }>;
  scannedAt: string;
}

// ============================================================================
// Escalation Rules
// ============================================================================

/** Minimum stamps received for 1→2 */
const MIN_STAMPS_FOR_CONTRIBUTOR = 3;
/** Minimum average quality for 1→2 */
const MIN_AVG_QUALITY_FOR_CONTRIBUTOR = 3.0;
/** Minimum days registered for 1→2 */
const MIN_DAYS_REGISTERED_FOR_CONTRIBUTOR = 7;

/** Minimum stamps received for 2→3 */
const MIN_STAMPS_FOR_MAINTAINER = 10;
/** Minimum stamps issued (as validator) for 2→3 */
const MIN_STAMPS_ISSUED_FOR_MAINTAINER = 5;
/** Minimum average quality for 2→3 */
const MIN_AVG_QUALITY_FOR_MAINTAINER = 4.0;
/** Minimum days at level 2 for 2→3 */
const MIN_DAYS_AT_CONTRIBUTOR_FOR_MAINTAINER = 30;
/** Minimum unique validators for 2→3 */
const MIN_UNIQUE_VALIDATORS_FOR_MAINTAINER = 2;

/**
 * Calculate days between two dates.
 */
function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Build the escalation rules for 1→2 (Registered → Contributor).
 */
export function buildContributorRules(): EscalationRule {
  return {
    fromLevel: 1,
    toLevel: 2,
    criteria: [
      {
        name: 'stamps_received',
        description: `At least ${MIN_STAMPS_FOR_CONTRIBUTOR} stamps received`,
        evaluate: (ctx) => ({
          met: ctx.stamps.stampsReceived >= MIN_STAMPS_FOR_CONTRIBUTOR,
          actual: `${ctx.stamps.stampsReceived} stamps`,
          required: `>= ${MIN_STAMPS_FOR_CONTRIBUTOR} stamps`,
        }),
      },
      {
        name: 'avg_quality',
        description: `Average quality score >= ${MIN_AVG_QUALITY_FOR_CONTRIBUTOR}`,
        evaluate: (ctx) => ({
          met: ctx.stamps.stampsReceived > 0 &&
               ctx.stamps.avgQualityReceived >= MIN_AVG_QUALITY_FOR_CONTRIBUTOR,
          actual: ctx.stamps.stampsReceived > 0
            ? `${ctx.stamps.avgQualityReceived.toFixed(2)}`
            : 'no stamps',
          required: `>= ${MIN_AVG_QUALITY_FOR_CONTRIBUTOR.toFixed(1)}`,
        }),
      },
      {
        name: 'time_registered',
        description: `Registered for at least ${MIN_DAYS_REGISTERED_FOR_CONTRIBUTOR} days`,
        evaluate: (ctx) => {
          if (!ctx.rig.registered_at) {
            return { met: false, actual: 'unknown registration date', required: `>= ${MIN_DAYS_REGISTERED_FOR_CONTRIBUTOR} days` };
          }
          const days = daysBetween(new Date(ctx.rig.registered_at), ctx.now);
          return {
            met: days >= MIN_DAYS_REGISTERED_FOR_CONTRIBUTOR,
            actual: `${days} days`,
            required: `>= ${MIN_DAYS_REGISTERED_FOR_CONTRIBUTOR} days`,
          };
        },
      },
    ],
  };
}

/**
 * Build the escalation rules for 2→3 (Contributor → Maintainer).
 */
export function buildMaintainerRules(): EscalationRule {
  return {
    fromLevel: 2,
    toLevel: 3,
    criteria: [
      {
        name: 'stamps_received',
        description: `At least ${MIN_STAMPS_FOR_MAINTAINER} stamps received`,
        evaluate: (ctx) => ({
          met: ctx.stamps.stampsReceived >= MIN_STAMPS_FOR_MAINTAINER,
          actual: `${ctx.stamps.stampsReceived} stamps`,
          required: `>= ${MIN_STAMPS_FOR_MAINTAINER} stamps`,
        }),
      },
      {
        name: 'stamps_issued',
        description: `At least ${MIN_STAMPS_ISSUED_FOR_MAINTAINER} stamps issued as validator`,
        evaluate: (ctx) => ({
          met: ctx.stamps.stampsIssued >= MIN_STAMPS_ISSUED_FOR_MAINTAINER,
          actual: `${ctx.stamps.stampsIssued} stamps issued`,
          required: `>= ${MIN_STAMPS_ISSUED_FOR_MAINTAINER} stamps`,
        }),
      },
      {
        name: 'avg_quality',
        description: `Average quality score >= ${MIN_AVG_QUALITY_FOR_MAINTAINER}`,
        evaluate: (ctx) => ({
          met: ctx.stamps.stampsReceived > 0 &&
               ctx.stamps.avgQualityReceived >= MIN_AVG_QUALITY_FOR_MAINTAINER,
          actual: ctx.stamps.stampsReceived > 0
            ? `${ctx.stamps.avgQualityReceived.toFixed(2)}`
            : 'no stamps',
          required: `>= ${MIN_AVG_QUALITY_FOR_MAINTAINER.toFixed(1)}`,
        }),
      },
      {
        name: 'unique_validators',
        description: `At least ${MIN_UNIQUE_VALIDATORS_FOR_MAINTAINER} different validators`,
        evaluate: (ctx) => ({
          met: ctx.stamps.uniqueValidators >= MIN_UNIQUE_VALIDATORS_FOR_MAINTAINER,
          actual: `${ctx.stamps.uniqueValidators} validators`,
          required: `>= ${MIN_UNIQUE_VALIDATORS_FOR_MAINTAINER} validators`,
        }),
      },
      {
        name: 'time_at_contributor',
        description: `At least ${MIN_DAYS_AT_CONTRIBUTOR_FOR_MAINTAINER} days at Contributor level`,
        evaluate: (ctx) => {
          if (!ctx.trustLevelChangedAt) {
            return { met: false, actual: 'unknown promotion date', required: `>= ${MIN_DAYS_AT_CONTRIBUTOR_FOR_MAINTAINER} days` };
          }
          const days = daysBetween(new Date(ctx.trustLevelChangedAt), ctx.now);
          return {
            met: days >= MIN_DAYS_AT_CONTRIBUTOR_FOR_MAINTAINER,
            actual: `${days} days`,
            required: `>= ${MIN_DAYS_AT_CONTRIBUTOR_FOR_MAINTAINER} days`,
          };
        },
      },
    ],
  };
}

// ============================================================================
// Evaluation Engine
// ============================================================================

/**
 * Evaluate a rig against an escalation rule.
 */
export function evaluateRule(
  rule: EscalationRule,
  context: EscalationContext,
): EscalationEvaluation {
  const results = rule.criteria.map(criterion => {
    const result = criterion.evaluate(context);
    return {
      name: criterion.name,
      description: criterion.description,
      ...result,
    };
  });

  const eligible = results.every(r => r.met);

  let recommendation: string;
  if (eligible) {
    recommendation = `ELIGIBLE: ${context.rig.handle} meets all criteria for trust level ${rule.toLevel}`;
  } else {
    const unmet = results.filter(r => !r.met).map(r => r.name);
    recommendation = `NOT ELIGIBLE: unmet criteria: ${unmet.join(', ')}`;
  }

  return {
    handle: context.rig.handle,
    currentLevel: rule.fromLevel,
    targetLevel: rule.toLevel,
    eligible,
    criteria: results,
    recommendation,
  };
}

/**
 * Evaluate a rig for all applicable escalation paths.
 * Returns the evaluation for the next level up from current trust level.
 */
export function evaluateRig(context: EscalationContext): EscalationEvaluation | null {
  const level = context.rig.trust_level;

  if (level === 1) {
    return evaluateRule(buildContributorRules(), context);
  }
  if (level === 2) {
    const evaluation = evaluateRule(buildMaintainerRules(), context);

    // Wire escalation bonus as informational tiebreaker
    if (context.escalationBonus !== undefined) {
      evaluation.escalationBonus = context.escalationBonus;
      if (!evaluation.eligible && context.escalationBonus >= 0.5) {
        evaluation.recommendation +=
          ` (interpersonal trust bonus: ${context.escalationBonus.toFixed(2)} — consider manual review)`;
      }
    }

    return evaluation;
  }

  // Level 0 (auto-promote on registration) and level 3 (max) have no escalation rules
  return null;
}

// ============================================================================
// Data Provider
// ============================================================================

/** Data provider for escalation context (dependency injection) */
export interface EscalationDataProvider {
  getRigs(minTrustLevel?: number, maxTrustLevel?: number): Promise<RigRecord[]>;
  getStampSummary(handle: string): Promise<StampSummary>;
  getCompletionSummary(handle: string): Promise<CompletionSummary>;
  getTrustLevelChangedAt(handle: string): Promise<string | null>;
  /** Optional: get interpersonal trust bonus for escalation tiebreaking. */
  getEscalationBonus?(handle: string): Promise<number>;
}

/**
 * Create an EscalationDataProvider backed by DoltHub's REST API.
 */
export function createDoltHubEscalationProvider(
  owner: string,
  repo: string,
  branch: string = 'main',
): EscalationDataProvider {
  const baseUrl = `https://www.dolthub.com/api/v1alpha1/${owner}/${repo}/${branch}`;

  async function query(sql: string): Promise<Record<string, string>[]> {
    const url = `${baseUrl}?q=${encodeURIComponent(sql)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`DoltHub API error: ${response.status}`);
    }
    const data = await response.json() as { query_execution_status: string; rows: Record<string, string>[] };
    if (data.query_execution_status !== 'Success') {
      throw new Error(`DoltHub query failed: ${data.query_execution_status}`);
    }
    return data.rows ?? [];
  }

  return {
    async getRigs(minTrustLevel = 0, maxTrustLevel = 3) {
      if (!Number.isFinite(minTrustLevel) || !Number.isFinite(maxTrustLevel)) {
        throw new Error('Trust levels must be finite numbers');
      }
      const rows = await query(
        `SELECT handle, trust_level, rig_type, registered_at FROM rigs WHERE trust_level >= ${minTrustLevel} AND trust_level <= ${maxTrustLevel} ORDER BY handle`
      );
      return rows.map(r => ({
        handle: r.handle,
        trust_level: parseInt(r.trust_level, 10),
        rig_type: r.rig_type,
        registered_at: r.registered_at ? normalizeToUTC(r.registered_at, 'rigs.registered_at') : null,
      }));
    },

    async getStampSummary(handle: string) {
      const escaped = sqlEscape(handle);

      const [received, issued] = await Promise.all([
        query(`
          SELECT COUNT(*) as cnt,
                 AVG(JSON_EXTRACT(valence, '$.quality')) as avg_q,
                 AVG(JSON_EXTRACT(valence, '$.reliability')) as avg_r,
                 AVG(JSON_EXTRACT(valence, '$.creativity')) as avg_c,
                 COUNT(DISTINCT author) as unique_validators,
                 MAX(created_at) as latest
          FROM stamps WHERE subject = '${escaped}'
        `),
        query(`SELECT COUNT(*) as cnt FROM stamps WHERE author = '${escaped}'`),
      ]);

      const r = received[0] ?? {};
      const i = issued[0] ?? {};

      return {
        stampsReceived: parseInt(r.cnt ?? '0', 10),
        stampsIssued: parseInt(i.cnt ?? '0', 10),
        avgQualityReceived: parseFloat(r.avg_q ?? '0') || 0,
        avgReliabilityReceived: parseFloat(r.avg_r ?? '0') || 0,
        avgCreativityReceived: parseFloat(r.avg_c ?? '0') || 0,
        uniqueValidators: parseInt(r.unique_validators ?? '0', 10),
        latestStampAt: r.latest ? normalizeToUTC(r.latest, 'stamps.created_at') : null,
      };
    },

    async getCompletionSummary(handle: string) {
      const escaped = sqlEscape(handle);
      const rows = await query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN validated_by IS NOT NULL THEN 1 ELSE 0 END) as validated,
          SUM(CASE WHEN validated_by IS NULL THEN 1 ELSE 0 END) as pending
        FROM completions WHERE completed_by = '${escaped}'
      `);
      const r = rows[0] ?? {};
      return {
        totalCompletions: parseInt(r.total ?? '0', 10),
        validatedCompletions: parseInt(r.validated ?? '0', 10),
        pendingCompletions: parseInt(r.pending ?? '0', 10),
      };
    },

    async getTrustLevelChangedAt(handle: string) {
      const escaped = sqlEscape(handle);
      const rows = await query(
        `SELECT trust_level_changed_at FROM rigs WHERE handle = '${escaped}'`
      );
      const raw = rows[0]?.trust_level_changed_at;
      return raw ? normalizeToUTC(raw, 'rigs.trust_level_changed_at') : null;
    },
  };
}

// ============================================================================
// Batch Scanner
// ============================================================================

/**
 * Scan all rigs at a given trust level and evaluate escalation eligibility.
 */
export async function scanForEscalation(
  provider: EscalationDataProvider,
  trustLevel: number,
  now: Date = new Date(),
): Promise<EscalationScanResult> {
  const eligible: EscalationEvaluation[] = [];
  const notEligible: EscalationEvaluation[] = [];
  const errors: Array<{ handle: string; error: string }> = [];

  let rigs: RigRecord[];
  try {
    rigs = await provider.getRigs(trustLevel, trustLevel);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { eligible: [], notEligible: [], errors: [{ handle: '*', error: msg }], scannedAt: now.toISOString() };
  }

  for (const rig of rigs) {
    try {
      const [stamps, completions, trustChangedAt] = await Promise.all([
        provider.getStampSummary(rig.handle),
        provider.getCompletionSummary(rig.handle),
        provider.getTrustLevelChangedAt(rig.handle),
      ]);

      // Fetch escalation bonus if the provider supports it
      const escalationBonus = provider.getEscalationBonus
        ? await provider.getEscalationBonus(rig.handle)
        : undefined;

      const context: EscalationContext = {
        rig,
        stamps,
        completions,
        now,
        trustLevelChangedAt: trustChangedAt ?? rig.registered_at,
        escalationBonus,
      };

      const evaluation = evaluateRig(context);
      if (!evaluation) continue;

      if (evaluation.eligible) {
        eligible.push(evaluation);
      } else {
        notEligible.push(evaluation);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ handle: rig.handle, error: msg });
    }
  }

  return { eligible, notEligible, errors, scannedAt: now.toISOString() };
}

// ============================================================================
// SQL Generator
// ============================================================================

/**
 * Generate SQL to promote a rig to a new trust level.
 */
export function toPromotionSQL(evaluation: EscalationEvaluation): string {
  if (!evaluation.eligible) {
    return `-- ${evaluation.handle}: NOT ELIGIBLE for trust level ${evaluation.targetLevel}`;
  }

  const escaped = sqlEscape(evaluation.handle);
  const criteriaNote = evaluation.criteria
    .map(c => `${c.name}: ${c.actual}`)
    .join(', ');

  return [
    `-- Promote ${evaluation.handle} to trust level ${evaluation.targetLevel}`,
    `-- Evidence: ${criteriaNote}`,
    `UPDATE rigs SET trust_level = ${evaluation.targetLevel}, trust_level_changed_at = NOW(), last_seen = NOW()`,
    `WHERE handle = '${escaped}' AND trust_level = ${evaluation.currentLevel};`,
  ].join('\n');
}

/**
 * Generate a full promotion report as SQL script.
 */
export function toPromotionReport(result: EscalationScanResult): string {
  const header = [
    '-- Trust Tier Escalation Report',
    `-- Scanned: ${result.scannedAt}`,
    `-- Eligible: ${result.eligible.length}`,
    `-- Not eligible: ${result.notEligible.length}`,
    `-- Errors: ${result.errors.length}`,
    '',
  ];

  if (result.eligible.length === 0) {
    return [...header, '-- No rigs eligible for promotion at this time.'].join('\n');
  }

  const promotions = result.eligible.map(e => toPromotionSQL(e));
  return [...header, ...promotions].join('\n\n');
}

// ============================================================================
// Human-Readable Report
// ============================================================================

/**
 * Generate a readable text report of escalation evaluation.
 */
export function formatEvaluation(evaluation: EscalationEvaluation): string {
  const status = evaluation.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE';
  const lines = [
    `${evaluation.handle} — ${status} for level ${evaluation.currentLevel} → ${evaluation.targetLevel}`,
  ];

  for (const c of evaluation.criteria) {
    const icon = c.met ? '+' : '-';
    lines.push(`  ${icon} ${c.description}: ${c.actual} (need ${c.required})`);
  }

  if (evaluation.escalationBonus !== undefined && evaluation.escalationBonus > 0) {
    lines.push(`  ~ interpersonal trust bonus: ${evaluation.escalationBonus.toFixed(2)}`);
  }

  return lines.join('\n');
}
