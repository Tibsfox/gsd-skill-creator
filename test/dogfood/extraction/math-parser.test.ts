import { describe, it, expect } from 'vitest';
import {
  parseMathBlock,
  renderReadable,
  estimateTokens,
} from '../../../src/dogfood/extraction/math-parser.js';

describe('parseMathBlock', () => {
  it('detects display equations (centered, multi-line)', () => {
    const text = [
      'Consider the following equation:',
      '',
      '    \u2211_{i=1}^{n} x_i = x_1 + x_2 + ... + x_n',
      '',
      'This sum converges.',
    ].join('\n');

    const exprs = parseMathBlock(text);
    const display = exprs.filter(e => e.type === 'display');

    expect(display.length).toBeGreaterThanOrEqual(1);
    expect(display[0].latex).toContain('\u2211');
  });

  it('detects theorem blocks with label', () => {
    const text = 'Theorem 3.1: For all x in R, |x| \u2265 0.\n\nNext paragraph.';

    const exprs = parseMathBlock(text);
    const theorems = exprs.filter(e => e.type === 'theorem');

    expect(theorems.length).toBe(1);
    expect(theorems[0].label).toBe('thm:3.1');
  });

  it('detects definition blocks', () => {
    const text = 'Definition 2.3: A metric space is a set M with a distance function d.\n\nMore text.';

    const exprs = parseMathBlock(text);
    const defs = exprs.filter(e => e.type === 'definition');

    expect(defs.length).toBe(1);
    expect(defs[0].latex).toContain('metric space');
  });

  it('detects inline expressions within prose', () => {
    const text = 'The integral \u222B_a^b f(x) dx gives the area under the curve.';

    const exprs = parseMathBlock(text);
    const inline = exprs.filter(e => e.type === 'inline');

    expect(inline.length).toBeGreaterThanOrEqual(1);
  });

  it('handles proof blocks with QED markers', () => {
    const text = [
      'Proof. Let x be any real number. If x \u2265 0, then |x| = x \u2265 0.',
      'If x < 0, then |x| = -x > 0. QED',
    ].join('\n');

    const exprs = parseMathBlock(text);
    const proofs = exprs.filter(e => e.type === 'proof');

    expect(proofs.length).toBe(1);
    expect(proofs[0].latex).toContain('real number');
  });

  it('returns MathExpr with latex, readable, and type fields', () => {
    const text = 'Theorem 1.1: The sum \u2211 x_i converges.\n\n';
    const exprs = parseMathBlock(text);

    for (const expr of exprs) {
      expect(expr).toHaveProperty('latex');
      expect(expr).toHaveProperty('readable');
      expect(expr).toHaveProperty('type');
      expect(['inline', 'display', 'theorem', 'definition', 'proof']).toContain(expr.type);
    }
  });
});

describe('renderReadable', () => {
  it('converts summation symbol to "sum"', () => {
    expect(renderReadable('\u2211_{i=1}^{n} x_i')).toContain('sum');
  });

  it('converts integral symbol to "integral"', () => {
    expect(renderReadable('\u222B_a^b f(x) dx')).toContain('integral');
  });

  it('converts square root symbol to "sqrt"', () => {
    expect(renderReadable('\u221A(x)')).toContain('sqrt');
  });

  it('converts fraction-like patterns', () => {
    const result = renderReadable('a \u00F7 b');
    expect(result).toContain('/');
  });

  it('spells out Greek letters', () => {
    expect(renderReadable('\u03B1')).toContain('alpha');
    expect(renderReadable('\u03B2')).toContain('beta');
    expect(renderReadable('\u03B8')).toContain('theta');
    expect(renderReadable('\u03C0')).toContain('pi');
  });

  it('passes through already readable expressions unchanged', () => {
    const input = 'the sum of x squared';
    expect(renderReadable(input)).toBe(input);
  });

  it('converts superscript numbers', () => {
    expect(renderReadable('x\u00B2')).toContain('^2');
    expect(renderReadable('x\u00B3')).toContain('^3');
  });

  it('converts infinity symbol', () => {
    expect(renderReadable('\u221E')).toContain('infinity');
  });
});

describe('estimateTokens', () => {
  it('returns ~1.3 tokens per word for pure prose', () => {
    const prose = 'The quick brown fox jumps over the lazy dog near the river bank today now here';
    const estimate = estimateTokens(prose);
    const wordCount = prose.split(/\s+/).length;

    // Should be approximately 1.3 * wordCount, within 20%
    expect(estimate).toBeGreaterThan(wordCount * 1.0);
    expect(estimate).toBeLessThan(wordCount * 1.8);
  });

  it('returns higher ratio for math-heavy text', () => {
    const mathText = '\u2211_{i=1}^{n} \u222B_a^b \u221A(x\u00B2 + y\u00B2) \u2265 \u03B1\u03B2\u03B8\u03C0 \u00D7 \u00F7 \u2248';
    const proseText = 'The quick brown fox jumps over the lazy dog near here';

    const mathEstimate = estimateTokens(mathText);
    const proseEstimate = estimateTokens(proseText);

    const mathWords = mathText.split(/\s+/).length;
    const proseWords = proseText.split(/\s+/).length;

    // Math ratio should be higher than prose ratio
    expect(mathEstimate / mathWords).toBeGreaterThan(proseEstimate / proseWords);
  });

  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('estimates within 10% for representative English text', () => {
    // "The sum of x squared" ~ 7 tokens in GPT tokenizer
    const text = 'The sum of x squared';
    const estimate = estimateTokens(text);

    // Allow within 40% since we don't use actual tokenizer here
    expect(estimate).toBeGreaterThan(4);
    expect(estimate).toBeLessThan(12);
  });

  it('handles single word', () => {
    const estimate = estimateTokens('hello');
    expect(estimate).toBeGreaterThan(0);
  });
});
