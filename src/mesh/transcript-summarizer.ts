/**
 * Transcript summarization for mesh execution context preservation.
 *
 * Extracts structured decisions from transcript text and compresses
 * step output into a bounded digest. Consumed by result-ingestion.ts.
 *
 * Pure functions -- no IO, no side effects (IMP-06).
 */

import type { DecisionRecord } from './context-types.js';

/** Maximum length of a transcript digest in characters */
export const MAX_DIGEST_LENGTH = 2000;

/**
 * Pattern for decision lines in transcripts.
 * Format: DECISION: {description} | RATIONALE: {rationale} | OUTCOME: {outcome}
 */
const DECISION_PATTERN =
  /^DECISION:\s*(.+?)\s*\|\s*RATIONALE:\s*(.+?)\s*\|\s*OUTCOME:\s*(accepted|rejected|deferred)\s*$/;

/**
 * Keywords that identify relevant step output lines.
 * Lines containing any of these (case-sensitive) are preserved in compression.
 */
const RELEVANT_KEYWORDS = [
  'Result:',
  'Output:',
  'Error:',
  'Decision:',
  'Summary:',
  'Created:',
  'PASS',
  'FAIL',
];

/**
 * Extract structured decision records from a transcript.
 *
 * Parses lines matching the DECISION format and returns an array of
 * DecisionRecord objects with generated IDs (dec-0, dec-1, ...).
 *
 * @param transcript - Full execution transcript text
 * @returns Array of extracted decision records
 */
export function extractDecisions(transcript: string): DecisionRecord[] {
  if (!transcript) return [];

  const decisions: DecisionRecord[] = [];
  const lines = transcript.split('\n');
  const now = new Date().toISOString();

  for (const line of lines) {
    const match = line.match(DECISION_PATTERN);
    if (match) {
      decisions.push({
        id: `dec-${decisions.length}`,
        description: match[1],
        rationale: match[2],
        outcome: match[3] as DecisionRecord['outcome'],
        timestamp: now,
      });
    }
  }

  return decisions;
}

/**
 * Compress a transcript to only relevant step output lines.
 *
 * Keeps lines containing: Result:, Output:, Error:, Decision:, Summary:,
 * Created:, PASS, FAIL. All other lines are discarded.
 *
 * @param transcript - Full execution transcript text
 * @returns Compressed transcript with only relevant lines
 */
export function compressSteps(transcript: string): string {
  if (!transcript) return '';

  const lines = transcript.split('\n');
  const relevant = lines.filter((line) =>
    RELEVANT_KEYWORDS.some((keyword) => line.includes(keyword)),
  );

  return relevant.join('\n');
}

/**
 * Summarize a transcript into decisions and a bounded digest.
 *
 * Combines extractDecisions() and compressSteps(), truncating the
 * digest to MAX_DIGEST_LENGTH characters.
 *
 * @param transcript - Full execution transcript text
 * @returns Object with decisions array and digest string
 */
export function summarizeTranscript(transcript: string): {
  decisions: DecisionRecord[];
  digest: string;
} {
  const decisions = extractDecisions(transcript);
  let digest = compressSteps(transcript);

  if (digest.length > MAX_DIGEST_LENGTH) {
    digest = digest.slice(0, MAX_DIGEST_LENGTH);
  }

  return { decisions, digest };
}
