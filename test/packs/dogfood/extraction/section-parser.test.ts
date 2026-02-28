import { describe, it, expect } from 'vitest';
import {
  parseSections,
  extractMathExpressions,
  detectCrossRefs,
  tagMusiXTeX,
} from '../../../../src/packs/dogfood/extraction/section-parser.js';

// --- Helpers ---

function sectionText(): string {
  return [
    '3.1 Vector Spaces',
    '',
    'A vector space is a set V together with two operations.',
    'The first operation is vector addition.',
    '',
    '3.1.1 Subspaces',
    '',
    'A subspace of V is a subset W that is itself a vector space.',
    '',
    '3.2 Linear Transformations',
    '',
    'A linear transformation T: V -> W preserves the structure.',
    '',
    'Exercises',
    '',
    '1. Prove that the zero vector is unique.',
    '2. Show that every subspace contains the zero vector.',
  ].join('\n');
}

function mathText(): string {
  return [
    'The sum is given by',
    '',
    '    \u2211_{i=1}^{n} x_i = x_1 + x_2 + ... + x_n',
    '',
    'which converges when the terms decrease.',
    '',
    'For any function f, the integral \u222B_a^b f(x) dx represents the area.',
    '',
    'Theorem 3.1: For all x in R, |x| \u2265 0.',
    '',
    'Proof. Let x be a real number. If x \u2265 0, then |x| = x \u2265 0.',
    'If x < 0, then |x| = -x > 0. QED',
    '',
    'Definition 2.3: A metric space is a set M with a distance function d.',
    '',
    'We also note that \u221A(x\u00B2) = |x| for all x in R.',
  ].join('\n');
}

function crossRefText(): string {
  return [
    'As we saw in Chapter 5, the derivative measures instantaneous change.',
    'Refer to Section 3.2 for the full proof.',
    'This extends the work from Part III on linear algebra.',
    'See Chapter 12 and Chapter 15 for related discussions.',
    'Section 7.1 provides the necessary background.',
  ].join('\n');
}

function musicText(): string {
  return [
    'The melody is constructed on a treble clef staff:',
    '',
    '\u266D\u266E\u266F--- c d e f g a b ---\u2669\u266A\u266B',
    '\u2502---\u2502---\u2502---\u2502---\u2502',
    '',
    'The ascending pattern demonstrates a major scale.',
    '',
    'Regular prose continues here without any musical content.',
  ].join('\n');
}

describe('parseSections', () => {
  it('detects numbered sections by pattern (e.g., "3.1 Vector Spaces")', () => {
    const sections = parseSections(sectionText());
    const numbered = sections.filter(s => /^\d+\.\d+/.test(s.heading));

    expect(numbered.length).toBeGreaterThanOrEqual(2);
    expect(numbered.some(s => s.heading.includes('Vector Spaces'))).toBe(true);
    expect(numbered.some(s => s.heading.includes('Linear Transformations'))).toBe(true);
  });

  it('detects subsections (e.g., "3.1.1 Subspaces") with level=2', () => {
    const sections = parseSections(sectionText());
    const subsections = sections.filter(s => s.level === 2);

    expect(subsections.length).toBeGreaterThanOrEqual(1);
    expect(subsections.some(s => s.heading.includes('Subspaces'))).toBe(true);
  });

  it('assigns level=1 for sections and level=2 for subsections', () => {
    const sections = parseSections(sectionText());
    const vectorSpaces = sections.find(s => s.heading.includes('Vector Spaces') && !s.heading.includes('Subspaces'));
    const subspaces = sections.find(s => s.heading.includes('Subspaces'));

    expect(vectorSpaces?.level).toBe(1);
    expect(subspaces?.level).toBe(2);
  });

  it('returns SectionInfo[] with heading, level, startOffset, endOffset', () => {
    const sections = parseSections(sectionText());

    for (const section of sections) {
      expect(section).toHaveProperty('heading');
      expect(section).toHaveProperty('level');
      expect(section).toHaveProperty('startOffset');
      expect(section).toHaveProperty('endOffset');
      expect(typeof section.heading).toBe('string');
      expect(typeof section.level).toBe('number');
      expect(section.startOffset).toBeGreaterThanOrEqual(0);
      expect(section.endOffset).toBeGreaterThan(section.startOffset);
    }
  });

  it('detects unnumbered sections like "Exercises"', () => {
    const sections = parseSections(sectionText());
    const exercises = sections.find(s => s.heading === 'Exercises');

    expect(exercises).toBeDefined();
  });

  it('sections cover the entire text without gaps', () => {
    const text = sectionText();
    const sections = parseSections(text);

    if (sections.length > 0) {
      // First section starts at or near 0
      expect(sections[0].startOffset).toBeLessThanOrEqual(text.indexOf('3.1'));
      // Last section ends at text length
      expect(sections[sections.length - 1].endOffset).toBe(text.length);
    }
  });
});

describe('extractMathExpressions', () => {
  it('detects display math (centered equation lines)', () => {
    const exprs = extractMathExpressions(mathText());
    const display = exprs.filter(e => e.type === 'display');

    expect(display.length).toBeGreaterThanOrEqual(1);
  });

  it('detects inline math (symbols within prose)', () => {
    const exprs = extractMathExpressions(mathText());
    const inline = exprs.filter(e => e.type === 'inline');

    expect(inline.length).toBeGreaterThanOrEqual(1);
  });

  it('detects theorem blocks preceded by "Theorem N.N:"', () => {
    const exprs = extractMathExpressions(mathText());
    const theorems = exprs.filter(e => e.type === 'theorem');

    expect(theorems.length).toBeGreaterThanOrEqual(1);
    expect(theorems[0].latex).toContain('|x|');
  });

  it('detects definition blocks preceded by "Definition N.N:"', () => {
    const exprs = extractMathExpressions(mathText());
    const defs = exprs.filter(e => e.type === 'definition');

    expect(defs.length).toBeGreaterThanOrEqual(1);
    expect(defs[0].latex).toContain('metric space');
  });

  it('detects proof blocks between "Proof." and QED marker', () => {
    const exprs = extractMathExpressions(mathText());
    const proofs = exprs.filter(e => e.type === 'proof');

    expect(proofs.length).toBeGreaterThanOrEqual(1);
    expect(proofs[0].latex).toContain('real number');
  });

  it('provides readable field for math expressions', () => {
    const exprs = extractMathExpressions(mathText());

    for (const expr of exprs) {
      expect(expr.readable).toBeDefined();
      expect(typeof expr.readable).toBe('string');
      expect(expr.readable.length).toBeGreaterThan(0);
    }
  });

  it('renders summation notation in readable form', () => {
    const exprs = extractMathExpressions(mathText());
    const display = exprs.find(e => e.type === 'display' && e.latex.includes('\u2211'));

    if (display) {
      expect(display.readable.toLowerCase()).toMatch(/sum/);
    }
  });

  it('returns MathExpr with latex, readable, type fields', () => {
    const exprs = extractMathExpressions(mathText());

    for (const expr of exprs) {
      expect(expr).toHaveProperty('latex');
      expect(expr).toHaveProperty('readable');
      expect(expr).toHaveProperty('type');
      expect(['inline', 'display', 'theorem', 'definition', 'proof']).toContain(expr.type);
    }
  });
});

describe('detectCrossRefs', () => {
  it('detects "Chapter N" references', () => {
    const refs = detectCrossRefs(crossRefText());

    expect(refs).toContain('ch-05');
    expect(refs).toContain('ch-12');
    expect(refs).toContain('ch-15');
  });

  it('detects "Section N.N" references', () => {
    const refs = detectCrossRefs(crossRefText());

    expect(refs).toContain('ch-03-sec-02');
    expect(refs).toContain('ch-07-sec-01');
  });

  it('detects "Part N" references (Roman numerals)', () => {
    const refs = detectCrossRefs(crossRefText());

    expect(refs).toContain('part-03');
  });

  it('deduplicates results', () => {
    const text = 'See Chapter 5. Again, Chapter 5 explains this.';
    const refs = detectCrossRefs(text);

    const ch5Count = refs.filter(r => r === 'ch-05').length;
    expect(ch5Count).toBe(1);
  });

  it('returns sorted array of cross-ref IDs', () => {
    const refs = detectCrossRefs(crossRefText());

    for (let i = 1; i < refs.length; i++) {
      expect(refs[i] >= refs[i - 1]).toBe(true);
    }
  });

  it('returns zero-padded chapter IDs', () => {
    const refs = detectCrossRefs('See Chapter 5.');

    expect(refs).toContain('ch-05');
  });

  it('handles multiple refs in same paragraph', () => {
    const text = 'See Chapter 1, Chapter 2, and Section 3.1 for details.';
    const refs = detectCrossRefs(text);

    expect(refs.length).toBeGreaterThanOrEqual(3);
  });
});

describe('tagMusiXTeX', () => {
  it('replaces MusiXTeX segments with descriptive tags', () => {
    const result = tagMusiXTeX(musicText());

    expect(result).toContain('[MusiXTeX:');
  });

  it('does not treat regular prose as MusiXTeX', () => {
    const result = tagMusiXTeX(musicText());

    expect(result).toContain('Regular prose continues');
  });

  it('description derived from surrounding prose context', () => {
    const result = tagMusiXTeX(musicText());
    // The tag should reference the musical context
    const match = result.match(/\[MusiXTeX:\s*([^\]]+)\]/);

    expect(match).toBeTruthy();
    if (match) {
      expect(match[1].length).toBeGreaterThan(0);
    }
  });

  it('returns text unchanged when no MusiXTeX present', () => {
    const plainText = 'This is plain prose about mathematics. No music here.';
    const result = tagMusiXTeX(plainText);

    expect(result).toBe(plainText);
  });

  it('MusiXTeX content is NOT treated as garbled text', () => {
    const result = tagMusiXTeX(musicText());
    // The garbled characters should be replaced, not left in
    expect(result).not.toMatch(/\u266D\u266E\u266F---/);
  });
});
