/**
 * tests/scoring/mus-score.test.ts — verify the MUS A(100) scorer.
 *
 * Scores against a self-contained fixture under tests/scoring/fixtures/
 * so the test does not depend on real Research/MUS/1.62 content.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
// @ts-expect-error — JS .mjs import; vitest handles via node loader
import { scoreDegree, wordCountResearchMd, lilypondValid, faustValid, numericDegree } from '../../tools/mus-smoke/score.mjs';

const REPO = resolve(__dirname, '..', '..');
const FIXTURE = join(REPO, 'tests', 'scoring', 'fixtures', 'mus-fixture');
const FIXTURE_BAD = join(REPO, 'tests', 'scoring', 'fixtures', 'mus-fixture-bad');
const COLLEGE_FIXTURE = join(REPO, 'tests', 'scoring', 'fixtures', 'college');
const SCRIPT = join(REPO, 'tools', 'mus-smoke', 'score.mjs');

describe('MUS scorer — pure helpers', () => {
  it('wordCountResearchMd skips fenced code blocks', () => {
    const text = 'one two three\n```\nthis is inside\nfour five\n```\nsix seven';
    expect(wordCountResearchMd(text)).toBe(5);
  });
  it('wordCountResearchMd skips References section', () => {
    const text = 'alpha beta gamma\n\n## References\n\nlots of words here that should not count';
    expect(wordCountResearchMd(text)).toBe(3);
  });
  it('lilypondValid requires \\version and \\score{}', () => {
    expect(lilypondValid('\\version "2.24.0"\n\\score { c4 }')).toBe(true);
    expect(lilypondValid('\\score { c4 }')).toBe(false);
    expect(lilypondValid('\\version "2.24.0"')).toBe(false);
  });
  it('faustValid accepts stdfaust import or process line', () => {
    expect(faustValid('import("stdfaust.lib");\nprocess = _;')).toBe(true);
    expect(faustValid('process = no.noise * 0.1;')).toBe(true);
    expect(faustValid('// just a comment')).toBe(false);
  });
  it('numericDegree orders correctly', () => {
    expect(numericDegree('1.5')).toBeLessThan(numericDegree('1.10'));
    expect(numericDegree('1.62')).toBeLessThan(numericDegree('1.99'));
  });
});

describe('MUS scorer — full fixture (passing)', () => {
  it('scores 1.62 over the ship floor', async () => {
    const r = await scoreDegree({ degree: '1.62', mussRoot: FIXTURE, repoRoot: COLLEGE_FIXTURE });
    expect(r.degree).toBe('1.62');
    expect(r.criteria).toHaveLength(11);
    expect(r.total).toBeGreaterThanOrEqual(90);
    expect(r.pass).toBe(true);
    expect(r.verdict).toBe('PASS');
  });

  it('emits expected per-criterion scores', async () => {
    const r = await scoreDegree({ degree: '1.62', mussRoot: FIXTURE, repoRoot: COLLEGE_FIXTURE });
    const byName = Object.fromEntries(r.criteria.map((c: any) => [c.name, c]));
    expect(byName['Triad coverage'].score).toBe(15);
    expect(byName['Subject mutual exclusion'].score).toBe(10);
    expect(byName['Word count'].score).toBe(5);
    expect(byName['Score example'].score).toBe(10);
    expect(byName['Audio demos'].score).toBe(10);
    expect(byName['Spectrogram set'].score).toBe(10);
    expect(byName['Pedagogical anchor'].score).toBe(10);
    expect(byName['Concept-registry entry'].score).toBe(10);
    expect(byName['Forward-reference-forbidden'].score).toBe(10);
    expect(byName['Cross-track links'].score).toBe(5);
    expect(byName['Pedagogical takeaway'].score).toBe(5);
  });

  it('total equals sum of criteria scores', async () => {
    const r = await scoreDegree({ degree: '1.62', mussRoot: FIXTURE, repoRoot: COLLEGE_FIXTURE });
    const sum = r.criteria.reduce((s: number, c: any) => s + c.score, 0);
    expect(r.total).toBe(sum);
    expect(r.max).toBe(100);
  });
});

describe('MUS scorer — bad fixture (failure paths)', () => {
  it('flags missing triad, missing word count, forward-ref, mutual exclusion conflict', async () => {
    const r = await scoreDegree({ degree: '1.62', mussRoot: FIXTURE_BAD, repoRoot: COLLEGE_FIXTURE });
    const byName = Object.fromEntries(r.criteria.map((c: any) => [c.name, c]));
    expect(byName['Triad coverage'].score).toBe(0);
    expect(byName['Subject mutual exclusion'].score).toBe(0); // duplicate of 1.30
    expect(byName['Word count'].score).toBe(0);
    expect(byName['Forward-reference-forbidden'].score).toBe(0);
    expect(byName['Pedagogical anchor'].score).toBe(0);
    expect(byName['Spectrogram set'].score).toBe(0);
    expect(r.pass).toBe(false);
    expect(r.verdict).toBe('FAIL');
    expect(r.total).toBeLessThan(90);
  });
});

describe('MUS scorer — CLI', () => {
  it('--json mode emits the expected shape', () => {
    const r = spawnSync('node', [SCRIPT, '--degree', '1.62', '--json',
      '--root', FIXTURE, '--repo-root', COLLEGE_FIXTURE], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    const obj = JSON.parse(r.stdout);
    expect(obj.degree).toBe('1.62');
    expect(obj.ship_floor).toBe(90);
    expect(obj.pass).toBe(true);
    expect(obj.verdict).toBe('PASS');
    expect(Array.isArray(obj.criteria)).toBe(true);
    expect(obj.criteria.length).toBe(11);
    for (const c of obj.criteria) {
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('score');
      expect(c).toHaveProperty('max');
      expect(c).toHaveProperty('pass');
    }
  });

  it('exit code 0 on PASS, 1 on FAIL', () => {
    const ok = spawnSync('node', [SCRIPT, '--degree', '1.62', '--json',
      '--root', FIXTURE, '--repo-root', COLLEGE_FIXTURE], { encoding: 'utf8' });
    expect(ok.status).toBe(0);
    const bad = spawnSync('node', [SCRIPT, '--degree', '1.62', '--json',
      '--root', FIXTURE_BAD, '--repo-root', COLLEGE_FIXTURE], { encoding: 'utf8' });
    expect(bad.status).toBe(1);
  });

  it('--all walks every numeric-named directory', () => {
    const r = spawnSync('node', [SCRIPT, '--all', '--json',
      '--root', FIXTURE, '--repo-root', COLLEGE_FIXTURE], { encoding: 'utf8' });
    // 1.30 fixture is incomplete on purpose (no research.md etc.) so will fail;
    // we only assert shape + degree count, not pass status.
    const obj = JSON.parse(r.stdout);
    expect(Array.isArray(obj)).toBe(true);
    expect(obj.length).toBe(2);
    expect(obj.map((d: any) => d.degree).sort()).toEqual(['1.30', '1.62']);
  });
});
