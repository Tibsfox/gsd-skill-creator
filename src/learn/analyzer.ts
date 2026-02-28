// === Document Analyzer ===
//
// Entry point for the sc:learn extraction pipeline (Stage 3: ANALYZE).
// Takes normalized text content and produces a structural map + domain
// classification that the extractor uses to select appropriate heuristics.
//
// Does NOT import plane-classifier.ts (avoids domain-index.json load at
// module init). Reimplements scoring logic locally and accepts domain
// definitions as a parameter.

import type { PlanePosition, DomainId, DomainDefinition } from '../core/types/mfe-types.js';

// === Public types ===

export type ContentType = 'textbook' | 'reference' | 'tutorial' | 'spec' | 'paper' | 'unknown';

export interface DocumentSection {
  title: string;
  level: number;        // 1 = top-level chapter, 2 = section, etc.
  content: string;      // Raw text content of this section
  children: DocumentSection[];
  startIndex: number;   // Character offset in original document
}

export interface DocumentAnalysis {
  sections: DocumentSection[];
  contentType: ContentType;
  detectedDomain: string | null;    // DomainId or null if not recognized
  planePosition: PlanePosition;
  confidence: number;               // 0.0-1.0
  keywords: string[];               // Extracted significant terms
  wordCount: number;
  sectionCount: number;
}

// === Stop words (same set as plane-classifier.ts) ===

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'must',
  'this', 'that', 'these', 'those', 'it', 'its',
  'of', 'for', 'in', 'to', 'on', 'at', 'by', 'from', 'with', 'as',
  'and', 'or', 'but', 'not', 'nor', 'so', 'yet',
  'if', 'then', 'than', 'when', 'where', 'how', 'what', 'which', 'who',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'some', 'any',
  'no', 'between', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
  'again', 'further', 'once', 'here', 'there', 'about',
  'very', 'just', 'also', 'too', 'only', 'own', 'same',
]);

// === Content type patterns ===

interface ContentTypePattern {
  type: ContentType;
  patterns: RegExp[];
  weight: number;
}

const CONTENT_TYPE_PATTERNS: ContentTypePattern[] = [
  {
    type: 'textbook',
    patterns: [
      /\bDefinition\b[:\s]/gi,
      /\bDef\.\s/gi,
      /\bTheorem\b[:\s]/gi,
      /\bThm\.\s/gi,
      /\bProof\b[:\s]/gi,
      /\bLemma\b[:\s]/gi,
      /\bCorollary\b[:\s]/gi,
      /\bExample\b[:\s]/gi,
      /\bExercise\b[:\s]/gi,
    ],
    weight: 3,
  },
  {
    type: 'reference',
    patterns: [
      /\bAPI\b/gi,
      /\bendpoint\b/gi,
      /\bfunction\b\s+\w+/gi,
      /\bparameter\b/gi,
      /\breturn\b/gi,
      /\bmethod\b/gi,
      /\bclass\b\s+\w+/gi,
      /\binterface\b\s+\w+/gi,
      /```\w*/g,
    ],
    weight: 2,
  },
  {
    type: 'tutorial',
    patterns: [
      /\bStep\s+\d+/gi,
      /\btry\s+this\b/gi,
      /\bexercise\b[:\s]/gi,
      /\bhands-on\b/gi,
      /\bbuild\s+a\b/gi,
      /\bcreate\s+a\b/gi,
      /\bpractice\b/gi,
      /\blearn\b/gi,
    ],
    weight: 2,
  },
  {
    type: 'spec',
    patterns: [
      /\bMUST\b(?:\s+NOT)?\s+/g,
      /\bSHALL\b(?:\s+NOT)?\s+/g,
      /\bSHOULD\b(?:\s+NOT)?\s+/g,
      /\brequirement\b/gi,
      /\bconstraint\b/gi,
      /\bspecification\b/gi,
    ],
    weight: 3,
  },
  {
    type: 'paper',
    patterns: [
      /\bAbstract\b/g,
      /\bIntroduction\b/g,
      /\bMethodology\b/gi,
      /\bResults\b/g,
      /\bConclusion\b/g,
      /\bReferences\b/g,
      /\bDiscussion\b/g,
    ],
    weight: 2,
  },
];

// === Activation threshold for domain scoring ===

const ACTIVATION_THRESHOLD = 0.1;

// === Tokenization ===

function tokenize(input: string): string[] {
  if (!input || !input.trim()) return [];

  return input
    .toLowerCase()
    .split(/[\s,;:!?()\[\]{}"']+/)
    .map(t => t.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ''))
    .filter(t => t.length >= 2)
    .filter(t => !STOP_WORDS.has(t));
}

// === Keyword extraction ===

function extractKeywords(tokens: string[]): string[] {
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

// === Structure extraction ===

const HEADING_REGEX = /^(#{1,6})\s+(.+)$/;
const NUMBERED_SECTION_REGEX = /^(\d+(?:\.\d+)+)\s+(.+)$/;

function extractSections(content: string): DocumentSection[] {
  if (!content || !content.trim()) return [];

  const lines = content.split('\n');
  const rootSections: DocumentSection[] = [];
  // Stack to track current nesting: each entry is [level, section]
  const stack: Array<{ level: number; section: DocumentSection }> = [];

  let currentContent = '';
  let hasHeadings = false;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const charOffset = content.indexOf(line, lineIdx === 0 ? 0 : content.indexOf(lines[lineIdx - 1]) + lines[lineIdx - 1].length);

    // Try markdown heading
    const headingMatch = line.match(HEADING_REGEX);
    if (headingMatch) {
      hasHeadings = true;

      // Flush accumulated content to current section
      if (stack.length > 0) {
        stack[stack.length - 1].section.content += currentContent;
      }
      currentContent = '';

      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const startIndex = computeOffset(content, lines, lineIdx);

      const section: DocumentSection = {
        title,
        level,
        content: '',
        children: [],
        startIndex,
      };

      // Find parent: pop stack until we find a level < this one
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        rootSections.push(section);
      } else {
        stack[stack.length - 1].section.children.push(section);
      }

      stack.push({ level, section });
      continue;
    }

    // Try numbered section (only if we haven't found markdown headings yet or as sub-sections)
    const numMatch = line.match(NUMBERED_SECTION_REGEX);
    if (numMatch) {
      const numParts = numMatch[1].split('.');
      const level = numParts.length + 1; // Numbered sections nest under heading level
      const title = `${numMatch[1]} ${numMatch[2].trim()}`;
      const startIndex = computeOffset(content, lines, lineIdx);

      // Flush content
      if (stack.length > 0) {
        stack[stack.length - 1].section.content += currentContent;
      }
      currentContent = '';

      const section: DocumentSection = {
        title,
        level,
        content: '',
        children: [],
        startIndex,
      };

      // Find parent
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        rootSections.push(section);
      } else {
        stack[stack.length - 1].section.children.push(section);
      }

      stack.push({ level, section });
      hasHeadings = true;
      continue;
    }

    // Regular content line
    currentContent += (currentContent ? '\n' : '') + line;
  }

  // Flush remaining content
  if (stack.length > 0) {
    stack[stack.length - 1].section.content += currentContent;
  }

  // If no headings found, wrap entire content in a single root section
  if (!hasHeadings && content.trim()) {
    return [{
      title: 'Document',
      level: 1,
      content: content.trim(),
      children: [],
      startIndex: 0,
    }];
  }

  return rootSections;
}

function computeOffset(content: string, lines: string[], lineIdx: number): number {
  let offset = 0;
  for (let i = 0; i < lineIdx; i++) {
    offset += lines[i].length + 1; // +1 for newline
  }
  return offset;
}

function countSections(sections: DocumentSection[]): number {
  let count = sections.length;
  for (const s of sections) {
    count += countSections(s.children);
  }
  return count;
}

// === Content type classification ===

function classifyContentType(content: string): ContentType {
  if (!content || !content.trim()) return 'unknown';

  const scores = new Map<ContentType, number>();

  for (const pattern of CONTENT_TYPE_PATTERNS) {
    let matchCount = 0;
    for (const regex of pattern.patterns) {
      // Reset regex state for global patterns
      regex.lastIndex = 0;
      const matches = content.match(regex);
      if (matches) {
        matchCount += matches.length;
      }
    }
    scores.set(pattern.type, matchCount * pattern.weight);
  }

  // Find highest scoring type
  let bestType: ContentType = 'unknown';
  let bestScore = 0;

  for (const [type, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  // Below threshold = unknown
  if (bestScore < 2) {
    return 'unknown';
  }

  return bestType;
}

// === Domain scoring (reimplemented from plane-classifier.ts) ===

interface DomainScore {
  domainId: DomainId;
  score: number;
  matchedPatterns: string[];
}

function scoreDomains(
  keywords: string[],
  inputLower: string,
  domains: DomainDefinition[],
): DomainScore[] {
  const scores: DomainScore[] = [];

  for (const domain of domains) {
    const matchedPatterns: string[] = [];
    const patterns = domain.activationPatterns;

    for (const pattern of patterns) {
      const patternLower = pattern.toLowerCase();
      const isMultiWord = patternLower.includes(' ');

      if (isMultiWord) {
        if (inputLower.includes(patternLower)) {
          matchedPatterns.push(pattern);
        }
      } else {
        const matched = keywords.some(kw =>
          kw.includes(patternLower) || patternLower.includes(kw)
        );
        if (matched) {
          matchedPatterns.push(pattern);
        }
      }
    }

    const totalPatterns = patterns.length;
    const matchCount = matchedPatterns.length;

    const rawScore = totalPatterns > 0
      ? Math.sqrt(matchCount / totalPatterns) * (1 + 0.15 * matchCount)
      : 0;

    const score = Math.min(1.0, rawScore);

    if (score > ACTIVATION_THRESHOLD) {
      scores.push({
        domainId: domain.id,
        score,
        matchedPatterns,
      });
    }
  }

  return scores.sort((a, b) => b.score - a.score);
}

function calculatePosition(
  activations: DomainScore[],
  domains: DomainDefinition[],
): PlanePosition {
  if (activations.length === 0) {
    return { real: 0, imaginary: 0 };
  }

  let sumReal = 0;
  let sumImag = 0;
  let sumScores = 0;

  for (const activation of activations) {
    const domain = domains.find(d => d.id === activation.domainId);
    if (!domain) continue;

    sumReal += domain.planeRegion.center.real * activation.score;
    sumImag += domain.planeRegion.center.imaginary * activation.score;
    sumScores += activation.score;
  }

  if (sumScores === 0) {
    return { real: 0, imaginary: 0 };
  }

  return {
    real: Math.max(-1.0, Math.min(1.0, sumReal / sumScores)),
    imaginary: Math.max(-1.0, Math.min(1.0, sumImag / sumScores)),
  };
}

function calculateConfidence(activations: DomainScore[]): number {
  if (activations.length === 0) return 0.0;
  const topScore = activations[0].score;
  const count = activations.length;
  return Math.min(1.0, topScore * (1 + 0.1 * count));
}

// === Main analyzer ===

/**
 * Analyze a document: extract structure, classify content type, detect domain,
 * and map to Complex Plane position.
 *
 * @param content - Raw document text (typically markdown)
 * @param domainDefinitions - Optional domain definitions for domain detection.
 *   When omitted, domain detection is skipped (returns null domain, origin position).
 */
export function analyzeDocument(
  content: string,
  domainDefinitions?: DomainDefinition[],
): DocumentAnalysis {
  // Handle empty input
  if (!content || !content.trim()) {
    return {
      sections: [],
      contentType: 'unknown',
      detectedDomain: null,
      planePosition: { real: 0, imaginary: 0 },
      confidence: 0,
      keywords: [],
      wordCount: 0,
      sectionCount: 0,
    };
  }

  // Extract structure
  const sections = extractSections(content);
  const sectionCount = countSections(sections);

  // Classify content type
  const contentType = classifyContentType(content);

  // Tokenize and extract keywords
  const tokens = tokenize(content);
  const keywords = extractKeywords(tokens);
  const wordCount = content.trim().split(/\s+/).length;

  // Domain detection
  let detectedDomain: string | null = null;
  let planePosition: PlanePosition = { real: 0, imaginary: 0 };
  let confidence = 0;

  if (domainDefinitions && domainDefinitions.length > 0) {
    const inputLower = content.toLowerCase();
    const activations = scoreDomains(keywords, inputLower, domainDefinitions);

    if (activations.length > 0) {
      detectedDomain = activations[0].domainId;
      planePosition = calculatePosition(activations, domainDefinitions);
      confidence = calculateConfidence(activations);
    }
  }

  return {
    sections,
    contentType,
    detectedDomain,
    planePosition,
    confidence,
    keywords,
    wordCount,
    sectionCount,
  };
}
