import {
  getExtension,
  isLegacyFormat,
  hasExtensionData,
  type GsdSkillCreatorExtension,
} from './extensions.js';

// Re-export extension helpers for convenience
export { getExtension, isLegacyFormat, hasExtensionData, type GsdSkillCreatorExtension };

/**
 * Claude Code skill metadata interface.
 *
 * Contains both official Claude Code fields at root level and a `metadata` container
 * for extension fields. Legacy extension fields at root are preserved for backward
 * compatibility but deprecated - use getExtension() to access extension data.
 */
export interface SkillMetadata {
  // Required by Claude Code
  name: string;           // max 64 chars, lowercase + hyphens only
  description: string;    // max 1024 chars, used for auto-triggering

  // Claude Code optional fields
  'disable-model-invocation'?: boolean;  // Prevent Claude from using
  'user-invocable'?: boolean;            // Allow /skill:name invocation
  'allowed-tools'?: string[] | string;    // Restrict available tools (array or space-delimited string)
  'argument-hint'?: string;              // Hint for user invocation arguments
  model?: string;                        // Model override for skill execution
  context?: 'fork';                      // Fork context for isolated execution
  agent?: string;                        // Agent reference for skill
  hooks?: Record<string, unknown>;       // Lifecycle hooks configuration
  license?: string;                      // SPDX license identifier or free text
  compatibility?: string;                // Compatibility notes (max 500 chars)

  // Official metadata container for extensions
  metadata?: {
    extensions?: {
      'gsd-skill-creator'?: GsdSkillCreatorExtension;
      /** Preserve unknown extensions from other tools */
      [key: string]: unknown;
    };
  };

  // LEGACY: These fields are deprecated, use metadata.extensions.gsd-skill-creator
  // Kept for backward compatibility - getExtension() handles both locations

  /** @deprecated Use getExtension(metadata).triggers */
  triggers?: SkillTrigger;

  /** @deprecated Use getExtension(metadata).learning */
  learning?: SkillLearning;

  /** @deprecated Use getExtension(metadata).enabled */
  enabled?: boolean;

  /** @deprecated Use getExtension(metadata).version */
  version?: number;

  /** @deprecated Use getExtension(metadata).createdAt */
  createdAt?: string;

  /** @deprecated Use getExtension(metadata).updatedAt */
  updatedAt?: string;

  /** @deprecated Use getExtension(metadata).extends */
  extends?: string;
}

/**
 * Official Claude Code skill metadata (without legacy extension fields).
 * Use this type for write operations to ensure clean output format.
 */
export type OfficialSkillMetadata = Omit<
  SkillMetadata,
  'triggers' | 'learning' | 'enabled' | 'version' | 'extends' | 'createdAt' | 'updatedAt'
>;

// Trigger conditions for auto-activation
export interface SkillTrigger {
  // Match user intent patterns (regex or keywords)
  intents?: string[];

  // Match file patterns being worked on (glob)
  files?: string[];

  // Match context patterns (e.g., "in GSD planning phase")
  contexts?: string[];

  // Minimum confidence score to activate (0-1)
  threshold?: number;
}

// Learning metadata for skill refinement
export interface SkillLearning {
  // How many times skill has been applied
  applicationCount?: number;

  // User feedback scores (1-5)
  feedbackScores?: number[];

  // Corrections/overrides captured
  corrections?: SkillCorrection[];

  // Last refinement timestamp
  lastRefined?: string;
}

export interface SkillCorrection {
  timestamp: string;
  original: string;
  corrected: string;
  context?: string;
}

// Complete skill representation
export interface Skill {
  metadata: SkillMetadata;
  body: string;           // Markdown content
  path: string;           // File path for reference
}

// Validation helpers
// LEGACY: Too permissive - allows ---, -foo, foo-
export const SKILL_NAME_PATTERN = /^[a-z0-9-]{1,64}$/;

// Official pattern from agentskills.io specification
// - Must start and end with alphanumeric (not hyphen)
// - Single char names allowed (just alphanumeric)
// - Still need separate check for consecutive hyphens (--)
export const OFFICIAL_NAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export const MAX_DESCRIPTION_LENGTH = 1024;

/**
 * Validate skill name against official Claude Code specification.
 *
 * Rules:
 * - 1-64 characters
 * - Only lowercase letters, numbers, and hyphens
 * - Must not start or end with hyphen
 * - Must not contain consecutive hyphens (--)
 *
 * @param name - Skill name to validate
 * @returns true if valid, false otherwise
 */
export function validateSkillName(name: string): boolean {
  return (
    name.length >= 1 &&
    name.length <= 64 &&
    OFFICIAL_NAME_PATTERN.test(name) &&
    !name.includes('--')
  );
}

export function validateSkillMetadata(metadata: SkillMetadata): string[] {
  const errors: string[] = [];

  if (!metadata.name) {
    errors.push('name is required');
  } else if (!validateSkillName(metadata.name)) {
    errors.push('name must be lowercase, hyphens only, max 64 chars');
  }

  if (!metadata.description) {
    errors.push('description is required');
  } else if (metadata.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`description exceeds ${MAX_DESCRIPTION_LENGTH} chars`);
  }

  // Validate extends field - check both root (legacy) and extension location
  const ext = getExtension(metadata);
  const extendsValue = metadata.extends ?? ext.extends;

  if (extendsValue !== undefined) {
    if (!validateSkillName(extendsValue)) {
      errors.push('extends must be a valid skill name (lowercase, hyphens only, max 64 chars)');
    } else if (extendsValue === metadata.name) {
      errors.push('skill cannot extend itself');
    }
  }

  return errors;
}
