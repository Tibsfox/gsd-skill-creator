/**
 * Vision document validator, quality checker, and archetype classifier.
 *
 * Provides pure functions for post-parse validation of VisionDocument objects:
 * - validateVisionDocument(): structural completeness checks
 * - checkQuality(): content quality analysis
 * - classifyArchetype(): keyword-weighted document classification
 *
 * All functions return structured diagnostics (VisionDiagnostic[]) or
 * an Archetype classification string.
 *
 * @module vtm/vision-validator
 */

import type { VisionDocument } from './types.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Structured diagnostic with severity, section context, message, and code. */
export interface VisionDiagnostic {
  severity: 'error' | 'warning' | 'info';
  section: string;
  message: string;
  code: string;
}

/** Document archetype classification. */
export type Archetype =
  | 'educational-pack'
  | 'infrastructure-component'
  | 'organizational-system'
  | 'creative-tool';

// ---------------------------------------------------------------------------
// Keyword sets for archetype classification
// ---------------------------------------------------------------------------

const ARCHETYPE_KEYWORDS: Record<Archetype, string[]> = {
  'educational-pack': [
    'learn', 'teach', 'module', 'curriculum', 'lesson', 'knowledge',
    'student', 'education', 'tutorial', 'course', 'skill', 'concept',
    'practice', 'exercise',
  ],
  'infrastructure-component': [
    'pipeline', 'engine', 'service', 'infrastructure', 'runtime',
    'compiler', 'parser', 'validator', 'processor', 'optimizer',
    'cache', 'registry', 'framework',
  ],
  'organizational-system': [
    'workflow', 'process', 'management', 'governance', 'operations',
    'coordinate', 'orchestrate', 'schedule', 'monitor', 'policy',
    'compliance', 'audit',
  ],
  'creative-tool': [
    'create', 'design', 'compose', 'editor', 'studio', 'canvas',
    'palette', 'render', 'generate', 'template', 'customize',
    'visual', 'artistic',
  ],
};

/** Ecosystem principle keywords for through-line validation (case-insensitive). */
const ECOSYSTEM_KEYWORDS = [
  'amiga principle',
  'humane flow',
  'progressive disclosure',
  "beginner's mind",
  'ecosystem',
];

/** Vague phrase patterns for success criteria quality checking. */
const VAGUE_PHRASES = /\b(should work|looks good|is nice|works well|good enough)\b/i;

// ---------------------------------------------------------------------------
// validateVisionDocument
// ---------------------------------------------------------------------------

/**
 * Validate structural completeness of a VisionDocument.
 *
 * Checks required non-empty fields and arrays, returning diagnostics
 * for any structural issues found. Error-level for required fields,
 * warning-level for optional but recommended sections.
 *
 * @param doc - Parsed VisionDocument object
 * @returns Array of VisionDiagnostic for structural issues (empty = valid)
 */
export function validateVisionDocument(doc: VisionDocument): VisionDiagnostic[] {
  const diagnostics: VisionDiagnostic[] = [];

  // Required non-empty string fields
  if (!doc.vision || doc.vision.trim().length === 0) {
    diagnostics.push({
      severity: 'error',
      section: 'vision',
      message: 'Vision section is empty',
      code: 'EMPTY_VISION',
    });
  }

  if (!doc.throughLine || doc.throughLine.trim().length === 0) {
    diagnostics.push({
      severity: 'error',
      section: 'throughLine',
      message: 'Through-line section is empty',
      code: 'EMPTY_THROUGH_LINE',
    });
  }

  if (!doc.context || doc.context.trim().length === 0) {
    diagnostics.push({
      severity: 'error',
      section: 'context',
      message: 'Context section is empty',
      code: 'EMPTY_CONTEXT',
    });
  }

  if (!doc.coreConcept.interactionModel || doc.coreConcept.interactionModel.trim().length === 0) {
    diagnostics.push({
      severity: 'error',
      section: 'coreConcept',
      message: 'Core concept interaction model is empty',
      code: 'EMPTY_INTERACTION_MODEL',
    });
  }

  if (!doc.coreConcept.description || doc.coreConcept.description.trim().length === 0) {
    diagnostics.push({
      severity: 'error',
      section: 'coreConcept',
      message: 'Core concept description is empty',
      code: 'EMPTY_CORE_DESCRIPTION',
    });
  }

  // Required non-empty arrays
  if (doc.problemStatement.length === 0) {
    diagnostics.push({
      severity: 'error',
      section: 'problemStatement',
      message: 'Problem statement array is empty',
      code: 'EMPTY_PROBLEM_STATEMENT',
    });
  }

  if (doc.successCriteria.length === 0) {
    diagnostics.push({
      severity: 'error',
      section: 'successCriteria',
      message: 'Success criteria array is empty',
      code: 'EMPTY_CRITERIA',
    });
  }

  // Warning-level checks for optional but recommended sections
  if (doc.modules.length === 0) {
    diagnostics.push({
      severity: 'warning',
      section: 'modules',
      message: 'Modules array is empty',
      code: 'EMPTY_MODULES',
    });
  }

  if (doc.architecture.connections.length === 0) {
    diagnostics.push({
      severity: 'warning',
      section: 'architecture',
      message: 'Architecture connections array is empty',
      code: 'EMPTY_CONNECTIONS',
    });
  }

  return diagnostics;
}

// ---------------------------------------------------------------------------
// checkQuality
// ---------------------------------------------------------------------------

/**
 * Check content quality of a VisionDocument.
 *
 * Analyzes success criteria for vagueness, chipset configuration for
 * completeness, through-line for ecosystem alignment, and dependency
 * declarations for consistency.
 *
 * @param doc - Parsed VisionDocument object
 * @returns Array of VisionDiagnostic for quality issues (empty = high quality)
 */
export function checkQuality(doc: VisionDocument): VisionDiagnostic[] {
  const diagnostics: VisionDiagnostic[] = [];

  // ---- Success criteria quality ----
  for (const criterion of doc.successCriteria) {
    // Vague phrase detection
    if (VAGUE_PHRASES.test(criterion)) {
      diagnostics.push({
        severity: 'warning',
        section: 'successCriteria',
        message: `Vague success criterion: "${criterion}"`,
        code: 'VAGUE_CRITERIA',
      });
    }

    // Short criteria detection
    if (criterion.length < 20) {
      diagnostics.push({
        severity: 'warning',
        section: 'successCriteria',
        message: `Success criterion too short (${criterion.length} chars, minimum 20): "${criterion}"`,
        code: 'SHORT_CRITERIA',
      });
    }
  }

  // ---- Chipset validation ----
  if (Object.keys(doc.chipsetConfig.skills).length === 0) {
    diagnostics.push({
      severity: 'error',
      section: 'chipsetConfig',
      message: 'Chipset skills record is empty',
      code: 'EMPTY_CHIPSET_SKILLS',
    });
  }

  if (doc.chipsetConfig.agents.agents.length === 0) {
    diagnostics.push({
      severity: 'error',
      section: 'chipsetConfig',
      message: 'Chipset agents array is empty',
      code: 'EMPTY_CHIPSET_AGENTS',
    });
  }

  // ---- Through-line ecosystem check ----
  const throughLineLower = doc.throughLine.toLowerCase();
  const hasEcosystemPrinciple = ECOSYSTEM_KEYWORDS.some(
    keyword => throughLineLower.includes(keyword),
  );
  if (!hasEcosystemPrinciple) {
    diagnostics.push({
      severity: 'error',
      section: 'throughLine',
      message: 'Through-line does not reference any ecosystem principle (expected: Amiga Principle, humane flow, progressive disclosure, beginner\'s mind, or ecosystem)',
      code: 'NO_ECOSYSTEM_PRINCIPLE',
    });
  }

  // ---- Dependency check ----
  if (doc.dependsOn.length === 0) {
    diagnostics.push({
      severity: 'warning',
      section: 'dependsOn',
      message: 'Dependencies list is empty — consider whether this document is truly foundational',
      code: 'EMPTY_DEPENDS_ON',
    });
  }

  return diagnostics;
}

// ---------------------------------------------------------------------------
// classifyArchetype
// ---------------------------------------------------------------------------

/**
 * Count keyword occurrences in a text string.
 */
function countKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const keyword of keywords) {
    // Use word boundary matching via regex
    const re = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lower.match(re);
    if (matches) {
      count += matches.length;
    }
  }
  return count;
}

/**
 * Classify a VisionDocument into one of four archetype categories.
 *
 * Uses weighted keyword scoring across multiple document fields:
 * - doc.name: 3x weight
 * - doc.vision: 2x weight
 * - doc.coreConcept.description: 2x weight
 * - doc.modules[].name: 3x weight (module names are strongest signal)
 *
 * Returns the highest-scoring archetype. Defaults to "infrastructure-component"
 * when no keywords match or scores are tied.
 *
 * @param doc - Parsed VisionDocument object
 * @returns Archetype classification string
 */
export function classifyArchetype(doc: VisionDocument): Archetype {
  const scores: Record<Archetype, number> = {
    'educational-pack': 0,
    'infrastructure-component': 0,
    'organizational-system': 0,
    'creative-tool': 0,
  };

  // Collect module names into a single string
  const moduleNames = doc.modules.map(m => m.name).join(' ');

  for (const [archetype, keywords] of Object.entries(ARCHETYPE_KEYWORDS) as Array<[Archetype, string[]]>) {
    // doc.name: 3x weight
    scores[archetype] += countKeywords(doc.name, keywords) * 3;

    // doc.vision: 2x weight
    scores[archetype] += countKeywords(doc.vision, keywords) * 2;

    // doc.coreConcept.description: 2x weight
    scores[archetype] += countKeywords(doc.coreConcept.description, keywords) * 2;

    // doc.modules[].name: 3x weight
    scores[archetype] += countKeywords(moduleNames, keywords) * 3;
  }

  // Find highest scoring archetype
  let bestArchetype: Archetype = 'infrastructure-component';
  let bestScore = 0;

  for (const [archetype, score] of Object.entries(scores) as Array<[Archetype, number]>) {
    if (score > bestScore) {
      bestScore = score;
      bestArchetype = archetype;
    }
  }

  return bestArchetype;
}
