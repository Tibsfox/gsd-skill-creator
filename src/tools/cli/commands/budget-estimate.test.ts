/**
 * Tests for the budget-estimate CLI command.
 *
 * Covers:
 * - Shows budget estimate for default agent profile (gsd-executor)
 * - Shows budget estimate for specified agent via --agent flag
 * - Returns error for unknown agent with available profiles list
 * - Groups skills by tier correctly
 * - Shows threshold warnings when budget exceeded
 * - Handles empty skills directory gracefully
 * - Uses formatProgressBar for display
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import matter from 'gray-matter';

// Track log messages for assertions
const logMessages: string[] = [];
const logInfoMessages: string[] = [];
const logErrorMessages: string[] = [];

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: {
    message: vi.fn((msg: string) => { logMessages.push(msg); }),
    info: vi.fn((msg: string) => { logInfoMessages.push(msg); }),
    error: vi.fn((msg: string) => { logErrorMessages.push(msg); }),
    warn: vi.fn(),
    success: vi.fn(),
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
let skillsDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'budget-estimate-test-'));
  skillsDir = join(tempDir, 'skills');
  await mkdir(skillsDir, { recursive: true });
  logMessages.length = 0;
  logInfoMessages.length = 0;
  logErrorMessages.length = 0;
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

describe('budgetEstimateCommand', () => {
  // Lazy import to respect mocks
  async function runCommand(options?: Parameters<typeof import('./budget-estimate.js')['budgetEstimateCommand']>[0]) {
    const { budgetEstimateCommand } = await import('./budget-estimate.js');
    return budgetEstimateCommand(options);
  }

  it('shows budget estimate for default agent profile', async () => {
    await createSkill('skill-a', 'First skill', 'body content for skill a');
    await createSkill('skill-b', 'Second skill', 'body content for skill b');
    await createSkill('skill-c', 'Third skill', 'body content for skill c');

    const exitCode = await runCommand({ skillsDir });

    expect(exitCode).toBe(0);
    const allOutput = logMessages.join('\n');
    // Default profile is gsd-executor
    expect(allOutput).toContain('gsd-executor');
    expect(allOutput).toContain('tokens');
  });

  it('shows budget estimate for specified agent', async () => {
    await createSkill('skill-a', 'A skill', 'some body');

    const exitCode = await runCommand({ skillsDir, agent: 'gsd-planner' });

    expect(exitCode).toBe(0);
    const allOutput = logMessages.join('\n');
    expect(allOutput).toContain('gsd-planner');
  });

  it('returns error for unknown agent', async () => {
    const exitCode = await runCommand({ skillsDir, agent: 'nonexistent' });

    expect(exitCode).toBe(1);
    expect(logErrorMessages.some(m => m.includes('nonexistent'))).toBe(true);
    // Should list available profiles
    const allOutput = logMessages.join('\n');
    expect(allOutput).toContain('gsd-executor');
  });

  it('groups skills by tier correctly', async () => {
    // Since default profiles have empty tiers, all skills default to standard.
    // Verify the standard section appears.
    await createSkill('alpha', 'Alpha skill', 'alpha body');
    await createSkill('beta', 'Beta skill', 'beta body');

    const exitCode = await runCommand({ skillsDir });

    expect(exitCode).toBe(0);
    const allOutput = logMessages.join('\n');
    // All skills should be in standard tier (unlisted default to standard)
    expect(allOutput).toContain('Standard (within budget)');
    expect(allOutput).toContain('alpha');
    expect(allOutput).toContain('beta');
  });

  it('shows threshold warnings when budget exceeded', async () => {
    // Use a very small context window to force budget exhaustion
    // gsd-executor budgetPercent = 0.06, so standardBudget = 60 * 0.06 = 3 tokens
    // Any skill will exceed this tiny budget
    await createSkill('big-skill', 'A skill with content', 'This body has enough content to use several tokens easily.');

    const exitCode = await runCommand({
      skillsDir,
      contextWindowSize: 60,  // Tiny context = 3-token standard budget
    });

    expect(exitCode).toBe(0);
    const allOutput = logMessages.join('\n');
    // Should show a threshold warning (budget exceeded at 100%+)
    expect(allOutput).toContain('Threshold Warnings');
  });

  it('handles empty skills directory', async () => {
    const emptyDir = join(tempDir, 'empty-skills');
    await mkdir(emptyDir, { recursive: true });

    const exitCode = await runCommand({ skillsDir: emptyDir });

    expect(exitCode).toBe(0);
    expect(logInfoMessages.some(m => m.includes('No skills found'))).toBe(true);
  });

  it('uses formatProgressBar for display', async () => {
    await createSkill('bar-skill', 'Progress bar test', 'some body content');

    const exitCode = await runCommand({ skillsDir });

    expect(exitCode).toBe(0);
    const allOutput = logMessages.join('\n');
    // formatProgressBar outputs [####....] or [..........] style bars
    expect(allOutput).toMatch(/\[[#.]+\]/);
  });
});
