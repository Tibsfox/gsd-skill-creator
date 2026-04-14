/**
 * test-triggering.test.ts — unit tests for the test-triggering CLI command.
 *
 * Uses _store and _client DI injection to avoid filesystem and API calls.
 * Tests cover all 12 cases from RESEARCH.md §8.3.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { testTriggeringCommand } from './test-triggering.js';
import type { SubagentClient } from '../../critique/types.js';
import type { CritiqueFinding } from '../../critique/types.js';

// A structurally valid triggering.test.md with all 4 required sections + 3 data rows
const validTriggering = [
  '## Naive Prompt',
  'What should I do?',
  '',
  '## Expected Baseline Failure',
  'Agent guesses.',
  '',
  '## Expected Skill Activation',
  'foo-skill activates.',
  '',
  '## Rationalization Table',
  '| Rationalization | Counter |',
  '|---|---|',
  '| a | b |',
  '| c | d |',
  '| e | f |',
].join('\n');

function makeClient(rawResponse: string): SubagentClient {
  return {
    review: vi.fn(async (_prompt: string, _content: string): Promise<{ findings: CritiqueFinding[]; rawResponse?: string }> => ({
      findings: [],
      rawResponse,
    })),
  };
}

describe('testTriggeringCommand', () => {
  let tmp: string;
  let skillsDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tmp = await mkdtemp(join(tmpdir(), 'tt-'));
    skillsDir = join(tmp, 'skills');
    await mkdir(join(skillsDir, 'foo-skill'), { recursive: true });
    await writeFile(join(skillsDir, 'foo-skill', 'SKILL.md'), '---\nname: foo-skill\n---\nbody');
    // Set cwd to tmp so .local/triggering-logs lands inside the temp dir
    process.chdir(tmp);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tmp, { recursive: true, force: true });
  });

  it('returns 1 and shows help when skillName is undefined', async () => {
    const code = await testTriggeringCommand(undefined, { skillsDir });
    expect(code).toBe(1);
  });

  it('returns 1 when skill does not exist', async () => {
    const code = await testTriggeringCommand('nonexistent', {
      skillsDir,
      _store: { exists: async () => false },
    });
    expect(code).toBe(1);
  });

  it('returns 1 when triggering.test.md is missing', async () => {
    const code = await testTriggeringCommand('foo-skill', {
      skillsDir,
      _store: { exists: async () => true },
    });
    expect(code).toBe(1);
  });

  it('returns 1 when triggering.test.md has structural errors', async () => {
    await writeFile(join(skillsDir, 'foo-skill', 'triggering.test.md'), '## Naive Prompt\nText only');
    const code = await testTriggeringCommand('foo-skill', {
      skillsDir,
      _store: { exists: async () => true },
    });
    expect(code).toBe(1);
  });

  it('returns 0 when scripted response contains expected skill name', async () => {
    await writeFile(join(skillsDir, 'foo-skill', 'triggering.test.md'), validTriggering);
    const code = await testTriggeringCommand('foo-skill', {
      skillsDir,
      _store: { exists: async () => true },
      _client: makeClient('You should use foo-skill for this.'),
    });
    expect(code).toBe(0);
  });

  it('returns 1 when scripted response does not contain expected skill name', async () => {
    await writeFile(join(skillsDir, 'foo-skill', 'triggering.test.md'), validTriggering);
    const code = await testTriggeringCommand('foo-skill', {
      skillsDir,
      _store: { exists: async () => true },
      _client: makeClient('Try bar-skill instead.'),
    });
    expect(code).toBe(1);
  });

  it('writes .triggering-status.json on pass with all required fields', async () => {
    await writeFile(join(skillsDir, 'foo-skill', 'triggering.test.md'), validTriggering);
    await testTriggeringCommand('foo-skill', {
      skillsDir,
      _store: { exists: async () => true },
      _client: makeClient('foo-skill'),
    });
    const raw = await readFile(join(skillsDir, 'foo-skill', '.triggering-status.json'), 'utf8');
    const status = JSON.parse(raw) as Record<string, unknown>;
    expect(status.status).toBe('passed');
    expect(status.triggeringTestHash).toBeDefined();
    expect(typeof status.triggeringTestHash).toBe('string');
    expect(status.passed).toBe(true);
  });

  it('writes .triggering-status.json on fail with status=failed', async () => {
    await writeFile(join(skillsDir, 'foo-skill', 'triggering.test.md'), validTriggering);
    await testTriggeringCommand('foo-skill', {
      skillsDir,
      _store: { exists: async () => true },
      _client: makeClient('something else entirely'),
    });
    const raw = await readFile(join(skillsDir, 'foo-skill', '.triggering-status.json'), 'utf8');
    const status = JSON.parse(raw) as Record<string, unknown>;
    expect(status.status).toBe('failed');
    expect(status.passed).toBe(false);
  });

  it('writes log entry to .local/triggering-logs/', async () => {
    await writeFile(join(skillsDir, 'foo-skill', 'triggering.test.md'), validTriggering);
    await testTriggeringCommand('foo-skill', {
      skillsDir,
      _store: { exists: async () => true },
      _client: makeClient('foo-skill'),
    });
    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(join(tmp, '.local', 'triggering-logs'));
    expect(entries.some((e) => e.startsWith('foo-skill-'))).toBe(true);
  });

  it('uses cache on second run with same triggering hash (no client call on second run)', async () => {
    await writeFile(join(skillsDir, 'foo-skill', 'triggering.test.md'), validTriggering);
    const client = makeClient('foo-skill');
    // First run — calls the client
    await testTriggeringCommand('foo-skill', {
      skillsDir,
      _store: { exists: async () => true },
      _client: client,
    });
    // Second run with same file — should hit cache
    await testTriggeringCommand('foo-skill', {
      skillsDir,
      _store: { exists: async () => true },
      _client: client,
    });
    // review() should only have been called once (second run was cached)
    expect((client.review as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });

  it('bypasses cache when triggering content changes (different hash)', async () => {
    await writeFile(join(skillsDir, 'foo-skill', 'triggering.test.md'), validTriggering);
    const client = makeClient('foo-skill');
    await testTriggeringCommand('foo-skill', {
      skillsDir,
      _store: { exists: async () => true },
      _client: client,
    });
    // Change the file — different hash → cache miss
    await writeFile(
      join(skillsDir, 'foo-skill', 'triggering.test.md'),
      validTriggering + '\n\n## Notes\nAdded after first run.',
    );
    await testTriggeringCommand('foo-skill', {
      skillsDir,
      _store: { exists: async () => true },
      _client: client,
    });
    // review() should have been called twice
    expect((client.review as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });

  it('records override reason to overrides.log when --override-triggering is set', async () => {
    await writeFile(join(skillsDir, 'foo-skill', 'triggering.test.md'), validTriggering);
    const code = await testTriggeringCommand('foo-skill', {
      skillsDir,
      _store: { exists: async () => true },
      overrideTriggering: 'tests in CI override',
    });
    expect(code).toBe(0);
    const logPath = join(tmp, '.local', 'triggering-logs', 'overrides.log');
    const log = await readFile(logPath, 'utf8');
    expect(log).toContain('foo-skill');
    expect(log).toContain('tests in CI override');
  });
});
