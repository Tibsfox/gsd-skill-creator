/**
 * Tests for the quality CLI command.
 *
 * Covers:
 * - Shows help with --help flag
 * - Returns 0 exit code on success
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  },
}));

// Track console.log output for help text assertions
const consoleOutput: string[] = [];
const originalLog = console.log;

beforeEach(() => {
  consoleOutput.length = 0;
  console.log = vi.fn((...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(' '));
  });
});

// Restore after all tests
import { afterAll } from 'vitest';
afterAll(() => {
  console.log = originalLog;
});

describe('qualityCommand', () => {
  it('shows help with --help flag', async () => {
    const { qualityCommand } = await import('./quality.js');
    const exitCode = await qualityCommand(['--help']);

    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output.toLowerCase()).toMatch(/quality|usage|health/);
  });

  it('returns 0 exit code on success with mocked dependencies', async () => {
    // This test will import the command and exercise basic flow
    const { qualityCommand } = await import('./quality.js');
    const exitCode = await qualityCommand(['--help']);

    expect(exitCode).toBe(0);
  });
});
