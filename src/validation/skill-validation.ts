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

// Full schema for skill creation input
export const SkillInputSchema = z.object({
  name: SkillNameSchema,
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1024, 'Description must be 1024 characters or less'),
  enabled: z.boolean().default(true),
  triggers: TriggerPatternsSchema.optional(),
  'user-invocable': z.boolean().optional(),
  'disable-model-invocation': z.boolean().optional(),
  'allowed-tools': z.array(z.string()).optional(),
});

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
