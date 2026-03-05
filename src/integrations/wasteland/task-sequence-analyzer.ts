/**
 * Task Sequence Analyzer — Layer 1, Wave 1
 *
 * Extracts n-gram patterns from task sequences using PrefixSpan.
 * Detects rework cycles, ranks patterns by frequency * success rate,
 * and supports inter-town sequence analysis.
 */

import type { ObservationEvent, SequencePattern } from './types.js';

// ============================================================================
// N-gram Extraction
// ============================================================================

/**
 * Group observation events into task sequences by case ID.
 * Case ID = first segment of taskId (e.g., "req-123" from "req-123-impl").
 */
export function groupByCaseId(events: ObservationEvent[]): Map<string, ObservationEvent[]> {
  const cases = new Map<string, ObservationEvent[]>();
  for (const event of events) {
    if (event.eventType !== 'task-completed' && event.eventType !== 'task-failed') continue;
    const caseId = event.taskId.split('-').slice(0, 2).join('-') || event.taskId;
    const existing = cases.get(caseId) ?? [];
    existing.push(event);
    cases.set(caseId, existing);
  }
  // Sort each case by timestamp
  for (const [, evts] of cases) {
    evts.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
  return cases;
}

/**
 * Extract task type sequences from grouped events.
 */
export function extractSequences(cases: Map<string, ObservationEvent[]>): string[][] {
  const sequences: string[][] = [];
  for (const [, events] of cases) {
    const seq = events.map(e =>
      (e.metadata?.taskType as string) ?? e.taskId.split('-').pop() ?? 'unknown'
    );
    if (seq.length >= 2) {
      sequences.push(seq);
    }
  }
  return sequences;
}

/**
 * Extract all n-grams of a given length from a sequence.
 */
export function extractNgrams(sequence: string[], n: number): string[][] {
  const ngrams: string[][] = [];
  for (let i = 0; i <= sequence.length - n; i++) {
    ngrams.push(sequence.slice(i, i + n));
  }
  return ngrams;
}

/**
 * Count n-gram frequencies across all sequences.
 * Returns sorted by frequency descending.
 */
export function countNgrams(
  sequences: string[][],
  minN: number = 2,
  maxN: number = 5,
  minSupport: number = 2,
): Map<string, { sequence: string[]; count: number }> {
  const counts = new Map<string, { sequence: string[]; count: number }>();

  for (const seq of sequences) {
    for (let n = minN; n <= Math.min(maxN, seq.length); n++) {
      const ngrams = extractNgrams(seq, n);
      // Use a Set to count each n-gram once per sequence (support count)
      const seen = new Set<string>();
      for (const gram of ngrams) {
        const key = gram.join(' -> ');
        if (!seen.has(key)) {
          seen.add(key);
          const existing = counts.get(key);
          if (existing) {
            existing.count++;
          } else {
            counts.set(key, { sequence: gram, count: 1 });
          }
        }
      }
    }
  }

  // Filter by minimum support
  for (const [key, val] of counts) {
    if (val.count < minSupport) {
      counts.delete(key);
    }
  }

  return counts;
}

// ============================================================================
// PrefixSpan Implementation
// ============================================================================

/** PrefixSpan result entry */
export interface PrefixSpanResult {
  pattern: string[];
  support: number;
}

/**
 * Simplified PrefixSpan algorithm for sequential pattern mining.
 *
 * Projects the database by frequent prefixes and grows patterns recursively.
 * More efficient than GSP for longer sequences with larger vocabularies.
 */
export function prefixSpan(
  sequences: string[][],
  minSupport: number = 2,
  maxLength: number = 10,
): PrefixSpanResult[] {
  const results: PrefixSpanResult[] = [];

  // Count single-item support
  const itemSupport = new Map<string, number>();
  for (const seq of sequences) {
    const seen = new Set<string>();
    for (const item of seq) {
      if (!seen.has(item)) {
        seen.add(item);
        itemSupport.set(item, (itemSupport.get(item) ?? 0) + 1);
      }
    }
  }

  // Recursive pattern growth
  function grow(prefix: string[], projected: string[][]): void {
    if (prefix.length >= maxLength) return;

    // Count support for each next item
    const nextSupport = new Map<string, { count: number; projections: string[][] }>();

    for (const seq of projected) {
      const seen = new Set<string>();
      for (let i = 0; i < seq.length; i++) {
        const item = seq[i];
        if (!seen.has(item)) {
          seen.add(item);
          const entry = nextSupport.get(item) ?? { count: 0, projections: [] };
          entry.count++;
          // Project: suffix after this position
          if (i + 1 < seq.length) {
            entry.projections.push(seq.slice(i + 1));
          }
          nextSupport.set(item, entry);
        }
      }
    }

    for (const [item, { count, projections }] of nextSupport) {
      if (count >= minSupport) {
        const newPrefix = [...prefix, item];
        results.push({ pattern: newPrefix, support: count });
        if (projections.length > 0) {
          grow(newPrefix, projections);
        }
      }
    }
  }

  // Start with empty prefix, full sequences as projection
  grow([], sequences);

  return results;
}

// ============================================================================
// Rework Detection
// ============================================================================

/**
 * Detect rework in a task sequence.
 * Rework = same task type appearing more than once.
 */
export function detectRework(sequence: string[]): { hasRework: boolean; reworkTypes: string[] } {
  const counts = new Map<string, number>();
  for (const type of sequence) {
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  const reworkTypes = Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([type]) => type);
  return { hasRework: reworkTypes.length > 0, reworkTypes };
}

// ============================================================================
// Pattern Scoring
// ============================================================================

/**
 * Score and rank patterns, combining frequency with success rate data.
 */
export function scorePatterns(
  ngramCounts: Map<string, { sequence: string[]; count: number }>,
  successRates: Map<string, number>, // key -> success rate for the sequence
  totalSequences: number,
): SequencePattern[] {
  const patterns: SequencePattern[] = [];
  let idx = 0;

  for (const [key, { sequence, count }] of ngramCounts) {
    const avgSuccessRate = successRates.get(key) ?? 0.5; // default 50%
    const frequency = count / totalSequences;
    const rework = detectRework(sequence);

    patterns.push({
      id: `pat-${idx++}`,
      sequence,
      support: count,
      frequency,
      avgSuccessRate,
      score: frequency * avgSuccessRate,
      reworkDetected: rework.hasRework,
    });
  }

  // Sort by score descending
  patterns.sort((a, b) => b.score - a.score);
  return patterns;
}

/**
 * Run the full analysis pipeline on observation events.
 * Returns top-N patterns ranked by score.
 */
export function analyzeSequences(
  events: ObservationEvent[],
  options: {
    minSupport?: number;
    maxNgramLength?: number;
    topN?: number;
    usePrefixSpan?: boolean;
    maxPrefixSpanLength?: number;
  } = {},
): SequencePattern[] {
  const {
    minSupport = 2,
    maxNgramLength = 5,
    topN = 10,
    usePrefixSpan: usePSOption = false,
    maxPrefixSpanLength = 10,
  } = options;

  const cases = groupByCaseId(events);
  const sequences = extractSequences(cases);

  if (sequences.length === 0) return [];

  // N-gram analysis
  const ngramCounts = countNgrams(sequences, 2, maxNgramLength, minSupport);

  // PrefixSpan for longer patterns
  if (usePSOption) {
    const psResults = prefixSpan(sequences, minSupport, maxPrefixSpanLength);
    for (const result of psResults) {
      if (result.pattern.length > maxNgramLength) {
        const key = result.pattern.join(' -> ');
        if (!ngramCounts.has(key)) {
          ngramCounts.set(key, { sequence: result.pattern, count: result.support });
        }
      }
    }
  }

  const patterns = scorePatterns(ngramCounts, new Map(), sequences.length);
  return patterns.slice(0, topN);
}
