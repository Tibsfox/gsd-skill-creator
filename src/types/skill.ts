// Claude Code required frontmatter fields
export interface SkillMetadata {
  // Required by Claude Code
  name: string;           // max 64 chars, lowercase + hyphens only
  description: string;    // max 1024 chars, used for auto-triggering

  // Claude Code optional fields
  'disable-model-invocation'?: boolean;  // Prevent Claude from using
  'user-invocable'?: boolean;            // Allow /skill:name invocation
  'allowed-tools'?: string[];            // Restrict available tools

  // Extension: Trigger conditions (when to auto-apply)
  triggers?: SkillTrigger;

  // Extension: Learning metadata (how skill improves)
  learning?: SkillLearning;

  // Extension: State
  enabled?: boolean;       // Default true, can disable without deleting
  version?: number;        // Incremented on updates
  createdAt?: string;      // ISO timestamp
  updatedAt?: string;      // ISO timestamp

  // Extension: Inheritance
  extends?: string;        // Parent skill name to inherit from
}

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
export const SKILL_NAME_PATTERN = /^[a-z0-9-]{1,64}$/;
export const MAX_DESCRIPTION_LENGTH = 1024;

export function validateSkillName(name: string): boolean {
  return SKILL_NAME_PATTERN.test(name);
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

  // Validate extends field if provided
  if (metadata.extends !== undefined) {
    if (!validateSkillName(metadata.extends)) {
      errors.push('extends must be a valid skill name (lowercase, hyphens only, max 64 chars)');
    } else if (metadata.extends === metadata.name) {
      errors.push('skill cannot extend itself');
    }
  }

  return errors;
}
