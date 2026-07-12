/**
 * CF-H-034 — Tool-tracker registration + privacy-tier-B compliance.
 *
 * Updated 2026-07: tool-tracker.sh now reads the hook payload from STDIN (Claude
 * Code's contract, keyed on `hook_event_name`) instead of $CLAUDE_* env vars the
 * runtime never set. This suite asserts:
 *  1. tool-tracker.sh exists and is executable
 *  2. project-claude/settings.json registers it on the REAL events it handles
 *     (SubagentStop, UserPromptSubmit)
 *  3. Fed a stdin payload, it writes a tier-B JSONL line keyed on hook_event_name,
 *     with the session id hashed and the prompt reduced to a length (no content)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, statSync, existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const TRACKER = join(REPO_ROOT, 'project-claude', 'hooks', 'tool-tracker.sh');
const SETTINGS = join(REPO_ROOT, 'project-claude', 'settings.json');

// The real Claude Code hook events tool-tracker handles + is registered on.
const REQUIRED_EVENTS = ['SubagentStop', 'UserPromptSubmit'];

// windows: this suite executes a POSIX shell script (tool-tracker.sh) via bash
// and asserts on Unix file-mode execute bits — neither is portable to the
// windows-latest GH runner.
describe.skipIf(process.platform === 'win32')('CF-H-034: tool-tracker.sh registration + privacy tier B', () => {
  it('tool-tracker.sh exists and is executable', () => {
    expect(existsSync(TRACKER)).toBe(true);
    const st = statSync(TRACKER);
    // owner-execute bit
    expect((st.mode & 0o100) !== 0).toBe(true);
  });

  it('settings.json registers tracker on the real events it handles', () => {
    const settings = JSON.parse(readFileSync(SETTINGS, 'utf8'));
    expect(settings.hooks).toBeDefined();
    for (const ev of REQUIRED_EVENTS) {
      const entries = settings.hooks[ev];
      expect(entries, `event ${ev} must be subscribed`).toBeDefined();
      expect(Array.isArray(entries)).toBe(true);
      const cmds = entries.flatMap((e: any) => (e.hooks ?? []).map((h: any) => h.command ?? ''));
      const hasTracker = cmds.some((c: string) => c.includes('tool-tracker.sh'));
      expect(hasTracker, `event ${ev} must invoke tool-tracker.sh`).toBe(true);
    }
  });

  it('reads a stdin payload and writes a tier-B JSONL line keyed on hook_event_name', () => {
    // Sandbox CLAUDE_PROJECT_DIR so the tracker writes there, not real .planning/.
    const sandbox = mkdtempSync(join(tmpdir(), 'tool-tracker-test-'));
    try {
      const payload = JSON.stringify({
        hook_event_name: 'UserPromptSubmit',
        session_id: 'test-session-1234',
        prompt: 'my name is testuser and this is /home/testuser/secret.txt',
      });
      execFileSync('bash', [TRACKER], {
        env: { ...process.env, CLAUDE_PROJECT_DIR: sandbox },
        input: payload,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const dir = join(sandbox, '.planning', 'patterns');
      expect(existsSync(dir)).toBe(true);
      const files = readdirSync(dir).filter((f) => f.startsWith('tool-tracker-') && f.endsWith('.jsonl'));
      expect(files.length).toBeGreaterThan(0);

      const content = readFileSync(join(dir, files[0]), 'utf8').trim();
      const line = content.split('\n').filter(Boolean).pop()!;
      const parsed = JSON.parse(line);

      expect(parsed.event).toBe('UserPromptSubmit');
      expect(parsed.tier).toBe('B');
      // Session id is hashed, NOT the raw value.
      expect(parsed.session_id).toBeDefined();
      expect(parsed.session_id).not.toBe('test-session-1234');
      // The prompt is reduced to a length — its CONTENT never lands in the line.
      expect(typeof parsed.data.prompt_chars).toBe('number');
      expect(line).not.toMatch(/testuser/);
      expect(line).not.toMatch(/\/home\//);
      expect(line).not.toMatch(/secret\.txt/);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('writes nothing on empty stdin and never crashes', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'tool-tracker-empty-'));
    try {
      execFileSync('bash', [TRACKER], {
        env: { ...process.env, CLAUDE_PROJECT_DIR: sandbox },
        input: '',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const dir = join(sandbox, '.planning', 'patterns');
      const files = existsSync(dir)
        ? readdirSync(dir).filter((f) => f.endsWith('.jsonl') && readFileSync(join(dir, f), 'utf8').trim().length > 0)
        : [];
      expect(files.length).toBe(0);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
});
