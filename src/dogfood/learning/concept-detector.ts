/**
 * Concept detector — extracts named mathematical concepts from chunk text
 * using regex and heuristic patterns (not LLM).
 */

import type {
  ChunkInput,
  LearnedConcept,
  ConceptDetectionResult,
} from './types.js';
import { INITIAL_RADIUS, PART_ANGULAR_REGIONS, MAX_ANGULAR_VELOCITY } from './types.js';

/**
 * Patterns that indicate a concept definition or key term.
 * Each pattern captures the concept name.
 */
const CONCEPT_PATTERNS = [
  /\bDefinition:\s*(?:An?\s+)?([A-Z][a-z]+(?:\s+[A-Za-z]+){0,4})/g,
  /\bTheorem\s*(?:\d+(?:\.\d+)?)?\s*\(([^)]+)\)/g,
  /\b([A-Z][a-z]+(?:\s+[A-Za-z]+){0,3})\s+is\s+defined\s+as\b/g,
  /\bThe\s+([A-Z][a-z]+(?:\s+[A-Za-z]+){0,3})\s+(?:states|asserts|establishes)\b/g,
  /\b([A-Z][a-z]+(?:'s)?\s+(?:theorem|lemma|conjecture|principle|law|transform|identity|formula|equation|space|group|ring|field|series|function|operator|category|functor|morphism))\b/gi,
];

/**
 * Detect concepts from a text chunk using heuristic pattern matching.
 * Returns unique concepts not already in priorConcepts.
 */
export function detectConcepts(
  chunk: ChunkInput,
  priorConcepts: LearnedConcept[],
): ConceptDetectionResult {
  const priorNames = new Set(priorConcepts.map(c => c.name.toLowerCase().trim()));
  const detectedNames = new Set<string>();
  const concepts: LearnedConcept[] = [];
  const garbledChunks: string[] = [];
  const processingNotes: string[] = [];

  // Check for garbled content
  const nonAsciiRatio = (chunk.text.match(/[^\x20-\x7E\n\r\t]/g) || []).length / Math.max(chunk.text.length, 1);
  if (nonAsciiRatio > 0.3) {
    garbledChunks.push(chunk.id);
    processingNotes.push(`Chunk ${chunk.id} has high non-ASCII ratio (${(nonAsciiRatio * 100).toFixed(1)}%), likely garbled`);
    return { concepts, garbledChunks, processingNotes };
  }

  // Extract concepts from patterns
  for (const pattern of CONCEPT_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(chunk.text)) !== null) {
      const rawName = match[1]?.trim();
      if (!rawName || rawName.length < 3) continue;

      const normalized = rawName.toLowerCase().trim();
      if (priorNames.has(normalized) || detectedNames.has(normalized)) continue;

      detectedNames.add(normalized);
      const baseTheta = PART_ANGULAR_REGIONS[chunk.part] ?? 0;

      concepts.push({
        id: `concept-${chunk.chapter}-${concepts.length + 1}`,
        name: rawName,
        sourceChunk: chunk.id,
        sourceChapter: chunk.chapter,
        sourcePart: chunk.part,
        theta: baseTheta,
        radius: INITIAL_RADIUS,
        angularVelocity: Math.min(chunk.mathDensity * 0.15, MAX_ANGULAR_VELOCITY),
        definition: extractDefinitionContext(chunk.text, rawName),
        keyRelationships: [],
        prerequisites: [],
        applications: [],
        ecosystemMappings: [],
        confidence: computeConfidence(chunk, rawName),
        mathDensity: chunk.mathDensity,
        abstractionLevel: estimateAbstraction(chunk),
        detectedAt: new Date().toISOString(),
      });
    }
  }

  // If no patterns matched but chunk has high math density, try extracting from structure
  if (concepts.length === 0 && chunk.mathDensity > 0.5) {
    processingNotes.push(`Chunk ${chunk.id} has high math density but no named concepts detected`);
  }

  return { concepts, garbledChunks, processingNotes };
}

function extractDefinitionContext(text: string, name: string): string {
  const idx = text.toLowerCase().indexOf(name.toLowerCase());
  if (idx === -1) return `Concept: ${name}`;
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + name.length + 100);
  return text.slice(start, end).replace(/\n/g, ' ').trim();
}

function computeConfidence(chunk: ChunkInput, _name: string): number {
  // Higher confidence for definition-heavy content
  const hasDefinition = /Definition:/i.test(chunk.text);
  const hasTheorem = /Theorem/i.test(chunk.text);
  const base = 0.6;
  const defBonus = hasDefinition ? 0.15 : 0;
  const theoBonus = hasTheorem ? 0.1 : 0;
  const densityBonus = chunk.mathDensity * 0.1;
  return Math.min(base + defBonus + theoBonus + densityBonus, 1.0);
}

function estimateAbstraction(chunk: ChunkInput): number {
  // Parts 7-8 (category theory, information theory) are most abstract
  const partAbstraction: Record<number, number> = {
    1: 0.2, 2: 0.3, 3: 0.4, 4: 0.5, 5: 0.4,
    6: 0.6, 7: 0.9, 8: 0.8, 9: 0.5, 10: 0.7,
  };
  return partAbstraction[chunk.part] ?? 0.5;
}
