/**
 * Tonnetz — T3 primitive (MATH-20, Phase 752, standard CAPCOM preservation
 * gate G6).
 *
 * Unit-circle + combinatorial-geometry primitive per arXiv:2604.19960
 * (Boland 2026, `boland2026tonnetz`) and M6 §2/§4. Ships:
 *
 *   - 24-triad neo-Riemannian Tonnetz lattice (12 major + 12 minor)
 *   - Canonical P/L/R transforms (involutions)
 *   - Combinatorial-geometry operations: chord triangles, shortest-path
 *     distance, fundamental domain
 *   - Sound of Puget Sound mapping: 360 PNW species × 360 Seattle musicians
 *     projected onto the same unit circle (1° per entity; shared θ yields a
 *     shared Tonnetz chord)
 *
 * ## Opt-in mechanism
 *
 * This module is **default-OFF**. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "mathematical-foundations": {
 *       "tonnetz": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false:
 *   - `isTonnetzEnabled()` returns `false`;
 *   - the module is side-effect-free at import (`readFileSync` is lazy — it
 *     only fires when a caller explicitly invokes the settings reader);
 *   - no downstream subsystem is perturbed (byte-identical to the v1.49.571
 *     tip `a5ec2bd6f` when the flag is off).
 *
 * ## Explicit non-goals (G6 standard preservation)
 *
 * This module **DOES NOT**:
 *   - bypass CAPCOM handoff — every operation is a pure read-only computation
 *     and cannot emit gate-bypass actions of any kind (forbidden-token grep
 *     enforces this statically);
 *   - mutate the skill library or any persistent state of any kind;
 *   - perform any file I/O beyond the settings reader's lazy `readFileSync`;
 *   - extend beyond 12-tone equal temperament (microtonal systems are out of
 *     scope);
 *   - embed the lattice into R^2 or R^3 (the abstract graph representation
 *     is sufficient for combinatorial queries — geometric embeddings are
 *     mission content, not primitive code);
 *   - provide audio synthesis, rendering, or any real-time pipeline hook;
 *   - persist SoPS mappings — callers hold the mapping in-memory if needed;
 *   - ship species/musician catalogue data — only the structural mapping is
 *     primitive code.
 *
 * @module tonnetz
 */

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type {
  ChordTriangle,
  PitchClass,
  SoPSEntity,
  SoPSMapping,
  TonnetzLattice,
  TonnetzTransform,
  Triad,
  TriadQuality,
  UnitCirclePoint,
} from './types.js';

// ----------------------------------------------------------------------------
// Settings
// ----------------------------------------------------------------------------

export type { TonnetzConfig } from './settings.js';

export {
  DEFAULT_TONNETZ_CONFIG,
  isTonnetzEnabled,
  readTonnetzConfig,
} from './settings.js';

// ----------------------------------------------------------------------------
// Lattice + transforms
// ----------------------------------------------------------------------------

export {
  applyTransform,
  buildStandardTonnetz,
  inferQuality,
  majorTriad,
  makeTriad,
  minorTriad,
  normalizePC,
  triadIndex,
} from './lattice.js';

// ----------------------------------------------------------------------------
// Combinatorial geometry
// ----------------------------------------------------------------------------

export {
  chordTriangle,
  fundamentalDomain,
  tonnetzDistance,
} from './combinatorial-geometry.js';

// ----------------------------------------------------------------------------
// Sound of Puget Sound mapping
// ----------------------------------------------------------------------------

export {
  SOPS_CATALOGUE_SIZE,
  SOPS_THETA_EPSILON,
  SOPS_THETA_STEP,
  buildSoPSMapping,
  placeOnUnitCircle,
  sharedChord,
  thetaToPitchClass,
} from './sops-mapping.js';
