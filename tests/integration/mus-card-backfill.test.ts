import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const REPO_ROOT = resolve(__dirname, '../..');
const SCRIPT = join(REPO_ROOT, 'tools', 'mus-card-backfill.mjs');
const REF_CARD = readFileSync(resolve(__dirname, '../fixtures/catalog-card-gate/mus-reference-card.html'), 'utf8');
const OVER_CARD = readFileSync(resolve(__dirname, '../fixtures/catalog-card-gate/mus-over-expanded.html'), 'utf8');

function setupTempMus(cards: string, degrees: string[]) {
  const tmp = mkdtempSync(join(tmpdir(), 'mus-bf-'));
  const mus = join(tmp, 'www', 'tibsfox', 'com', 'Research', 'MUS');
  mkdirSync(mus, { recursive: true });
  writeFileSync(join(mus, 'index.html'), `<!doctype html><html><body>${cards}</body></html>`);
  for (const d of degrees) {
    mkdirSync(join(mus, d), { recursive: true });
    writeFileSync(
      join(mus, d, 'index.html'),
      `<!DOCTYPE html><html><body><main>MUS ${d} body</main></body></html>`,
    );
  }
  return tmp;
}

describe('mus-card-backfill dry-run', () => {
  it('reports 0 violations for template-compliant catalog', () => {
    const tmp = setupTempMus(REF_CARD, ['1.0']);
    const r = spawnSync('node', [SCRIPT, '--root', tmp], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Violations:\s+0/);
    expect(r.stdout).toMatch(/DRY-RUN/);
    rmSync(tmp, { recursive: true, force: true });
  });

  it('reports violations for over-expanded card without writing', () => {
    const tmp = setupTempMus(REF_CARD + OVER_CARD, ['1.0', '1.117']);
    const indexPath = join(tmp, 'www', 'tibsfox', 'com', 'Research', 'MUS', 'index.html');
    const before = readFileSync(indexPath, 'utf8');
    const r = spawnSync('node', [SCRIPT, '--root', tmp], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Violations:\s+1/);
    expect(r.stdout).toMatch(/MUS 1\.117/);
    expect(readFileSync(indexPath, 'utf8')).toBe(before); // unchanged
    rmSync(tmp, { recursive: true, force: true });
  });
});

describe('mus-card-backfill --write', () => {
  it('reduces over-expanded card under 1500B and inserts backfill marker', () => {
    const tmp = setupTempMus(REF_CARD + OVER_CARD, ['1.0', '1.117']);
    const indexPath = join(tmp, 'www', 'tibsfox', 'com', 'Research', 'MUS', 'index.html');
    const degreePath = join(tmp, 'www', 'tibsfox', 'com', 'Research', 'MUS', '1.117', 'index.html');
    const r = spawnSync('node', [SCRIPT, '--write', '--root', tmp], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    const newIndex = readFileSync(indexPath, 'utf8');
    expect(newIndex).toMatch(/v1\.49\.658-backfill-complete/);
    expect(newIndex.length).toBeLessThan(REF_CARD.length + OVER_CARD.length);
    const newDegree = readFileSync(degreePath, 'utf8');
    expect(newDegree).toMatch(/v1\.49\.658-relocated:start/);
    expect(newDegree).toMatch(/v1\.49\.658-relocated:end/);
    rmSync(tmp, { recursive: true, force: true });
  });

  it('is idempotent — second --write run produces identical state', () => {
    const tmp = setupTempMus(REF_CARD + OVER_CARD, ['1.0', '1.117']);
    const indexPath = join(tmp, 'www', 'tibsfox', 'com', 'Research', 'MUS', 'index.html');
    const degreePath = join(tmp, 'www', 'tibsfox', 'com', 'Research', 'MUS', '1.117', 'index.html');
    spawnSync('node', [SCRIPT, '--write', '--root', tmp], { encoding: 'utf8' });
    const indexAfter1 = readFileSync(indexPath, 'utf8');
    const degreeAfter1 = readFileSync(degreePath, 'utf8');
    spawnSync('node', [SCRIPT, '--write', '--root', tmp], { encoding: 'utf8' });
    const indexAfter2 = readFileSync(indexPath, 'utf8');
    const degreeAfter2 = readFileSync(degreePath, 'utf8');
    expect(indexAfter2).toBe(indexAfter1);
    expect(degreeAfter2).toBe(degreeAfter1);
    rmSync(tmp, { recursive: true, force: true });
  });

  it('flags R1 missing per-degree page in report when degree dir absent', () => {
    const tmp = setupTempMus(REF_CARD + OVER_CARD, ['1.0']); // no 1.117 dir
    const r = spawnSync('node', [SCRIPT, '--write', '--root', tmp], { encoding: 'utf8' });
    expect(r.stdout).toMatch(/R1 FAIL/);
    expect(r.stdout).toMatch(/no-per-degree-page/);
    rmSync(tmp, { recursive: true, force: true });
  });

  it('exits 0 even when violations remain that need manual review', () => {
    const tmp = setupTempMus(OVER_CARD, ['1.117']);
    const r = spawnSync('node', [SCRIPT, '--write', '--root', tmp], { encoding: 'utf8' });
    expect(r.status).toBe(0); // backfill made progress; exit is OK
    rmSync(tmp, { recursive: true, force: true });
  });
});
