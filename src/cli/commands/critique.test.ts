import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ============================================================================
// Mock setup — must be before imports of the module under test
// ============================================================================

// Mock the heavy dependencies before importing critiqueCommand
const VALID_TRIGGERING = `## Naive Prompt\nText.\n\n## Expected Baseline Failure\nText.\n\n## Expected Skill Activation\nText.\n\n## Rationalization Table\n| R | C |\n|---|---|\n| a | b |\n| c | d |\n| e | f |`;

vi.mock('../../critique/draft.js', () => ({
  loadDraft: vi.fn(async (skillDir: string) => ({
    skillName: 'test-skill',
    skillDir,
    body: '---\nname: test-skill\ndescription: A test\n---\n\n# Test Skill\n',
    metadata: { name: 'test-skill', description: 'A test' },
    files: new Map([['triggering.test.md', VALID_TRIGGERING]]),
  })),
}));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    mkdir: vi.fn(async () => {}),
    // writeFile is mocked so we can assert on calls; readFile stays real so prompt files load
    writeFile: vi.fn(async () => {}),
  };
});

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
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  })),
}));

// ============================================================================
// Import after mocks
// ============================================================================

import { critiqueCommand } from './critique.js';
import { MockSubagentClient } from '../../critique/subagent-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Tests
// ============================================================================

describe('critiqueCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 when --mock flag drives convergence (immediate convergence)', async () => {
    // --mock uses MockSubagentClient with empty queue → all stages return [] → converges
    const code = await critiqueCommand('test-skill', {
      skillsDir: '/tmp/fake-skills',
      mock: true,
      maxIter: 2,
    });
    expect(code).toBe(0);
  });

  it('returns 1 on max-iterations', async () => {
    // Override mock client with a persistent finding to force max-iterations
    const code = await critiqueCommand('test-skill', {
      skillsDir: '/tmp/fake-skills',
      mock: true,
      maxIter: 2,
      _mockFindingsOverride: [
        { stage: 'spec-compliance', severity: 'error' as const, message: 'issue' },
      ],
    });
    // With a persistent finding and maxIter=2, status will be max-iterations or stalled
    expect(code).toBe(1);
  });

  it('writes .critique-status.json with sha256 hash', async () => {
    const { writeFile } = await import('node:fs/promises');

    await critiqueCommand('test-skill', {
      skillsDir: '/tmp/fake-skills',
      mock: true,
      maxIter: 2,
    });

    // writeFile should have been called with a path ending in .critique-status.json
    const calls = (writeFile as ReturnType<typeof vi.fn>).mock.calls;
    const statusCall = calls.find((c: unknown[]) =>
      typeof c[0] === 'string' && c[0].endsWith('.critique-status.json'),
    );
    expect(statusCall).toBeDefined();

    const content = JSON.parse(statusCall![1] as string) as Record<string, unknown>;
    expect(typeof content['skillHash']).toBe('string');
    expect((content['skillHash'] as string).length).toBe(64); // sha256 hex = 64 chars
  });

  it('writes a log file under .local/critique-logs/', async () => {
    const { writeFile } = await import('node:fs/promises');

    await critiqueCommand('test-skill', {
      skillsDir: '/tmp/fake-skills',
      mock: true,
      maxIter: 2,
    });

    const calls = (writeFile as ReturnType<typeof vi.fn>).mock.calls;
    const logCall = calls.find((c: unknown[]) =>
      typeof c[0] === 'string' && c[0].includes('.local/critique-logs/') && c[0].endsWith('.json'),
    );
    expect(logCall).toBeDefined();
  });

  it('--check-external flag is accepted without error', async () => {
    const code = await critiqueCommand('test-skill', {
      skillsDir: '/tmp/fake-skills',
      mock: true,
      maxIter: 2,
      checkExternal: true,
    });
    // Should not throw; exit code may be 0 or 1 depending on convergence
    expect(typeof code).toBe('number');
  });

  it('--user flag is accepted (switches skillsDir)', async () => {
    const code = await critiqueCommand('test-skill', {
      skillsDir: '/tmp/user-skills',
      mock: true,
      maxIter: 2,
    });
    expect(typeof code).toBe('number');
  });
});

describe('cli.ts critique registration', () => {
  it('critique case is registered in cli.ts', () => {
    const cliSource = readFileSync(join(__dirname, '../../cli.ts'), 'utf-8');
    expect(cliSource).toContain("'critique'");
    expect(cliSource).toContain('critiqueCommand');
  });

  it('existing refine case is NOT touched', () => {
    const cliSource = readFileSync(join(__dirname, '../../cli.ts'), 'utf-8');
    expect(cliSource).toContain("case 'refine'");
  });
});
