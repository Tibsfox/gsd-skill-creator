import { diffWords } from 'diff';
import { Change, CorrectionAnalysis } from '../types/learning.js';

export interface DetectorConfig {
  threshold: number;       // Similarity below this is significant (default 0.7)
  minChangedWords: number; // Minimum changed words to be significant (default 3)
}

export interface DetectionResult {
  skillName: string;
  analysis: CorrectionAnalysis;
  timestamp: string;
  original: string;
  final: string;
}

const DEFAULT_CONFIG: DetectorConfig = {
  threshold: 0.7,
  minChangedWords: 3,
};

/**
 * Analyze a text correction using word-level diff
 */
export function analyzeCorrection(original: string, final: string, threshold = 0.7): CorrectionAnalysis {
  // Handle edge cases
  if (!original && !final) {
    return {
      originalLength: 0,
      finalLength: 0,
      addedWords: 0,
      removedWords: 0,
      keptWords: 0,
      similarity: 1.0,
      changes: [],
      isSignificant: false,
    };
  }

  if (!original) {
    const words = countWords(final);
    return {
      originalLength: 0,
      finalLength: final.length,
      addedWords: words,
      removedWords: 0,
      keptWords: 0,
      similarity: 0,
      changes: [{ value: final, added: true }],
      isSignificant: words > 0,
    };
  }

  if (!final) {
    const words = countWords(original);
    return {
      originalLength: original.length,
      finalLength: 0,
      addedWords: 0,
      removedWords: words,
      keptWords: 0,
      similarity: 0,
      changes: [{ value: original, removed: true }],
      isSignificant: words > 0,
    };
  }

  // Compute word-level diff
  const changes = diffWords(original, final) as Change[];

  // Count words in each category
  let addedWords = 0;
  let removedWords = 0;
  let keptWords = 0;

  for (const change of changes) {
    const words = countWords(change.value);
    if (change.added) {
      addedWords += words;
    } else if (change.removed) {
      removedWords += words;
    } else {
      keptWords += words;
    }
  }

  // Calculate similarity (proportion of original text kept)
  const originalWords = keptWords + removedWords;
  const similarity = originalWords > 0 ? keptWords / originalWords : 1.0;

  // Determine if change is significant
  const isSignificant = similarity < threshold;

  return {
    originalLength: original.length,
    finalLength: final.length,
    addedWords,
    removedWords,
    keptWords,
    similarity,
    changes,
    isSignificant,
  };
}

/**
 * Count words in a text string
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Check if changes are formatting-only (whitespace/punctuation)
 */
export function isFormattingOnly(changes: Change[]): boolean {
  for (const change of changes) {
    if (change.added || change.removed) {
      // Check if the change contains meaningful content
      const meaningful = change.value.replace(/[\s\p{P}]/gu, '');
      if (meaningful.length > 0) {
        return false;
      }
    }
  }
  return true;
}

/**
 * FeedbackDetector detects significant corrections to skill-guided outputs
 */
export class FeedbackDetector {
  private config: DetectorConfig;

  constructor(config?: Partial<DetectorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect if a text change represents a significant correction
   * Returns null if the change is not significant enough to learn from
   */
  detect(original: string, final: string, skillName: string): DetectionResult | null {
    const analysis = analyzeCorrection(original, final, this.config.threshold);

    // Not significant if similarity is high
    if (!analysis.isSignificant) {
      return null;
    }

    // Not significant if too few words changed
    const changedWords = analysis.addedWords + analysis.removedWords;
    if (changedWords < this.config.minChangedWords) {
      return null;
    }

    // Filter out formatting-only changes
    if (isFormattingOnly(analysis.changes)) {
      return null;
    }

    return {
      skillName,
      analysis,
      timestamp: new Date().toISOString(),
      original,
      final,
    };
  }

  /**
   * Update detector configuration
   */
  configure(config: Partial<DetectorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): DetectorConfig {
    return { ...this.config };
  }
}
