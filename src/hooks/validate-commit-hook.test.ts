import { describe, it, expect } from 'vitest';
import { execSync, spawnSync } from 'child_process';
import { join } from 'path';

// Source of truth for the Conventional Commits PreToolUse hook. The hook
// ships from project-claude/hooks/validate-commit.cjs and is installed into
// .claude/hooks/ by project-claude/install.cjs. We test it at the source
// path so the suite covers the pre-install copy.
const HOOK_PATH = join(process.cwd(), 'project-claude/hooks/validate-commit.cjs');
const NODE = process.execPath;

function runHook(command: string): { code: number; stdout: string; stderr: string } {
  const input = JSON.stringify({ tool_name: 'Bash', tool_input: { command } });
  const result = spawnSync(NODE, [HOOK_PATH], {
    input,
    encoding: 'utf-8',
    timeout: 5000,
  });
  return {
    code: result.status ?? 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

describe('validate-commit hook', () => {
  it('passes syntax check', () => {
    expect(() => execSync(`"${NODE}" --check "${HOOK_PATH}"`)).not.toThrow();
  });

  it('exits 0 for non-commit commands', () => {
    expect(runHook('git status').code).toBe(0);
    expect(runHook('ls').code).toBe(0);
  });

  it('accepts a conforming single-line -m subject', () => {
    expect(runHook('git commit -m "fix(scope): valid subject"').code).toBe(0);
  });

  it('blocks a non-conforming single-line -m subject', () => {
    const { code, stdout } = runHook('git commit -m "not a conventional commit"');
    expect(code).toBe(2);
    expect(stdout).toContain('Conventional Commits');
  });

  it('accepts a conforming single-quoted -m subject', () => {
    expect(runHook("git commit -m 'fix(scope): single quoted subject'").code).toBe(0);
  });

  // Regression: the previous regex ordering ran the double-quoted [^"]*
  // matcher first, which greedy-matched across newlines and captured the
  // literal "$(cat <<'EOF'" as the subject — rejecting the documented
  // HEREDOC commit style.
  it('accepts a HEREDOC commit message with valid subject', () => {
    const cmd =
      'git commit -m "$(cat <<\'EOF\'\n' +
      'fix(harness): close residual gaps\n' +
      '\n' +
      'Body line describing the fix.\n' +
      'EOF\n' +
      ')"';
    expect(runHook(cmd).code).toBe(0);
  });

  it('blocks a HEREDOC commit message with non-conforming subject', () => {
    const cmd =
      'git commit -m "$(cat <<\'EOF\'\n' +
      'this subject has no type prefix\n' +
      '\n' +
      'Body.\n' +
      'EOF\n' +
      ')"';
    expect(runHook(cmd).code).toBe(2);
  });

  it('warns but does not block on out-of-order wave markers in HEREDOC body', () => {
    const cmd =
      'git commit -m "$(cat <<\'EOF\'\n' +
      'feat(core): bundle waves\n' +
      '\n' +
      'Wave 2: second wave\n' +
      'Wave 1: first wave (out of order)\n' +
      'EOF\n' +
      ')"';
    const { code, stderr } = runHook(cmd);
    expect(code).toBe(0);
    expect(stderr).toContain('Wave commit markers');
  });
});
