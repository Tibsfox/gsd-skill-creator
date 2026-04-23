import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PY_SCRIPT = path.join(REPO_ROOT, 'scripts', 'erdos-refresh.py');
const SNAPSHOT = path.join(REPO_ROOT, 'scripts', 'data', 'erdos-ai-contributions.json');
const TRACKER_LIVE = path.join(REPO_ROOT, 'ERDOS-TRACKER.md');

describe('scripts/erdos-refresh.py (Phase 682)', () => {
  let tmpdir: string;
  let tmpTracker: string;

  beforeEach(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'erdos-refresh-'));
    tmpTracker = path.join(tmpdir, 'ERDOS-TRACKER.md');
    fs.copyFileSync(TRACKER_LIVE, tmpTracker);
  });

  afterEach(() => {
    fs.rmSync(tmpdir, { recursive: true, force: true });
  });

  it('--dry-run exits 0 on a working tracker copy', () => {
    // Either produces a diff OR reports "no changes" -- both are exit 0.
    const out = execFileSync(
      'python3',
      [PY_SCRIPT, '--dry-run', '--tracker', tmpTracker, '--snapshot', SNAPSHOT],
      { encoding: 'utf8' },
    );
    expect(typeof out).toBe('string');
  });

  it('dry-run is idempotent -- two consecutive runs produce identical output', () => {
    const run1 = execFileSync(
      'python3',
      [PY_SCRIPT, '--dry-run', '--tracker', tmpTracker, '--snapshot', SNAPSHOT],
      { encoding: 'utf8' },
    );
    const run2 = execFileSync(
      'python3',
      [PY_SCRIPT, '--dry-run', '--tracker', tmpTracker, '--snapshot', SNAPSHOT],
      { encoding: 'utf8' },
    );
    expect(run1).toBe(run2);
  });

  it('apply -> apply is a fixed point (file unchanged on second apply)', () => {
    // First apply
    execFileSync(
      'python3',
      [PY_SCRIPT, '--tracker', tmpTracker, '--snapshot', SNAPSHOT],
      { encoding: 'utf8' },
    );
    const after1 = fs.readFileSync(tmpTracker, 'utf8');
    // Second apply -- should be a no-op
    execFileSync(
      'python3',
      [PY_SCRIPT, '--tracker', tmpTracker, '--snapshot', SNAPSHOT],
      { encoding: 'utf8' },
    );
    const after2 = fs.readFileSync(tmpTracker, 'utf8');
    expect(after1).toBe(after2);
  });

  it('snapshot file is well-formed JSON with >=7 attempts', () => {
    const data = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
    expect(Array.isArray(data.attempts)).toBe(true);
    expect(data.attempts.length).toBeGreaterThanOrEqual(7);
    for (const a of data.attempts) {
      expect(typeof a.problem).toBe('number');
      expect(typeof a.status).toBe('string');
      // canonical status tokens -- wiki vocabulary
      expect(['none', 'partial', 'solved', 'conditional']).toContain(a.status);
    }
  });

  it('handles missing tracker file gracefully (exit 2)', () => {
    const missing = path.join(tmpdir, 'does-not-exist.md');
    let exitCode = 0;
    try {
      execFileSync(
        'python3',
        [PY_SCRIPT, '--dry-run', '--tracker', missing, '--snapshot', SNAPSHOT],
        { encoding: 'utf8', stdio: 'pipe' },
      );
    } catch (e: unknown) {
      const err = e as { status?: number };
      exitCode = err.status ?? 0;
    }
    expect(exitCode).toBe(2);
  });

  it('parses ### #N headers and only modifies fields inside those blocks', () => {
    // The tracker has mentions of #1196 in narrative/tables but only one ### #N block
    // matches our snapshot (#120). Script should leave narrative mentions alone.
    const before = fs.readFileSync(tmpTracker, 'utf8');
    execFileSync(
      'python3',
      [PY_SCRIPT, '--tracker', tmpTracker, '--snapshot', SNAPSHOT],
      { encoding: 'utf8' },
    );
    const after = fs.readFileSync(tmpTracker, 'utf8');
    // Narrative line about #1196 (line 18) must survive untouched.
    const beforeIntro = before.split('\n').slice(15, 20).join('\n');
    const afterIntro = after.split('\n').slice(15, 20).join('\n');
    expect(afterIntro).toBe(beforeIntro);
  });

  it('completes a dry-run in under 10 seconds', () => {
    const start = Date.now();
    execFileSync(
      'python3',
      [PY_SCRIPT, '--dry-run', '--tracker', tmpTracker, '--snapshot', SNAPSHOT],
      { encoding: 'utf8' },
    );
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10_000);
  });
});
