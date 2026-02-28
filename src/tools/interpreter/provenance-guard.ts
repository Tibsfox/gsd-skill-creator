/**
 * DACP provenance guard.
 *
 * Deep provenance validation for bundle scripts: source skill presence,
 * version registration in provenance metadata, semver format checking,
 * and chain-of-custody completeness verification.
 *
 * @module interpreter/provenance-guard
 */

import type { BundleScript } from './types.js';
import type { Provenance } from '../../integrations/dacp/types.js';

// ============================================================================
// Types
// ============================================================================

/** Result of validating provenance for a single script. */
export interface ProvenanceResult {
  /** Name of the script that was validated */
  scriptName: string;

  /** Whether provenance validation passed */
  valid: boolean;

  /** Reason for failure (only present when valid is false) */
  reason?: string;

  /** Non-fatal warnings (e.g., non-semver versions, incomplete chain) */
  warnings: string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Regex for basic semver format (major.minor.patch). */
const SEMVER_REGEX = /^\d+\.\d+\.\d+/;

// ============================================================================
// Implementation
// ============================================================================

/**
 * Validate provenance for a batch of scripts.
 *
 * For each script:
 * 1. Check source_skill is non-empty (SAFE-06)
 * 2. Check source_skill exists in provenance.skill_versions
 * 3. Check version format (semver preferred)
 * 4. Check chain completeness (assembled_by, assembled_at)
 *
 * @param scripts - Scripts to validate
 * @param provenance - Provenance metadata from the bundle manifest
 * @returns Validation results in same order as input scripts
 */
export function validateProvenance(
  scripts: BundleScript[],
  provenance: Provenance,
): ProvenanceResult[] {
  if (scripts.length === 0) {
    return [];
  }

  // Pre-compute chain completeness warnings (apply to all results)
  const chainWarnings: string[] = [];
  if (!provenance.assembled_by || provenance.assembled_by.trim() === '') {
    chainWarnings.push('Provenance chain incomplete: missing assembled_by');
  }
  if (!provenance.assembled_at || provenance.assembled_at.trim() === '') {
    chainWarnings.push('Provenance chain incomplete: missing assembled_at');
  }

  return scripts.map(script => {
    const warnings: string[] = [...chainWarnings];

    // 1. Check source_skill is non-empty
    if (!script.sourceSkill || script.sourceSkill.trim() === '') {
      return {
        scriptName: script.name,
        valid: false,
        reason: 'Missing source skill',
        warnings,
      };
    }

    // 2. Check source_skill exists in skill_versions
    if (!(script.sourceSkill in provenance.skill_versions)) {
      return {
        scriptName: script.name,
        valid: false,
        reason: `Skill version not registered: '${script.sourceSkill}' not found in provenance.skill_versions`,
        warnings,
      };
    }

    // 3. Check version format
    const version = provenance.skill_versions[script.sourceSkill];
    if (!SEMVER_REGEX.test(version)) {
      warnings.push(`Non-semver version format: '${version}' for skill '${script.sourceSkill}'`);
    }

    return {
      scriptName: script.name,
      valid: true,
      warnings,
    };
  });
}
