/**
 * Tests for `skill-creator activations` CLI command.
 *
 * Deterministic, CI-safe (all 3 OS legs): builds tmpdir fixture transcripts —
 * never reads the real ~/.claude/projects corpus, never writes to the real
 * .claude/skills. Mirrors the tmpdir pattern from amiga.test.ts.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { activationsCommand } from './activations.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const T0 = Date.parse('2026-06-01T10:00:00.000Z');

const tmpdirs: string[] = [];
function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpdirs.push(d);
  return d;
}

afterEach(() => {
  vi.restoreAllMocks();
  while (tmpdirs.length) {
    rmSync(tmpdirs.pop()!, { recursive: true, force: true });
  }
});

/**
 * Write a Claude Code transcript JSONL with:
 * - one Skill tool_use entry (activates skill `skillName`)
 * - one <command-name> user entry (activates skill `commandSkillName`)
 * - one denylisted command entry (should NOT appear in mined skills)
 */
function writeFixtureTranscript(
  dir: string,
  name: string,
  sessionId: string,
  skillName: string,
  commandSkillName: string,
): string {
  const path = join(dir, name);
  const lines = [
    // Source 1: Skill tool_use block inside assistant message.content
    JSON.stringify({
      sessionId,
      timestamp: new Date(T0).toISOString(),
      message: {
        content: [
          { type: 'tool_use', name: 'Skill', input: { skill: skillName } },
        ],
      },
    }),
    // Source 2: <command-name> tag in user string content.
    JSON.stringify({
      sessionId,
      timestamp: new Date(T0 + 1000).toISOString(),
      message: {
        content: `<command-name>${commandSkillName}</command-name>\nsome message text`,
      },
    }),
    // Denylisted slash command — must NOT appear in results.
    JSON.stringify({
      sessionId,
      timestamp: new Date(T0 + 2000).toISOString(),
      message: {
        content: `<command-name>/clear</command-name>\n`,
      },
    }),
  ];
  writeFileSync(path, lines.join('\n') + '\n', 'utf8');
  return path;
}

/** Write a minimal SKILL.md in <skillsDir>/<name>/SKILL.md. */
function writeSkillFile(skillsDir: string, name: string): void {
  const dir = join(skillsDir, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'SKILL.md'),
    `---\nname: ${name}\ndescription: Test skill ${name}\n---\n\n# ${name}\n`,
    'utf8',
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('activationsCommand', () => {
  it('--help returns 0 without touching disk', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(await activationsCommand(['--help'])).toBe(0);
  });

  it('returns 0 with 0 activations when corpus dir is empty or missing', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m?: unknown) => void logs.push(String(m)));
    const missing = join(tmpdir(), 'act-corpus-does-not-exist-xyz');
    const code = await activationsCommand(['--json', '--corpus-dir', missing]);
    expect(code).toBe(0);
    const out = JSON.parse(logs.join('\n'));
    expect(out.sessionsScanned).toBe(0);
    expect(out.skills).toEqual([]);
  });

  it('mines Skill tool_use + command-name, excludes denylist, returns expected counts', async () => {
    const corpus = mkTmp('act-corpus-');
    writeFixtureTranscript(corpus, 's1.jsonl', 'sess-1', 'gsd-workflow', 'gsd-progress');

    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m?: unknown) => void logs.push(String(m)));

    const code = await activationsCommand(['--json', '--corpus-dir', corpus]);
    expect(code).toBe(0);

    const out = JSON.parse(logs.join('\n'));
    expect(out.sessionsScanned).toBe(1);
    expect(out.sessionsWithActivations).toBe(1);

    const names = out.skills.map((s: { name: string }) => s.name);
    expect(names).toContain('gsd-workflow');
    expect(names).toContain('gsd-progress');
    // Denylisted 'clear' must not appear.
    expect(names).not.toContain('clear');

    for (const skill of out.skills as Array<{ name: string; count: number }>) {
      expect(skill.count).toBe(1);
    }
  });

  it('aggregates counts across multiple sessions (session-granularity)', async () => {
    const corpus = mkTmp('act-multi-');
    // Both sessions activate 'gsd-workflow' → count should be 2.
    writeFixtureTranscript(corpus, 's1.jsonl', 'sess-1', 'gsd-workflow', 'gsd-progress');
    writeFixtureTranscript(corpus, 's2.jsonl', 'sess-2', 'gsd-workflow', 'security-hygiene');

    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m?: unknown) => void logs.push(String(m)));

    const code = await activationsCommand(['--json', '--corpus-dir', corpus]);
    expect(code).toBe(0);

    const out = JSON.parse(logs.join('\n'));
    expect(out.sessionsScanned).toBe(2);
    expect(out.sessionsWithActivations).toBe(2);

    const gsd = (out.skills as Array<{ name: string; count: number }>).find(
      (s) => s.name === 'gsd-workflow',
    );
    expect(gsd).toBeDefined();
    expect(gsd!.count).toBe(2);
  });

  it('--write populates .skill-index.json with activationCount', async () => {
    const corpus = mkTmp('act-write-corpus-');
    const skillsDir = mkTmp('act-write-skills-');

    writeFixtureTranscript(corpus, 's1.jsonl', 'sess-1', 'gsd-workflow', 'gsd-progress');
    // gsd-workflow has a SKILL.md; gsd-progress does not → gsd-progress should be unknown.
    writeSkillFile(skillsDir, 'gsd-workflow');

    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m?: unknown) => void logs.push(String(m)));

    const code = await activationsCommand([
      '--write',
      '--json',
      '--corpus-dir', corpus,
      '--skills-dir', skillsDir,
    ]);
    expect(code).toBe(0);

    const out = JSON.parse(logs.join('\n'));
    expect(out.sessionsScanned).toBe(1);
    expect(out.sessionsWithActivations).toBe(1);

    // gsd-workflow was recorded; gsd-progress was not in index → unknown.
    const indexPath = join(skillsDir, '.skill-index.json');
    const raw = JSON.parse(readFileSync(indexPath, 'utf8'));
    const gsdEntry = (raw.entries as Array<Record<string, unknown>>).find(
      (e) => e['name'] === 'gsd-workflow',
    );
    expect(gsdEntry).toBeDefined();
    expect(gsdEntry!['activationCount']).toBe(1);
  });

  it('--write is idempotent (second run same count, no duplication)', async () => {
    const corpus = mkTmp('act-idem-corpus-');
    const skillsDir = mkTmp('act-idem-skills-');

    writeFixtureTranscript(corpus, 's1.jsonl', 'sess-1', 'gsd-workflow', 'gsd-progress');
    writeSkillFile(skillsDir, 'gsd-workflow');

    const runOnce = async () => {
      const logs: string[] = [];
      vi.spyOn(console, 'log').mockImplementation((m?: unknown) => void logs.push(String(m)));
      await activationsCommand([
        '--write', '--json',
        '--corpus-dir', corpus,
        '--skills-dir', skillsDir,
      ]);
      vi.restoreAllMocks();
      return JSON.parse(logs.join('\n'));
    };

    const first = await runOnce();
    const second = await runOnce();

    expect(first.sessionsScanned).toBe(second.sessionsScanned);
    expect(first.skills).toEqual(second.skills);

    // Both runs should produce the same activationCount in the index.
    const indexPath = join(skillsDir, '.skill-index.json');
    const raw = JSON.parse(readFileSync(indexPath, 'utf8'));
    const gsd = (raw.entries as Array<Record<string, unknown>>).find(
      (e) => e['name'] === 'gsd-workflow',
    );
    expect(gsd!['activationCount']).toBe(1);
  });
});
