/**
 * HB-06 ambiguity linter — multi-issue aggregation.
 *
 * A single document containing more than one ambiguity type must
 * aggregate flags correctly: one flag per issue, sorted by line then
 * column, and `passed=false`.
 */

import { describe, it, expect } from 'vitest';
import { checkAmbiguity } from '../ambiguity.js';

describe('HB-06 ambiguity — multi-issue aggregation', () => {
  it('aggregates flags across all four types in line order', () => {
    const longLine =
      'When the orchestrator schedules a wave the executor must validate the skilllist and the agentlist or the chipsetlist before running and emit a record into the trace ledger so the verifier can reproduce the wave outcome later from telemetry alone without re-running anything in production and without triggering any additional side effects on disk anywhere';
    const md = [
      '# Mixed', // line 1: heading, ignored
      '', // 2
      '- Load the model now', // 3: lexical
      '', // 4
      longLine, // 5: syntactic
      '', // 6
      '- The verifier must validate every artifact before signoff', // 7: semantic
      '', // 8
      '- Use as appropriate', // 9: vagueness
      '',
    ].join('\n');
    const r = checkAmbiguity(md, 'mixed.md');
    expect(r.passed).toBe(false);
    expect(r.flags.length).toBeGreaterThanOrEqual(4);
    // Verify ordered by line.
    const lines = r.flags.map((f) => f.span.line);
    const sorted = [...lines].sort((a, b) => a - b);
    expect(lines).toEqual(sorted);
    // Verify all four types observed.
    const types = new Set(r.flags.map((f) => f.type));
    expect(types.has('lexical')).toBe(true);
    expect(types.has('syntactic')).toBe(true);
    expect(types.has('semantic')).toBe(true);
    expect(types.has('vagueness')).toBe(true);
  });

  it('passed=true and flags=[] for a clean SKILL.md', () => {
    const md = [
      '---',
      'name: clean',
      'description: example with no ambiguity',
      '---',
      '',
      '# Clean',
      '',
      '- Apply the megakernel scheduler when phase 811 completes',
      '- Validate the LoRA adapter weights against the trace ledger',
      '',
    ].join('\n');
    const r = checkAmbiguity(md, 'clean.md');
    expect(r.passed).toBe(true);
    expect(r.flags).toEqual([]);
  });
});
