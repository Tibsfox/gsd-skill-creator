/**
 * Markdown vision document section extractor.
 *
 * Parses vision documents (e.g., MATH-101-vision.md) into structured
 * VisionDocument objects by splitting on ## headings and mapping known
 * section names to typed fields. Unknown sections are preserved in
 * rawSections for extensibility.
 *
 * @module vision-parser
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Structured representation of a vision document.
 *
 * Known headings are mapped to named fields. All sections (including
 * unknown ones) are stored in rawSections keyed by heading text.
 */
export interface VisionDocument {
  title: string | null;
  vision: string | null;
  problemStatement: string | null;
  coreConcepts: string | null;
  skillTree: string | null;
  modules: string | null;
  assessmentFramework: string | null;
  parentGuidance: string | null;
  resources: string | null;
  rawSections: Map<string, string>;
}

// ============================================================================
// Heading-to-field mapping
// ============================================================================

/**
 * Maps lowercase heading text to VisionDocument field name.
 * Supports common heading variations found in vision documents.
 */
const HEADING_MAP: Record<string, keyof Omit<VisionDocument, 'title' | 'rawSections'>> = {
  vision: 'vision',
  'problem statement': 'problemStatement',
  'core concepts': 'coreConcepts',
  'skill tree architecture': 'skillTree',
  'skill tree': 'skillTree',
  modules: 'modules',
  'assessment framework': 'assessmentFramework',
  assessment: 'assessmentFramework',
  'parent guidance': 'parentGuidance',
  resources: 'resources',
  'vetted resources': 'resources',
};

// ============================================================================
// parseVisionDocument
// ============================================================================

/**
 * Parse a markdown vision document into structured sections.
 *
 * Splits on `## ` headings, extracts the H1 title, and maps known
 * headings to VisionDocument fields. All sections are preserved in
 * rawSections regardless of whether they map to a known field.
 *
 * @param markdown - Raw markdown content of the vision document
 * @returns Structured VisionDocument with extracted sections
 */
export function parseVisionDocument(markdown: string): VisionDocument {
  const doc: VisionDocument = {
    title: null,
    vision: null,
    problemStatement: null,
    coreConcepts: null,
    skillTree: null,
    modules: null,
    assessmentFramework: null,
    parentGuidance: null,
    resources: null,
    rawSections: new Map(),
  };

  if (!markdown.trim()) {
    return doc;
  }

  // Extract H1 title
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    doc.title = titleMatch[1].trim();
  }

  // Split by ## headings
  // We split on lines that start with "## " to get sections
  const parts = markdown.split(/\n## /);

  // First part is everything before the first ## (may contain H1, intro, etc.)
  // Remaining parts each start with the heading text
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

    // Store in rawSections (original heading text)
    doc.rawSections.set(heading, content);

    // Map to known field
    const key = HEADING_MAP[heading.toLowerCase()];
    if (key) {
      doc[key] = content;
    }
  }

  return doc;
}
