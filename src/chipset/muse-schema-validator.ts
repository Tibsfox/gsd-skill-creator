/**
 * Muse chipset schema validation.
 *
 * Zod-based validation for muse chipset YAML objects. Provides:
 * - validateMuseChipset: validate a parsed YAML object against MuseChipsetSchema
 * - isMuseChipset: discriminator — true if the object has a museType field
 * - getMuseOrientation: convert polar (angle, magnitude) to PlanePosition
 *
 * All six system muses (foxy, lex, hemlock, sam, cedar, willow) validate
 * against MuseChipsetSchema. Standard chipsets without museType do not.
 */

import { z } from 'zod';

// ============================================================================
// Public types
// ============================================================================

/** Well-known system muse identifiers. */
export type MuseId = 'foxy' | 'lex' | 'hemlock' | 'sam' | 'cedar' | 'willow';

/** Result of a schema validation attempt. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** A point on the complex plane in Cartesian coordinates. */
export interface PlanePosition {
  real: number;
  imaginary: number;
}

// ============================================================================
// Zod schemas
// ============================================================================

const MuseOrientationSchema = z.object({
  angle: z.number().min(0).max(2 * Math.PI),
  magnitude: z.number().min(0).max(1),
});

const MuseVoiceSchema = z.object({
  tone: z.string(),
  style: z.enum(['narrative', 'technical', 'conversational', 'observational', 'welcoming']),
  signature: z.string().optional(),
});

const MuseChipsetSchema = z
  .object({
    name: z.string(),
    version: z.string(),
    museType: z.enum(['system', 'user', 'community']),
    totalBudget: z.number().optional(),
    orientation: MuseOrientationSchema,
    vocabulary: z.array(z.string()).max(100).optional(),
    voice: MuseVoiceSchema,
    activationPatterns: z.array(z.string()).max(20).optional(),
    composableWith: z.array(z.string()).optional(),
  })
  .passthrough(); // Allow additional chipset fields (backward compatible)

// ============================================================================
// Exported functions
// ============================================================================

/**
 * Validate a parsed YAML object against the muse chipset schema.
 *
 * Returns {valid: true, errors: []} on success.
 * Returns {valid: false, errors: [...]} with human-readable messages on failure.
 */
export function validateMuseChipset(yaml: unknown): ValidationResult {
  const result = MuseChipsetSchema.safeParse(yaml);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  const errors = result.error.issues.map(
    (e) => `${e.path.join('.')}: ${e.message}`
  );
  return { valid: false, errors };
}

/**
 * Discriminator: returns true if the object has a museType field.
 *
 * Safe to call on any chipset — never throws. Standard chipsets
 * (without museType) return false without modification.
 */
export function isMuseChipset(chipset: Record<string, unknown>): boolean {
  return 'museType' in chipset && chipset['museType'] !== undefined;
}

/**
 * Convert polar orientation to a Cartesian PlanePosition.
 *
 * Applies: real = magnitude * cos(angle), imaginary = magnitude * sin(angle)
 *
 * Returns null if the chipset has no orientation field.
 */
export function getMuseOrientation(chipset: Record<string, unknown>): PlanePosition | null {
  const orientation = chipset['orientation'];
  if (
    orientation === null ||
    orientation === undefined ||
    typeof orientation !== 'object'
  ) {
    return null;
  }
  const { angle, magnitude } = orientation as { angle: number; magnitude: number };
  return {
    real: magnitude * Math.cos(angle),
    imaginary: magnitude * Math.sin(angle),
  };
}
