/**
 * tools/__tests__/scaffold-trs-packs.test.mjs — v1.49.664 cc-1 C09 tests.
 *
 * Hermetic: each test uses a tmpdir as trsRoot. Mirrors the SPS scaffolder
 * test pattern (pure helpers + integration via exported scaffoldTrsPacks()).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  SCAFFOLD_MARKER,
  renderTrsStub,
  loadManifest,
  scaffoldTrsPacks,
  packDirName,
} from '../scaffold-trs-packs.mjs';

let tmpRoot, trsRoot, manifestPath;

function manifestBody(packs) {
  return JSON.stringify({ schema: 'scaffold-trs-packs/v1', packs }, null, 2);
}

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'scaffold-trs-test-'));
  trsRoot = join(tmpRoot, 'TRS');
  mkdirSync(trsRoot, { recursive: true });
  manifestPath = join(tmpRoot, 'manifest.json');
});

afterEach(() => { try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {} });

describe('scaffold-trs-packs: pure helpers', () => {
  it('packDirName zero-pads pack numbers', () => {
    expect(packDirName(1)).toBe('pack-01');
    expect(packDirName(9)).toBe('pack-09');
    expect(packDirName(10)).toBe('pack-10');
    expect(packDirName(43)).toBe('pack-43');
  });

  it('renderTrsStub embeds the SCAFFOLD-PENDING marker', () => {
    const html = renderTrsStub({ pack: 40, theme: 'stochastic processes', k_n: 533 });
    expect(html).toContain(SCAFFOLD_MARKER);
  });

  it('renderTrsStub includes theme + K_N + pack number', () => {
    const html = renderTrsStub({ pack: 40, theme: 'stochastic processes', k_n: 533, milestone_bound: 'v1.49.660' });
    expect(html).toContain('pack-40');
    expect(html).toContain('stochastic processes');
    expect(html).toContain('K_40 = 533');
    expect(html).toContain('v1.49.660');
  });

  it('renderTrsStub handles pending K_N gracefully', () => {
    const html = renderTrsStub({ pack: 15, theme: 'pending', k_n: null, milestone_bound: 'pending' });
    expect(html).toContain('pending');
    expect(html).toContain('K_15 = pending');
  });

  it('loadManifest throws on missing file', () => {
    expect(() => loadManifest('/nonexistent/path.json')).toThrow(/not found/);
  });

  it('loadManifest throws on malformed JSON', () => {
    writeFileSync(manifestPath, 'not json');
    expect(() => loadManifest(manifestPath)).toThrow(/parse error/);
  });

  it('loadManifest throws when packs array is missing', () => {
    writeFileSync(manifestPath, JSON.stringify({ schema: 'x' }));
    expect(() => loadManifest(manifestPath)).toThrow(/packs/);
  });
});

describe('scaffold-trs-packs: integration', () => {
  it('--dry-run reports without writing', () => {
    writeFileSync(manifestPath, manifestBody([{ pack: 40, theme: 'stochastic processes' }]));
    const summary = scaffoldTrsPacks({ dryRun: true, manifestPath, trsRoot });
    expect(summary.files_created).toContain('pack-40/index.html');
    expect(existsSync(join(trsRoot, 'pack-40'))).toBe(false);
  });

  it('creates dir + index.html for a missing pack', () => {
    writeFileSync(manifestPath, manifestBody([{ pack: 40, theme: 'stochastic processes', k_n: 533 }]));
    scaffoldTrsPacks({ manifestPath, trsRoot });
    expect(existsSync(join(trsRoot, 'pack-40/index.html'))).toBe(true);
    const html = readFileSync(join(trsRoot, 'pack-40/index.html'), 'utf8');
    expect(html).toContain('SCAFFOLD-PENDING');
    expect(html).toContain('stochastic processes');
  });

  it('idempotent: skips packs whose index.html already exists', () => {
    mkdirSync(join(trsRoot, 'pack-13'), { recursive: true });
    writeFileSync(join(trsRoot, 'pack-13/index.html'), '<html>existing real pack-13 content</html>\n');
    writeFileSync(manifestPath, manifestBody([
      { pack: 13, theme: 'graph theory' },
      { pack: 40, theme: 'stochastic processes' },
    ]));
    const summary = scaffoldTrsPacks({ manifestPath, trsRoot });
    // pack-13 untouched
    expect(readFileSync(join(trsRoot, 'pack-13/index.html'), 'utf8')).toBe('<html>existing real pack-13 content</html>\n');
    expect(summary.files_skipped_existing).toContain('pack-13/index.html');
    // pack-40 created
    expect(existsSync(join(trsRoot, 'pack-40/index.html'))).toBe(true);
  });

  it('second run is a no-op (all packs skipped as existing)', () => {
    writeFileSync(manifestPath, manifestBody([{ pack: 40, theme: 'x' }, { pack: 41, theme: 'y' }]));
    scaffoldTrsPacks({ manifestPath, trsRoot });
    const second = scaffoldTrsPacks({ manifestPath, trsRoot });
    expect(second.files_created.length).toBe(0);
    expect(second.files_skipped_existing.length).toBe(2);
  });

  it('records errors in summary instead of throwing on missing manifest', () => {
    const summary = scaffoldTrsPacks({ manifestPath: '/nonexistent/manifest.json', trsRoot });
    expect(summary.errors.length).toBeGreaterThan(0);
    expect(summary.errors[0].error).toMatch(/not found/);
  });

  it('handles 29-pack manifest (the cc-1 absorbed-scope case)', () => {
    const packs = [];
    for (let i = 14; i <= 38; i++) packs.push({ pack: i, theme: 'pending' });
    for (let i = 40; i <= 43; i++) packs.push({ pack: i, theme: 'pending' });
    writeFileSync(manifestPath, manifestBody(packs));
    const summary = scaffoldTrsPacks({ manifestPath, trsRoot });
    expect(summary.files_created.length).toBe(29);
    expect(existsSync(join(trsRoot, 'pack-14/index.html'))).toBe(true);
    expect(existsSync(join(trsRoot, 'pack-38/index.html'))).toBe(true);
    expect(existsSync(join(trsRoot, 'pack-43/index.html'))).toBe(true);
    expect(existsSync(join(trsRoot, 'pack-39'))).toBe(false); // gap preserved
  });
});
