/**
 * Tests for the capabilities CLI command.
 *
 * Covers:
 * - generate subcommand writes CAPABILITIES.md to output dir
 * - generate produces deterministic output
 * - show subcommand prints summary to terminal
 * - returns error for unknown subcommand
 * - handles missing directories gracefully
 * - default subcommand is show
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import matter from 'gray-matter';

// Track log messages for assertions
const logMessages: string[] = [];
const logInfoMessages: string[] = [];
const logErrorMessages: string[] = [];
const logSuccessMessages: string[] = [];

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: {
    message: vi.fn((msg: string) => { logMessages.push(msg); }),
    info: vi.fn((msg: string) => { logInfoMessages.push(msg); }),
    error: vi.fn((msg: string) => { logErrorMessages.push(msg); }),
    warn: vi.fn(),
    success: vi.fn((msg: string) => { logSuccessMessages.push(msg); }),
  },
}));

vi.mock('picocolors', () => ({
  default: {
    bgCyan: (s: string) => s,
    black: (s: string) => s,
    bold: (s: string) => s,
    dim: (s: string) => s,
    red: (s: string) => `[red]${s}[/red]`,
    yellow: (s: string) => `[yellow]${s}[/yellow]`,
    green: (s: string) => `[green]${s}[/green]`,
    cyan: (s: string) => `[cyan]${s}[/cyan]`,
    white: (s: string) => s,
  },
}));

let tempDir: string;
let outputDir: string;
let skillsDir: string;
let agentsDir: string;
let teamsDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'capabilities-test-'));
  outputDir = join(tempDir, 'output');
  skillsDir = join(tempDir, 'skills');
  agentsDir = join(tempDir, 'agents');
  teamsDir = join(tempDir, 'teams');
  await mkdir(outputDir, { recursive: true });
  await mkdir(skillsDir, { recursive: true });
  await mkdir(agentsDir, { recursive: true });
  await mkdir(teamsDir, { recursive: true });
  logMessages.length = 0;
  logInfoMessages.length = 0;
  logErrorMessages.length = 0;
  logSuccessMessages.length = 0;
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(tempDir, { recursive: true, force: true });
});

/** Helper: create a skill directory with SKILL.md */
async function createSkill(name: string, description: string, body: string): Promise<void> {
  const skillDir = join(skillsDir, name);
  await mkdir(skillDir, { recursive: true });
  const content = matter.stringify(body, { name, description });
  await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');
}

/** Helper: create an agent .md file with frontmatter */
async function createAgent(name: string, description: string): Promise<void> {
  const content = matter.stringify(`Agent instructions for ${name}.`, {
    name,
    description,
  });
  await writeFile(join(agentsDir, `${name}.md`), content, 'utf-8');
}

function makeOptions() {
  return {
    outputDir,
    skillsDirs: [{ scope: 'project' as const, dir: skillsDir }],
    agentDirs: [{ scope: 'project' as const, dir: agentsDir }],
    teamDirs: [{ scope: 'project' as const, dir: teamsDir }],
  };
}

describe('capabilitiesCommand', () => {
  // Lazy import to respect mocks
  async function runCommand(args: string[], options?: Record<string, unknown>) {
    const { capabilitiesCommand } = await import('./capabilities.js');
    return capabilitiesCommand(args, options ?? makeOptions());
  }

  it('generate subcommand writes CAPABILITIES.md to output dir', async () => {
    await createSkill('my-skill', 'A test skill', 'body content for my-skill');
    await createAgent('test-agent', 'A test agent');

    const exitCode = await runCommand(['generate'], makeOptions());

    expect(exitCode).toBe(0);
    const capFile = join(outputDir, 'CAPABILITIES.md');
    expect(existsSync(capFile)).toBe(true);

    const content = await readFile(capFile, 'utf-8');
    const parsed = matter(content);
    expect(parsed.data.version).toBe(1);
    expect(content).toContain('my-skill');
  });

  it('generate produces deterministic output', async () => {
    await createSkill('det-skill', 'Determinism test', 'stable body');

    const opts = makeOptions();
    const { capabilitiesCommand } = await import('./capabilities.js');

    await capabilitiesCommand(['generate'], opts);
    const first = await readFile(join(outputDir, 'CAPABILITIES.md'), 'utf-8');

    await capabilitiesCommand(['generate'], opts);
    const second = await readFile(join(outputDir, 'CAPABILITIES.md'), 'utf-8');

    // Content hash in frontmatter should be identical
    const firstParsed = matter(first);
    const secondParsed = matter(second);
    expect(firstParsed.data.contentHash).toBe(secondParsed.data.contentHash);
  });

  it('show subcommand prints summary to terminal', async () => {
    await createSkill('show-skill', 'Show test', 'body');
    await createAgent('show-agent', 'Show agent test');

    const exitCode = await runCommand(['show'], makeOptions());

    expect(exitCode).toBe(0);
    const allOutput = [...logMessages, ...logInfoMessages, ...logSuccessMessages].join('\n');
    expect(allOutput).toContain('Skills:');
    expect(allOutput).toContain('Agents:');
    expect(allOutput).toContain('Teams:');
  });

  it('returns error for unknown subcommand', async () => {
    const exitCode = await runCommand(['unknown'], makeOptions());

    expect(exitCode).toBe(1);
    expect(logErrorMessages.some(m => m.includes('unknown'))).toBe(true);
  });

  it('handles missing directories gracefully', async () => {
    const missingOpts = {
      outputDir,
      skillsDirs: [{ scope: 'project' as const, dir: join(tempDir, 'nonexistent-skills') }],
      agentDirs: [{ scope: 'project' as const, dir: join(tempDir, 'nonexistent-agents') }],
      teamDirs: [{ scope: 'project' as const, dir: join(tempDir, 'nonexistent-teams') }],
    };

    const exitCode = await runCommand(['generate'], missingOpts);

    expect(exitCode).toBe(0);
    const capFile = join(outputDir, 'CAPABILITIES.md');
    expect(existsSync(capFile)).toBe(true);

    const content = await readFile(capFile, 'utf-8');
    const parsed = matter(content);
    expect(parsed.data.version).toBe(1);
  });

  it('default subcommand is show', async () => {
    await createSkill('default-skill', 'Default test', 'body');

    const exitCode = await runCommand([], makeOptions());

    expect(exitCode).toBe(0);
    const allOutput = [...logMessages, ...logInfoMessages, ...logSuccessMessages].join('\n');
    expect(allOutput).toContain('Skills:');
  });
});
