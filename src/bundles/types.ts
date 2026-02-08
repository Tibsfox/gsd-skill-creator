/**
 * Type definitions for bundle YAML files.
 *
 * Defines Zod schemas and inferred TypeScript types for:
 * - BundleSkillEntry: a skill reference within a bundle (name, required, status)
 * - BundleDefinition: complete bundle with name, skills array, optional metadata
 *
 * All schemas use .passthrough() for forward compatibility with new fields
 * added in future versions.
 */

import { z } from 'zod';

// ============================================================================
// BundleSkillEntry
// ============================================================================

/**
 * Schema for a skill entry within a bundle.
 *
 * Required: name (min 1 char)
 * Optional with defaults: required (true), status ('pending')
 */
export const BundleSkillEntrySchema = z.object({
  name: z.string().min(1),
  required: z.boolean().default(true),
  status: z.enum(['pending', 'loaded', 'applied']).default('pending'),
}).passthrough();

export type BundleSkillEntry = z.infer<typeof BundleSkillEntrySchema>;

// ============================================================================
// BundleDefinition
// ============================================================================

/**
 * Schema for a bundle definition parsed from .bundle.yaml files.
 *
 * Required: name (min 1 char), skills (min 1 entry)
 * Optional with defaults: version (1)
 * Optional without defaults: description, phase, created_at
 */
export const BundleDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.number().default(1),
  phase: z.string().optional(),
  skills: z.array(BundleSkillEntrySchema).min(1),
  created_at: z.string().optional(),
}).passthrough();

export type BundleDefinition = z.infer<typeof BundleDefinitionSchema>;
