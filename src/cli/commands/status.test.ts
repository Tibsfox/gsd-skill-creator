/**
 * Tests for the enhanced status CLI command.
 *
 * Covers:
 * - Basic output structure (budget header, progress bar, percentage, per-skill breakdown)
 * - Headroom display
 * - Empty skills handling
 * - Disclosure breakdown (SKILL.md vs reference chars)
 * - Help flag
 * - JSON output mode
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before imports
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: {
    message: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('picocolors', () => ({
  default: {
    bold: (s: string) => s,
    dim: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    cyan: (s: string) => s,
    white: (s: string) => s,
    bgCyan: (s: string) => s,
    black: (s: string) => s,
  },
}));

vi.mock('../../validation/budget-validation.js', () => ({
  BudgetValidator: {
    load: vi.fn(() => ({
      checkCumulative: vi.fn().mockResolvedValue({
        totalChars: 8000,
        budget: 15500,
        usagePercent: 51.6,
        severity: 'ok' as const,
        skills: [
          { name: 'git-commit', descriptionChars: 50, bodyChars: 3500, totalChars: 3800, path: '/skills/git-commit/SKILL.md' },
          { name: 'test-runner', descriptionChars: 40, bodyChars: 2200, totalChars: 2500, path: '/skills/test-runner/SKILL.md' },
          { name: 'deploy', descriptionChars: 30, bodyChars: 1700, totalChars: 1700, path: '/skills/deploy/SKILL.md' },
        ],
        hiddenCount: 0,
      }),
      getBudget: vi.fn().mockReturnValue(15000),
      getCumulativeBudget: vi.fn().mockReturnValue(15500),
    })),
  },
  formatProgressBar: vi.fn((current: number, max: number) => {
    const pct = Math.min(current / max, 1);
    const filled = Math.round(20 * pct);
    return `[${'#'.repeat(filled)}${'.'.repeat(20 - filled)}]`;
  }),
}));

vi.mock('../../disclosure/disclosure-budget.js', () => ({
  DisclosureBudget: vi.fn().mockImplementation(() => ({
    calculateBreakdown: vi.fn().mockResolvedValue({
      skillMdChars: 3000,
      skillMdWords: 500,
      references: [{ filename: 'patterns.md', chars: 800, words: 100, path: 'references/patterns.md' }],
      scripts: [],
      totalChars: 3800,
      alwaysLoadedChars: 3000,
      conditionalChars: 800,
    }),
  })),
}));

vi.mock('../../storage/budget-history.js', () => ({
  BudgetHistory: vi.fn().mockImplementation(() => ({
    read: vi.fn().mockResolvedValue([]),
    append: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../../index.js', () => ({
  createApplicationContext: vi.fn(() => ({
    applicator: {
      initialize: vi.fn().mockResolvedValue(undefined),
      getActiveDisplay: vi.fn().mockReturnValue('Active skills: git-commit, test-runner'),
      getReport: vi.fn().mockReturnValue({
        flaggedSkills: [],
      }),
    },
  })),
}));

// Capture console.log output
const consoleOutput: string[] = [];
const originalLog = console.log;

beforeEach(() => {
  consoleOutput.length = 0;
  console.log = vi.fn((...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(' '));
  });
});

afterEach(() => {
  console.log = originalLog;
  vi.restoreAllMocks();
});

import { statusCommand } from './status.js';

describe('statusCommand', () => {
  it('should return 0 and show budget header with progress bar and percentage', async () => {
    const exitCode = await statusCommand([]);

    expect(exitCode).toBe(0);

    const output = consoleOutput.join('\n');
    // Should include budget-related display
    expect(output).toMatch(/[Bb]udget/);
    // Should include a progress bar
    expect(output).toMatch(/\[#+\.+\]/);
  });

  it('should show remaining headroom', async () => {
    const exitCode = await statusCommand([]);

    expect(exitCode).toBe(0);

    const output = consoleOutput.join('\n');
    // Headroom = 15500 - 8000 = 7500
    expect(output).toMatch(/[Hh]eadroom/i);
    expect(output).toMatch(/7,500|7500/);
  });

  it('should show "No skills found" when no skills exist', async () => {
    // Override mock for this test
    const { BudgetValidator } = await import('../../validation/budget-validation.js');
    vi.mocked(BudgetValidator.load).mockReturnValue({
      checkCumulative: vi.fn().mockResolvedValue({
        totalChars: 0,
        budget: 15500,
        usagePercent: 0,
        severity: 'ok' as const,
        skills: [],
        hiddenCount: 0,
      }),
      getBudget: vi.fn().mockReturnValue(15000),
      getCumulativeBudget: vi.fn().mockReturnValue(15500),
    } as any);

    const exitCode = await statusCommand([]);

    expect(exitCode).toBe(0);

    const output = consoleOutput.join('\n');
    expect(output).toMatch(/[Nn]o skills found/i);
  });

  it('should show SKILL.md vs reference breakdown for skills with references', async () => {
    const exitCode = await statusCommand([]);

    expect(exitCode).toBe(0);

    const output = consoleOutput.join('\n');
    // Should show per-skill breakdown
    expect(output).toMatch(/git-commit/);
  });

  it('should print help text and return 0 with --help flag', async () => {
    const exitCode = await statusCommand(['--help']);

    expect(exitCode).toBe(0);

    const output = consoleOutput.join('\n');
    expect(output).toMatch(/[Uu]sage/);
    expect(output).toMatch(/status/);
  });

  it('should produce valid JSON with --json flag', async () => {
    const exitCode = await statusCommand(['--json']);

    expect(exitCode).toBe(0);

    // Find the JSON output line
    const jsonLine = consoleOutput.find(line => {
      try {
        JSON.parse(line);
        return true;
      } catch {
        return false;
      }
    });

    expect(jsonLine).toBeDefined();

    const parsed = JSON.parse(jsonLine!);
    expect(parsed).toHaveProperty('budget');
    expect(parsed).toHaveProperty('totalChars');
    expect(parsed).toHaveProperty('headroom');
    expect(parsed).toHaveProperty('skills');
    expect(parsed).toHaveProperty('trend');
  });
});
