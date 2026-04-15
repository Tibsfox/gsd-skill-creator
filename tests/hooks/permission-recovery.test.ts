import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, unlinkSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const HOOK = join(process.cwd(), '.claude/hooks/permission-recovery.cjs');

function run(stdin: string): { stdout: string; code: number | null } {
  const res = spawnSync('node', [HOOK], { input: stdin, encoding: 'utf8' });
  return { stdout: res.stdout, code: res.status };
}

function parseCtx(stdout: string): string {
  if (!stdout) return '';
  try {
    return JSON.parse(stdout)?.hookSpecificOutput?.additionalContext ?? '';
  } catch {
    return '';
  }
}

function cleanup(sid: string) {
  const p = `/tmp/claude-denied-${sid}.json`;
  try { if (existsSync(p)) unlinkSync(p); } catch { /* ignore */ }
}

describe('permission-recovery', () => {
  const sid = `test-perm-${process.pid}`;
  beforeEach(() => cleanup(sid));
  afterEach(() => cleanup(sid));

  it('T-P-01: first denial is silent', () => {
    const { stdout, code } = run(
      JSON.stringify({ session_id: sid, tool_name: 'Bash', tool_input: { command: 'ls /root' } })
    );
    expect(code).toBe(0);
    expect(stdout).toBe('');
  });

  it('T-P-02: second denial emits retry-loop warning with tool guidance', () => {
    const input = JSON.stringify({ session_id: sid, tool_name: 'Bash', tool_input: { command: 'ls /root' } });
    run(input);
    const { stdout } = run(input);
    const ctx = parseCtx(stdout);
    expect(ctx).toContain('RETRY LOOP DETECTED');
    expect(ctx).toContain('denied 2 times');
    expect(ctx).toContain('Shell command denied');
  });

  it('T-P-03: state persists across invocations', () => {
    const input = JSON.stringify({ session_id: sid, tool_name: 'Write', tool_input: { file_path: '/etc/passwd' } });
    run(input);
    run(input);
    run(input);
    const data = JSON.parse(readFileSync(`/tmp/claude-denied-${sid}.json`, 'utf8'));
    const key = Object.keys(data)[0];
    expect(data[key]).toBe(3);
  });

  it('different keys track independently', () => {
    run(JSON.stringify({ session_id: sid, tool_name: 'Bash', tool_input: { command: 'a' } }));
    run(JSON.stringify({ session_id: sid, tool_name: 'Bash', tool_input: { command: 'b' } }));
    const out = run(JSON.stringify({ session_id: sid, tool_name: 'Bash', tool_input: { command: 'a' } }));
    const ctx = parseCtx(out.stdout);
    expect(ctx).toContain('denied 2 times');
  });

  it('includes Write-specific guidance on second Write denial', () => {
    const input = JSON.stringify({ session_id: sid, tool_name: 'Write', tool_input: { file_path: '/etc/x' } });
    run(input);
    const { stdout } = run(input);
    expect(parseCtx(stdout)).toContain('File write denied');
  });

  it('T-SAFE-04: exits 0 on malformed JSON', () => {
    const { stdout, code } = run('{not json');
    expect(code).toBe(0);
    expect(stdout).toBe('');
  });

  it('truncates long keys to 80 chars', () => {
    const long = 'x'.repeat(200);
    run(JSON.stringify({ session_id: sid, tool_name: 'Bash', tool_input: { command: long } }));
    const data = JSON.parse(readFileSync(`/tmp/claude-denied-${sid}.json`, 'utf8'));
    const key = Object.keys(data)[0];
    expect(key.length).toBeLessThanOrEqual(80);
  });
});
