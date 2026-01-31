import { z } from 'zod';

// Schema for skill name: lowercase alphanumeric with hyphens, 1-64 chars
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
  'allowed-tools': z.array(z.string()).optional(),
  'argument-hint': z.string().optional(),
  model: z.string().optional(),
  context: z.literal('fork').optional(),
  agent: z.string().optional(),
  hooks: z.record(z.string(), z.unknown()).optional(),

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
  'allowed-tools': z.array(z.string()).optional(),
  'argument-hint': z.string().optional(),
  model: z.string().optional(),
  context: z.literal('fork').optional(),
  agent: z.string().optional(),
  hooks: z.record(z.string(), z.unknown()).optional(),

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
