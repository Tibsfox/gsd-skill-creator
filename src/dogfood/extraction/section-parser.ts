/**
 * Section/subsection detection, math extraction, cross-ref detection, MusiXTeX tagging.
 * Parses chapter text into structural elements for downstream chunking.
 */

import type { SectionInfo } from './types.js';
import type { MathExpr } from '../types.js';

const ROMAN_TO_ARABIC: Record<string, number> = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
  'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
};

const UNNUMBERED_SECTIONS = ['Exercises', 'Build Lab', 'Summary', 'Review', 'Problems'];

/**
 * Detect section and subsection headings within chapter text.
 * Numbered: "3.1 Title" (level 1), "3.1.2 Title" (level 2)
 * Unnumbered: "Exercises", "Build Lab", "Summary", etc.
 */
export function parseSections(chapterText: string): SectionInfo[] {
  const sections: SectionInfo[] = [];

  // Match numbered sections: "N.N Title" or "N.N.N Title"
  const numberedPattern = /^(\d+\.\d+(?:\.\d+)?)\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = numberedPattern.exec(chapterText)) !== null) {
    const numberParts = match[1].split('.');
    const level = numberParts.length >= 3 ? 2 : 1;
    const heading = `${match[1]} ${match[2]}`;

    sections.push({
      heading,
      level,
      startOffset: match.index,
      endOffset: -1, // calculated below
    });
  }

  // Match unnumbered sections
  const unnumberedPattern = new RegExp(
    `^(${UNNUMBERED_SECTIONS.join('|')})\\s*$`,
    'gm'
  );

  while ((match = unnumberedPattern.exec(chapterText)) !== null) {
    sections.push({
      heading: match[1],
      level: 1,
      startOffset: match.index,
      endOffset: -1,
    });
  }

  // Sort by startOffset
  sections.sort((a, b) => a.startOffset - b.startOffset);

  // Calculate endOffset: each section ends where the next begins, last ends at text length
  for (let i = 0; i < sections.length; i++) {
    if (i < sections.length - 1) {
      sections[i].endOffset = sections[i + 1].startOffset;
    } else {
      sections[i].endOffset = chapterText.length;
    }
  }

  return sections;
}

// --- Math symbol detection utilities ---

const MATH_SYMBOLS = /[\u2200-\u22FF\u2190-\u21FF\u00B2\u00B3\u00B9\u207F\u2070-\u209F\u0391-\u03C9\u2211\u222B\u221A\u221E\u2202\u2260\u2264\u2265\u00D7\u00F7\u2248\u2261]/g;

function mathSymbolDensity(text: string): number {
  if (text.length === 0) return 0;
  const symbolCount = (text.match(MATH_SYMBOLS) || []).length;
  return symbolCount / text.length;
}

function isDisplayMathLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  // Display math: lines with significant leading whitespace (centered) and math content
  const leadingSpaces = line.length - line.trimStart().length;
  const hasMathContent = mathSymbolDensity(trimmed) > 0.1 ||
    /[=+\-*/^_{}()[\]|]/.test(trimmed) && trimmed.length < 200;
  return leadingSpaces >= 4 && hasMathContent;
}

/**
 * Render math symbols to human-readable form.
 */
function renderMathReadable(text: string): string {
  let result = text;

  // Unicode math symbols to words
  result = result.replace(/\u2211/g, 'sum');
  result = result.replace(/\u222B/g, 'integral');
  result = result.replace(/\u221A/g, 'sqrt');
  result = result.replace(/\u221E/g, 'infinity');
  result = result.replace(/\u2202/g, 'partial');
  result = result.replace(/\u2192/g, '->');
  result = result.replace(/\u2190/g, '<-');
  result = result.replace(/\u21D4/g, '<=>');
  result = result.replace(/\u2264/g, '<=');
  result = result.replace(/\u2265/g, '>=');
  result = result.replace(/\u2260/g, '!=');
  result = result.replace(/\u00B2/g, '^2');
  result = result.replace(/\u00B3/g, '^3');
  result = result.replace(/\u00D7/g, '*');
  result = result.replace(/\u00F7/g, '/');
  result = result.replace(/\u2248/g, '~=');

  // Greek letters
  result = result.replace(/\u03B1/g, 'alpha');
  result = result.replace(/\u03B2/g, 'beta');
  result = result.replace(/\u03B3/g, 'gamma');
  result = result.replace(/\u03B4/g, 'delta');
  result = result.replace(/\u03B5/g, 'epsilon');
  result = result.replace(/\u03B8/g, 'theta');
  result = result.replace(/\u03BB/g, 'lambda');
  result = result.replace(/\u03BC/g, 'mu');
  result = result.replace(/\u03C0/g, 'pi');
  result = result.replace(/\u03C3/g, 'sigma');
  result = result.replace(/\u03C6/g, 'phi');
  result = result.replace(/\u03C9/g, 'omega');

  return result;
}

/**
 * Extract mathematical expressions from text.
 * Identifies display math, inline math, theorems, definitions, and proofs.
 */
export function extractMathExpressions(text: string): MathExpr[] {
  const exprs: MathExpr[] = [];

  // 1. Theorem blocks
  const theoremPattern = /^(Theorem)\s*(\d+\.?\d*)?[:.]\s*(.+?)(?=\n\n|\n(?:Definition|Proof|Theorem|Lemma)|$)/gms;
  let match: RegExpExecArray | null;

  while ((match = theoremPattern.exec(text)) !== null) {
    const latex = match[3].trim();
    const label = match[2] ? `thm:${match[2]}` : undefined;
    exprs.push({
      latex,
      readable: renderMathReadable(latex),
      type: 'theorem',
      label,
    });
  }

  // 2. Definition blocks
  const defPattern = /^(Definition)\s*(\d+\.?\d*)?[:.]\s*(.+?)(?=\n\n|\n(?:Theorem|Proof|Definition|Lemma)|$)/gms;

  while ((match = defPattern.exec(text)) !== null) {
    const latex = match[3].trim();
    const label = match[2] ? `def:${match[2]}` : undefined;
    exprs.push({
      latex,
      readable: renderMathReadable(latex),
      type: 'definition',
      label,
    });
  }

  // 3. Proof blocks: from "Proof." or "Proof:" to QED / q.e.d. / blacksquare
  const proofPattern = /^Proof[.\s:](.+?)(?:QED|q\.e\.d\.|Q\.E\.D\.|\u25A0|\u25FC)/gms;

  while ((match = proofPattern.exec(text)) !== null) {
    const latex = match[1].trim();
    exprs.push({
      latex,
      readable: renderMathReadable(latex),
      type: 'proof',
    });
  }

  // 4. Display math: centered lines with math content
  const lines = text.split('\n');
  let displayBlock: string[] = [];
  let inDisplayBlock = false;

  for (const line of lines) {
    if (isDisplayMathLine(line)) {
      inDisplayBlock = true;
      displayBlock.push(line.trim());
    } else {
      if (inDisplayBlock && displayBlock.length > 0) {
        const latex = displayBlock.join(' ');
        exprs.push({
          latex,
          readable: renderMathReadable(latex),
          type: 'display',
        });
        displayBlock = [];
      }
      inDisplayBlock = false;
    }
  }
  // Flush remaining display block
  if (displayBlock.length > 0) {
    const latex = displayBlock.join(' ');
    exprs.push({
      latex,
      readable: renderMathReadable(latex),
      type: 'display',
    });
  }

  // 5. Inline math: shorter runs of math symbols within prose lines
  const proseLines = lines.filter(l => !isDisplayMathLine(l) && l.trim().length > 0);
  for (const line of proseLines) {
    // Skip lines that are part of theorem/def/proof blocks
    if (/^(Theorem|Definition|Proof)\s/i.test(line.trim())) continue;

    // Find inline math segments: sequences containing math symbols
    const inlinePattern = /(?:^|(?<=\s))([^\s]*[\u2200-\u22FF\u2190-\u21FF\u00B2\u00B3\u00D7\u00F7\u0391-\u03C9][^\n]*?)(?=\s{2,}|[.!?]\s|$)/g;
    let inlineMatch: RegExpExecArray | null;

    while ((inlineMatch = inlinePattern.exec(line)) !== null) {
      const candidate = inlineMatch[1].trim();
      if (candidate.length > 0 && mathSymbolDensity(candidate) > 0.05) {
        // Don't add duplicates of already-found expressions
        const isDuplicate = exprs.some(e => e.latex === candidate);
        if (!isDuplicate) {
          exprs.push({
            latex: candidate,
            readable: renderMathReadable(candidate),
            type: 'inline',
          });
        }
      }
    }
  }

  return exprs;
}

/**
 * Detect cross-references to other chapters, sections, and parts.
 * Returns deduplicated, sorted array of reference IDs.
 */
export function detectCrossRefs(text: string): string[] {
  const refs = new Set<string>();

  // Chapter references: "Chapter N"
  const chapterPattern = /Chapter\s+(\d{1,2})/gi;
  let match: RegExpExecArray | null;

  while ((match = chapterPattern.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    refs.add(`ch-${String(num).padStart(2, '0')}`);
  }

  // Section references: "Section N.N"
  const sectionPattern = /Section\s+(\d+)\.(\d+)/gi;

  while ((match = sectionPattern.exec(text)) !== null) {
    const chNum = parseInt(match[1], 10);
    const secNum = parseInt(match[2], 10);
    refs.add(`ch-${String(chNum).padStart(2, '0')}-sec-${String(secNum).padStart(2, '0')}`);
  }

  // Part references: "Part N" (Roman or Arabic)
  const partPattern = /Part\s+(I{1,3}|IV|V|VI{0,3}|IX|X|\d{1,2})/gi;

  while ((match = partPattern.exec(text)) !== null) {
    const partStr = match[1].toUpperCase();
    const partNum = ROMAN_TO_ARABIC[partStr] ?? parseInt(match[1], 10);
    if (!isNaN(partNum) && partNum > 0) {
      refs.add(`part-${String(partNum).padStart(2, '0')}`);
    }
  }

  return Array.from(refs).sort();
}

// --- MusiXTeX detection ---

const MUSICAL_CONTEXT_WORDS = /\b(staff|note|melody|clef|treble|bass|rhythm|measure|scale|chord|tempo|octave|pitch|harmony)\b/i;

const MUSICTEX_ARTIFACTS = /[\u266D\u266E\u266F\u2669\u266A\u266B\u266C]|(?:---\u2502|---[-|]+){2,}|(?:\bc\s+d\s+e\s+f\s+g\s+a\s+b\b)/;

/**
 * Tag MusiXTeX segments with descriptive placeholders.
 * Detects garbled musical notation artifacts near musical context words.
 */
export function tagMusiXTeX(text: string): string {
  if (!MUSICTEX_ARTIFACTS.test(text)) {
    return text;
  }

  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (MUSICTEX_ARTIFACTS.test(line)) {
      // Collect consecutive MusiXTeX lines
      const startIdx = i;
      while (i < lines.length && (MUSICTEX_ARTIFACTS.test(lines[i]) || lines[i].trim() === '')) {
        i++;
      }

      // Look for context before and after
      const contextBefore = lines.slice(Math.max(0, startIdx - 3), startIdx).join(' ');
      const contextAfter = lines.slice(i, Math.min(lines.length, i + 3)).join(' ');
      const combinedContext = `${contextBefore} ${contextAfter}`;

      // Find the best description from surrounding prose
      let description = 'musical notation';
      const contextMatch = combinedContext.match(MUSICAL_CONTEXT_WORDS);
      if (contextMatch) {
        // Extract the sentence containing the musical context word
        const sentences = combinedContext.split(/[.!?]+/);
        const relevantSentence = sentences.find(s => MUSICAL_CONTEXT_WORDS.test(s));
        if (relevantSentence) {
          description = relevantSentence.trim().slice(0, 100);
        }
      }

      result.push(`[MusiXTeX: ${description}]`);
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join('\n');
}
