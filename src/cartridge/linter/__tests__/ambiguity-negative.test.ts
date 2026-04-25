/**
 * HB-06 ambiguity linter — negative fixtures.
 *
 * One fixture per ambiguity type, each rewritten to be unambiguous. The
 * linter must produce zero flags on every negative fixture.
 */

import { describe, it, expect } from 'vitest';
import { checkAmbiguity } from '../ambiguity.js';

describe('HB-06 ambiguity — negative fixtures (one per type)', () => {
  it('lexical: disambiguated "LoRA adapter weights" passes', () => {
    const md = [
      '# Title',
      '',
      '## Steps',
      '',
      '- Load the per-skill LoRA adapter weights',
      '- Apply the megakernel scheduler',
      '',
    ].join('\n');
    const r = checkAmbiguity(md, 'lexical-negative.md');
    expect(r.flags.filter((f) => f.type === 'lexical')).toHaveLength(0);
  });

  it('syntactic: explicit grouping with "either" passes', () => {
    const longLine =
      'When the orchestrator schedules a wave the executor must validate either the skill and the agent or the chipset before running and emit a record into the trace ledger so the verifier can reproduce the wave outcome later from telemetry alone without re-running anything in production and without triggering any additional side effects on disk anywhere';
    const md = ['# Title', '', longLine, ''].join('\n');
    const r = checkAmbiguity(md, 'syntactic-negative.md');
    expect(r.flags.filter((f) => f.type === 'syntactic')).toHaveLength(0);
  });

  it('semantic: scoped "every artifact in the trace ledger" passes', () => {
    const md = [
      '# Title',
      '',
      '- The verifier must validate every artifact in the trace ledger before signoff',
      '',
    ].join('\n');
    const r = checkAmbiguity(md, 'semantic-negative.md');
    expect(r.flags.filter((f) => f.type === 'semantic')).toHaveLength(0);
  });

  it('vagueness: operationalized "when phase 811 completes" passes', () => {
    const md = [
      '# Title',
      '',
      '- Apply the skill when phase 811 completes',
      '',
    ].join('\n');
    const r = checkAmbiguity(md, 'vagueness-negative.md');
    expect(r.flags.filter((f) => f.type === 'vagueness')).toHaveLength(0);
  });
});
