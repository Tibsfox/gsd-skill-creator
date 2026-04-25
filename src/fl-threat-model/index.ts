/**
 * FL Threat-Model Gate — public API.
 *
 * Structural pre-rollout gate that blocks unauthorized federated-training
 * paths until the data-free MIA threat model is explicitly addressed in
 * calling code's design document.
 *
 * This module is GATE-ONLY. No federated training is implemented here.
 * No touches to src/orchestration/, src/capcom/, or src/dacp/.
 *
 * Primary sources (Lee et al. trio, all submitted 21 April 2026):
 *   arXiv:2604.19891  Data-Free MIA (SCLL-prior gradient-inversion attack)
 *   arXiv:2604.19915  DECIFR (domain-aware targeted exfiltration)
 *   arXiv:2604.20020  FL Hardware Assurance Survey (threat taxonomy)
 *
 * Canonical spec:
 *   .planning/missions/arxiv-eess-integration-apr17-23/work/templates/m4-mia-threat-model.tex
 *
 * Phase: 768 (T1d W5 FL Pre-Rollout Threat-Model Gate)
 * UIP: UIP-16
 * CAPCOM gate: G14 (composition — flag-off byte-identical)
 *
 * Default-off: when `upstream-intelligence.fl-threat-model.enabled` is false
 * (or unreadable), every API call returns `{ verdict: 'gate-disabled', ... }`.
 *
 * @module fl-threat-model
 */

export type {
  DesignDoc,
  GateVerdict,
  GateVerdictState,
  Mitigation,
  BlockOnCondition,
  FlThreatModelBlock,
  MitigationsSpec,
  DifferentialPrivacySpec,
  GradientClippingSpec,
  SecureAggregationSpec,
  PerClientDataCapSpec,
  DecifirAssessmentSpec,
  DoltHubDelineationSpec,
} from './types.js';

export { isFlThreatModelEnabled, readFlThreatModelConfig } from './settings.js';
export type { FlThreatModelConfig } from './settings.js';

export { MANDATORY_MITIGATIONS, checkMitigationMatrix, allMitigationsPass } from './mitigation-matrix.js';
export type { MitigationCheckResult } from './mitigation-matrix.js';

export { BLOCK_ON_ENTRIES, evaluateBlockOnConditions } from './block-on-conditions.js';
export type { BlockOnEntry, BlockOnCheckFn } from './block-on-conditions.js';

export {
  parseDesignDocContent,
  loadDesignDoc,
  extractFrontmatter,
  findMissingCites,
  REQUIRED_ARXIV_IDS,
} from './yaml-validator.js';
export type { ParseResult } from './yaml-validator.js';

import type { DesignDoc, GateVerdict } from './types.js';
import { isFlThreatModelEnabled } from './settings.js';
import { evaluateBlockOnConditions } from './block-on-conditions.js';
import { loadDesignDoc, parseDesignDocContent } from './yaml-validator.js';

// ============================================================================
// Core gate functions
// ============================================================================

/**
 * Evaluate the pre-rollout gate against a pre-parsed design doc.
 *
 * When the opt-in flag is off, returns `{ verdict: 'gate-disabled', blocks: [], messages: [] }`.
 *
 * @param designDoc    Already-parsed design document.
 * @param settingsPath Optional override for the settings file location.
 */
export function gatePreRollout(
  designDoc: DesignDoc,
  settingsPath?: string,
): GateVerdict {
  const timestamp = new Date().toISOString();

  if (!isFlThreatModelEnabled(settingsPath)) {
    return {
      verdict: 'gate-disabled',
      blocks: [],
      messages: [],
      timestamp,
      sourcePath: designDoc.sourcePath,
    };
  }

  const fired = evaluateBlockOnConditions(designDoc);
  if (fired.length === 0) {
    return {
      verdict: 'pass',
      blocks: [],
      messages: [],
      timestamp,
      sourcePath: designDoc.sourcePath,
    };
  }

  return {
    verdict: 'block',
    blocks: fired.map((e) => e.condition.key),
    messages: fired.map((e) => e.condition.description),
    timestamp,
    sourcePath: designDoc.sourcePath,
  };
}

/**
 * Load a design-doc from `yamlPath` and evaluate the pre-rollout gate.
 *
 * Convenience wrapper over `loadDesignDoc` + `gatePreRollout`.
 *
 * When the opt-in flag is off, returns `{ verdict: 'gate-disabled', ... }`.
 * When the file cannot be read or parsed, returns `{ verdict: 'block', ... }`.
 *
 * @param yamlPath     Path to the design-doc file (YAML or Markdown+frontmatter).
 * @param settingsPath Optional override for the settings file location.
 */
export function validateDesignDoc(
  yamlPath: string,
  settingsPath?: string,
): GateVerdict {
  const timestamp = new Date().toISOString();

  if (!isFlThreatModelEnabled(settingsPath)) {
    return {
      verdict: 'gate-disabled',
      blocks: [],
      messages: [],
      timestamp,
      sourcePath: yamlPath,
    };
  }

  const { doc, parseError } = loadDesignDoc(yamlPath);
  if (parseError) {
    return {
      verdict: 'block',
      blocks: ['file.parse_error'],
      messages: [parseError],
      timestamp,
      sourcePath: yamlPath,
    };
  }

  return gatePreRollout(doc, settingsPath);
}

/**
 * Convenience: parse a YAML string (rather than a file path) and run the gate.
 *
 * Useful in tests and for programmatic callers that build the design-doc in
 * memory.
 *
 * @param yamlContent  Raw YAML string (or Markdown with frontmatter).
 * @param settingsPath Optional override for the settings file location.
 * @param sourcePath   Optional source label for diagnostics.
 */
export function validateDesignDocContent(
  yamlContent: string,
  settingsPath?: string,
  sourcePath?: string,
): GateVerdict {
  const timestamp = new Date().toISOString();

  if (!isFlThreatModelEnabled(settingsPath)) {
    return {
      verdict: 'gate-disabled',
      blocks: [],
      messages: [],
      timestamp,
      sourcePath,
    };
  }

  const { doc, parseError } = parseDesignDocContent(yamlContent, sourcePath);
  if (parseError) {
    return {
      verdict: 'block',
      blocks: ['file.parse_error'],
      messages: [parseError],
      timestamp,
      sourcePath,
    };
  }

  return gatePreRollout(doc, settingsPath);
}
