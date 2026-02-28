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

// --- Detection patterns ---

/** Patterns matching definition blocks: "Definition: X is ..." */
const DEFINITION_PATTERN =
  /(?:Definition|Def\.)\s*(?:\d+(?:\.\d+)*)?\s*[.:\s]+(?:An?\s+)?(.+?)(?=\n\n|\n(?:Definition|Theorem|Proof|Lemma)|$)/gis;

/** Patterns matching theorem statements: "Theorem 3.1: ..." */
const THEOREM_PATTERN =
  /(?:Theorem|Thm\.)\s*(?:\d+(?:\.\d+)*)?\s*[.:\s]+(.+?)(?=\n\n|\nProof|$)/gis;

/** Prerequisite phrases */
const PREREQUISITE_PATTERN =
  /(?:requires?\s+(?:knowledge\s+of\s+)?|assumes?\s+(?:knowledge\s+of\s+)?|building\s+on|prerequisite[s]?\s*(?::\s*|are\s+|is\s+))(.+?)(?=[.]|\n|$)/gi;

/** Relationship phrases */
const RELATIONSHIP_PATTERN =
  /(?:related\s+to|extends|generalizes|special\s+case\s+of|connected\s+to|associated\s+with)\s+(.+?)(?=[.]|\n|$)/gi;

/** Application phrases */
const APPLICATION_PATTERN =
  /(?:used\s+in|applied\s+to|application\s+in|application[s]?\s+(?:include|are))\s+(.+?)(?=[.]|\n|$)/gi;

/** Garbled LaTeX detection */
const GARBLED_LATEX_PATTERNS = [
  /\\frac\{[^}]*$/m,           // unmatched \frac{
  /\\begin\{(?!.*\\end\{)/s,   // \begin{ without \end{
  /\\[a-z]+\{(?![^{}]*\})/,    // any \command{ without closing }
];

/**
 * Extract the concept name from a definition or theorem match.
 * Returns the first meaningful noun phrase.
 */
function extractConceptName(text: string): string {
  // Clean up the matched text
  const cleaned = text.replace(/\s+/g, ' ').trim();

  // For definitions like "X is Y", extract X
  const isMatch = cleaned.match(/^(.+?)\s+is\s+/i);
  if (isMatch) {
    return isMatch[1].replace(/^(?:an?\s+|the\s+)/i, '').trim();
  }

  // For "Every X ..." or "Any X ..."
  const everyMatch = cleaned.match(/^(?:every|any|each)\s+(.+?)(?:\s+(?:on|in|is|has|can)\s)/i);
  if (everyMatch) {
    return everyMatch[1].trim();
  }

  // Take first noun-phrase-like segment (up to 5 words starting with capital)
  const words = cleaned.split(/\s+/).slice(0, 5);
  const nameWords: string[] = [];
  for (const w of words) {
    if (nameWords.length > 0 && /^(?:is|are|was|the|a|an|of|in|on|for|with|that|which|has|have)$/i.test(w)) break;
    nameWords.push(w);
  }
  return nameWords.join(' ').replace(/[.,;:!?]+$/, '');
}

/**
 * Extract items from a comma/and separated list in a match.
 */
function extractListItems(text: string): string[] {
  return text
    .split(/\s*(?:,\s*(?:and\s+)?|(?:\s+and\s+))\s*/i)
    .map(s => s.trim()
      .replace(/[.,;:!?]+$/, '')
      .replace(/\s+as\s+(?:a\s+)?prerequisites?$/i, '')
      .replace(/\s+(?:which|that|where|when)\s.*$/i, '')
      .trim())
    .filter(s => s.length > 0 && s.length < 80);
}

/**
 * Detect concepts from a text chunk using heuristic pattern matching.
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

  // Check for garbled LaTeX
  const hasGarbledLatex = GARBLED_LATEX_PATTERNS.some(p => p.test(chunk.text));
  if (hasGarbledLatex) {
    garbledChunks.push(chunk.id);
    processingNotes.push(`Chunk ${chunk.id} contains garbled LaTeX — processing readable content`);
  }

  // Extract all prerequisites from the full chunk text
  const allPrerequisites = extractAllMatches(chunk.text, PREREQUISITE_PATTERN);
  const allRelationships = extractAllMatches(chunk.text, RELATIONSHIP_PATTERN);
  const allApplications = extractAllMatches(chunk.text, APPLICATION_PATTERN);

  // Phase 1: Detect from definition blocks
  DEFINITION_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = DEFINITION_PATTERN.exec(chunk.text)) !== null) {
    const bodyText = match[1].trim();
    const name = extractConceptName(bodyText);
    if (!name || name.length < 2) continue;

    const normalized = name.toLowerCase().trim();
    if (priorNames.has(normalized) || detectedNames.has(normalized)) continue;
    detectedNames.add(normalized);

    const concept = buildConcept(chunk, name, bodyText, 0.85, allPrerequisites, allRelationships, allApplications, concepts.length);
    concepts.push(concept);
  }

  // Phase 2: Detect from theorem statements
  THEOREM_PATTERN.lastIndex = 0;
  while ((match = THEOREM_PATTERN.exec(chunk.text)) !== null) {
    const bodyText = match[1].trim();
    const name = extractConceptName(bodyText);
    if (!name || name.length < 2) continue;

    const normalized = name.toLowerCase().trim();
    if (priorNames.has(normalized) || detectedNames.has(normalized)) continue;
    detectedNames.add(normalized);

    const concept = buildConcept(chunk, name, bodyText, 0.80, allPrerequisites, allRelationships, allApplications, concepts.length);
    concepts.push(concept);
  }

  // Phase 3: Heading-derived concepts (lower confidence)
  const headingPattern = /^#+\s+(.+)$/gm;
  headingPattern.lastIndex = 0;
  while ((match = headingPattern.exec(chunk.text)) !== null) {
    const name = match[1].trim().replace(/[.,;:!?]+$/, '');
    if (!name || name.length < 3) continue;

    const normalized = name.toLowerCase().trim();
    if (priorNames.has(normalized) || detectedNames.has(normalized)) continue;
    detectedNames.add(normalized);

    const concept = buildConcept(chunk, name, `Section heading: ${name}`, 0.6, allPrerequisites, allRelationships, allApplications, concepts.length);
    concepts.push(concept);
  }

  // If no patterns matched but chunk has high math density, note it
  if (concepts.length === 0 && chunk.mathDensity > 0.5) {
    processingNotes.push(`Chunk ${chunk.id} has high math density but no named concepts detected`);
  }

  return { concepts, garbledChunks, processingNotes };
}

/**
 * Build a LearnedConcept from detected data.
 */
function buildConcept(
  chunk: ChunkInput,
  name: string,
  definition: string,
  confidence: number,
  allPrerequisites: string[],
  allRelationships: string[],
  allApplications: string[],
  conceptIndex: number,
): LearnedConcept {
  const baseTheta = PART_ANGULAR_REGIONS[chunk.part] ?? 0;

  return {
    id: `${chunk.chapter}-${conceptIndex}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    sourceChunk: chunk.id,
    sourceChapter: chunk.chapter,
    sourcePart: chunk.part,
    theta: baseTheta,
    radius: INITIAL_RADIUS,
    angularVelocity: 0,
    definition,
    keyRelationships: allRelationships,
    prerequisites: allPrerequisites,
    applications: allApplications,
    ecosystemMappings: [],
    confidence,
    mathDensity: chunk.mathDensity,
    abstractionLevel: baseTheta / (2 * Math.PI),
    detectedAt: new Date().toISOString(),
  };
}

/**
 * Extract all list-item matches from a pattern across the full text.
 */
function extractAllMatches(text: string, pattern: RegExp): string[] {
  const results: string[] = [];
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const items = extractListItems(match[1]);
    results.push(...items);
  }
  return [...new Set(results)];
}
