/**
 * Assessment markdown parser with rubric extraction.
 *
 * Parses assessment documents into structured AssessmentDocument objects
 * by extracting rubric levels (Beginning, Developing, Proficient, Advanced)
 * and assessment strategies (formative, summative, portfolio). Uses the
 * same ## heading split pattern as vision-parser.ts.
 *
 * @module assessment-loader
 */

import { readFile } from 'node:fs/promises';

// ============================================================================
// Types
// ============================================================================

/**
 * A rubric level with name and description content.
 */
export interface RubricLevel {
  level: string;
  description: string;
}

/**
 * Structured representation of an assessment document.
 *
 * Contains extracted rubric levels, assessment strategies, and
 * all raw sections for extensibility.
 */
export interface AssessmentDocument {
  rubricLevels: RubricLevel[];
  formativeStrategies: string | null;
  summativeStrategies: string | null;
  portfolioSuggestions: string | null;
  rawSections: Map<string, string>;
}

// ============================================================================
// Constants
// ============================================================================

/** Known rubric level headings (case-insensitive match). */
const RUBRIC_LEVELS = new Set(['beginning', 'developing', 'proficient', 'advanced']);

/** Strategy heading mappings. */
const STRATEGY_MAP: Record<string, keyof Pick<AssessmentDocument, 'formativeStrategies' | 'summativeStrategies' | 'portfolioSuggestions'>> = {
  'formative assessment': 'formativeStrategies',
  'summative assessment': 'summativeStrategies',
  'portfolio suggestions': 'portfolioSuggestions',
};

// ============================================================================
// parseAssessment
// ============================================================================

/**
 * Parse an assessment markdown document into structured sections.
 *
 * Extracts rubric levels by matching known headings (Beginning,
 * Developing, Proficient, Advanced) and assessment strategies
 * (Formative, Summative, Portfolio). All sections stored in rawSections.
 *
 * @param markdown - Raw markdown content of the assessment document
 * @returns Structured AssessmentDocument
 */
export function parseAssessment(markdown: string): AssessmentDocument {
  const doc: AssessmentDocument = {
    rubricLevels: [],
    formativeStrategies: null,
    summativeStrategies: null,
    portfolioSuggestions: null,
    rawSections: new Map(),
  };

  if (!markdown.trim()) {
    return doc;
  }

  // Split by ## headings
  const parts = markdown.split(/\n## /);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const newlineIdx = part.indexOf('\n');

    let heading: string;
    let content: string;

    if (newlineIdx === -1) {
      heading = part.trim();
      content = '';
    } else {
      heading = part.substring(0, newlineIdx).trim();
      content = part.substring(newlineIdx + 1).trim();
    }

    // Store in rawSections
    doc.rawSections.set(heading, content);

    const lower = heading.toLowerCase();

    // Check for rubric levels
    if (RUBRIC_LEVELS.has(lower)) {
      doc.rubricLevels.push({
        level: heading,
        description: content,
      });
      continue;
    }

    // Check for strategy headings
    const strategyKey = STRATEGY_MAP[lower];
    if (strategyKey) {
      doc[strategyKey] = content;
    }
  }

  return doc;
}

// ============================================================================
// parseAssessmentFile
// ============================================================================

/**
 * Read an assessment markdown file from disk and parse its contents.
 *
 * @param filePath - Absolute or relative path to the assessment file
 * @returns Structured AssessmentDocument
 */
export async function parseAssessmentFile(filePath: string): Promise<AssessmentDocument> {
  const content = await readFile(filePath, 'utf-8');
  return parseAssessment(content);
}
