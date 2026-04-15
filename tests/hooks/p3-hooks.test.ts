import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, unlinkSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveHookPath } from '../fixtures/test-hooks.js';

const NOTIF = resolveHookPath('notification-logger.cjs');
const WT = resolveHookPath('worktree-init.cjs');

function run(hook: string, stdin: string): { stdout: string; code: number | null } {
  const res = spawnSync('node', [hook], { input: stdin, encoding: 'utf8' });
  return { stdout: res.stdout, code: res.status };
}

function cleanup(...paths: string[]) {
  for (const p of paths) {
    try { if (existsSync(p)) unlinkSync(p); } catch { /* ignore */ }
  }
}

describe('notification-logger', () => {
  const sid = `test-notif-${process.pid}`;
  const logPath = `/tmp/claude-notifications-${sid}.jsonl`;
  beforeEach(() => cleanup(logPath));
  afterEach(() => cleanup(logPath));

  it('T-N-01: appends JSONL entry per event', () => {
    const { stdout, code } = run(
      NOTIF,
      JSON.stringify({ session_id: sid, notification_type: 'context_warning', payload: { usage: 0.8 } })
    );
    expect(code).toBe(0);
    expect(stdout).toBe('');
    expect(existsSync(logPath)).toBe(true);
    const lines = readFileSync(logPath, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]);
    expect(entry.type).toBe('context_warning');
    expect(entry.ts).toBeGreaterThan(0);
    expect(entry.data).toBeDefined();
  });

  it('appends multiple lines over multiple invocations', () => {
    run(NOTIF, JSON.stringify({ session_id: sid, type: 'a' }));
    run(NOTIF, JSON.stringify({ session_id: sid, type: 'b' }));
    const lines = readFileSync(logPath, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
  });

  it('T-SAFE-05: exits 0 on malformed stdin', () => {
    const { stdout, code } = run(NOTIF, '{not json');
    expect(code).toBe(0);
    expect(stdout).toBe('');
  });
});

describe('worktree-init', () => {
  const sid = `test-wt-${process.pid}`;
  const regPath = `/tmp/claude-worktrees-${sid}.json`;
  beforeEach(() => cleanup(regPath));
  afterEach(() => cleanup(regPath));

  it('T-W-01: registers new worktree entry', () => {
    const { stdout, code } = run(
      WT,
      JSON.stringify({ session_id: sid, worktree_path: '/tmp/wt-abc' })
    );
    expect(code).toBe(0);
    expect(stdout).toBe('');
    const reg = JSON.parse(readFileSync(regPath, 'utf8'));
    expect(Array.isArray(reg)).toBe(true);
    expect(reg).toHaveLength(1);
    expect(reg[0].path).toBe('/tmp/wt-abc');
    expect(reg[0].status).toBe('active');
    expect(reg[0].session_id).toBe(sid);
  });

  it('T-W-02: preserves prior entries across invocations', () => {
    run(WT, JSON.stringify({ session_id: sid, worktree_path: '/tmp/a' }));
    run(WT, JSON.stringify({ session_id: sid, worktree_path: '/tmp/b' }));
    const reg = JSON.parse(readFileSync(regPath, 'utf8'));
    expect(reg).toHaveLength(2);
    expect(reg[0].path).toBe('/tmp/a');
    expect(reg[1].path).toBe('/tmp/b');
  });

  it('T-SAFE-06: exits 0 silently when session_id missing', () => {
    const { stdout, code } = run(WT, JSON.stringify({ worktree_path: '/tmp/x' }));
    expect(code).toBe(0);
    expect(stdout).toBe('');
    expect(existsSync(regPath)).toBe(false);
  });

  it('falls back to cwd when worktree_path absent', () => {
    const { code } = run(WT, JSON.stringify({ session_id: sid, cwd: '/tmp/fallback' }));
    expect(code).toBe(0);
    const reg = JSON.parse(readFileSync(regPath, 'utf8'));
    expect(reg[0].path).toBe('/tmp/fallback');
  });
});
