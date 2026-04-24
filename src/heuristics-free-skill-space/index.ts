/**
 * Heuristics-Free Skill Space — unified settings + composition surface.
 *
 * Phase 734 shipping deliverable. Exposes the settings reader that downstream
 * code uses to check whether a given Half B module is opted-in, and provides
 * the composition contracts documented in the LEJEPA-19 acceptance criterion:
 *
 *   - Every Half B module composes cleanly with MB-1 Lyapunov and MB-5
 *     dead-zone (no Lyapunov-violating updates, no dead-zone bypass).
 *   - Every Half B module ships default-off. Flipping all flags off returns
 *     the substrate to byte-identical v1.49.570 behavior.
 *
 * CAPCOM preservation: this module reads config and checks module flags. It
 * does not dispatch, gate, or alter any CAPCOM state.
 *
 * @module heuristics-free-skill-space
 */

export type {
  HeuristicsFreeModule,
  HeuristicsFreeSkillSpaceConfig,
} from './settings.js';

export {
  readHeuristicsFreeConfig,
  isModuleEnabled,
} from './settings.js';

/** The six LEJEPA-* substrate surfaces registered by v1.49.571. */
export const HEURISTICS_FREE_MODULES = [
  {
    id: 'skill_isotropy_audit',
    requirement: 'LEJEPA-13',
    phase: 728,
    path: 'src/skill-isotropy/',
    capcomImpact: 'read-only audit; no dispatch',
  },
  {
    id: 'sigreg',
    requirement: 'LEJEPA-14',
    phase: 729,
    path: 'src/sigreg/',
    capcomImpact: 'pure computation; no dispatch',
  },
  {
    id: 'single_lambda_audit',
    requirement: 'LEJEPA-15',
    phase: 730,
    path: 'docs/substrate-audits/single-lambda.md',
    capcomImpact: 'documentation only',
  },
  {
    id: 'heuristics_audit',
    requirement: 'LEJEPA-16',
    phase: 731,
    path: 'docs/substrate-audits/heuristics-audit.md',
    capcomImpact: 'documentation only',
  },
  {
    id: 'mission_world_model',
    requirement: 'LEJEPA-17',
    phase: 732,
    path: 'src/mission-world-model/',
    capcomImpact: 'advisory only; hard CAPCOM preservation gate; predictor cannot emit gate-bypass actions',
  },
  {
    id: 'intrinsic_telemetry',
    requirement: 'LEJEPA-18',
    phase: 733,
    path: 'src/intrinsic-telemetry/',
    capcomImpact: 'pure correlation report; no dispatch',
  },
] as const;
