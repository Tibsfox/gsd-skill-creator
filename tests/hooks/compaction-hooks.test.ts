import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  writeFileSync,
  readFileSync,
  existsSync,
  unlinkSync,
  mkdtempSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveHookPath } from '../fixtures/test-hooks.js';

const PRE = resolveHookPath('pre-compact-snapshot.cjs');
const POST = resolveHookPath('post-compact-recovery.cjs');

function run(script: string, stdin: string, cwd?: string): { stdout: string; code: number | null } {
  const res = spawnSync('node', [script], {
    input: stdin,
    encoding: 'utf8',
    cwd: cwd ?? process.cwd(),
  });
  return { stdout: res.stdout, code: res.status };
}

function snapshotPath(sid: string): string {
  return `/tmp/claude-precompact-${sid}.json`;
}

function journalPath(sid: string): string {
  return `/tmp/claude-journal-${sid}.jsonl`;
}

function cleanup(sid: string) {
  for (const p of [snapshotPath(sid), journalPath(sid)]) {
    try { if (existsSync(p)) unlinkSync(p); } catch { /* ignore */ }
  }
}

describe('pre-compact-snapshot.cjs', () => {
  const sid = `test-pre-${process.pid}`;

  beforeEach(() => cleanup(sid));
  afterEach(() => cleanup(sid));

  it('writes snapshot with all required fields', () => {
    const { code } = run(PRE, JSON.stringify({ session_id: sid, cwd: process.cwd() }));
    expect(code).toBe(0);
    expect(existsSync(snapshotPath(sid))).toBe(true);

    const snap = JSON.parse(readFileSync(snapshotPath(sid), 'utf8'));
    expect(snap.session_id).toBe(sid);
    expect(snap.cwd).toBe(process.cwd());
    expect(typeof snap.timestamp).toBe('string');
    expect(snap.compaction_count).toBe(1);
    expect(snap.git).toBeDefined();
    expect(typeof snap.git.branch).toBe('string');
    expect(Array.isArray(snap.recent_files)).toBe(true);
  });

  it('increments compaction_count on repeat invocation', () => {
    run(PRE, JSON.stringify({ session_id: sid, cwd: process.cwd() }));
    run(PRE, JSON.stringify({ session_id: sid, cwd: process.cwd() }));
    run(PRE, JSON.stringify({ session_id: sid, cwd: process.cwd() }));
    const snap = JSON.parse(readFileSync(snapshotPath(sid), 'utf8'));
    expect(snap.compaction_count).toBe(3);
  });

  it('reads journal tail when present', () => {
    writeFileSync(
      journalPath(sid),
      JSON.stringify({ tool: 'Edit', file: 'foo.ts' }) + '\n' +
      JSON.stringify({ tool: 'Write', file: 'bar.ts' }) + '\n'
    );
    run(PRE, JSON.stringify({ session_id: sid, cwd: process.cwd() }));
    const snap = JSON.parse(readFileSync(snapshotPath(sid), 'utf8'));
    expect(snap.recent_files).toHaveLength(2);
    expect(snap.recent_files[0].tool).toBe('Edit');
  });

  it('T-SAFE-01: exits 0 silently on malformed stdin', () => {
    const { stdout, code } = run(PRE, '{not json');
    expect(code).toBe(0);
    expect(stdout).toBe('');
  });

  it('T-SAFE-02: exits 0 when cwd does not exist', () => {
    const fakeCwd = join(tmpdir(), 'does-not-exist-' + process.pid);
    const { code } = run(PRE, JSON.stringify({ session_id: sid, cwd: fakeCwd }));
    expect(code).toBe(0);
  });

  it('captures STATE.md head when .planning/STATE.md exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pre-compact-cwd-'));
    mkdirSync(join(dir, '.planning'));
    writeFileSync(join(dir, '.planning/STATE.md'), 'LINE1\nLINE2\nLINE3\n');
    run(PRE, JSON.stringify({ session_id: sid, cwd: dir }));
    const snap = JSON.parse(readFileSync(snapshotPath(sid), 'utf8'));
    expect(snap.gsd_state).toContain('LINE1');
    expect(snap.gsd_state).toContain('LINE2');
  });
});

describe('post-compact-recovery.cjs', () => {
  const sid = `test-post-${process.pid}`;

  beforeEach(() => cleanup(sid));
  afterEach(() => cleanup(sid));

  it('emits PostCompact envelope with recovery context', () => {
    writeFileSync(
      snapshotPath(sid),
      JSON.stringify({
        session_id: sid,
        cwd: process.cwd(),
        timestamp: '2026-04-15T00:00:00Z',
        compaction_count: 1,
        git: { branch: 'dev', status: '', log: '' },
        gsd_state: '',
        recent_files: [],
      })
    );
    const { stdout, code } = run(POST, JSON.stringify({ session_id: sid, cwd: process.cwd() }));
    expect(code).toBe(0);
    const payload = JSON.parse(stdout);
    expect(payload.hookSpecificOutput.hookEventName).toBe('PostCompact');
    expect(payload.hookSpecificOutput.additionalContext).toContain('CONTEXT RECOVERY');
    expect(payload.hookSpecificOutput.additionalContext).toContain('Compaction #1');
  });

  it('handles missing snapshot gracefully', () => {
    const { stdout, code } = run(POST, JSON.stringify({ session_id: sid, cwd: process.cwd() }));
    expect(code).toBe(0);
    const payload = JSON.parse(stdout);
    expect(payload.hookSpecificOutput.additionalContext).toContain('no prior snapshot');
  });

  it('warns after 3+ compactions', () => {
    writeFileSync(
      snapshotPath(sid),
      JSON.stringify({
        session_id: sid,
        cwd: process.cwd(),
        timestamp: '2026-04-15T00:00:00Z',
        compaction_count: 4,
        git: { branch: 'dev', status: '', log: '' },
        gsd_state: '',
        recent_files: [],
      })
    );
    const { stdout } = run(POST, JSON.stringify({ session_id: sid, cwd: process.cwd() }));
    const payload = JSON.parse(stdout);
    expect(payload.hookSpecificOutput.additionalContext).toContain('4 compactions');
  });

  it('combines snapshot with LIVE git state (live branch included)', () => {
    writeFileSync(
      snapshotPath(sid),
      JSON.stringify({
        session_id: sid,
        cwd: process.cwd(),
        timestamp: '2026-04-15T00:00:00Z',
        compaction_count: 1,
        git: { branch: 'dev', status: '', log: '' },
        gsd_state: '',
        recent_files: [],
      })
    );
    const { stdout } = run(POST, JSON.stringify({ session_id: sid, cwd: process.cwd() }));
    const payload = JSON.parse(stdout);
    expect(payload.hookSpecificOutput.additionalContext).toContain('branch:');
  });

  it('T-SAFE-01: exits 0 silently on malformed stdin', () => {
    const { code } = run(POST, '{not json');
    expect(code).toBe(0);
  });
});
