/**
 * Training pair coherence checker for adapter quality.
 *
 * Uses statistical anomaly detection to identify training pairs
 * that deviate from the expected distribution within a set.
 * Checks length outliers, similarity outliers, and format mismatches.
 *
 * @module staging/derived/training-coherence
 */

import type { CoherenceFinding, DerivedCheckSeverity } from './types.js';

/** A single training pair with input and expected output. */
export interface TrainingPair {
  input: string;
  output: string;
}

/**
 * Check training pairs for statistical coherence issues.
 *
 * Requires at least 3 pairs to perform statistical analysis.
 * Detects: length outliers (>2 stdDev), similarity outliers
 * (<0.1 or >0.95), and format mismatches (code vs prose, json vs yaml).
 *
 * @param pairs - Training pairs to analyze
 * @returns Array of coherence findings, empty if no issues
 */
export function checkTrainingCoherence(pairs: TrainingPair[]): CoherenceFinding[] {
  if (pairs.length < 3) {
    return [];
  }

  const findings: CoherenceFinding[] = [];

  // Length analysis
  findings.push(...detectLengthOutliers(pairs));

  // Similarity analysis
  findings.push(...detectSimilarityOutliers(pairs));

  // Format analysis
  findings.push(...detectFormatMismatches(pairs));

  return findings;
}

/**
 * Compute mean and standard deviation for an array of numbers.
 */
function computeMeanStdDev(values: number[]): { mean: number; stdDev: number } {
  const n = values.length;
  if (n === 0) return { mean: 0, stdDev: 0 };

  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}

/**
 * Compute word-level Jaccard similarity between two strings.
 *
 * Jaccard = |intersection| / |union| of word sets (lowercased, tokenized).
 * Returns 0 for empty inputs.
 */
function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));

  if (wordsA.size === 0 && wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) {
      intersection++;
    }
  }

  const union = wordsA.size + wordsB.size - intersection;
  if (union === 0) return 0;

  return intersection / union;
}

/**
 * Detect the structural format of a text string.
 *
 * Returns 'json' for JSON structures, 'yaml' for YAML-like content,
 * 'code' for programming code, or 'prose' as default.
 */
function detectFormat(text: string): 'code' | 'json' | 'yaml' | 'prose' {
  const trimmed = text.trim();

  // JSON detection: starts with { or [
  if (/^\s*[\{\[]/.test(trimmed) && /[\}\]]\s*$/.test(trimmed)) {
    return 'json';
  }

  // YAML detection: has key: value patterns on multiple lines
  const yamlPattern = /^[a-zA-Z_][\w]*:\s+\S/m;
  const lines = trimmed.split('\n');
  const yamlLineCount = lines.filter((line) => yamlPattern.test(line.trim())).length;
  if (yamlLineCount >= 2 && lines.length >= 2) {
    return 'yaml';
  }

  // Code detection: code block markers, indentation patterns, or common code tokens
  const codeIndicators = [
    /```/,                              // code block markers
    /^\s*(function|const|let|var|import|export|class|interface|type|return)\b/m,  // code keywords
    /[{}\[\]();]=>/,                    // code syntax characters
    /^\s{2,}(if|for|while|return)\b/m,  // indented control flow
  ];
  const codeScore = codeIndicators.filter((pattern) => pattern.test(trimmed)).length;
  if (codeScore >= 2) {
    return 'code';
  }

  return 'prose';
}

/**
 * Detect length outliers in training pairs.
 *
 * Flags pairs where input or output length deviates more than
 * 2 standard deviations from the mean.
 */
function detectLengthOutliers(pairs: TrainingPair[]): CoherenceFinding[] {
  const findings: CoherenceFinding[] = [];

  const inputLengths = pairs.map((p) => p.input.length);
  const outputLengths = pairs.map((p) => p.output.length);

  const inputStats = computeMeanStdDev(inputLengths);
  const outputStats = computeMeanStdDev(outputLengths);

  for (let i = 0; i < pairs.length; i++) {
    const inputDev = Math.abs(inputLengths[i] - inputStats.mean);
    const outputDev = Math.abs(outputLengths[i] - outputStats.mean);

    // Only flag if stdDev is meaningful (avoid division by zero or near-zero)
    if (inputStats.stdDev > 0 && inputDev > 2 * inputStats.stdDev) {
      findings.push(makeLengthFinding(i, 'input', inputLengths[i], inputStats.mean, inputStats.stdDev));
    }

    if (outputStats.stdDev > 0 && outputDev > 2 * outputStats.stdDev) {
      findings.push(makeLengthFinding(i, 'output', outputLengths[i], outputStats.mean, outputStats.stdDev));
    }
  }

  return findings;
}

/**
 * Detect similarity outliers in training pairs.
 *
 * Flags pairs where input-output Jaccard similarity is >0.95 (too similar)
 * or <0.1 (too dissimilar).
 */
function detectSimilarityOutliers(pairs: TrainingPair[]): CoherenceFinding[] {
  const findings: CoherenceFinding[] = [];

  for (let i = 0; i < pairs.length; i++) {
    const similarity = jaccardSimilarity(pairs[i].input, pairs[i].output);

    if (similarity > 0.95) {
      findings.push({
        type: 'coherence',
        severity: 'warning' as DerivedCheckSeverity,
        message: `Pair ${i}: input and output are too similar (Jaccard=${similarity.toFixed(3)}), likely copy-paste`,
        pairIndex: i,
        anomalyType: 'outlier-similarity',
        details: `Jaccard similarity ${similarity.toFixed(3)} exceeds 0.95 threshold`,
      });
    } else if (similarity < 0.1) {
      findings.push({
        type: 'coherence',
        severity: 'warning' as DerivedCheckSeverity,
        message: `Pair ${i}: input and output are too dissimilar (Jaccard=${similarity.toFixed(3)}), possibly unrelated`,
        pairIndex: i,
        anomalyType: 'outlier-similarity',
        details: `Jaccard similarity ${similarity.toFixed(3)} is below 0.1 threshold`,
      });
    }
  }

  return findings;
}

/**
 * Detect format mismatches between input and output in training pairs.
 *
 * Flags pairs where input and output have structurally different formats
 * (e.g., code vs prose, JSON vs YAML).
 */
function detectFormatMismatches(pairs: TrainingPair[]): CoherenceFinding[] {
  const findings: CoherenceFinding[] = [];

  // Track which format pairs are seen to determine "normal" for the set
  for (let i = 0; i < pairs.length; i++) {
    const inputFormat = detectFormat(pairs[i].input);
    const outputFormat = detectFormat(pairs[i].output);

    if (inputFormat !== outputFormat && isSignificantFormatMismatch(inputFormat, outputFormat)) {
      findings.push({
        type: 'coherence',
        severity: 'info' as DerivedCheckSeverity,
        message: `Pair ${i}: format mismatch between input (${inputFormat}) and output (${outputFormat})`,
        pairIndex: i,
        anomalyType: 'format-mismatch',
        details: `Input format: ${inputFormat}, output format: ${outputFormat}`,
      });
    }
  }

  return findings;
}

/**
 * Check if a format difference is significant enough to flag.
 * Code vs prose, JSON vs YAML are significant mismatches.
 */
function isSignificantFormatMismatch(
  a: 'code' | 'json' | 'yaml' | 'prose',
  b: 'code' | 'json' | 'yaml' | 'prose',
): boolean {
  // All cross-format mismatches are significant
  // code vs prose, json vs yaml, code vs json, etc.
  return a !== b;
}

/**
 * Create a CoherenceFinding for a length outlier.
 */
function makeLengthFinding(
  pairIndex: number,
  field: 'input' | 'output',
  actual: number,
  mean: number,
  stdDev: number,
): CoherenceFinding {
  const deviations = ((actual - mean) / stdDev).toFixed(1);
  return {
    type: 'coherence',
    severity: 'warning' as DerivedCheckSeverity,
    message: `Pair ${pairIndex}: ${field} length (${actual}) deviates ${deviations} stdDev from mean (${mean.toFixed(0)})`,
    pairIndex,
    anomalyType: 'outlier-length',
    details: `${field} length: ${actual}, mean: ${mean.toFixed(1)}, stdDev: ${stdDev.toFixed(1)}, deviation: ${deviations} stdDev`,
  };
}
