import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractCard, validateCard, renderCard, byteCountCard, extractAllCards } from '../../../tools/catalog-card-template/extractor.mjs';
import { HARD_LIMITS, TRACK_TEMPLATES } from '../../../tools/catalog-card-template/spec.mjs';

const FIXTURE_DIR = resolve(__dirname, '../../fixtures/catalog-card-gate');
const REF_CARD = readFileSync(resolve(FIXTURE_DIR, 'mus-reference-card.html'), 'utf8');
const OVER_CARD = readFileSync(resolve(FIXTURE_DIR, 'mus-over-expanded.html'), 'utf8');

describe('extractCard', () => {
  it('extracts MUS 1.0 reference card into 5-field AST', () => {
    const ast = extractCard(REF_CARD);
    expect(ast.hrefDegree).toBe('1.0/index.html');
    expect(ast.domainClass).toBe('domain-11');
    expect(ast.degreeNum).toContain('MUS 1.0');
    expect(ast.degreeTitle).toContain('Foundation documents in music');
    expect(ast.meta).toHaveLength(3);
    expect(ast.meta.map(m => m.name)).toEqual(['S36', 'SPS', 'NASA']);
  });

  it('extracts oversized MUS 1.117 card with byte count over threshold', () => {
    const ast = extractCard(OVER_CARD);
    expect(ast.hrefDegree).toBe('1.117/index.html');
    expect(ast.byteCount).toBeGreaterThan(HARD_LIMITS.totalCardBytes);
  });

  it('preserves <em> inline markup in degree-num', () => {
    const ast = extractCard(OVER_CARD);
    expect(ast.degreeNum).toContain('<em>');
  });
});

describe('validateCard', () => {
  it('PASSes MUS 1.0 reference card under all HARD_LIMITS', () => {
    const ast = extractCard(REF_CARD);
    const result = validateCard(ast, 'MUS');
    expect(result.pass).toBe(true);
    expect(result.fieldViolations).toHaveLength(0);
    expect(result.forbiddenPatterns).toHaveLength(0);
    expect(result.missingRequired).toHaveLength(0);
  });

  it('FAILs MUS 1.117 with byte-count BLOCKER + forbidden patterns', () => {
    const ast = extractCard(OVER_CARD);
    const result = validateCard(ast, 'MUS');
    expect(result.pass).toBe(false);
    expect(result.fieldViolations.length).toBeGreaterThan(0);
    expect(result.forbiddenPatterns.length).toBeGreaterThan(0);
    expect(result.blockerMessage).toMatch(/^\[card-template:BLOCKER\] MUS 1\.117 card \d+ bytes/);
  });

  it('forbidden-pattern matchers catch obs#N first-instance + #1xxxx + substrate-arc', () => {
    const ast = extractCard(OVER_CARD);
    const result = validateCard(ast, 'MUS');
    const hasObs = result.forbiddenPatterns.some(p => /obs#\d+/i.test(p));
    const hasLessonRef = result.forbiddenPatterns.some(p => /#1\d{4}/.test(p));
    expect(hasObs || hasLessonRef).toBe(true);
  });

  it('per-track meta count enforced — synthetic 4-field MUS card FAILs', () => {
    const synthetic = `<div class="degree-card domain-11"><a href="1.x/index.html">
          <div class="degree-num">MUS 1.x</div>
          <div class="degree-title">Synthetic</div>
          <div class="degree-meta"><strong>S36:</strong> X</div>
          <div class="degree-meta"><strong>SPS:</strong> Y</div>
          <div class="degree-meta"><strong>NASA:</strong> Z</div>
          <div class="degree-meta"><strong>extra:</strong> W</div>
        </a></div>`;
    const ast = extractCard(synthetic);
    const result = validateCard(ast, 'MUS');
    expect(result.fieldViolations.some(v => v.field === 'degree-meta' && v.unit === 'count')).toBe(true);
  });

  it('missing required META field reported', () => {
    const synthetic = `<div class="degree-card domain-11"><a href="1.x/index.html">
          <div class="degree-num">MUS 1.x</div>
          <div class="degree-title">Synthetic</div>
          <div class="degree-meta"><strong>S36:</strong> X</div>
        </a></div>`;
    const ast = extractCard(synthetic);
    const result = validateCard(ast, 'MUS');
    expect(result.missingRequired).toEqual(expect.arrayContaining(['SPS', 'NASA']));
    expect(result.pass).toBe(false);
  });

  it('forbidden inline markup (<a>) is reported', () => {
    const synthetic = `<div class="degree-card domain-11"><a href="1.x/index.html">
          <div class="degree-num">MUS 1.x</div>
          <div class="degree-title">Synthetic with <a href="evil">link</a></div>
          <div class="degree-meta"><strong>S36:</strong> X</div>
          <div class="degree-meta"><strong>SPS:</strong> Y</div>
          <div class="degree-meta"><strong>NASA:</strong> Z</div>
        </a></div>`;
    const ast = extractCard(synthetic);
    const result = validateCard(ast, 'MUS');
    expect(result.forbiddenMarkup.some(s => s.includes('<a>'))).toBe(true);
  });
});

describe('renderCard', () => {
  it('round-trips reference card with parseable identical AST', () => {
    const ast = extractCard(REF_CARD);
    const rendered = renderCard(ast);
    const reAst = extractCard(rendered);
    expect(reAst.hrefDegree).toBe(ast.hrefDegree);
    expect(reAst.degreeNum).toBe(ast.degreeNum);
    expect(reAst.meta.map(m => m.name)).toEqual(ast.meta.map(m => m.name));
  });
});

describe('byteCountCard', () => {
  it('returns utf-8 byte length, not char length', () => {
    expect(byteCountCard('hello')).toBe(5);
    expect(byteCountCard('héllo')).toBeGreaterThan(5);
  });
});

describe('extractAllCards', () => {
  it('walks a synthetic index with 2 cards and returns 2 ASTs', () => {
    const index = `<html><body>${REF_CARD}${REF_CARD}</body></html>`;
    const cards = extractAllCards(index);
    expect(cards).toHaveLength(2);
  });
});
