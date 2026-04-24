/**
 * Skill Space Isotropy Audit — public API.
 *
 * Default-off module shipped by Phase 728 (v1.49.571 Heuristics-Free Skill Space).
 * Source paper: Balestriero & LeCun 2025, arXiv:2511.08544v3 (LeJEPA Lemma 3
 * Hyperspherical Cramér-Wold + §4.3 projection-based dimensional independence).
 *
 * Read-only audit. No skill-library writes. Never bypasses CAPCOM.
 * Opt-in via `.claude/gsd-skill-creator.json`:
 *
 *     "heuristics-free-skill-space": {
 *       "skill_isotropy_audit": { "enabled": true }
 *     }
 *
 * When the flag is false/absent the module exposes no behavior — byte-identical
 * to not importing it at all.
 *
 * @module skill-isotropy
 */

export type {
  SkillEmbedding,
  TargetDistribution,
  UnivariateTest,
  IsotropyAuditConfig,
  IsotropyFinding,
  IsotropyAuditReport,
} from './types.js';

export { LEJEPA_FIG6_REFERENCE } from './types.js';

export { DEFAULT_AUDIT_CONFIG, runIsotropyAudit } from './audit.js';

export {
  sampleUnitDirections,
  projectOntoDirection,
} from './slicing.js';

export {
  andersonDarlingA2,
  andersonDarlingPValue,
  ksStatistic,
  ksPValue,
  shapiroWilkDeviation,
  runUnivariateTest,
} from './univariate-tests.js';
