/**
 * SIGReg — Sketched Isotropic Gaussian Regularization primitive (public API).
 *
 * Default-off module shipped by Phase 729 (v1.49.571 Heuristics-Free Skill Space).
 * Source: Balestriero & LeCun 2025, arXiv:2511.08544v3, §4.
 * Reference implementation: rbalestr-lab/lejepa (MIT) — see ../../license_notices.md.
 *
 * Opt-in via `.claude/gsd-skill-creator.json`:
 *
 *     "heuristics-free-skill-space": {
 *       "sigreg": { "enabled": true }
 *     }
 *
 * @module sigreg
 */

export type {
  EppsPulleyConfig,
  SigregConfig,
  SigregBreakdown,
} from './types.js';

export { LEJEPA_DEFAULT_CONFIG } from './types.js';

export { eppsPulley } from './epps-pulley.js';

export { sigreg, sigregWithBreakdown } from './sigreg.js';
