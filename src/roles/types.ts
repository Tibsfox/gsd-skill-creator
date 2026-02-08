/**
 * Type definitions for role YAML files.
 *
 * Defines Zod schema and inferred TypeScript type for:
 * - RoleDefinition: complete role with name, skills, constraints, tools, model
 *
 * Schema uses .passthrough() for forward compatibility with new fields
 * added in future versions.
 */

import { z } from 'zod';

// ============================================================================
// RoleDefinition
// ============================================================================

/**
 * Schema for a role definition parsed from .role.yaml files.
 *
 * Required: name (min 1 char)
 * Optional with defaults: extends (null), skills ([]), constraints ([])
 * Optional without defaults: description, tools, model
 */
export const RoleDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  extends: z.string().nullable().default(null),
  skills: z.array(z.string()).default(() => []),
  constraints: z.array(z.string()).default(() => []),
  tools: z.string().optional(),
  model: z.enum(['sonnet', 'opus', 'haiku', 'inherit']).optional(),
}).passthrough();

export type RoleDefinition = z.infer<typeof RoleDefinitionSchema>;
