/**
 * Capability reference validator.
 *
 * Checks capability references (use/after/adapt verbs) against a
 * CapabilityManifest to detect references to unknown capabilities.
 * Create verbs bypass validation since they declare intent to produce
 * new capabilities.
 */

import type {
  CapabilityManifest,
  CapabilityRef,
  CapabilityVerb,
} from './types.js';

// ============================================================================
// Result Types
// ============================================================================

/**
 * A warning about a capability reference that could not be resolved
 * against the manifest.
 */
export interface ValidationWarning {
  /** The full capability string, e.g. "skill/unknown-skill" */
  capability: string;
  /** The verb used in the reference */
  verb: CapabilityVerb;
  /** Where the reference was declared, e.g. "Phase 55" or "55-01-PLAN.md" */
  source: string;
  /** Human-readable warning message */
  message: string;
}

/**
 * The result of validating a set of capability declarations.
 *
 * valid is true only when there are zero warnings.
 */
export interface ValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
}

// ============================================================================
// Validator
// ============================================================================

/**
 * Validates capability references against a known manifest.
 *
 * Builds O(1) lookup sets from the manifest's skills, agents, and teams
 * arrays. References with `create` verb always pass; references with
 * `use`, `after`, or `adapt` must resolve to an entry in the manifest.
 */
export class CapabilityValidator {
  private readonly skillNames: Set<string>;
  private readonly agentNames: Set<string>;
  private readonly teamNames: Set<string>;

  constructor(manifest: CapabilityManifest) {
    this.skillNames = new Set(manifest.skills.map((s) => s.name));
    this.agentNames = new Set(manifest.agents.map((a) => a.name));
    this.teamNames = new Set(manifest.teams.map((t) => t.name));
  }

  /**
   * Validate an array of capability declarations against the manifest.
   *
   * @param declarations - Capability references to validate
   * @param source - Label for where the declarations came from (for warning messages)
   * @returns Validation result with any warnings
   */
  validateDeclarations(
    declarations: CapabilityRef[],
    source: string
  ): ValidationResult {
    const warnings: ValidationWarning[] = [];

    for (const ref of declarations) {
      // Create verb bypasses validation -- it declares intent to produce
      if (ref.verb === 'create') continue;

      const lookup = this.getLookup(ref.type);
      if (!lookup.has(ref.name)) {
        const capability = `${ref.type}/${ref.name}`;
        warnings.push({
          capability,
          verb: ref.verb,
          source,
          message: `Capability "${capability}" not found in manifest (verb: ${ref.verb})`,
        });
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Get the name lookup set for a given capability type.
   */
  private getLookup(type: 'skill' | 'agent' | 'team'): Set<string> {
    switch (type) {
      case 'skill':
        return this.skillNames;
      case 'agent':
        return this.agentNames;
      case 'team':
        return this.teamNames;
    }
  }
}
