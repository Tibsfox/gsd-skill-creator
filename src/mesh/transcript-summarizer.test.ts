import { describe, it, expect } from 'vitest';
import {
  MAX_DIGEST_LENGTH,
  extractDecisions,
  compressSteps,
  summarizeTranscript,
} from './transcript-summarizer.js';
import type { DecisionRecord } from './context-types.js';

// ============================================================================
// extractDecisions
// ============================================================================

describe('extractDecisions', () => {
  it('extracts a single decision line', () => {
    const transcript = 'DECISION: Use local node | RATIONALE: Lower latency | OUTCOME: accepted';
    const decisions = extractDecisions(transcript);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].description).toBe('Use local node');
    expect(decisions[0].rationale).toBe('Lower latency');
    expect(decisions[0].outcome).toBe('accepted');
    expect(decisions[0].id).toBe('dec-0');
    expect(decisions[0].timestamp).toBeTruthy();
  });

  it('extracts multiple decision lines', () => {
    const transcript = [
      'Step 1: analyze',
      'DECISION: Use gpt-4 | RATIONALE: Best accuracy | OUTCOME: accepted',
      'Step 2: route',
      'DECISION: Skip fallback | RATIONALE: Only one node | OUTCOME: deferred',
      'Step 3: done',
    ].join('\n');
    const decisions = extractDecisions(transcript);
    expect(decisions).toHaveLength(2);
    expect(decisions[0].id).toBe('dec-0');
    expect(decisions[0].description).toBe('Use gpt-4');
    expect(decisions[1].id).toBe('dec-1');
    expect(decisions[1].description).toBe('Skip fallback');
    expect(decisions[1].outcome).toBe('deferred');
  });

  it('returns empty array when no decisions found', () => {
    const transcript = 'Step 1: init\nStep 2: execute\nStep 3: done';
    const decisions = extractDecisions(transcript);
    expect(decisions).toHaveLength(0);
  });

  it('handles rejected outcome', () => {
    const transcript = 'DECISION: Use cloud node | RATIONALE: Too expensive | OUTCOME: rejected';
    const decisions = extractDecisions(transcript);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].outcome).toBe('rejected');
  });

  it('returns empty array for empty transcript', () => {
    expect(extractDecisions('')).toHaveLength(0);
  });
});

// ============================================================================
// compressSteps
// ============================================================================

describe('compressSteps', () => {
  it('keeps lines containing relevant keywords', () => {
    const transcript = [
      'Step 1: init',
      'Result: initialized',
      'Step 2: processing',
      'Output: file created',
      'Step 3: cleanup',
      'Error: disk full',
      'Summary: 2 steps done',
    ].join('\n');
    const compressed = compressSteps(transcript);
    expect(compressed).toContain('Result: initialized');
    expect(compressed).toContain('Output: file created');
    expect(compressed).toContain('Error: disk full');
    expect(compressed).toContain('Summary: 2 steps done');
    expect(compressed).not.toContain('Step 1: init');
    expect(compressed).not.toContain('Step 2: processing');
    expect(compressed).not.toContain('Step 3: cleanup');
  });

  it('keeps PASS and FAIL lines', () => {
    const transcript = 'Test A: PASS\nTest B: FAIL\nOther line';
    const compressed = compressSteps(transcript);
    expect(compressed).toContain('PASS');
    expect(compressed).toContain('FAIL');
    expect(compressed).not.toContain('Other line');
  });

  it('keeps Decision and Created lines', () => {
    const transcript = 'Decision: use local\nCreated: output.json\nSome noise';
    const compressed = compressSteps(transcript);
    expect(compressed).toContain('Decision: use local');
    expect(compressed).toContain('Created: output.json');
    expect(compressed).not.toContain('Some noise');
  });

  it('returns empty string for empty transcript', () => {
    expect(compressSteps('')).toBe('');
  });

  it('returns empty string when no relevant lines', () => {
    const transcript = 'Step 1\nStep 2\nStep 3';
    expect(compressSteps(transcript)).toBe('');
  });
});

// ============================================================================
// summarizeTranscript
// ============================================================================

describe('summarizeTranscript', () => {
  it('combines decisions and digest', () => {
    const transcript = [
      'DECISION: Use node-1 | RATIONALE: Lowest load | OUTCOME: accepted',
      'Result: task started',
      'Output: file written',
      'DECISION: Skip retry | RATIONALE: Success on first try | OUTCOME: deferred',
    ].join('\n');
    const summary = summarizeTranscript(transcript);
    expect(summary.decisions).toHaveLength(2);
    expect(summary.digest).toContain('Result: task started');
    expect(summary.digest).toContain('Output: file written');
  });

  it('truncates digest to MAX_DIGEST_LENGTH', () => {
    const longLine = 'Result: ' + 'x'.repeat(300);
    const lines = Array.from({ length: 20 }, () => longLine);
    const transcript = lines.join('\n');
    const summary = summarizeTranscript(transcript);
    expect(summary.digest.length).toBeLessThanOrEqual(MAX_DIGEST_LENGTH);
  });

  it('handles transcript with no decisions or relevant lines', () => {
    const transcript = 'Nothing important here';
    const summary = summarizeTranscript(transcript);
    expect(summary.decisions).toHaveLength(0);
    expect(summary.digest).toBe('');
  });

  it('handles empty transcript', () => {
    const summary = summarizeTranscript('');
    expect(summary.decisions).toHaveLength(0);
    expect(summary.digest).toBe('');
  });
});

// ============================================================================
// MAX_DIGEST_LENGTH constant
// ============================================================================

describe('MAX_DIGEST_LENGTH', () => {
  it('is 2000', () => {
    expect(MAX_DIGEST_LENGTH).toBe(2000);
  });
});
