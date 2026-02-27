/**
 * DACP provenance guard.
 *
 * Deep provenance validation: skill version lookup, chain-of-custody checks.
 *
 * @module interpreter/provenance-guard
 */

import type { BundleScript } from './types.js';
import type { Provenance } from '../dacp/types.js';

/** Result of validating provenance for a single script. */
export interface ProvenanceResult {
  scriptName: string;
  valid: boolean;
  reason?: string;
  warnings: string[];
}

/**
 * Validate provenance for a batch of scripts.
 *
 * @param scripts - Scripts to validate
 * @param provenance - Provenance metadata from the bundle manifest
 * @returns Validation results in same order as input scripts
 */
export function validateProvenance(
  _scripts: BundleScript[],
  _provenance: Provenance,
): ProvenanceResult[] {
  // Stub -- will be implemented in GREEN phase
  throw new Error('Not implemented');
}
