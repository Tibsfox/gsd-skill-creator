/**
 * Type definitions for the cartridge packaging format.
 *
 * A cartridge bundles educational content with navigational structure
 * and domain-specific intelligence: deepMap + story + chipset.
 *
 * Zod schemas with .passthrough() for forward compatibility.
 */

import { z } from 'zod';

// ============================================================================
// Concept graph (deep map)
// ============================================================================

export const ConceptNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  chapter: z.number().int().positive().optional(),
  complexPlanePosition: z
    .object({
      angle: z.number().min(0).max(2 * Math.PI),
      magnitude: z.number().min(0).max(1),
    })
    .optional(),
  depth: z.enum(['glance', 'scan', 'read']),
  tags: z.array(z.string()),
}).passthrough();

export type ConceptNode = z.infer<typeof ConceptNodeSchema>;

export const ConceptConnectionSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  relationship: z.string().min(1),
  strength: z.number().min(0).max(1),
}).passthrough();

export type ConceptConnection = z.infer<typeof ConceptConnectionSchema>;

export const ProgressionPathSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  steps: z.array(z.string().min(1)).min(1),
}).passthrough();

export type ProgressionPath = z.infer<typeof ProgressionPathSchema>;

export const DeepMapSchema = z.object({
  concepts: z.array(ConceptNodeSchema).min(1),
  connections: z.array(ConceptConnectionSchema),
  entryPoints: z.array(z.string().min(1)).min(1),
  progressionPaths: z.array(ProgressionPathSchema),
}).passthrough();

export type DeepMap = z.infer<typeof DeepMapSchema>;

// ============================================================================
// Narrative thread (story arc)
// ============================================================================

export const StoryChapterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  conceptRefs: z.array(z.string()),
}).passthrough();

export type StoryChapter = z.infer<typeof StoryChapterSchema>;

export const StoryArcSchema = z.object({
  title: z.string().min(1),
  narrative: z.string().min(1),
  chapters: z.array(StoryChapterSchema).min(1),
  throughLine: z.string().min(1),
}).passthrough();

export type StoryArc = z.infer<typeof StoryArcSchema>;

// ============================================================================
// Domain intelligence (cartridge chipset)
// ============================================================================

export const CartridgeChipsetSchema = z.object({
  vocabulary: z.array(z.string()).min(1),
  orientation: z.object({
    angle: z.number().min(0).max(2 * Math.PI),
    magnitude: z.number().min(0).max(1),
  }),
  voice: z.object({
    tone: z.string().min(1),
    style: z.enum(['narrative', 'technical', 'conversational', 'observational', 'welcoming']),
  }),
  museAffinity: z.array(z.string()).optional(),
}).passthrough();

export type CartridgeChipset = z.infer<typeof CartridgeChipsetSchema>;

// ============================================================================
// Trust levels
// ============================================================================

export const CartridgeTrustSchema = z.enum(['system', 'user', 'community']);

export type CartridgeTrust = z.infer<typeof CartridgeTrustSchema>;

// ============================================================================
// Validation result
// ============================================================================

export interface CartridgeValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Cartridge (top-level)
// ============================================================================

export const CartridgeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  author: z.string().min(1),
  description: z.string().min(1),
  trust: CartridgeTrustSchema,
  deepMap: DeepMapSchema,
  story: StoryArcSchema,
  chipset: CartridgeChipsetSchema,
  dependencies: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export type Cartridge = z.infer<typeof CartridgeSchema>;

// ============================================================================
// Bundle format (serialized cartridge)
// ============================================================================

export const CartridgeBundleSchema = z.object({
  format: z.literal('cartridge-v1'),
  cartridge: CartridgeSchema,
  packedAt: z.string(),
}).passthrough();

export type CartridgeBundle = z.infer<typeof CartridgeBundleSchema>;
