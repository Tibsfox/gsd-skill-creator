/**
 * ArtifactNet Provenance — UIP-20 T2d (Phase 772, CAPCOM hard preservation
 * Gate G13).
 *
 * Forensic-residual-physics provenance layer for skill/asset authenticity per
 * ArtifactNet (arXiv:2604.16254 / Heewon Oh et al., SONICS 3-way at
 * n=23,288). Detects AI-generated content vs real-musician/author/contributor
 * work; wires into the Grove record audit pipeline (and `src/skilldex-auditor`
 * pipeline) as a **pre-audit step**.
 *
 * ## Opt-in mechanism
 *
 * This module is **default-OFF**. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "upstream-intelligence": {
 *       "artifactnet-provenance": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false, every public entry point is a no-op
 * passthrough:
 *   - `verifyProvenance()` returns `{ disabled: true, verdict: 'unknown' }`,
 *   - `composeWithAudit()` returns the input report unchanged (===),
 *   - `preAuditHook()` returns the existing-audit function unchanged.
 *
 * This is the Gate G13 hard-preservation invariant: byte-identical to the
 * phase-771 tip whenever the flag is off.
 *
 * ## Hard preservation invariants (Gate G13)
 *
 * 1. The existing skill/asset audit pipeline (`src/memory/grove-format.ts`,
 *    `src/skilldex-auditor/`, etc.) is byte-identical with the flag off.
 * 2. Provenance gate is a pre-audit augmentation: it produces findings
 *    BEFORE the existing audit runs and stores them in a separate
 *    `preAudit` slot on the report. The existing `findings` array is
 *    never mutated.
 * 3. No CAPCOM/orchestrator/DACP imports anywhere in the module.
 * 4. Type-only references to `src/memory/` and `src/skilldex-auditor/`
 *    are permitted via `import type`; no runtime imports cross those
 *    boundaries.
 *
 * @module artifactnet-provenance
 */

export type {
  Asset,
  AssetKind,
  ExistingAudit,
  ProvenanceFinding,
  ProvenanceVerdict,
  ResidualSignature,
} from './types.js';

export type { ArtifactNetProvenanceConfig } from './settings.js';

export {
  DEFAULT_ARTIFACTNET_PROVENANCE_CONFIG,
  isArtifactNetProvenanceEnabled,
  readArtifactNetProvenanceConfig,
} from './settings.js';

export {
  amplitudeEntropy,
  adjacentSampleRepetition,
  bigramRepetition,
  blockSpectralFlatness,
  envelopeBurstiness,
  extractAudioSignature,
  extractImageSignature,
  extractResidualSignature,
  extractTextSignature,
  normalisedShannonEntropy,
  sentenceBurstiness,
  zipfDeviation,
} from './forensic-residual-detector.js';

export type { ClassifierOutput } from './sonics-detector.js';
export { classifySignature } from './sonics-detector.js';

export {
  composeWithAudit,
  preAuditHook,
  verifyProvenance,
} from './grove-audit-prehook.js';
