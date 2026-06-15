/**
 * nasa-nav-promote-predecessor — behavioral drift-guard (2026-06-15).
 *
 * The leading-edge nav rule (folded into the tooling after the v1.221 GRACE
 * ship): the newest degree's index nav uses a "Series hub" right cell, NOT a
 * dead "Next mission -> successor" link the consistency audit BLOCKS. So when a
 * new degree D ships, its predecessor P's right nav cell is PROMOTED Series hub
 * -> Next mission -> D. tools/nasa-nav-promote-predecessor.mjs performs that
 * flip on both the top and bottom nav-cards.
 *
 * This test runs the REAL script against synthetic fixtures (a temp www/ tree
 * via --root), so it carries no dependency on the gitignored NASA content and
 * runs in CI. It pins: promotion of both cards, idempotency, --check semantics,
 * and the loud-failure modes (missing index, malformed arg, conflicting cell).
 * Layer-1: tests/integration/*.test.ts runs on every bare `npx vitest run`.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const REPO_ROOT = resolve(__dirname, '..', '..');
const TOOL = resolve(REPO_ROOT, 'tools', 'nasa-nav-promote-predecessor.mjs');

const SERIES_HUB_CELL = `<div class="right">
    <div class="nav-label">Series hub</div>
    <a href="../index.html">NASA Mission Series &rarr;</a>
  </div>`;

// One nav-card with a swappable right cell — the same 3-cell shape every degree
// index uses (Previous / Current / right).
function navCard(rightCell: string): string {
  return `<div class="nav-card">
  <div>
    <div class="nav-label">Previous mission</div>
    <a href="../1.219/index.html">&larr; v1.219 LAGEOS-1</a>
  </div>
  <div class="center">
    <div class="nav-label">Current</div>
    <span>NASA 1.220 &middot; v1.49.1036</span>
  </div>
  ${rightCell}
</div>`;
}

// A degree index always has two nav-cards (top + bottom).
function page(rightCell = SERIES_HUB_CELL): string {
  return `<!doctype html><html><body>\n${navCard(rightCell)}\n<main>body</main>\n${navCard(rightCell)}\n</body></html>\n`;
}

function run(root: string, args: string[]) {
  return spawnSync('node', [TOOL, ...args], { encoding: 'utf8' });
}

const count = (html: string, re: RegExp) => (html.match(re) || []).length;

describe('nasa-nav-promote-predecessor', () => {
  let root: string;
  let predIndex: string;
  const PROMOTE = ['--predecessor', '1.220', '--new-degree', '1.221', '--new-mission', 'GRACE'];

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'nav-promote-'));
    const dir = join(root, 'www/tibsfox/com/Research/NASA/1.220');
    mkdirSync(dir, { recursive: true });
    predIndex = join(dir, 'index.html');
    writeFileSync(predIndex, page());
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('promotes both nav-cards: Series hub -> Next mission -> new degree', () => {
    const r = run(root, [...PROMOTE, '--root', root]);
    expect(r.status).toBe(0);
    const html = readFileSync(predIndex, 'utf8');
    expect(count(html, /Next mission/g)).toBe(2);
    expect(count(html, /href="\.\.\/1\.221\/index\.html"/g)).toBe(2);
    expect(count(html, /v1\.221 GRACE &rarr;/g)).toBe(2);
    expect(html).not.toContain('Series hub');
    // the Previous/Current cells are untouched
    expect(count(html, /Previous mission/g)).toBe(2);
  });

  it('is idempotent: a second run reports no change and leaves the file byte-identical', () => {
    run(root, [...PROMOTE, '--root', root]);
    const after1 = readFileSync(predIndex, 'utf8');
    const r2 = run(root, [...PROMOTE, '--root', root]);
    expect(r2.status).toBe(0);
    expect(r2.stdout).toMatch(/already promoted/);
    expect(readFileSync(predIndex, 'utf8')).toBe(after1);
  });

  it('--check exits 1 on an un-promoted predecessor (writes nothing), 0 after promotion', () => {
    const c1 = run(root, [...PROMOTE, '--root', root, '--check']);
    expect(c1.status).toBe(1);
    expect(readFileSync(predIndex, 'utf8')).toContain('Series hub'); // --check did not write
    run(root, [...PROMOTE, '--root', root]);
    const c2 = run(root, [...PROMOTE, '--root', root, '--check']);
    expect(c2.status).toBe(0);
  });

  it('exits 2 when the predecessor index is missing', () => {
    const r = run(root, ['--predecessor', '1.999', '--new-degree', '1.221', '--new-mission', 'GRACE', '--root', root]);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/index not found/);
  });

  it('exits 2 on a malformed degree argument', () => {
    const r = run(root, ['--predecessor', 'nope', '--new-degree', '1.221', '--new-mission', 'GRACE', '--root', root]);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/must look like 1\.N/);
  });

  it('exits 2 (no silent overwrite) when the right cell already points at a DIFFERENT successor', () => {
    const conflictCell = `<div class="right">
    <div class="nav-label">Next mission</div>
    <a href="../1.250/index.html">v1.250 OTHER &rarr;</a>
  </div>`;
    writeFileSync(predIndex, page(conflictCell));
    const r = run(root, [...PROMOTE, '--root', root]);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/already points to/);
    expect(readFileSync(predIndex, 'utf8')).toContain('1.250'); // untouched
  });

  it('still promotes the single cell (with a stderr warning) when only one nav-card is present', () => {
    // Defensive: the script warns but does not abort if it finds !=2 right cells.
    writeFileSync(predIndex, `<!doctype html><html><body>\n${navCard(SERIES_HUB_CELL)}\n</body></html>\n`);
    const r = run(root, [...PROMOTE, '--root', root]);
    expect(r.status).toBe(0);
    expect(r.stderr).toMatch(/expected 2 nav-card right cells \(top\+bottom\), found 1/);
    const html = readFileSync(predIndex, 'utf8');
    expect(count(html, /Next mission/g)).toBe(1);
    expect(count(html, /href="\.\.\/1\.221\/index\.html"/g)).toBe(1);
    expect(html).not.toContain('Series hub');
  });

  it('html-escapes ampersands in the mission name', () => {
    const r = run(root, ['--predecessor', '1.220', '--new-degree', '1.221', '--new-mission', 'A & B', '--root', root]);
    expect(r.status).toBe(0);
    expect(readFileSync(predIndex, 'utf8')).toContain('v1.221 A &amp; B &rarr;');
  });
});
