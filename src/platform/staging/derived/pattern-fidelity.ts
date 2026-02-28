/**
 * Pattern fidelity checker for derived knowledge.
 *
 * Compares derived skill content against observation evidence to
 * detect phantom content -- skill instructions not backed by
 * actually observed patterns.
 *
 * @module staging/derived/pattern-fidelity
 */

import type { PhantomFinding, DerivedCheckSeverity } from './types.js';

/**
 * Evidence from actual session observations to validate skill content against.
 */
export interface ObservationEvidence {
  /** Commands actually seen in sessions. */
  observedCommands: string[];
  /** Files actually touched. */
  observedFiles: string[];
  /** Tools actually used. */
  observedTools: string[];
  /** Free-text patterns/descriptions from session data. */
  observedPatterns: string[];
}

/**
 * Common stop words excluded from overlap computation.
 * These words carry no domain-specific signal.
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'to', 'for', 'when', 'with', 'this', 'that',
  'in', 'on', 'at', 'of', 'and', 'or', 'it', 'be', 'as', 'by', 'from',
  'not', 'are', 'was', 'were', 'been', 'has', 'have', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'its',
  'you', 'your', 'we', 'our', 'they', 'their', 'them', 'all', 'each',
  'any', 'some', 'no', 'if', 'but', 'so', 'up', 'set', 'new',
]);

/**
 * Structural headings that are boilerplate, not instructional content.
 */
const BOILERPLATE_HEADINGS = new Set([
  'purpose', 'pattern evidence', 'overview', 'description', 'summary',
  'about', 'introduction', 'table of contents', 'references',
]);

/** Minimum evidence overlap fraction for a section to be considered supported. */
const SUPPORT_THRESHOLD = 0.3;

/**
 * Check skill body sections against observation evidence for phantom content.
 *
 * Splits the skill body into markdown sections, builds an evidence corpus
 * from all observation fields, and flags sections whose content has less
 * than 30% overlap with the evidence corpus.
 *
 * @param skillBody - The full markdown body of the skill
 * @param evidence - Observation evidence to validate against
 * @returns Array of PhantomFinding for each unsupported section
 */
export function checkPatternFidelity(
  skillBody: string,
  evidence: ObservationEvidence,
): PhantomFinding[] {
  // 1. Parse skill body into sections
  const sections = parseSections(skillBody);

  if (sections.length === 0) {
    return [];
  }

  // 2. Build evidence corpus
  const corpus = buildEvidenceCorpus(evidence);

  // 3. Check each section against evidence
  const phantomSections: { heading: string; body: string }[] = [];
  const supportedSections: string[] = [];

  for (const section of sections) {
    const overlapScore = computeOverlapScore(section.body, corpus, evidence);
    if (overlapScore < SUPPORT_THRESHOLD) {
      phantomSections.push(section);
    } else {
      supportedSections.push(section.heading);
    }
  }

  if (phantomSections.length === 0) {
    return [];
  }

  // 4. Compute severity based on phantom ratio
  const phantomRatio = phantomSections.length / sections.length;
  const severity = computeSeverity(phantomRatio);

  // 5. Build findings
  const relevantEvidence = getRelevantEvidence(evidence, 5);

  return phantomSections.map((section) => ({
    type: 'phantom' as const,
    severity,
    message: `Section '${section.heading}' contains content not backed by observation evidence`,
    contentSnippet: section.body.slice(0, 200),
    observedPatterns: relevantEvidence,
  }));
}

/**
 * A parsed markdown section with heading and body text.
 */
interface Section {
  heading: string;
  body: string;
}

/**
 * Parse a markdown skill body into instructional sections.
 *
 * Splits on ## and ### headings. Filters out frontmatter, empty
 * sections, and boilerplate structural headings.
 */
function parseSections(skillBody: string): Section[] {
  // Strip frontmatter
  let body = skillBody;
  const fmMatch = body.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
  if (fmMatch) {
    body = body.slice(fmMatch[0].length);
  }

  // Split on markdown headings (## or ###)
  const parts = body.split(/^(#{2,3}\s+.+)$/m);

  const sections: Section[] = [];
  for (let i = 0; i < parts.length; i++) {
    const headingMatch = parts[i].match(/^#{2,3}\s+(.+)$/);
    if (headingMatch && i + 1 < parts.length) {
      const heading = headingMatch[1].trim();
      const sectionBody = parts[i + 1].trim();

      // Skip boilerplate headings
      if (BOILERPLATE_HEADINGS.has(heading.toLowerCase())) {
        continue;
      }

      // Skip empty sections
      if (sectionBody.length === 0) {
        continue;
      }

      sections.push({ heading, body: sectionBody });
    }
  }

  return sections;
}

/**
 * Build a normalized evidence corpus from all evidence arrays.
 *
 * Combines commands (split into components), file path components,
 * tool names, and pattern tokens into a single set of lowercase tokens.
 */
function buildEvidenceCorpus(evidence: ObservationEvidence): Set<string> {
  const corpus = new Set<string>();

  // Commands: extract base command name components
  for (const cmd of evidence.observedCommands) {
    const lower = cmd.toLowerCase();
    corpus.add(lower);
    for (const token of lower.split(/\s+/)) {
      if (token.length > 1) {
        corpus.add(token);
      }
    }
  }

  // Files: extract filename, extension, and directory components
  for (const file of evidence.observedFiles) {
    const lower = file.toLowerCase();
    corpus.add(lower);
    // Split path into components
    for (const part of lower.split('/')) {
      if (part.length > 1) {
        corpus.add(part);
        // Also add without extension
        const dotIdx = part.lastIndexOf('.');
        if (dotIdx > 0) {
          corpus.add(part.slice(0, dotIdx));
          corpus.add(part.slice(dotIdx + 1));
        }
      }
    }
  }

  // Tools: use as-is
  for (const tool of evidence.observedTools) {
    corpus.add(tool.toLowerCase());
  }

  // Patterns: tokenize into words
  for (const pattern of evidence.observedPatterns) {
    const lower = pattern.toLowerCase();
    corpus.add(lower);
    for (const word of lower.split(/\s+/)) {
      if (word.length > 1 && !STOP_WORDS.has(word)) {
        corpus.add(word);
      }
    }
  }

  return corpus;
}

/**
 * Compute the overlap score between a section's content and the evidence corpus.
 *
 * Extracts commands, file paths, and significant words from the section,
 * then calculates the fraction that appear in the evidence corpus.
 * Also performs fuzzy matching against observedPatterns.
 */
function computeOverlapScore(
  sectionBody: string,
  corpus: Set<string>,
  evidence: ObservationEvidence,
): number {
  const lowerBody = sectionBody.toLowerCase();

  // Extract mentioned commands (backtick-delimited text)
  const commands: string[] = [];
  const cmdRegex = /`([^`]+)`/g;
  let match: RegExpExecArray | null;
  while ((match = cmdRegex.exec(lowerBody)) !== null) {
    commands.push(match[1]);
  }

  // Extract file paths (text with / or common extensions)
  const paths: string[] = [];
  const pathRegex = /(?:[a-z0-9_.-]+\/)+[a-z0-9_.-]+|[a-z0-9_-]+\.[a-z]{1,5}/g;
  let pathMatch: RegExpExecArray | null;
  while ((pathMatch = pathRegex.exec(lowerBody)) !== null) {
    paths.push(pathMatch[0]);
  }

  // Tokenize section body into significant words
  const words = lowerBody
    .replace(/`[^`]*`/g, '') // remove backtick content (already captured)
    .split(/[^a-z0-9-]+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  // Combine all section tokens
  const sectionTokens = new Set<string>();
  for (const cmd of commands) {
    sectionTokens.add(cmd);
    for (const part of cmd.split(/\s+/)) {
      if (part.length > 1) {
        sectionTokens.add(part);
      }
    }
  }
  for (const path of paths) {
    sectionTokens.add(path);
    for (const part of path.split('/')) {
      if (part.length > 1) {
        sectionTokens.add(part);
      }
    }
  }
  for (const word of words) {
    sectionTokens.add(word);
  }

  if (sectionTokens.size === 0) {
    return 0;
  }

  // Count how many section tokens appear in the corpus
  let matches = 0;
  for (const token of sectionTokens) {
    if (corpus.has(token)) {
      matches++;
    }
  }

  // Also check fuzzy matching against observedPatterns
  if (evidence.observedPatterns.length > 0) {
    const fuzzyMatched = checkFuzzyMatch(lowerBody, evidence.observedPatterns);
    if (fuzzyMatched) {
      // Boost overlap score for fuzzy matches
      matches += Math.ceil(sectionTokens.size * 0.5);
    }
  }

  return Math.min(1, matches / sectionTokens.size);
}

/**
 * Check if section body fuzzy-matches any observed pattern.
 *
 * Tokenizes both the section and each pattern, then checks for
 * word overlap. A match requires >= 2 shared significant words.
 * Uses prefix matching so "linting" matches "lint" and
 * "configure" matches "configuration".
 */
function checkFuzzyMatch(
  lowerBody: string,
  observedPatterns: string[],
): boolean {
  const bodyWords = lowerBody
    .split(/[^a-z0-9-]+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  for (const pattern of observedPatterns) {
    const patternWords = pattern.toLowerCase()
      .split(/[^a-z0-9-]+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));

    let sharedCount = 0;
    for (const pw of patternWords) {
      if (fuzzyWordMatch(pw, bodyWords)) {
        sharedCount++;
      }
    }

    if (sharedCount >= 2) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a word fuzzy-matches any word in the target list.
 *
 * A match occurs when two words share a common prefix of at least
 * 4 characters, enabling stem-level matching:
 * "lint" matches "linting", "configure" matches "configuration".
 */
function fuzzyWordMatch(word: string, targets: string[]): boolean {
  for (const target of targets) {
    if (target === word) return true;
    // Prefix matching: one word starts with the other (min 3 chars)
    if (target.startsWith(word) || word.startsWith(target)) {
      const sharedLen = Math.min(word.length, target.length);
      if (sharedLen >= 3) return true;
    }
    // Common stem matching: shared prefix of at least 4 chars
    const commonLen = commonPrefixLength(word, target);
    if (commonLen >= 4) return true;
  }
  return false;
}

/**
 * Count the length of the common prefix between two strings.
 */
function commonPrefixLength(a: string, b: string): number {
  const limit = Math.min(a.length, b.length);
  let i = 0;
  while (i < limit && a[i] === b[i]) i++;
  return i;
}

/**
 * Compute severity from the phantom section ratio.
 *
 * - > 0.5 => 'critical'
 * - >= 0.2 => 'warning'
 * - otherwise => 'info'
 */
function computeSeverity(phantomRatio: number): DerivedCheckSeverity {
  if (phantomRatio > 0.5) return 'critical';
  if (phantomRatio >= 0.2) return 'warning';
  return 'info';
}

/**
 * Get the most relevant evidence entries for inclusion in findings.
 *
 * Collects from all evidence fields, limited to maxCount entries.
 */
function getRelevantEvidence(
  evidence: ObservationEvidence,
  maxCount: number,
): string[] {
  const all: string[] = [
    ...evidence.observedCommands,
    ...evidence.observedFiles,
    ...evidence.observedTools,
    ...evidence.observedPatterns,
  ];

  return all.slice(0, maxCount);
}
