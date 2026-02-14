/**
 * Clarity assessor for document intake routing.
 *
 * Analyzes document content deterministically (no LLM calls) to route
 * documents into one of three intake paths: clear (well-structured,
 * ready to queue), gaps (identifiable missing info that targeted
 * questions can fill), or confused (too incoherent or minimal).
 *
 * @module staging/intake-flow/clarity-assessor
 */

import type { ClarityAssessment, GapDetail } from './types.js';

/** Regex matching markdown headings (h1-h6). Captures heading text in group 1. */
const HEADING_RE = /^#{1,6}\s+(.+)$/;

/**
 * Known key areas that a well-structured document should address.
 * Used to detect gaps when areas are missing.
 */
const KEY_AREAS: ReadonlyArray<{ area: string; keywords: string[]; question: string }> = [
  {
    area: 'goals/purpose',
    keywords: ['goal', 'goals', 'purpose', 'objective', 'objectives', 'aim', 'aims', 'motivation'],
    question: 'What are the specific goals or objectives for this work?',
  },
  {
    area: 'constraints',
    keywords: ['constraint', 'constraints', 'limitation', 'limitations', 'requirement', 'requirements', 'boundary', 'boundaries'],
    question: 'What constraints or requirements must be respected?',
  },
  {
    area: 'deliverables',
    keywords: ['deliverable', 'deliverables', 'output', 'outputs', 'outcome', 'outcomes', 'result', 'results', 'done', 'criteria'],
    question: 'What are the expected deliverables or success criteria?',
  },
  {
    area: 'technical approach',
    keywords: ['technical', 'approach', 'stack', 'technology', 'implementation', 'architecture', 'design', 'how'],
    question: 'What technical approach or stack will be used?',
  },
];

/**
 * Extract markdown section headings from content.
 * Returns heading text without the # prefix.
 */
function extractSections(content: string): string[] {
  const sections: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(HEADING_RE);
    if (match) {
      sections.push(match[1].trim());
    }
  }

  return sections;
}

/**
 * Count total words in content.
 */
function countWords(content: string): number {
  const trimmed = content.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Count specificity signals: code blocks, bullet lists, numbered lists,
 * numbers/measurements, file paths, URLs.
 */
function countSpecificitySignals(content: string): number {
  let count = 0;

  // Code blocks
  const codeBlocks = content.match(/```[\s\S]*?```/g);
  if (codeBlocks) count += codeBlocks.length * 2;

  // Bullet list items
  const bullets = content.match(/^\s*[-*]\s+/gm);
  if (bullets) count += bullets.length;

  // Numbered list items
  const numbered = content.match(/^\s*\d+\.\s+/gm);
  if (numbered) count += numbered.length;

  // Specific numbers/measurements (e.g., "200ms", "99.9%", "1000")
  const measurements = content.match(/\b\d+(\.\d+)?(%|ms|s|mb|gb|tb|kb|min|hr|day)\b/gi);
  if (measurements) count += measurements.length;

  // File paths
  const filePaths = content.match(/\b[\w./-]+\.\w{1,5}\b/g);
  if (filePaths) count += Math.min(filePaths.length, 5);

  // URLs
  const urls = content.match(/https?:\/\/\S+/g);
  if (urls) count += urls.length;

  return count;
}

/**
 * Detect gap signals: questions, placeholder text, very short sections.
 */
function countGapSignals(content: string): number {
  let count = 0;

  // Questions
  const questions = content.match(/\?(\s|$)/gm);
  if (questions) count += questions.length;

  // Placeholder text
  const placeholders = content.match(/\b(TBD|TODO|TBC|FIXME|XXX)\b/gi);
  if (placeholders) count += placeholders.length * 2;

  return count;
}

/**
 * Get section content (text between headings).
 * Returns array of { heading, wordCount } for each section.
 */
function getSectionDetails(content: string): Array<{ heading: string; wordCount: number }> {
  const lines = content.split('\n');
  const details: Array<{ heading: string; wordCount: number }> = [];
  let currentHeading: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      if (currentHeading !== null) {
        const text = currentContent.join(' ').trim();
        details.push({
          heading: currentHeading,
          wordCount: text.length > 0 ? text.split(/\s+/).length : 0,
        });
      }
      currentHeading = headingMatch[1].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Last section
  if (currentHeading !== null) {
    const text = currentContent.join(' ').trim();
    details.push({
      heading: currentHeading,
      wordCount: text.length > 0 ? text.split(/\s+/).length : 0,
    });
  }

  return details;
}

/**
 * Identify specific gaps by checking which key areas are missing.
 */
function identifyGaps(
  content: string,
  sections: string[],
  sectionDetails: Array<{ heading: string; wordCount: number }>
): GapDetail[] {
  const gaps: GapDetail[] = [];
  const lowerContent = content.toLowerCase();
  const lowerSections = sections.map((s) => s.toLowerCase());

  for (const keyArea of KEY_AREAS) {
    // Check if any section heading or content mentions this area's keywords
    const hasInHeading = keyArea.keywords.some((kw) =>
      lowerSections.some((s) => s.includes(kw))
    );
    const hasInContent = keyArea.keywords.some((kw) => lowerContent.includes(kw));

    if (!hasInHeading && !hasInContent) {
      gaps.push({ area: keyArea.area, question: keyArea.question });
    }
  }

  // Check for empty sections (headings with no content)
  for (const detail of sectionDetails) {
    if (detail.wordCount === 0) {
      gaps.push({
        area: detail.heading,
        question: `What content should go under "${detail.heading}"?`,
      });
    }
  }

  return gaps;
}

/**
 * Assess a document's clarity to determine its intake routing path.
 *
 * Uses deterministic text analysis (no LLM calls) to evaluate:
 * - Document structure (section count, headings)
 * - Content density (words per section)
 * - Specificity signals (code blocks, lists, measurements)
 * - Gap signals (placeholders, missing key areas)
 *
 * @param content - The document content to assess (markdown text)
 * @returns A ClarityAssessment with route, reason, confidence, gaps, and sections
 */
export function assessClarity(content: string): ClarityAssessment {
  const sections = extractSections(content);
  const totalWords = countWords(content);
  const sectionDetails = getSectionDetails(content);
  const specificityCount = countSpecificitySignals(content);
  const gapSignalCount = countGapSignals(content);
  const hasStructure = sections.length >= 1;

  // === CONFUSED: truly minimal or incoherent ===
  // Empty or near-empty content with no structure
  if (totalWords === 0) {
    return {
      route: 'confused',
      reason: 'Document is empty -- no content to assess',
      confidence: 0.05,
      gaps: [],
      sections,
    };
  }

  // No headings and very few words -- confused
  if (!hasStructure && totalWords < 100) {
    return {
      route: 'confused',
      reason: `Document is too minimal (${totalWords} words) with no structure to determine intent`,
      confidence: Math.max(0.05, 0.25 - (totalWords / 200)),
      gaps: [],
      sections,
    };
  }

  // === From here, either has structure OR has 100+ words ===

  // Check if all sections are empty (headings only)
  const allSectionsEmpty = sectionDetails.length > 0 &&
    sectionDetails.every((s) => s.wordCount === 0);

  if (allSectionsEmpty) {
    const gaps = identifyGaps(content, sections, sectionDetails);
    return {
      route: 'gaps',
      reason: 'Document has section structure but all sections are empty -- content needed',
      confidence: 0.5,
      gaps,
      sections,
    };
  }

  // Identify gaps
  const gaps = identifyGaps(content, sections, sectionDetails);

  // Calculate content density (average words per section)
  const avgWordsPerSection = sectionDetails.length > 0
    ? sectionDetails.reduce((sum, s) => sum + s.wordCount, 0) / sectionDetails.length
    : totalWords;

  // Count key-area gaps (missing fundamental areas like goals, constraints)
  const keyGapCount = gaps.filter((g) =>
    KEY_AREAS.some((ka) => ka.area === g.area)
  ).length;

  // === CLEAR: well-structured with substance ===
  const hasManySections = sections.length >= 3;
  const hasGoodDensity = avgWordsPerSection >= 20 || (sectionDetails.length === 0 && totalWords > 200);
  const hasSpecificity = specificityCount >= 3;
  // Allow up to 2 missing key areas -- focused technical docs may not
  // mention all four areas explicitly but are still clear if they have
  // good structure, density, and specificity signals
  const hasNoKeyGaps = keyGapCount <= 2;

  if (hasManySections && hasGoodDensity && hasNoKeyGaps) {
    let confidence = 0.7;
    if (hasSpecificity) confidence += 0.1;
    if (sections.length >= 5) confidence += 0.05;
    if (avgWordsPerSection > 50) confidence += 0.05;
    confidence = Math.min(1.0, confidence);

    return {
      route: 'clear',
      reason: `Well-structured document with ${sections.length} sections, good content density, and specificity signals`,
      confidence,
      gaps: [],
      sections,
    };
  }

  // === GAPS: has structure or content, but missing key information ===
  if (hasStructure) {
    // Confidence inversely related to gap count
    let confidence = Math.max(0.3, 0.65 - (gaps.length * 0.08));
    if (gapSignalCount > 0) confidence -= 0.05;
    confidence = Math.max(0.3, Math.min(0.7, confidence));

    const keyGapAreas = gaps
      .filter((g) => KEY_AREAS.some((ka) => ka.area === g.area))
      .map((g) => g.area);
    const emptyGapAreas = gaps
      .filter((g) => !KEY_AREAS.some((ka) => ka.area === g.area))
      .map((g) => g.area);

    const reasonParts: string[] = [];
    if (keyGapAreas.length > 0) {
      reasonParts.push(`missing key areas: ${keyGapAreas.join(', ')}`);
    }
    if (emptyGapAreas.length > 0) {
      reasonParts.push(`empty sections: ${emptyGapAreas.join(', ')}`);
    }
    if (gapSignalCount > 0) {
      reasonParts.push('contains placeholder text');
    }
    if (totalWords < 50) {
      reasonParts.push('very sparse content');
    }
    if (reasonParts.length === 0) {
      reasonParts.push('has structure but insufficient detail for clear routing');
    }

    return {
      route: 'gaps',
      reason: `Document has structure but needs more information: ${reasonParts.join('; ')}`,
      confidence,
      gaps,
      sections,
    };
  }

  // Fallback: 100+ words but no structure
  if (totalWords >= 100) {
    return {
      route: 'gaps',
      reason: 'Document has content but lacks section structure to organize it',
      confidence: 0.35,
      gaps: [
        { area: 'structure', question: 'Can you organize this into sections with headings?' },
        ...gaps,
      ],
      sections,
    };
  }

  // Final fallback: confused
  return {
    route: 'confused',
    reason: `Document lacks sufficient structure and content for meaningful assessment (${totalWords} words, ${sections.length} sections)`,
    confidence: 0.2,
    gaps: [],
    sections,
  };
}
