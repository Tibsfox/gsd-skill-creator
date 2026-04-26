/**
 * CF-H-034 — Tool-tracker registration + privacy-tier-B compliance.
 *
 * Asserts:
 *  1. tool-tracker.sh exists and is executable
 *  2. project-claude/settings.json registers it on PostCompact, FileChanged,
 *     PermissionDenied, SubagentSpawn (the four W1-missed events)
 *  3. The tracker writes a JSONL line (synthetic event in /tmp; never touches
 *     .planning/) with the documented shape
 *  4. The line carries `tier: "B"` and the `data` payload contains no PII
 *     pattern (name=, email=, password=, /Users/<name>, /home/<name>)
 *
 * Closes the test arm of OGA-034.
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

const REQUIRED_EVENTS = ['PostCompact', 'FileChanged', 'PermissionDenied', 'SubagentSpawn'];

describe('CF-H-034: tool-tracker.sh registration + privacy tier B', () => {
  it('tool-tracker.sh exists and is executable', () => {
    expect(existsSync(TRACKER)).toBe(true);
    const st = statSync(TRACKER);
    // owner-execute bit
    expect((st.mode & 0o100) !== 0).toBe(true);
  });

  it('settings.json registers tracker on the 4 W1-missed events', () => {
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

  it('writes a JSONL line with tier B and no PII for synthetic FileChanged', () => {
    // Create a sandboxed CLAUDE_PROJECT_DIR so the tracker writes there, NOT
    // into the real .planning/patterns.
    const sandbox = mkdtempSync(join(tmpdir(), 'tool-tracker-test-'));
    try {
      const env = {
        ...process.env,
        CLAUDE_PROJECT_DIR: sandbox,
        CLAUDE_HOOK_EVENT: 'FileChanged',
        CLAUDE_SESSION_ID: 'test-session-1234',
        CLAUDE_FILE_PATH: '/home/testuser/project/foo.ts',
      };
      execFileSync('bash', [TRACKER], { env, stdio: 'pipe' });

      const dir = join(sandbox, '.planning', 'patterns');
      expect(existsSync(dir)).toBe(true);
      const files = readdirSync(dir).filter((f) => f.startsWith('tool-tracker-') && f.endsWith('.jsonl'));
      expect(files.length).toBeGreaterThan(0);

      const content = readFileSync(join(dir, files[0]), 'utf8').trim();
      expect(content.length).toBeGreaterThan(0);
      const line = content.split('\n').filter(Boolean).pop()!;
      const parsed = JSON.parse(line);

      expect(parsed.event).toBe('FileChanged');
      expect(parsed.tier).toBe('B');
      expect(parsed.session_id).toBeDefined();
      // Hashed session id, NOT the raw value
      expect(parsed.session_id).not.toBe('test-session-1234');
      expect(parsed.data).toBeDefined();

      // Privacy assertions on the entire serialized line
      expect(line).not.toMatch(/name=/);
      expect(line).not.toMatch(/email=/);
      expect(line).not.toMatch(/password=/);
      // Home path should be scrubbed to ~
      expect(line).not.toMatch(/\/home\/testuser/);
      expect(line).not.toMatch(/\/Users\/[^/]+\//);
      // Path should be present but rewritten
      expect(parsed.data.path).toBeDefined();
      expect(parsed.data.path).toMatch(/^~\//);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
});
