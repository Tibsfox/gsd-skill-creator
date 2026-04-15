import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const HOOK = join(process.cwd(), '.claude/hooks/external-change-tracker.cjs');

function run(stdin: string, cwd?: string): { stdout: string; code: number | null } {
  const res = spawnSync('node', [HOOK], {
    input: stdin,
    encoding: 'utf8',
    cwd: cwd ?? process.cwd(),
  });
  return { stdout: res.stdout, code: res.status };
}

function parseAdditional(stdout: string): string {
  if (!stdout) return '';
  try {
    const p = JSON.parse(stdout);
    return p?.hookSpecificOutput?.additionalContext ?? '';
  } catch {
    return '';
  }
}

describe('external-change-tracker — case 1: SKILL.md', () => {
  it('T-FC-01: emits skill-reload guidance', () => {
    const { stdout, code } = run(
      JSON.stringify({ file_path: '/project/.claude/skills/sling-dispatch/SKILL.md' })
    );
    expect(code).toBe(0);
    const ctx = parseAdditional(stdout);
    expect(ctx).toContain('sling-dispatch');
    expect(ctx).toContain('re-read');
  });
});

describe('external-change-tracker — case 2: .planning', () => {
  it('T-FC-02: emits stale-GSD warning for planning files', () => {
    const { stdout } = run(
      JSON.stringify({ file_path: '/project/.planning/STATE.md' })
    );
    const ctx = parseAdditional(stdout);
    expect(ctx).toContain('STATE.md');
    expect(ctx).toContain('outdated');
  });
});

describe('external-change-tracker — case 3: settings.json', () => {
  it('emits hook-config-changed warning', () => {
    const { stdout } = run(
      JSON.stringify({ file_path: '/project/.claude/settings.json' })
    );
    const ctx = parseAdditional(stdout);
    expect(ctx).toContain('Hook configuration changed');
  });
});

describe('external-change-tracker — case 4: CLAUDE.md', () => {
  it('T-FC-04: emits directive-reload for project CLAUDE.md', () => {
    const { stdout } = run(
      JSON.stringify({
        file_path: '/home/foxy/work/CLAUDE.md',
        cwd: '/home/foxy/work',
      })
    );
    const ctx = parseAdditional(stdout);
    expect(ctx).toContain('Project instructions');
  });

  it('does NOT match CLAUDE.md inside .claude/', () => {
    const { stdout } = run(
      JSON.stringify({ file_path: '/project/.claude/skills/foo/CLAUDE.md' })
    );
    const ctx = parseAdditional(stdout);
    expect(ctx).not.toContain('Project instructions');
  });
});

describe('external-change-tracker — case 5: src/**', () => {
  it('T-FC-05: emits source-file-change warning', () => {
    const { stdout } = run(
      JSON.stringify({ file_path: '/project/src/cli.ts' })
    );
    const ctx = parseAdditional(stdout);
    expect(ctx).toContain('src/cli.ts');
    expect(ctx).toContain('conflicts');
  });

  it('matches desktop/** as well', () => {
    const { stdout } = run(
      JSON.stringify({ file_path: '/project/desktop/main.ts' })
    );
    const ctx = parseAdditional(stdout);
    expect(ctx).toContain('desktop/main.ts');
  });
});

describe('external-change-tracker — safety', () => {
  it('T-SAFE-03: exits 0 with empty stdout on malformed JSON', () => {
    const { stdout, code } = run('{not json');
    expect(code).toBe(0);
    expect(stdout).toBe('');
  });

  it('exits 0 with empty stdout on missing file_path', () => {
    const { stdout, code } = run(JSON.stringify({ other: 'field' }));
    expect(code).toBe(0);
    expect(stdout).toBe('');
  });

  it('accepts file_path nested inside tool_input', () => {
    const { stdout } = run(
      JSON.stringify({ tool_input: { file_path: '/x/.planning/foo.md' } })
    );
    const ctx = parseAdditional(stdout);
    expect(ctx).toContain('foo.md');
  });

  it('is idempotent — two invocations produce identical output', () => {
    const input = JSON.stringify({ file_path: '/p/src/x.ts' });
    const a = run(input);
    const b = run(input);
    expect(a.stdout).toBe(b.stdout);
  });

  it('produces no output for unmatched paths', () => {
    const { stdout, code } = run(JSON.stringify({ file_path: '/tmp/random.log' }));
    expect(code).toBe(0);
    expect(stdout).toBe('');
  });
});
