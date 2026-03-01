/**
 * Top-level extraction orchestrator using pdftotext -layout.
 * Coordinates PDF text extraction, chapter/part detection, and section parsing.
 */

import { execFile } from 'node:child_process';
import { access } from 'node:fs/promises';
import type { ExtractionConfig } from '../types.js';
import type { ExtractionResult, RawPage } from './types.js';
import { detectParts, detectChapters } from './chapter-detector.js';
import { tagMusiXTeX, parseSections, extractMathExpressions, detectCrossRefs } from './section-parser.js';

function runPdftotext(sourcePath: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile('pdftotext', ['-layout', sourcePath, '-'], (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout: stdout as string, stderr: stderr as string });
      }
    });
  });
}

/**
 * @justification Type: Accepted heuristic
 * - maxChunkTokens 8000: Balances extraction completeness against model input
 *   constraints. Leaves headroom for prompt framing within a 16K context window
 *   (8K content + 8K for system prompt, instructions, and response space).
 * - chunkStrategy 'adaptive': Splits at natural section boundaries rather than
 *   fixed offsets, preserving semantic coherence within chunks.
 */
const DEFAULT_CONFIG: Omit<ExtractionConfig, 'sourcePath'> = {
  outputDir: '.planning/v1.40/extraction',
  chunkStrategy: 'adaptive',
  maxChunkTokens: 8000,
  preserveLatex: true,
  catalogDiagrams: true,
};

/**
 * Extract text from a PDF using pdftotext -layout, then detect structure.
 *
 * @param config - Extraction configuration. sourcePath is required.
 * @returns ExtractionResult with parts, chapters, rawPages, and warnings.
 */
export async function extractPdf(
  config: Partial<ExtractionConfig> & { sourcePath: string }
): Promise<ExtractionResult> {
  if (!config.sourcePath) {
    throw new Error('sourcePath is required');
  }

  const fullConfig: ExtractionConfig = { ...DEFAULT_CONFIG, ...config };
  const warnings: string[] = [];

  // Verify PDF exists
  try {
    await access(fullConfig.sourcePath);
  } catch {
    throw new Error(`PDF file not found: ${fullConfig.sourcePath}`);
  }

  // Run pdftotext -layout
  let stdout: string;
  try {
    const result = await runPdftotext(fullConfig.sourcePath);
    stdout = result.stdout;
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'ENOENT') {
      throw new Error('pdftotext not found. Install poppler-utils: sudo apt install poppler-utils');
    }
    throw error;
  }

  // Handle empty output
  if (!stdout || stdout.trim().length === 0) {
    return {
      parts: [],
      chapters: [],
      rawPages: [],
      warnings: ['PDF extraction produced empty output'],
    };
  }

  // Split into pages by form-feed character
  const pageTexts = stdout.split('\f');
  const rawPages: RawPage[] = pageTexts.map((text, index) => ({
    pageNumber: index + 1,
    text,
  }));

  // Detect parts and chapters
  const parts = detectParts(rawPages);
  const chapters = detectChapters(rawPages, parts);

  // Process each chapter: apply MusiXTeX tagging, parse sections, extract math, detect cross-refs
  for (const chapter of chapters) {
    chapter.rawText = tagMusiXTeX(chapter.rawText);

    // Parse sections within chapter (for later use)
    const _sections = parseSections(chapter.rawText);
    const _mathExprs = extractMathExpressions(chapter.rawText);
    const _crossRefs = detectCrossRefs(chapter.rawText);

    // Collect warnings for chapters with potential issues
    if (chapter.rawText.trim().length < 100) {
      warnings.push(`Chapter ${chapter.chapterNumber} (${chapter.title}): Very short content (${chapter.rawText.trim().length} chars)`);
    }
  }

  return {
    parts,
    chapters,
    rawPages,
    warnings,
  };
}
