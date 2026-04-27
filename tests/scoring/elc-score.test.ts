/**
 * tests/scoring/elc-score.test.ts — verify the ELC A(100) scorer.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
// @ts-expect-error — JS .mjs import
import { scoreDegree, wordCountResearchMd, FAILURE_KEYWORDS, ERA_RANGE, numericDegree } from '../../tools/elc-smoke/score.mjs';
// @ts-expect-error — JS .mjs import
import { extractSkus, loadCatalog, catalogContains, checkDegree } from '../../tools/elc-smoke/check-skus.mjs';

const REPO = resolve(__dirname, '..', '..');
const FIXTURE = join(REPO, 'tests', 'scoring', 'fixtures', 'elc-fixture');
const FIXTURE_BAD = join(REPO, 'tests', 'scoring', 'fixtures', 'elc-fixture-bad');
const SCRIPT = join(REPO, 'tools', 'elc-smoke', 'score.mjs');
const SKU_SCRIPT = join(REPO, 'tools', 'elc-smoke', 'check-skus.mjs');

describe('ELC scorer — pure helpers', () => {
  it('wordCountResearchMd parity with MUS scorer', () => {
    expect(wordCountResearchMd('alpha beta\n```\ninside\n```\ngamma')).toBe(3);
  });
  it('FAILURE_KEYWORDS contains canonical mechanisms', () => {
    expect(FAILURE_KEYWORDS).toContain('electromigration');
    expect(FAILURE_KEYWORDS).toContain('latch-up');
    expect(FAILURE_KEYWORDS).toContain('drift');
  });
  it('ERA_RANGE covers all 7 eras', () => {
    expect(Object.keys(ERA_RANGE)).toHaveLength(7);
    expect(ERA_RANGE['si-discrete']).toEqual([1962, 1968]);
  });
  it('numericDegree orders correctly', () => {
    expect(numericDegree('1.5')).toBeLessThan(numericDegree('1.62'));
  });
});

describe('ELC scorer — full fixture (passing)', () => {
  it('scores 1.62 over the ship floor', async () => {
    const r = await scoreDegree({ degree: '1.62', elcRoot: FIXTURE, repoRoot: REPO });
    expect(r.degree).toBe('1.62');
    expect(r.criteria).toHaveLength(12);
    expect(r.total).toBeGreaterThanOrEqual(90);
    expect(r.pass).toBe(true);
  });

  it('emits expected per-criterion scores', async () => {
    const r = await scoreDegree({ degree: '1.62', elcRoot: FIXTURE, repoRoot: REPO });
    const byName = Object.fromEntries(r.criteria.map((c: any) => [c.name, c]));
    expect(byName['Triad coverage'].score).toBe(15);
    expect(byName['Subject mutual exclusion'].score).toBe(10);
    expect(byName['Word count'].score).toBe(5);
    expect(byName['Datasheet citation'].score).toBe(10);
    expect(byName['Bench parts list'].score).toBe(8); // deferred
    expect(byName['Measurement vs SPICE'].score).toBe(10); // deferred
    expect(byName['Failure-modes analysis'].score).toBeGreaterThanOrEqual(8);
    expect(byName['.cir compile'].score).toBe(10);
    expect(byName['Forward-reference-forbidden'].score).toBe(5);
    expect(byName['Cross-track links'].score).toBe(5);
    expect(byName['Pedagogical takeaway'].score).toBeGreaterThanOrEqual(4);
    expect(byName['Era-appropriate anchoring'].score).toBe(5); // 1967 in si-discrete
  });

  it('total equals sum and equals 100 max', async () => {
    const r = await scoreDegree({ degree: '1.62', elcRoot: FIXTURE, repoRoot: REPO });
    const sum = r.criteria.reduce((s: number, c: any) => s + c.score, 0);
    expect(r.total).toBe(sum);
    expect(r.max).toBe(100);
  });
});

describe('ELC scorer — bad fixture (failure paths)', () => {
  it('fails when triad incomplete + invalid era + missing artifacts', async () => {
    const r = await scoreDegree({ degree: '1.62', elcRoot: FIXTURE_BAD, repoRoot: REPO });
    const byName = Object.fromEntries(r.criteria.map((c: any) => [c.name, c]));
    expect(byName['Triad coverage'].score).toBeLessThan(12);
    expect(byName['Datasheet citation'].score).toBe(0);
    expect(byName['.cir compile'].score).toBe(0);
    expect(byName['Failure-modes analysis'].score).toBe(0);
    expect(byName['Era-appropriate anchoring'].score).toBe(0); // invalid era
    expect(r.pass).toBe(false);
    expect(r.verdict).toBe('FAIL');
  });
});

describe('ELC scorer — CLI', () => {
  it('--json shape', () => {
    const r = spawnSync('node', [SCRIPT, '--degree', '1.62', '--json', '--root', FIXTURE], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    const obj = JSON.parse(r.stdout);
    expect(obj.degree).toBe('1.62');
    expect(obj.ship_floor).toBe(90);
    expect(obj.pass).toBe(true);
    expect(obj.criteria.length).toBe(12);
  });

  it('exit code 0 on PASS, 1 on FAIL', () => {
    const ok = spawnSync('node', [SCRIPT, '--degree', '1.62', '--json', '--root', FIXTURE], { encoding: 'utf8' });
    expect(ok.status).toBe(0);
    const bad = spawnSync('node', [SCRIPT, '--degree', '1.62', '--json', '--root', FIXTURE_BAD], { encoding: 'utf8' });
    expect(bad.status).toBe(1);
  });
});

describe('ELC SKU checker', () => {
  it('extractSkus pulls Mouser + Digi-Key links', () => {
    const text = 'See [Mouser](https://www.mouser.com/ProductDetail/595-UA709CD) and [DK](https://www.digikey.com/en/products/detail/linear-systems/LSK489B/2257049).';
    const skus = extractSkus(text);
    expect(skus.mouser.has('595-UA709CD')).toBe(true);
    expect(skus.digikey.has('linear-systems/LSK489B/2257049')).toBe(true);
  });

  it('catalogContains matches by full key or trailing segment', () => {
    const set = new Set(['595-UA709CD', 'linear-systems/LSK489B/2257049']);
    expect(catalogContains(set, '595-UA709CD')).toBe(true);
    expect(catalogContains(set, 'linear-systems/LSK489B/2257049')).toBe(true);
  });

  it('checkDegree validates fixture SKUs offline', async () => {
    const catalog = await loadCatalog(FIXTURE);
    const r = await checkDegree({ degree: '1.62', elcRoot: FIXTURE, online: false, catalog });
    expect(r.missing).toBeFalsy();
    expect(r.summary.total).toBeGreaterThanOrEqual(2);
    expect(r.summary.invalid).toBe(0);
  });

  it('check-skus.mjs CLI exits 0 for valid catalog', () => {
    const r = spawnSync('node', [SKU_SCRIPT, '--degree', '1.62', '--json', '--root', FIXTURE], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    const obj = JSON.parse(r.stdout);
    expect(obj.degree).toBe('1.62');
    expect(obj.summary.invalid).toBe(0);
  });
});
