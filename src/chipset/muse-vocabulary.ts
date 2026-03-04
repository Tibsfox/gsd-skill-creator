/**
 * Muse vocabulary types for domain-aware muse selection.
 *
 * Extends the muse chipset system with searchable vocabulary
 * entries that map domain terms to muse affinities.
 */

import { z } from 'zod';

// ============================================================================
// Vocabulary entry
// ============================================================================

export const MuseVocabularyEntrySchema = z.object({
  term: z.string().min(1),
  domain: z.string().min(1),
  museAffinity: z.array(z.string().min(1)).min(1).max(3),
}).passthrough();

export type MuseVocabularyEntry = z.infer<typeof MuseVocabularyEntrySchema>;

// ============================================================================
// Vocabulary index interface
// ============================================================================

export interface MuseVocabularyIndex {
  entries: MuseVocabularyEntry[];
  getByMuse(museId: string): string[];
  getByDomain(domain: string): MuseVocabularyEntry[];
  search(query: string): MuseVocabularyEntry[];
}
