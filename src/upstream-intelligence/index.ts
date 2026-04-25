/**
 * Upstream Intelligence — registry of v1.49.573 Half B module APIs.
 *
 * This barrel re-exports the public surface of the ten new modules introduced
 * by Phases 765–774 for integration testing under `__tests__/`. It is the
 * single import-point used by `__tests__/integration.test.ts` and the four
 * specialised suites (cross-milestone, stability-rail, capcom-sweep,
 * composition-flag-off-byte-identical, live-config-flag-off).
 *
 * No production code outside `src/upstream-intelligence/__tests__/` is
 * expected to import this barrel; the integration suites alone use it as the
 * Gate G14 closure surface.
 *
 * Phase 775 (v1.49.573 W9 Integration + composition + flag-off byte-identical
 * regression). CAPCOM Gate G14 — hard composition.
 *
 * @module upstream-intelligence
 */

// ---------------------------------------------------------------------------
// T1 modules (Phases 765–768)
// ---------------------------------------------------------------------------
export * as skilldexAuditor from '../skilldex-auditor/index.js';
export * as boundedLearningEmpirical from '../bounded-learning-empirical/index.js';
export * as activationSteering from '../activation-steering/index.js';
export * as flThreatModel from '../fl-threat-model/index.js';

// ---------------------------------------------------------------------------
// T2 modules (Phases 769–772)
// ---------------------------------------------------------------------------
export * as experienceCompression from '../experience-compression/index.js';
export * as predictiveSkillLoader from '../predictive-skill-loader/index.js';
export * as promptClusterBatchEffect from '../promptcluster-batcheffect/index.js';
export * as artifactNetProvenance from '../artifactnet-provenance/index.js';

// ---------------------------------------------------------------------------
// T3 modules (Phases 773–774)
// ---------------------------------------------------------------------------
export * as stackelbergPricing from '../stackelberg-pricing/index.js';
export * as rumorDelayModel from '../rumor-delay-model/index.js';

// ---------------------------------------------------------------------------
// Cross-milestone composition partners (v1.49.572 mathematical-foundations)
// ---------------------------------------------------------------------------
export * as coherentFunctors from '../coherent-functors/index.js';
export * as ricciCurvatureAudit from '../ricci-curvature-audit/index.js';
export * as semanticChannel from '../semantic-channel/index.js';
export * as koopmanMemory from '../koopman-memory/index.js';
export * as hourglassPersistence from '../hourglass-persistence/index.js';
export * as wassersteinHebbian from '../wasserstein-hebbian/index.js';
export * as tonnetz from '../tonnetz/index.js';

// ---------------------------------------------------------------------------
// Stability rails
// ---------------------------------------------------------------------------
export * as lyapunov from '../lyapunov/index.js';
export * as deadZone from '../dead-zone/index.js';

/**
 * The 10 v1.49.573 module names. Used by the source-regex sweep + flag-off
 * suite to enumerate every new directory under `src/`.
 */
export const NEW_MODULE_DIRS = [
  'skilldex-auditor',
  'bounded-learning-empirical',
  'activation-steering',
  'fl-threat-model',
  'experience-compression',
  'predictive-skill-loader',
  'promptcluster-batcheffect',
  'artifactnet-provenance',
  'stackelberg-pricing',
  'rumor-delay-model',
] as const;

/**
 * Modules whose source must be byte-identical pre-vs-post the flag-off
 * regression test. These are the "preservation set" for Gate G14 closure.
 */
export const PRESERVED_MODULE_DIRS = [
  'orchestration',
  'dacp',
  'memory',
  'coherent-functors',
  'ricci-curvature-audit',
  'semantic-channel',
  'koopman-memory',
  'hourglass-persistence',
  'wasserstein-hebbian',
  'tonnetz',
] as const;
