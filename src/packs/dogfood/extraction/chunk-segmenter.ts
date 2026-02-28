/**
 * Chunk segmentation respecting chapter/section boundaries and token limits.
 * Produces TextChunk[] from a ChapterMap with proper metadata.
 */

import type { TextChunk, MathExpr, DiagramRef } from '../types.js';
import type { ChapterMap, PartMap } from './types.js';
import { parseSections } from './section-parser.js';
import { extractMathExpressions, detectCrossRefs } from './section-parser.js';
import { estimateTokens } from './math-parser.js';
import { catalogDiagrams } from './diagram-cataloger.js';

const MATH_SYMBOLS = /[\u2200-\u22FF\u2190-\u21FF\u00B2\u00B3\u00B9\u207F\u2070-\u209F\u0391-\u03C9\u2211\u222B\u221A\u221E\u2202\u2260\u2264\u2265\u00D7\u00F7\u2248\u2261]/g;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

function calcMathDensity(text: string): number {
  if (text.length === 0) return 0;
  const symbolCount = (text.match(MATH_SYMBOLS) || []).length;
  return symbolCount / text.length;
}

function detectContentType(
  text: string,
  sectionHeading: string | undefined,
  chapterNumber: number,
  mathDensity: number
): TextChunk['contentType'] {
  if (sectionHeading) {
    const lower = sectionHeading.toLowerCase();
    if (lower.includes('exercise') || lower.includes('problems')) return 'exercise';
    if (lower.includes('build lab')) return 'buildlab';
    if (lower.includes('appendix')) return 'appendix';
  }

  if (chapterNumber > 33) return 'appendix';
  if (mathDensity > 0.5) return 'math';

  return 'prose';
}

/**
 * Split text at paragraph boundaries (double newlines).
 * Returns text segments that can be further split if needed.
 */
function splitAtParagraphs(text: string): string[] {
  return text.split(/\n\n+/).filter(p => p.trim().length > 0);
}

/**
 * Split a paragraph at sentence boundaries.
 * Only used when a single paragraph exceeds the token limit.
 */
function splitAtSentences(text: string): string[] {
  // Split at sentence-ending punctuation followed by space and uppercase
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
  return sentences.filter(s => s.trim().length > 0);
}

/**
 * Group segments into chunks respecting maxChunkTokens.
 * Tries to keep related content together (theorem + proof).
 */
function groupIntoChunks(segments: string[], maxTokens: number): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const segment of segments) {
    const segTokens = estimateTokens(segment);

    if (segTokens > maxTokens) {
      // Flush current
      if (current.length > 0) {
        chunks.push(current.join('\n\n'));
        current = [];
        currentTokens = 0;
      }

      // Split oversized segment at sentences
      const sentences = splitAtSentences(segment);
      let sentBuf: string[] = [];
      let sentTokens = 0;

      for (const sentence of sentences) {
        const sTokens = estimateTokens(sentence);
        if (sentTokens + sTokens > maxTokens && sentBuf.length > 0) {
          chunks.push(sentBuf.join(' '));
          sentBuf = [];
          sentTokens = 0;
        }
        sentBuf.push(sentence);
        sentTokens += sTokens;
      }
      if (sentBuf.length > 0) {
        chunks.push(sentBuf.join(' '));
      }
    } else if (currentTokens + segTokens > maxTokens) {
      // Flush current, start new chunk
      if (current.length > 0) {
        chunks.push(current.join('\n\n'));
      }
      current = [segment];
      currentTokens = segTokens;
    } else {
      current.push(segment);
      currentTokens += segTokens;
    }
  }

  if (current.length > 0) {
    chunks.push(current.join('\n\n'));
  }

  return chunks;
}

/**
 * Segment a chapter into TextChunk[] respecting boundaries and token limits.
 *
 * @param chapter - The chapter to segment
 * @param part - The parent part
 * @param config - Configuration with maxChunkTokens
 * @param sequenceStart - Starting sequenceIndex for this chapter's chunks
 * @returns TextChunk[] for this chapter
 */
export function segmentChapter(
  chapter: ChapterMap,
  part: PartMap,
  config: { maxChunkTokens: number },
  sequenceStart: number
): TextChunk[] {
  const text = chapter.rawText;
  if (!text || text.trim().length === 0) {
    return [];
  }

  const sections = parseSections(text);
  const allDiagrams = catalogDiagrams(text, chapter.startPage);
  const chunks: TextChunk[] = [];
  let seqIdx = sequenceStart;
  let chunkCounter = 1;

  if (sections.length === 0) {
    // No sections: treat entire chapter as one segment
    const paragraphs = splitAtParagraphs(text);
    const textChunks = groupIntoChunks(paragraphs, config.maxChunkTokens);

    for (const chunkText of textChunks) {
      const density = calcMathDensity(chunkText);
      const contentType = detectContentType(chunkText, undefined, chapter.chapterNumber, density);

      chunks.push({
        id: `part-${pad2(part.partNumber)}-ch-${pad2(chapter.chapterNumber)}-chunk-${pad3(chunkCounter)}`,
        part: part.partNumber,
        partTitle: part.title,
        chapter: chapter.chapterNumber,
        chapterTitle: chapter.title,
        contentType,
        text: chunkText,
        mathExpressions: extractMathExpressions(chunkText),
        diagrams: findDiagramsInRange(allDiagrams, chunkText, text),
        wordCount: countWords(chunkText),
        estimatedTokens: estimateTokens(chunkText),
        mathDensity: density,
        crossRefs: detectCrossRefs(chunkText),
        sequenceIndex: seqIdx++,
      });
      chunkCounter++;
    }
  } else {
    // Segment by sections
    for (let si = 0; si < sections.length; si++) {
      const section = sections[si];
      const sectionText = text.slice(section.startOffset, section.endOffset).trim();

      if (sectionText.length === 0) continue;

      const sectionTokens = estimateTokens(sectionText);

      // Extract section number for ID
      const secNumMatch = section.heading.match(/^(\d+)\.(\d+)/);
      const secNum = secNumMatch ? secNumMatch[2] : undefined;

      const sectionIdPart = secNum
        ? `-sec-${pad2(parseInt(secNum, 10))}`
        : (section.heading.toLowerCase() === 'exercises' ? '-exercises' :
           section.heading.toLowerCase() === 'build lab' ? '-buildlab' : '');

      if (sectionTokens <= config.maxChunkTokens) {
        // Section fits in one chunk
        const density = calcMathDensity(sectionText);
        const contentType = detectContentType(sectionText, section.heading, chapter.chapterNumber, density);

        chunks.push({
          id: `part-${pad2(part.partNumber)}-ch-${pad2(chapter.chapterNumber)}${sectionIdPart}-chunk-${pad3(chunkCounter)}`,
          part: part.partNumber,
          partTitle: part.title,
          chapter: chapter.chapterNumber,
          chapterTitle: chapter.title,
          section: section.heading,
          contentType,
          text: sectionText,
          mathExpressions: extractMathExpressions(sectionText),
          diagrams: findDiagramsInRange(allDiagrams, sectionText, text),
          wordCount: countWords(sectionText),
          estimatedTokens: estimateTokens(sectionText),
          mathDensity: density,
          crossRefs: detectCrossRefs(sectionText),
          sequenceIndex: seqIdx++,
        });
        chunkCounter++;
      } else {
        // Section too large: split at paragraph boundaries
        const paragraphs = splitAtParagraphs(sectionText);
        const textChunks = groupIntoChunks(paragraphs, config.maxChunkTokens);

        for (const chunkText of textChunks) {
          const density = calcMathDensity(chunkText);
          const contentType = detectContentType(chunkText, section.heading, chapter.chapterNumber, density);

          chunks.push({
            id: `part-${pad2(part.partNumber)}-ch-${pad2(chapter.chapterNumber)}${sectionIdPart}-chunk-${pad3(chunkCounter)}`,
            part: part.partNumber,
            partTitle: part.title,
            chapter: chapter.chapterNumber,
            chapterTitle: chapter.title,
            section: section.heading,
            contentType,
            text: chunkText,
            mathExpressions: extractMathExpressions(chunkText),
            diagrams: findDiagramsInRange(allDiagrams, chunkText, text),
            wordCount: countWords(chunkText),
            estimatedTokens: estimateTokens(chunkText),
            mathDensity: density,
            crossRefs: detectCrossRefs(chunkText),
            sequenceIndex: seqIdx++,
          });
          chunkCounter++;
        }
      }
    }
  }

  return chunks;
}

function countWords(text: string): number {
  const words = text.match(/\S+/g);
  return words ? words.length : 0;
}

function findDiagramsInRange(
  allDiagrams: DiagramRef[],
  _chunkText: string,
  _fullText: string
): DiagramRef[] {
  // For now, return diagrams that might be in this chunk's text range
  // A more precise implementation would track character offsets
  return allDiagrams.filter(_d => {
    // Simple heuristic: include if the chunk contains diagram-related keywords
    return false; // Conservative: don't assign diagrams to chunks without precise offset tracking
  });
}
