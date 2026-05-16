import { describe, it, expect, beforeAll } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditTrackTemplates } from '../../tools/update-catalog-indexes.mjs';

const REF_CARD = readFileSync(
  resolve(__dirname, '../fixtures/catalog-card-gate/mus-reference-card.html'),
  'utf8',
);
const OVER_CARD = readFileSync(
  resolve(__dirname, '../fixtures/catalog-card-gate/mus-over-expanded.html'),
  'utf8',
);

const REPO_ROOT = resolve(__dirname, '../..');
const SCRIPT = join(REPO_ROOT, 'tools', 'update-catalog-indexes.mjs');

function makeTempResearch(cards: string) {
  const tmp = mkdtempSync(join(tmpdir(), 'cct-test-'));
  const root = join(tmp, 'www', 'tibsfox', 'com', 'Research', 'MUS');
  mkdirSync(root, { recursive: true });
  // also create a placeholder degree dir so the existing auditTrack scan passes
  mkdirSync(join(root, '1.0'), { recursive: true });
  writeFileSync(
    join(root, 'index.html'),
    `<!doctype html><html><body><main>${cards}</main></body></html>`,
  );
  // create empty NASA + ELC dirs so auditTrack doesn't ERROR
  mkdirSync(join(tmp, 'www', 'tibsfox', 'com', 'Research', 'NASA'), { recursive: true });
  writeFileSync(
    join(tmp, 'www', 'tibsfox', 'com', 'Research', 'NASA', 'index.html'),
    '<html><body><script>const completedMissions = new Set([]);</script></body></html>',
  );
  mkdirSync(join(tmp, 'www', 'tibsfox', 'com', 'Research', 'ELC'), { recursive: true });
  writeFileSync(
    join(tmp, 'www', 'tibsfox', 'com', 'Research', 'ELC', 'index.html'),
    '<html><body></body></html>',
  );
  return tmp;
}

describe('auditTrackTemplates', () => {
  it('PASSes when all cards meet template (reference card only)', () => {
    const tmp = makeTempResearch(REF_CARD);
    const research = join(tmp, 'www', 'tibsfox', 'com', 'Research');
    const result = auditTrackTemplates(research, 'MUS');
    expect(result.status).toBe('PASS');
    expect(result.card_count).toBe(1);
    expect(result.violations).toHaveLength(0);
    rmSync(tmp, { recursive: true, force: true });
  });

  it('DRIFTs when any card violates template (oversized included)', () => {
    const tmp = makeTempResearch(REF_CARD + OVER_CARD);
    const research = join(tmp, 'www', 'tibsfox', 'com', 'Research');
    const result = auditTrackTemplates(research, 'MUS');
    expect(result.status).toBe('DRIFT');
    expect(result.card_count).toBe(2);
    expect(result.violations.length).toBeGreaterThanOrEqual(1);
    expect(result.violations[0].blockerMessage).toMatch(/\[card-template:BLOCKER\] MUS 1\.117/);
    rmSync(tmp, { recursive: true, force: true });
  });

  it('returns ERROR when catalog index missing', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'cct-test-'));
    const research = join(tmp, 'www', 'tibsfox', 'com', 'Research');
    mkdirSync(join(research, 'MUS'), { recursive: true });
    const result = auditTrackTemplates(research, 'MUS');
    expect(result.status).toBe('ERROR');
    expect(result.error).toMatch(/Catalog index not found/);
    rmSync(tmp, { recursive: true, force: true });
  });
});

describe('update-catalog-indexes --check exit codes', () => {
  it('exit 8 when template violations present', () => {
    const tmp = makeTempResearch(REF_CARD + OVER_CARD);
    const result = spawnSync('node', [SCRIPT, '--check', '--root', tmp], {
      encoding: 'utf8',
    });
    expect(result.status).toBe(8);
    expect(result.stderr).toMatch(/card-template:BLOCKER/);
    rmSync(tmp, { recursive: true, force: true });
  });

  it('--json output includes templates key + template_drift summary', () => {
    const tmp = makeTempResearch(REF_CARD);
    const result = spawnSync('node', [SCRIPT, '--check', '--json', '--root', tmp], {
      encoding: 'utf8',
    });
    const parsed = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty('templates');
    expect(parsed).toHaveProperty('summary.template_drift');
    expect(parsed.templates.MUS.status).toBe('PASS');
    expect(parsed.summary.template_drift).toBe(false);
    rmSync(tmp, { recursive: true, force: true });
  });
});
