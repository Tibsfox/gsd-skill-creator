// === Extraction Heuristic Registry ===
//
// Pluggable heuristic library for domain-specific extraction patterns.
// Each heuristic targets a specific ContentType and provides regex patterns
// for extracting primitives from document sections.
//
// Extensible: new heuristics can be registered at runtime via registerHeuristic.

import type { ContentType } from '../analyzer.js';
import type { PrimitiveType } from '../../core/types/mfe-types.js';
import { mathHeuristic } from './math-heuristic.js';
import { codeHeuristic } from './code-heuristic.js';
import { tutorialHeuristic } from './tutorial-heuristic.js';
import { specHeuristic } from './spec-heuristic.js';
import { paperHeuristic } from './paper-heuristic.js';

// === Public types ===

export interface ExtractionPattern {
  regex: RegExp;
  primitiveType: PrimitiveType;
  nameGroup: number;    // Capture group index for the primitive name
  contentGroup: number; // Capture group index for the content/formal statement
  sectionGroup?: number; // Optional: capture group for section number
}

export interface ExtractionHeuristic {
  id: string;
  contentType: ContentType;
  description: string;
  patterns: ExtractionPattern[];
  /** Post-process extracted text into a cleaner formal statement */
  refineFormalStatement(raw: string): string;
  /** Generate a computational form from the formal statement */
  deriveComputationalForm(formalStatement: string, type: PrimitiveType): string;
}

// === Internal registry ===

const registry = new Map<string, ExtractionHeuristic>();

// === Public API ===

/**
 * Get a heuristic for the given content type.
 * Returns null if no heuristic is registered for that type.
 */
export function getHeuristic(contentType: ContentType | string): ExtractionHeuristic | null {
  return registry.get(contentType) || null;
}

/**
 * Register a heuristic. Overwrites if same contentType already registered.
 */
export function registerHeuristic(heuristic: ExtractionHeuristic): void {
  registry.set(heuristic.contentType, heuristic);
}

// === Built-in heuristics ===

export const BUILTIN_HEURISTICS: ExtractionHeuristic[] = [
  mathHeuristic,
  codeHeuristic,
  tutorialHeuristic,
  specHeuristic,
  paperHeuristic,
];

// Register all built-in heuristics on module init
for (const h of BUILTIN_HEURISTICS) {
  registerHeuristic(h);
}
