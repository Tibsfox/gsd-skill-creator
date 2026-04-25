/**
 * HB-06 ambiguity linter — one positive fixture per ambiguity type.
 *
 * Each fixture is a minimal SKILL.md exercising exactly one of the four
 * Orchid types. The linter must flag exactly one issue of the matching
 * type per fixture.
 */

import { describe, it, expect } from 'vitest';
import { checkAmbiguity } from '../ambiguity.js';

describe('HB-06 ambiguity — positive fixtures (one per type)', () => {
  it('lexical: bare "the model" in a short directive bullet is flagged', () => {
    const md = [
      '---',
      'name: lexical-fixture',
      'description: example',
      '---',
      '',
      '# Title',
      '',
      '## Steps',
      '',
      '- Load the model and run it.',
      '- Verify the load succeeded by inspecting the artifact directory.',
      '',
    ].join('\n');
    const r = checkAmbiguity(md, 'lexical-fixture.md');
    const lex = r.flags.filter((f) => f.type === 'lexical');
    expect(lex).toHaveLength(1);
    expect(lex[0].text).toBe('the model');
    expect(lex[0].span.line).toBe(10);
  });

  it('syntactic: long mixed and/or coordination is flagged', () => {
    // Build a single line, ≥45 words, with " and ... or ..." coordination
    // and no parens, no "either", no semicolons.
    const longLine =
      'When the orchestrator schedules a wave the executor must validate the skill and the agent or the chipset before running and emit a record into the trace ledger so the verifier can reproduce the wave outcome later from telemetry alone without re-running anything in production and without triggering any additional side effects on disk anywhere';
    const md = ['# Title', '', longLine, ''].join('\n');
    const r = checkAmbiguity(md, 'syntactic-fixture.md');
    const syn = r.flags.filter((f) => f.type === 'syntactic');
    expect(syn).toHaveLength(1);
  });

  it('semantic: unscoped "must validate every artifact" is flagged', () => {
    const md = [
      '# Title',
      '',
      '## Steps',
      '',
      '- The verifier must validate every artifact before signoff',
      '',
    ].join('\n');
    const r = checkAmbiguity(md, 'semantic-fixture.md');
    const sem = r.flags.filter((f) => f.type === 'semantic');
    expect(sem.length).toBeGreaterThanOrEqual(1);
  });

  it('vagueness: directive "Use as appropriate" is flagged', () => {
    const md = [
      '# Title',
      '',
      '## Usage',
      '',
      '- Use as appropriate',
      '',
    ].join('\n');
    const r = checkAmbiguity(md, 'vagueness-fixture.md');
    const vag = r.flags.filter((f) => f.type === 'vagueness');
    expect(vag).toHaveLength(1);
    expect(vag[0].text).toBe('as appropriate');
  });
});
