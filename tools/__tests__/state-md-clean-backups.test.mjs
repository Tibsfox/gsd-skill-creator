/**
 * state-md-clean-backups.test.mjs — tests for the .planning/ backup-file source
 * eliminator + detector (counter-cadence #28; two-layer closure #10431/#10436).
 *
 * Tests:
 *   T1.  --check exits 0 on a clean dir
 *   T2.  --check exits 1 + lists a STATE.md.backup-before-normalize-* file
 *   T3.  --check exits 1 for a citation-debt.json.bak.* file (narrow sibling)
 *   T4.  --check (narrow default) does NOT flag a manual CLAUDE.md.backup-* file
 *   T5.  --all --check DOES flag the broad CLAUDE.md.backup-* file
 *   T6.  --check does not delete (read-only — file still present after)
 *   T7.  --write removes all narrow-matched backups (exit 0)
 *   T8.  --write post-condition holds (a fresh --check is clean afterward)
 *   T9.  --write on an already-clean dir is a no-op (exit 0, removed 0)
 *   T10. --write does NOT touch the live files (STATE.md/PROJECT.md/citation-debt.json) — load-bearing
 *   T11. --write --all removes the broad backups too
 *   T12. --json emits a machine-readable result
 *   T13. missing dir (no .planning) is a clean no-op (exit 0)
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readdirSync, rmSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'state-md-clean-backups.mjs');

let tmpRoot;
let planningDir;

function setup(files = {}) {
  tmpRoot = mkdtempSync(join(tmpdir(), 'clean-backups-test-'));
  planningDir = join(tmpRoot, '.planning');
  mkdirSync(planningDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(planningDir, name), content, 'utf8');
  }
}

function run(args = '', { root } = {}) {
  const argv = args.length > 0 ? args.split(' ').filter(Boolean) : [];
  const result = spawnSync('node', [SCRIPT_PATH, ...argv], {
    cwd: tmpRoot,
    encoding: 'utf8',
    env: { ...process.env, SC_STATE_BACKUP_ROOT: root ?? planningDir },
  });
  return { exitCode: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function listDir() {
  return readdirSync(planningDir).sort();
}

afterEach(() => {
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch { /* ignore */ }
});

const STATE_BK = 'STATE.md.backup-before-normalize-2026-06-03T06-44-27-864Z';
const CITDEBT_BK = 'citation-debt.json.bak.1717300000000';
const MANUAL_BK = 'CLAUDE.md.backup-2026-05-10';

describe('state-md-clean-backups', () => {
  it('T1 --check exits 0 on a clean dir', () => {
    setup({ 'STATE.md': 'live', 'PROJECT.md': 'live' });
    const r = run('--check');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/no lingering backups/);
  });

  it('T2 --check exits 1 + lists a STATE.md backup', () => {
    setup({ 'STATE.md': 'live', [STATE_BK]: 'old' });
    const r = run('--check');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain(STATE_BK);
  });

  it('T3 --check exits 1 for a citation-debt backup (narrow sibling)', () => {
    setup({ 'citation-debt.json': '[]', [CITDEBT_BK]: 'old' });
    const r = run('--check');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain(CITDEBT_BK);
  });

  it('T4 --check (narrow default) does NOT flag a manual CLAUDE.md.backup', () => {
    setup({ [MANUAL_BK]: 'parked' });
    const r = run('--check');
    expect(r.exitCode).toBe(0); // narrow default leaves a parked manual backup alone
  });

  it('T5 --all --check DOES flag the manual CLAUDE.md.backup', () => {
    setup({ [MANUAL_BK]: 'parked' });
    const r = run('--all --check');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain(MANUAL_BK);
  });

  it('T6 --check does not delete (read-only)', () => {
    setup({ [STATE_BK]: 'old' });
    run('--check');
    expect(existsSync(join(planningDir, STATE_BK))).toBe(true);
  });

  it('T7 --write removes all narrow-matched backups', () => {
    setup({ 'STATE.md': 'live', [STATE_BK]: 'a', [CITDEBT_BK]: 'b' });
    const r = run('--write');
    expect(r.exitCode).toBe(0);
    expect(existsSync(join(planningDir, STATE_BK))).toBe(false);
    expect(existsSync(join(planningDir, CITDEBT_BK))).toBe(false);
  });

  it('T8 --write post-condition holds (a fresh --check is clean)', () => {
    setup({ [STATE_BK]: 'a', [CITDEBT_BK]: 'b' });
    expect(run('--write').exitCode).toBe(0);
    expect(run('--check').exitCode).toBe(0);
  });

  it('T9 --write on an already-clean dir is a no-op', () => {
    setup({ 'STATE.md': 'live' });
    const r = run('--write --json');
    expect(r.exitCode).toBe(0);
    expect(JSON.parse(r.stdout)).toMatchObject({ mode: 'write', removed: 0, ok: true });
  });

  it('T10 --write does NOT touch the live files (load-bearing negative)', () => {
    setup({
      'STATE.md': 'live-state',
      'PROJECT.md': 'live-project',
      'citation-debt.json': '[]',
      [STATE_BK]: 'a',
      [CITDEBT_BK]: 'b',
      [MANUAL_BK]: 'parked',
    });
    expect(run('--write').exitCode).toBe(0);
    const after = listDir();
    // Live files + the (narrow-excluded) manual backup survive; only the two
    // tool-written backups are gone.
    expect(after).toContain('STATE.md');
    expect(after).toContain('PROJECT.md');
    expect(after).toContain('citation-debt.json');
    expect(after).toContain(MANUAL_BK);
    expect(after).not.toContain(STATE_BK);
    expect(after).not.toContain(CITDEBT_BK);
  });

  it('T11 --write --all removes the broad backups too', () => {
    setup({ 'STATE.md': 'live', [STATE_BK]: 'a', [MANUAL_BK]: 'parked' });
    expect(run('--write --all').exitCode).toBe(0);
    expect(existsSync(join(planningDir, MANUAL_BK))).toBe(false);
    expect(existsSync(join(planningDir, 'STATE.md'))).toBe(true);
  });

  it('T12 --json emits a machine-readable result', () => {
    setup({ [STATE_BK]: 'a' });
    const r = run('--check --json');
    expect(r.exitCode).toBe(1);
    expect(JSON.parse(r.stdout)).toMatchObject({ mode: 'check', ok: false, found: [STATE_BK] });
  });

  it('T13 missing .planning dir is a clean no-op', () => {
    setup({});
    rmSync(planningDir, { recursive: true, force: true });
    const r = run('--check');
    expect(r.exitCode).toBe(0);
  });

  it('T14 --all does NOT delete a file whose name merely CONTAINS the marker mid-name', () => {
    // The BROAD `--all` pattern is anchored to the final segment, so a doc that
    // merely contains ".backup-"/".bak." mid-name is spared (v961 review MINOR).
    setup({
      'my.backup-notes.md': 'a doc about backups, NOT a backup',
      [MANUAL_BK]: 'real trailing-marker backup',
    });
    expect(run('--write --all').exitCode).toBe(0);
    expect(existsSync(join(planningDir, 'my.backup-notes.md'))).toBe(true); // spared
    expect(existsSync(join(planningDir, MANUAL_BK))).toBe(false); // real backup removed
  });

  it('T15 --write is idempotent across repeated invocation (second run removes 0)', () => {
    setup({ [STATE_BK]: 'a', [CITDEBT_BK]: 'b' });
    expect(JSON.parse(run('--write --json').stdout).removed).toBeGreaterThan(0);
    // A second --write is a no-op (the eliminator the self-clean wire relies on).
    expect(JSON.parse(run('--write --json').stdout)).toMatchObject({ removed: 0, ok: true });
  });

  it.skipIf(process.getuid?.() === 0 || process.platform === 'win32')(
    'T16 --write post-condition: exit 2 when a matched backup cannot be unlinked',
    () => {
      // The #10431 source-eliminator post-condition: re-scan after unlink, exit 2
      // on residue. Force a residue by making the dir read+execute but not write
      // (readdir/stat succeed -> file is listed + re-scanned -> unlink denied).
      setup({ [STATE_BK]: 'a' });
      chmodSync(planningDir, 0o500);
      try {
        const r = run('--write --json');
        expect(r.exitCode).toBe(2);
        expect(JSON.parse(r.stdout)).toMatchObject({ mode: 'write', ok: false });
      } finally {
        chmodSync(planningDir, 0o700); // restore BEFORE afterEach's rmSync
      }
    },
  );
});
