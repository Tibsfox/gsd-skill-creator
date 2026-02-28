/**
 * Virtual AGC rope image locator and validator.
 *
 * Catalogs unmodified Virtual AGC flight software binaries (the actual
 * Apollo software that flew to the moon) with URL generation and
 * structural validation. All sources reference virtualagc.github.io.
 *
 * @module agc/pack/rope-loader
 */

import type { Word15 } from '../types.js';

// ============================================================================
// Types
// ============================================================================

/** A Virtual AGC rope image source entry. */
export interface RopeImageSource {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly program: string;
  readonly mission: string;
  readonly version: string;
  readonly wordCount: number;
}

/** Result of locating a rope image by ID. */
export type LocateResult =
  | { readonly found: true; readonly source: RopeImageSource }
  | { readonly found: false };

/** Result of validating a rope image's structural integrity. */
export type RopeValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly error: string };

// ============================================================================
// Constants
// ============================================================================

/** Full fixed memory size in 15-bit words (36 banks x 1024 words). */
const FULL_FIXED_MEMORY_WORDS = 36864;

/** Maximum value for a 15-bit word (2^15 - 1 = 32767). */
const WORD15_MAX = 0o77777;

// ============================================================================
// Rope image source catalog
// ============================================================================

/**
 * Catalog of Virtual AGC flight software rope image sources.
 *
 * All URLs point to unmodified binaries hosted at virtualagc.github.io,
 * the canonical source maintained by the Virtual AGC project.
 */
export const ROPE_SOURCES: readonly RopeImageSource[] = [
  {
    id: 'luminary099',
    name: 'Luminary 099',
    description: 'Apollo 11 Lunar Module flight software',
    url: 'https://virtualagc.github.io/virtualagc/bindings/Luminary099/Luminary099.bin',
    program: 'Luminary',
    mission: 'Apollo 11',
    version: '099',
    wordCount: FULL_FIXED_MEMORY_WORDS,
  },
  {
    id: 'colossus249',
    name: 'Colossus 249',
    description: 'Apollo 11 Command Module flight software',
    url: 'https://virtualagc.github.io/virtualagc/bindings/Colossus249/Colossus249.bin',
    program: 'Colossus',
    mission: 'Apollo 11',
    version: '249',
    wordCount: FULL_FIXED_MEMORY_WORDS,
  },
  {
    id: 'luminary131',
    name: 'Luminary 131',
    description: 'Apollo 13 Lunar Module flight software',
    url: 'https://virtualagc.github.io/virtualagc/bindings/Luminary131/Luminary131.bin',
    program: 'Luminary',
    mission: 'Apollo 13',
    version: '131',
    wordCount: FULL_FIXED_MEMORY_WORDS,
  },
] as const;

// ============================================================================
// Functions
// ============================================================================

/**
 * Get the download URL for a rope image by source ID.
 *
 * @param id - The rope source ID (e.g. 'luminary099').
 * @returns The URL string, or undefined if the ID is not found.
 */
export function getRopeUrl(id: string): string | undefined {
  const source = ROPE_SOURCES.find((s) => s.id === id);
  return source?.url;
}

/**
 * Locate a rope image source by ID.
 *
 * @param id - The rope source ID to look up.
 * @returns LocateResult with found flag and source if found.
 */
export function locateRopeImage(id: string): LocateResult {
  const source = ROPE_SOURCES.find((s) => s.id === id);
  if (source) {
    return { found: true, source };
  }
  return { found: false };
}

/**
 * Validate a rope image's structural integrity.
 *
 * Checks: non-empty, correct length (36864 words), all values within
 * the Word15 range (0-32767). Does not perform network validation.
 *
 * @param words - Array of 15-bit word values representing the rope image.
 * @returns RopeValidation indicating valid or invalid with error message.
 */
export function validateRopeImage(words: readonly number[]): RopeValidation {
  if (words.length === 0) {
    return { valid: false, error: 'Empty rope image' };
  }

  if (words.length !== FULL_FIXED_MEMORY_WORDS) {
    return {
      valid: false,
      error: `Invalid rope image length: expected ${FULL_FIXED_MEMORY_WORDS} words, got ${words.length}`,
    };
  }

  for (let i = 0; i < words.length; i++) {
    if (words[i] < 0 || words[i] > WORD15_MAX) {
      return {
        valid: false,
        error: `Word at index ${i} out of range: ${words[i]} (must be 0-${WORD15_MAX})`,
      };
    }
  }

  return { valid: true };
}
