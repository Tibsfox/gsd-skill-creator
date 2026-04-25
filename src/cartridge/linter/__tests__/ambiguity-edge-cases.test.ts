/**
 * HB-06 ambiguity linter — edge cases.
 *
 * Empty docs, very long narrative paragraphs, unicode content, code-only
 * docs, frontmatter-only docs, and quoted-example content must not
 * produce false positives.
 */

import { describe, it, expect } from 'vitest';
import { checkAmbiguity } from '../ambiguity.js';

describe('HB-06 ambiguity — edge cases', () => {
  it('empty document → passes', () => {
    const r = checkAmbiguity('', 'empty.md');
    expect(r.passed).toBe(true);
    expect(r.flags).toEqual([]);
  });

  it('frontmatter-only document → passes', () => {
    const md = '---\nname: only\n---\n';
    const r = checkAmbiguity(md, 'fm-only.md');
    expect(r.passed).toBe(true);
  });

  it('code-block-only document → passes', () => {
    const md = [
      '# Code',
      '',
      '```ts',
      "// Use as appropriate",
      "// the model is loaded here",
      '```',
      '',
    ].join('\n');
    const r = checkAmbiguity(md, 'code-only.md');
    expect(r.passed).toBe(true);
  });

  it('quoted example with vague terms → passes', () => {
    const md = [
      '# Doc',
      '',
      '- Bad: "Apply when appropriate."',
      '- Good: Apply when phase 811 completes.',
      '',
    ].join('\n');
    const r = checkAmbiguity(md, 'quoted.md');
    expect(r.passed).toBe(true);
  });

  it('long narrative paragraph using "appropriate" in context → passes', () => {
    const md = [
      '# Narrative',
      '',
      'The chipset metaphor maps the dispatch unit to the appropriate execution port; this language is a deliberate engineering shorthand that helps reviewers locate the right component when triaging a fault. The metaphor predates this milestone by several releases and is in active use across the team.',
      '',
    ].join('\n');
    const r = checkAmbiguity(md, 'narrative.md');
    expect(r.passed).toBe(true);
  });

  it('unicode content (smart quotes, emoji) does not crash and does not flag', () => {
    const md = [
      '# Unicode',
      '',
      '- Apply 🎯 the LoRA adapter weights when phase 811 completes',
      '- "Use as appropriate" is the kind of phrase the linter catches',
      '',
    ].join('\n');
    const r = checkAmbiguity(md, 'unicode.md');
    expect(r.passed).toBe(true);
  });

  it('very long document scales linearly without crashing', () => {
    const block = [
      '# Section',
      '',
      '- Apply the megakernel scheduler when phase 811 completes',
      '',
    ].join('\n');
    const md = block.repeat(500);
    const r = checkAmbiguity(md, 'big.md');
    expect(r.passed).toBe(true);
  });

  it('schema validation: every flag has the required shape', () => {
    const md = ['# t', '', '- Use as appropriate', ''].join('\n');
    const r = checkAmbiguity(md, 'shape.md');
    expect(r.flags).toHaveLength(1);
    const f = r.flags[0];
    expect(f.filePath).toBe('shape.md');
    expect(f.type).toBe('vagueness');
    expect(f.span.line).toBeGreaterThan(0);
    expect(f.span.col).toBeGreaterThan(0);
    expect(f.span.length).toBeGreaterThan(0);
    expect(typeof f.text).toBe('string');
    expect(typeof f.rationale).toBe('string');
  });
});
