/**
 * Unified derived knowledge checker.
 *
 * Composes all sub-checkers (provenance, pattern fidelity, scope drift,
 * training coherence, copying detection) into a single check that
 * produces an aggregated DerivedCheckResult.
 *
 * @module staging/derived/checker
 */

import type { LineageEntry } from '../../types/observation.js';
import type { DerivedCheckResult } from './types.js';
import type { ObservationEvidence } from './pattern-fidelity.js';
import type { TrainingPair } from './training-coherence.js';
import { buildProvenanceChain } from './provenance.js';
import { checkPatternFidelity } from './pattern-fidelity.js';
import { detectScopeDrift } from './scope-drift.js';
import { checkTrainingCoherence } from './training-coherence.js';
import { detectCopyingSignals } from './copying-detector.js';

/**
 * Input for the unified derived knowledge checker.
 */
export interface DerivedCheckInput {
  /** Artifact ID being checked. */
  artifactId: string;
  /** Lineage entries for provenance chain building. */
  lineageEntries: LineageEntry[];
  /** Skill body content for pattern fidelity check. */
  skillBody: string;
  /** Observation evidence for pattern fidelity check. */
  observationEvidence: ObservationEvidence;
  /** Skill scope items for drift detection. */
  skillScope: string[];
  /** Observed scope items for drift detection. */
  observedScope: string[];
  /** Adapter training pairs for coherence check (optional). */
  trainingPairs?: TrainingPair[];
  /** Reference texts for copying detection (optional). */
  referenceTexts?: string[];
}

/**
 * Run all derived knowledge checks and aggregate results.
 *
 * Composes provenance chain building, pattern fidelity checking,
 * scope drift detection, training coherence checking, and copying
 * signal detection into a single DerivedCheckResult.
 *
 * @param input - Unified check input containing all sub-checker inputs
 * @returns Aggregated result with all findings and pass/fail determination
 */
export function checkDerived(input: DerivedCheckInput): DerivedCheckResult {
  // 1. Build provenance chain
  const provenance = buildProvenanceChain(input.artifactId, input.lineageEntries);

  // 2. Check pattern fidelity (phantom content detection)
  const phantomFindings = checkPatternFidelity(input.skillBody, input.observationEvidence);

  // 3. Detect scope drift
  const scopeDriftFindings = detectScopeDrift(input.skillScope, input.observedScope);

  // 4. Check training coherence (skip when no pairs provided)
  const coherenceFindings = input.trainingPairs
    ? checkTrainingCoherence(input.trainingPairs)
    : [];

  // 5. Detect copying signals (skip when no reference texts provided)
  const copyingFindings = input.referenceTexts
    ? detectCopyingSignals(input.skillBody, input.referenceTexts)
    : [];

  // 6. Determine passed: no critical or warning findings across all arrays
  const allFindings = [
    ...phantomFindings,
    ...scopeDriftFindings,
    ...coherenceFindings,
    ...copyingFindings,
  ];

  const passed = !allFindings.some(
    f => f.severity === 'critical' || f.severity === 'warning',
  );

  return {
    artifactId: input.artifactId,
    provenance,
    phantomFindings,
    scopeDriftFindings,
    coherenceFindings,
    copyingFindings,
    passed,
  };
}
