import { z } from 'zod';
import { OFFICIAL_NAME_PATTERN, validateSkillName } from '../types/skill.js';
import { ReservedNameValidator, formatReservedNameError } from './reserved-names.js';
import { DescriptionQualityValidator } from './description-quality.js';

// ============================================================================
// Description Quality Validation
// ============================================================================

/**
 * Patterns that indicate activation-friendly descriptions.
 * Based on official Claude Code skill documentation.
 */
const ACTIVATION_PATTERNS = [
  /\buse when\b/i,
  /\bwhen (user|you|working|editing|creating|reviewing|debugging)/i,
  /\bactivate when\b/i,
  /\bfor (handling|processing|working with|managing|creating|editing)/i,
  /\bhelps? (with|to) \w+/i,
  /\b(asks?|mentions?|says?) ['"]?[^'"]+['"]?/i,
];

/**
 * Check if description contains activation-friendly patterns.
 *
 * @param description - The description to check
 * @returns true if description has activation patterns
 */
export function hasActivationPattern(description: string): boolean {
  return ACTIVATION_PATTERNS.some(pattern => pattern.test(description));
}

/**
 * Result of description quality validation.
 */
export interface DescriptionQualityResult {
  hasActivationTriggers: boolean;
  hasCapabilityStatement?: boolean;
  hasUseWhenClause?: boolean;
  qualityScore?: number;
  warning?: string;
  suggestions?: string[];
}

// Lazy-initialized validator singleton (avoids circular dependency at module load)
let qualityValidator: DescriptionQualityValidator | null = null;
function getQualityValidator(): DescriptionQualityValidator {
  if (!qualityValidator) {
    qualityValidator = new DescriptionQualityValidator();
  }
  return qualityValidator;
}

/**
 * Validate description quality for skill activation.
 * Returns warnings (not errors) for poor descriptions.
 *
 * Enriched with quality score, capability detection, and Use when clause detection
 * while preserving backward-compatible hasActivationTriggers behavior.
 *
 * @param description - The skill description to validate
 * @returns Quality result with optional warning and suggestions
 */
export function validateDescriptionQuality(description: string): DescriptionQualityResult {
  const assessment = getQualityValidator().validate(description);
  const hasActivation = hasActivationPattern(description);

  if (hasActivation) {
    return {
      hasActivationTriggers: true,
      hasCapabilityStatement: assessment.hasCapabilityStatement,
      hasUseWhenClause: assessment.hasUseWhenClause,
      qualityScore: assessment.qualityScore,
    };
  }

  return {
    hasActivationTriggers: false,
    hasCapabilityStatement: assessment.hasCapabilityStatement,
    hasUseWhenClause: assessment.hasUseWhenClause,
    qualityScore: assessment.qualityScore,
    warning: 'Description may not activate reliably - lacks trigger phrases',
    suggestions: [
      'Add "Use when..." to specify when this skill should activate',
      'Include specific keywords users might mention',
      'Example: "Use when working with TypeScript projects"',
    ],
  };
}

// ============================================================================
// Name Suggestion Helper
// ============================================================================

/**
 * Transform an invalid skill name into a valid suggestion.
 *
 * @param input - The invalid name to transform
 * @returns Suggested fixed name, or null if no improvement possible
 */
export function suggestFixedName(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  let fixed = input
    .toLowerCase()                    // Force lowercase
    .replace(/[^a-z0-9-]/g, '-')     // Replace invalid chars with hyphen
    .replace(/-+/g, '-')             // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, '');        // Trim leading/trailing hyphens

  // Truncate to 64 chars
  if (fixed.length > 64) {
    fixed = fixed.slice(0, 64).replace(/-+$/, '');
  }

  // Return null if no improvement or invalid result
  if (!fixed || fixed === input || !validateSkillName(fixed)) {
    return null;
  }

  return fixed;
}

// ============================================================================
// Official Skill Name Schema (Strict)
// ============================================================================

/**
 * Official Claude Code skill name schema with strict validation.
 *
 * Enforces:
 * - 1-64 characters
 * - Only lowercase letters, numbers, and hyphens
 * - Must not start or end with hyphen
 * - Must not contain consecutive hyphens (--)
 *
 * Error messages include suggestions when possible.
 */
export const OfficialSkillNameSchema = z
  .string({
    error: (iss) =>
      iss.input === undefined
        ? 'Skill name is required'
        : 'Skill name must be a string',
  })
  .min(1, 'Skill name cannot be empty')
  .max(64, {
    error: (iss) => {
      const input = iss.input as string;
      const truncated = input.slice(0, 64).replace(/-+$/, '');
      const suggested = suggestFixedName(truncated);
      return suggested
        ? `Skill name exceeds 64 characters. Suggestion: "${suggested}"`
        : `Skill name exceeds 64 characters. Maximum is 64.`;
    },
  })
  .regex(/^[a-z0-9]/, {
    error: (iss) => {
      const input = iss.input as string;
      const suggested = suggestFixedName(input);
      return suggested
        ? `Skill name must start with a lowercase letter or number (not hyphen). Did you mean: "${suggested}"?`
        : 'Skill name must start with a lowercase letter or number (not hyphen)';
    },
  })
  .regex(/[a-z0-9]$/, {
    error: (iss) => {
      const input = iss.input as string;
      const suggested = suggestFixedName(input);
      return suggested
        ? `Skill name must end with a lowercase letter or number (not hyphen). Did you mean: "${suggested}"?`
        : 'Skill name must end with a lowercase letter or number (not hyphen)';
    },
  })
  .regex(/^[a-z0-9-]+$/, {
    error: (iss) => {
      const input = iss.input as string;
      const suggested = suggestFixedName(input);
      return suggested
        ? `Invalid characters in name. Only lowercase letters, numbers, and hyphens allowed. Did you mean: "${suggested}"?`
        : 'Name must contain only lowercase letters, numbers, and hyphens';
    },
  })
  .superRefine((name, ctx) => {
    if (name.includes('--')) {
      const suggested = suggestFixedName(name);
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: suggested
          ? `Skill name cannot contain consecutive hyphens (--). Did you mean: "${suggested}"?`
          : 'Skill name cannot contain consecutive hyphens (--)',
      });
    }
  });

// ============================================================================
// Validation Result Type and Function
// ============================================================================

/**
 * Result of strict skill name validation.
 */
export interface StrictNameValidationResult {
  valid: boolean;
  errors: string[];
  suggestion?: string;
}

/**
 * Validate a skill name against official Claude Code specification.
 *
 * Returns structured result with validation status, errors, and suggestions.
 *
 * @param name - The name to validate
 * @returns Validation result with errors and suggestion
 */
export function validateSkillNameStrict(name: string): StrictNameValidationResult {
  const result = OfficialSkillNameSchema.safeParse(name);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.issues.map((issue: z.ZodIssue) => issue.message);
  const suggestion = suggestFixedName(name) ?? undefined;

  return {
    valid: false,
    errors,
    suggestion,
  };
}

// ============================================================================
// Reserved Name Validation
// ============================================================================

// Cached validator instance (lazy-loaded)
let validatorInstance: ReservedNameValidator | null = null;

async function getValidator(): Promise<ReservedNameValidator> {
  if (!validatorInstance) {
    validatorInstance = await ReservedNameValidator.load();
  }
  return validatorInstance;
}

/**
 * Result of reserved name validation.
 */
export interface ReservedNameValidationResult {
  valid: boolean;
  reserved: boolean;
  category?: string;
  reason?: string;
  error?: string;
  alternatives?: string[];
}

/**
 * Check if a name is reserved and return validation result.
 * Does NOT throw - returns structured result for caller to handle.
 *
 * @param name - The skill name to check
 * @returns Validation result with reserved status and alternatives
 */
export async function validateReservedName(name: string): Promise<ReservedNameValidationResult> {
  const validator = await getValidator();
  const check = validator.isReserved(name);

  if (!check.reserved) {
    return { valid: true, reserved: false };
  }

  const alternatives = validator.suggestAlternatives(name);
  const error = formatReservedNameError(name, check, alternatives);

  return {
    valid: false,
    reserved: true,
    category: check.entry?.category,
    reason: check.entry?.reason,
    error,
    alternatives,
  };
}

// ============================================================================
// Dual-Format Allowed-Tools Schema (SPEC-04)
// ============================================================================

/**
 * Schema for allowed-tools that accepts both array and space-delimited string formats.
 *
 * Input formats:
 * - Array: ['Read', 'Grep'] -> ['Read', 'Grep']
 * - String: 'Read Grep'     -> ['Read', 'Grep']
 * - Single:  'Read'         -> ['Read']
 * - Empty:   ''             -> []
 * - Empty:   []             -> []
 *
 * Output is always string[].
 */
export const AllowedToolsSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed === '' ? [] : trimmed.split(/\s+/);
    }
    return val;
  },
  z.array(z.string()),
);

// ============================================================================
// Legacy Schema (for backward compatibility)
// ============================================================================

// Schema for skill name: lowercase alphanumeric with hyphens, 1-64 chars
// NOTE: This is the legacy schema - use OfficialSkillNameSchema for strict validation
export const SkillNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(64, 'Name must be 64 characters or less')
  .regex(/^[a-z0-9-]+$/, 'Name must be lowercase letters, numbers, and hyphens only');

// Schema for trigger patterns
export const TriggerPatternsSchema = z.object({
  intents: z.array(z.string()).optional(),
  files: z.array(z.string()).optional(),
  contexts: z.array(z.string()).optional(),
  threshold: z.number().min(0).max(1).optional(),
});

// Schema for skill correction entries
export const SkillCorrectionSchema = z.object({
  timestamp: z.string(),
  original: z.string(),
  corrected: z.string(),
  context: z.string().optional(),
});

// Schema for learning metadata
export const SkillLearningSchema = z.object({
  applicationCount: z.number().optional(),
  feedbackScores: z.array(z.number()).optional(),
  corrections: z.array(SkillCorrectionSchema).optional(),
  lastRefined: z.string().optional(),
});

/**
 * Schema for gsd-skill-creator extension fields.
 * Used for validation when reading/writing extension data.
 */
export const GsdExtensionSchema = z.object({
  triggers: TriggerPatternsSchema.optional(),
  learning: SkillLearningSchema.optional(),
  enabled: z.boolean().optional(),
  version: z.number().optional(),
  extends: SkillNameSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/** Type inference for extension schema */
export type GsdExtension = z.infer<typeof GsdExtensionSchema>;

/**
 * Schema for the metadata.extensions container.
 * Preserves unknown extensions from other tools.
 */
export const ExtensionsContainerSchema = z.object({
  'gsd-skill-creator': GsdExtensionSchema.optional(),
}).passthrough(); // Allow other tool extensions

/**
 * Schema for the metadata container field.
 */
export const MetadataContainerSchema = z.object({
  extensions: ExtensionsContainerSchema.optional(),
}).optional();

// Full schema for skill creation input (accepts both legacy and new formats)
export const SkillInputSchema = z.object({
  name: SkillNameSchema,
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1024, 'Description must be 1024 characters or less'),

  // Claude Code optional fields
  'disable-model-invocation': z.boolean().optional(),
  'user-invocable': z.boolean().optional(),
  'allowed-tools': AllowedToolsSchema.optional(),
  'argument-hint': z.string().optional(),
  model: z.string().optional(),
  context: z.literal('fork').optional(),
  agent: z.string().optional(),
  hooks: z.record(z.string(), z.unknown()).optional(),

  // Spec-standard fields (SPEC-01)
  license: z.string().optional(),
  compatibility: z.string().max(500, 'Compatibility must be 500 characters or less').optional(),

  // New format: metadata container
  metadata: MetadataContainerSchema,

  // Legacy format: extension fields at root (still accepted for input)
  enabled: z.boolean().default(true),
  triggers: TriggerPatternsSchema.optional(),
  learning: SkillLearningSchema.optional(),
  version: z.number().optional(),
  extends: SkillNameSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough(); // Preserve unknown fields

// Type inference from schema
export type SkillInput = z.infer<typeof SkillInputSchema>;

// Validate skill input and throw on errors
export function validateSkillInput(data: unknown): SkillInput {
  const result = SkillInputSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid skill input: ${errors}`);
  }

  return result.data;
}

// Partial validation for updates
export const SkillUpdateSchema = SkillInputSchema.partial().omit({ name: true });

export type SkillUpdate = z.infer<typeof SkillUpdateSchema>;

export function validateSkillUpdate(data: unknown): SkillUpdate {
  const result = SkillUpdateSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid skill update: ${errors}`);
  }

  return result.data;
}

/**
 * Full schema for reading skill metadata from disk.
 * Validates both legacy and new formats with all official Claude Code fields.
 */
export const SkillMetadataSchema = z.object({
  // Required fields
  name: SkillNameSchema,
  description: z.string().max(1024),

  // Claude Code optional fields
  'disable-model-invocation': z.boolean().optional(),
  'user-invocable': z.boolean().optional(),
  'allowed-tools': AllowedToolsSchema.optional(),
  'argument-hint': z.string().optional(),
  model: z.string().optional(),
  context: z.literal('fork').optional(),
  agent: z.string().optional(),
  hooks: z.record(z.string(), z.unknown()).optional(),

  // Spec-standard fields (SPEC-01)
  license: z.string().optional(),
  compatibility: z.string().max(500, 'Compatibility must be 500 characters or less').optional(),

  // New format: metadata container
  metadata: MetadataContainerSchema,

  // Legacy format: extension fields at root (for backward compatibility)
  triggers: TriggerPatternsSchema.optional(),
  enabled: z.boolean().optional(),
  learning: SkillLearningSchema.optional(),
  version: z.number().optional(),
  extends: SkillNameSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough(); // Preserve unknown fields

/** Type inference for full metadata schema */
export type SkillMetadataInput = z.infer<typeof SkillMetadataSchema>;

/**
 * Validate skill metadata from disk.
 *
 * @param data - Raw metadata object
 * @returns Validated metadata
 * @throws Error if validation fails
 */
export function validateSkillMetadataSchema(data: unknown): SkillMetadataInput {
  const result = SkillMetadataSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid skill metadata: ${errors}`);
  }

  return result.data;
}

// ============================================================================
// Field Classification (SPEC-06: Standard vs Extension Awareness)
// ============================================================================

/**
 * Fields defined in the Agent Skills standard specification.
 */
export const STANDARD_FIELDS = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'] as const;

/**
 * Fields that are Claude Code extensions (not in the base Agent Skills spec).
 */
export const CLAUDE_EXTENSION_FIELDS = ['context', 'agent', 'model', 'hooks', 'disable-model-invocation', 'user-invocable', 'argument-hint'] as const;

/**
 * Fields used by gsd-skill-creator extensions (legacy root-level or internal).
 */
const GSD_EXTENSION_FIELDS = ['triggers', 'enabled', 'version', 'extends', 'createdAt', 'updatedAt', 'learning'] as const;

/**
 * Result of classifying frontmatter fields.
 */
export interface FieldClassification {
  /** Fields from the Agent Skills specification */
  standard: string[];
  /** Claude Code extension fields */
  extensions: string[];
  /** Fields not recognized in any category */
  unknown: string[];
  /** Whether the skill has gsd-skill-creator extension data */
  gsdExtension: boolean;
}

/**
 * Classify frontmatter fields as standard, extension, or unknown.
 *
 * @param metadata - Raw frontmatter object
 * @returns Classification of all fields
 */
export function classifyFields(metadata: Record<string, unknown>): FieldClassification {
  const standard: string[] = [];
  const extensions: string[] = [];
  const unknown: string[] = [];
  let gsdExtension = false;

  const standardSet = new Set<string>(STANDARD_FIELDS);
  const extensionSet = new Set<string>(CLAUDE_EXTENSION_FIELDS);
  const gsdSet = new Set<string>(GSD_EXTENSION_FIELDS);

  for (const key of Object.keys(metadata)) {
    if (standardSet.has(key)) {
      standard.push(key);
    } else if (extensionSet.has(key)) {
      extensions.push(key);
    } else if (gsdSet.has(key)) {
      gsdExtension = true;
      // Don't classify gsd fields as unknown -- they're handled by the extension system
    } else {
      unknown.push(key);
    }
  }

  // Also check for gsd data in metadata.extensions container
  if (
    metadata.metadata &&
    typeof metadata.metadata === 'object' &&
    (metadata.metadata as Record<string, unknown>).extensions &&
    typeof (metadata.metadata as Record<string, unknown>).extensions === 'object' &&
    ((metadata.metadata as Record<string, unknown>).extensions as Record<string, unknown>)['gsd-skill-creator']
  ) {
    gsdExtension = true;
  }

  return { standard, extensions, unknown, gsdExtension };
}
