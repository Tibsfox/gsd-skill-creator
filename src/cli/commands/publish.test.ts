/**
 * publish.test.ts — tests for the requires-critique publish gate
 *
 * Tests the gate that blocks publishing skills with requires-critique: true
 * unless they have a matching converged .critique-status.json sidecar.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';

// ============================================================================
// Hoist mock fns so they're available inside vi.mock factories
// ============================================================================

const { mockReadFile, mockWriteFile, mockMkdir } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn(),
  mockMkdir: vi.fn(),
}));

// ============================================================================
// Mock setup — before imports of the module under test
// ============================================================================

// Mock scope path helper
vi.mock('../../types/scope.js', () => ({
  getSkillsBasePath: vi.fn(() => '/tmp/fake-skills'),
}));

// Mock packSkill so publish doesn't try to create real archives
vi.mock('../../mcp/index.js', () => ({
  packSkill: vi.fn(async (_dir: string, name: string, _out: string) => ({
    name,
    formatVersion: '1.0',
    files: ['SKILL.md'],
  })),
}));

// Mock clack/prompts
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    message: vi.fn(),
  },
}));

// Mock node:fs/promises — only readFile/writeFile/mkdir; keep rest real
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: mockReadFile,
    writeFile: mockWriteFile,
    mkdir: mockMkdir,
  };
});

// Mock SkillStore — tests inject via _store dep, but module must resolve
vi.mock('../../storage/skill-store.js', () => ({
  SkillStore: class MockSkillStore {
    exists = vi.fn(async () => true);
  },
}));

// ============================================================================
// Import after mocks
// ============================================================================

import { publishCommand } from './publish.js';

// ============================================================================
// Helpers
// ============================================================================

const SKILL_BODY = '---\nname: my-skill\nrequires-critique: true\n---\n\n# My Skill\n';
const SKILL_HASH = createHash('sha256').update(SKILL_BODY).digest('hex');

/** Injected store that always reports the skill as existing. */
const fakeStore = { exists: async (_name: string) => true };

function makeStatusJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    lastRun: new Date().toISOString(),
    skillHash: SKILL_HASH,
    status: 'converged',
    findings: 0,
    ...overrides,
  });
}

/** Find the call to writeFile that wrote to a path ending with `suffix`. */
function findWriteCall(suffix: string): unknown[] | undefined {
  const calls = (mockWriteFile as ReturnType<typeof vi.fn>).mock.calls as unknown[][];
  return calls.find((c) => typeof c[0] === 'string' && (c[0] as string).endsWith(suffix));
}

// ============================================================================
// Tests
// ============================================================================

describe('publishCommand — requires-critique gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockMkdir as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockWriteFile as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('1. passes gate when requires-critique is absent (no status file read)', async () => {
    // Skill without requires-critique — critique gate should NOT run.
    // Use mockImplementation to throw ENOENT for any non-SKILL.md path,
    // so the triggering gate also correctly detects no triggering.test.md.
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (path: unknown) => {
      if (typeof path === 'string' && path.endsWith('SKILL.md'))
        return '---\nname: my-skill\n---\n\n# No critique needed\n';
      const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      throw err;
    });

    const code = await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
    });
    expect(code).toBe(0);
  });

  it('2. blocks publish when .critique-status.json is missing', async () => {
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (path: unknown) => {
      if (typeof path === 'string' && path.endsWith('SKILL.md')) return SKILL_BODY;
      const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      throw err;
    });

    const code = await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
    });
    expect(code).toBe(1);
  });

  it('3. blocks publish when critique status is not converged', async () => {
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (path: unknown) => {
      if (typeof path === 'string' && path.endsWith('SKILL.md')) return SKILL_BODY;
      if (typeof path === 'string' && path.endsWith('.critique-status.json'))
        return makeStatusJson({ status: 'max-iterations' });
      throw new Error(`Unexpected read: ${String(path)}`);
    });

    const code = await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
    });
    expect(code).toBe(1);
  });

  it('4. blocks publish when skillHash does not match current SKILL.md content', async () => {
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (path: unknown) => {
      if (typeof path === 'string' && path.endsWith('SKILL.md')) return SKILL_BODY;
      if (typeof path === 'string' && path.endsWith('.critique-status.json'))
        return makeStatusJson({ skillHash: 'a'.repeat(64) });
      throw new Error(`Unexpected read: ${String(path)}`);
    });

    const code = await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
    });
    expect(code).toBe(1);
  });

  it('5. allows publish when status is converged and hash matches', async () => {
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (path: unknown) => {
      if (typeof path === 'string' && path.endsWith('SKILL.md')) return SKILL_BODY;
      if (typeof path === 'string' && path.endsWith('.critique-status.json'))
        return makeStatusJson();
      throw new Error(`Unexpected read: ${String(path)}`);
    });

    const code = await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
    });
    expect(code).toBe(0);
  });

  it('6. --override-critique bypasses gate and writes to overrides.log', async () => {
    // Status file missing — gate would block without override
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (path: unknown) => {
      if (typeof path === 'string' && path.endsWith('SKILL.md')) return SKILL_BODY;
      const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      throw err;
    });

    const code = await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
      overrideCritique: 'Emergency release - approved by team',
    });
    expect(code).toBe(0);

    const writeCall = findWriteCall('overrides.log');
    expect(writeCall).toBeDefined();
  });

  it('7. overrides.log contains skill name, reason, and timestamp', async () => {
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (path: unknown) => {
      if (typeof path === 'string' && path.endsWith('SKILL.md')) return SKILL_BODY;
      const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      throw err;
    });

    const reason = 'Hotfix for production incident';
    await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
      overrideCritique: reason,
    });

    const writeCall = findWriteCall('overrides.log');
    expect(writeCall).toBeDefined();

    const logContent = writeCall![1] as string;
    expect(logContent).toContain('my-skill');
    expect(logContent).toContain(reason);
    // Should have a timestamp (ISO 8601 date pattern)
    expect(logContent).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});

// ============================================================================
// Phase B: triggering gate tests
// ============================================================================

describe('publishCommand — triggering gate (Phase B)', () => {
  // Uses the hoisted mockReadFile / mockWriteFile / mockMkdir declared at the top.
  // findWriteCall is already declared above.

  // A structurally valid triggering.test.md (>=4 sections + 3 rationalization rows)
  const validTriggering = [
    '## Naive Prompt',
    'What should I do?',
    '',
    '## Expected Baseline Failure',
    'Agent guesses.',
    '',
    '## Expected Skill Activation',
    'my-skill activates.',
    '',
    '## Rationalization Table',
    '| Rationalization | Counter |',
    '|---|---|',
    '| a | b |',
    '| c | d |',
    '| e | f |',
  ].join('\n');
  const validTriggeringHash = createHash('sha256').update(validTriggering).digest('hex');

  function makeTriggeringStatus(overrides: Record<string, unknown> = {}): string {
    return JSON.stringify({
      lastRun: new Date().toISOString(),
      skillHash: SKILL_HASH,
      triggeringTestHash: validTriggeringHash,
      status: 'passed',
      naivePrompt: 'What should I do?',
      expectedSkill: 'my-skill',
      actualResponse: 'You should use my-skill',
      passed: true,
      durationMs: 42,
      ...overrides,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    (mockMkdir as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockWriteFile as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('passes publish when triggering.test.md does not exist (gate does not activate)', async () => {
    // No requires-critique, no triggering.test.md — gate is bypassed entirely
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (p: unknown) => {
      if (typeof p === 'string' && p.endsWith('SKILL.md'))
        return '---\nname: my-skill\n---\n\n# No triggering test\n';
      const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      throw err;
    });
    const code = await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
    });
    expect(code).toBe(0);
  });

  it('blocks publish when triggering.test.md exists but structural validation fails', async () => {
    // File present, but only one section → validateTriggeringTestFile fails
    const broken = '## Naive Prompt\nText only — no other required sections.';
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (p: unknown) => {
      if (typeof p === 'string' && p.endsWith('SKILL.md'))
        return '---\nname: my-skill\n---\n\n# body\n';
      if (typeof p === 'string' && p.endsWith('triggering.test.md')) return broken;
      const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      throw err;
    });
    const code = await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
    });
    expect(code).toBe(1);
  });

  it('blocks publish when triggering.test.md is valid but .triggering-status.json is missing', async () => {
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (p: unknown) => {
      if (typeof p === 'string' && p.endsWith('SKILL.md'))
        return '---\nname: my-skill\n---\n\n# body\n';
      if (typeof p === 'string' && p.endsWith('triggering.test.md')) return validTriggering;
      const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      throw err;
    });
    const code = await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
    });
    expect(code).toBe(1);
  });

  it('blocks publish when .triggering-status.json exists but status is not "passed"', async () => {
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (p: unknown) => {
      if (typeof p === 'string' && p.endsWith('SKILL.md'))
        return '---\nname: my-skill\n---\n\n# body\n';
      if (typeof p === 'string' && p.endsWith('triggering.test.md')) return validTriggering;
      if (typeof p === 'string' && p.endsWith('.triggering-status.json'))
        return makeTriggeringStatus({ status: 'failed', passed: false });
      throw new Error(`Unexpected read: ${String(p)}`);
    });
    const code = await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
    });
    expect(code).toBe(1);
  });

  it('blocks publish when triggeringTestHash is stale (content changed since last run)', async () => {
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (p: unknown) => {
      if (typeof p === 'string' && p.endsWith('SKILL.md'))
        return '---\nname: my-skill\n---\n\n# body\n';
      if (typeof p === 'string' && p.endsWith('triggering.test.md')) return validTriggering;
      if (typeof p === 'string' && p.endsWith('.triggering-status.json'))
        return makeTriggeringStatus({ triggeringTestHash: 'b'.repeat(64) });
      throw new Error(`Unexpected read: ${String(p)}`);
    });
    const code = await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
    });
    expect(code).toBe(1);
  });

  it('passes publish on the happy path (valid file + passing status + hash match)', async () => {
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (p: unknown) => {
      if (typeof p === 'string' && p.endsWith('SKILL.md'))
        return '---\nname: my-skill\n---\n\n# body\n';
      if (typeof p === 'string' && p.endsWith('triggering.test.md')) return validTriggering;
      if (typeof p === 'string' && p.endsWith('.triggering-status.json'))
        return makeTriggeringStatus();
      throw new Error(`Unexpected read: ${String(p)}`);
    });
    const code = await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
    });
    expect(code).toBe(0);
  });

  it('passes publish and writes audit entry when overrideTriggering is set', async () => {
    // Structurally invalid triggering.test.md, but override bypasses the gate
    const broken = '## Naive Prompt\nText only.';
    (mockReadFile as ReturnType<typeof vi.fn>).mockImplementation(async (p: unknown) => {
      if (typeof p === 'string' && p.endsWith('SKILL.md'))
        return '---\nname: my-skill\n---\n\n# body\n';
      if (typeof p === 'string' && p.endsWith('triggering.test.md')) return broken;
      const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      throw err;
    });
    const code = await publishCommand('my-skill', {
      skillsDir: '/tmp/fake-skills',
      _store: fakeStore,
      overrideTriggering: 'CI emergency release',
    });
    expect(code).toBe(0);
    const writeCall = findWriteCall('triggering-logs/overrides.log');
    expect(writeCall).toBeDefined();
    const logContent = writeCall![1] as string;
    expect(logContent).toContain('my-skill');
    expect(logContent).toContain('CI emergency release');
  });
});
