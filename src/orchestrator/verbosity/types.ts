/**
 * Type definitions for the verbosity controller module.
 *
 * Placeholder - to be implemented in GREEN phase.
 */

import { z } from 'zod';

// TODO: Implement VerbosityLevelSchema
export const VerbosityLevelSchema = z.number();

export type VerbosityLevel = z.infer<typeof VerbosityLevelSchema>;

// TODO: Implement VERBOSITY_LEVELS constant
export const VERBOSITY_LEVELS = {} as Record<string, number>;

// TODO: Implement OutputSectionSchema
export const OutputSectionSchema = z.object({
  tag: z.string(),
  content: z.string(),
  minLevel: z.number(),
});

export type OutputSection = z.infer<typeof OutputSectionSchema>;
