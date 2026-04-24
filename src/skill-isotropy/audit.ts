/**
 * Top-level Skill Space Isotropy Audit.
 *
 * Read-only: audits a snapshot of skill embeddings and returns a structured
 * report. Never modifies the skill library, never emits CAPCOM-gate events,
 * never bypasses any existing safety surface. Default-off — callers must
 * explicitly set `.heuristics-free-skill-space.skill_isotropy_audit.enabled`
 * in `.claude/gsd-skill-creator.json` and invoke `runIsotropyAudit` directly.
 *
 * @module skill-isotropy/audit
 */

import type {
  IsotropyAuditConfig,
  IsotropyAuditReport,
  IsotropyFinding,
  SkillEmbedding,
} from './types.js';
import { projectOntoDirection, sampleUnitDirections } from './slicing.js';
import { runUnivariateTest } from './univariate-tests.js';

/** Default config — conservative Anderson-Darling with 16 directions. */
export const DEFAULT_AUDIT_CONFIG: IsotropyAuditConfig = {
  numDirections: 16,
  univariateTest: 'anderson-darling',
  target: 'standard-gaussian',
  significanceLevel: 0.01,
};

/**
 * Run one Isotropy Audit over a skill-embedding snapshot.
 *
 * Pure function: no I/O, no side effects. Produces a structured report that a
 * caller can log, persist, or feed into the Phase 733 Intrinsic Telemetry
 * correlation pipeline.
 *
 * Complexity: O(M · N · K) where M = numDirections, N = skill count,
 * K = embedding dim. For a typical library (N ~ 500, K ~ 384, M = 16) the
 * audit completes in single-digit milliseconds.
 */
export function runIsotropyAudit(
  skills: ReadonlyArray<SkillEmbedding>,
  config: IsotropyAuditConfig = DEFAULT_AUDIT_CONFIG,
): IsotropyAuditReport {
  if (skills.length === 0) {
    return emptyReport(config, 0, 0);
  }
  const embeddingDim = skills[0].vector.length;
  // Structural check: every skill's vector must have the same dimension.
  for (let i = 1; i < skills.length; i++) {
    if (skills[i].vector.length !== embeddingDim) {
      throw new Error(
        `skill ${skills[i].skillId} has embedding dim ${skills[i].vector.length}; ` +
          `expected ${embeddingDim} (from skill ${skills[0].skillId})`,
      );
    }
  }

  const directions = sampleUnitDirections(
    config.numDirections,
    embeddingDim,
    config.seed,
  );
  const vectors = skills.map((s) => s.vector);

  const findings: IsotropyFinding[] = [];
  let sumDeviation = 0;
  let maxDeviation = 0;

  for (let m = 0; m < directions.length; m++) {
    const direction = directions[m];
    const projections = projectOntoDirection(vectors, direction);
    const { statistic, pValue } = runUnivariateTest(
      projections,
      config.univariateTest,
      config.target,
    );
    sumDeviation += statistic;
    if (statistic > maxDeviation) maxDeviation = statistic;

    if (pValue < config.significanceLevel) {
      findings.push({
        directionIndex: m,
        direction,
        deviationScore: statistic,
        pValue,
        description:
          `direction ${m}: ${config.univariateTest} statistic ${statistic.toFixed(4)} ` +
          `(p=${pValue.toExponential(2)}) — projections deviate from ${config.target}`,
      });
    }
  }

  findings.sort((a, b) => b.deviationScore - a.deviationScore);

  const meanDeviationScore = sumDeviation / directions.length;
  const verdict = classify(findings.length, maxDeviation, directions.length);
  const runTag = makeRunTag(config);

  return {
    skillCount: skills.length,
    embeddingDim,
    config,
    findings,
    meanDeviationScore,
    maxDeviationScore: maxDeviation,
    verdict,
    runTag,
  };
}

function emptyReport(
  config: IsotropyAuditConfig,
  skillCount: number,
  embeddingDim: number,
): IsotropyAuditReport {
  return {
    skillCount,
    embeddingDim,
    config,
    findings: [],
    meanDeviationScore: 0,
    maxDeviationScore: 0,
    verdict: 'healthy',
    runTag: makeRunTag(config),
  };
}

function classify(
  findingCount: number,
  maxDeviation: number,
  numDirections: number,
): IsotropyAuditReport['verdict'] {
  const findingFrac = findingCount / Math.max(1, numDirections);
  if (findingFrac === 0) return 'healthy';
  if (findingFrac >= 0.5 || maxDeviation > 5.0) return 'collapse-suspected';
  return 'watch';
}

function makeRunTag(config: IsotropyAuditConfig): string {
  const seedTag = config.seed === undefined ? 'rand' : `s${config.seed}`;
  return (
    `${config.univariateTest}|${config.target}|M=${config.numDirections}|` +
    `α=${config.significanceLevel}|${seedTag}`
  );
}
