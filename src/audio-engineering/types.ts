/**
 * Type definitions for the audio engineering educational pack.
 *
 * Defines domain types for audio concepts extracted from the
 * 27-chapter audio-synthesis-reference. Zod schemas with
 * .passthrough() for forward compatibility.
 */

import { z } from 'zod';

// ============================================================================
// Audio domains
// ============================================================================

export const AudioDomainSchema = z.enum([
  'acoustics',
  'synthesis',
  'protocols',
  'mixing',
  'production',
  'culture',
]);

export type AudioDomain = z.infer<typeof AudioDomainSchema>;

// ============================================================================
// Audio concept
// ============================================================================

export const AudioConceptSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  domain: AudioDomainSchema,
  chapter: z.number().int().min(1).max(27),
  summary: z.string().min(1),
  meshMapping: z.string().optional(),
  complexPlanePosition: z
    .object({
      angle: z.number().min(0).max(2 * Math.PI),
      magnitude: z.number().min(0).max(1),
    })
    .optional(),
  relatedConcepts: z.array(z.string()),
  keywords: z.array(z.string()).min(2),
}).passthrough();

export type AudioConcept = z.infer<typeof AudioConceptSchema>;

// ============================================================================
// Audio engineering pack interface
// ============================================================================

export interface AudioEngineeringPack {
  name: 'audio-engineering';
  version: string;
  domains: AudioDomain[];
  concepts: AudioConcept[];
  getConcept(id: string): AudioConcept | undefined;
  getByDomain(domain: AudioDomain): AudioConcept[];
  getByChapter(chapter: number): AudioConcept[];
  search(query: string): AudioConcept[];
}
