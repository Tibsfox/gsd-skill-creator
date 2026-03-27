/**
 * Tests for the dashboard CLI command.
 *
 * Covers:
 * - dashboardCommand(['generate']) returns 0 on success
 * - dashboardCommand(['--help']) returns 0
 * - dashboardCommand(['generate', '--output', '/tmp/test']) passes output dir
 * - dashboardCommand([]) defaults to 'generate' subcommand
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
    blue: (s: string) => s,
    gray: (s: string) => s,
  },
}));

// Mock the generator module
vi.mock('../../dashboard/generator.js', () => ({
  generate: vi.fn().mockResolvedValue({
    pages: ['index.html'],
    skipped: [],
    errors: [],
    duration: 42,
  }),
}));

// Track console.log output for help text assertions
const consoleOutput: string[] = [];
const originalLog = console.log;

beforeEach(() => {
  consoleOutput.length = 0;
  console.log = vi.fn((...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(' '));
  });
  vi.clearAllMocks();
});

import { afterAll } from 'vitest';
afterAll(() => {
  console.log = originalLog;
});

describe('dashboardCommand', () => {
  it('returns 0 on generate success', async () => {
    const { dashboardCommand } = await import('./dashboard.js');
    const exitCode = await dashboardCommand(['generate']);
    expect(exitCode).toBe(0);
  });

  it('returns 0 with --help flag', async () => {
    const { dashboardCommand } = await import('./dashboard.js');
    const exitCode = await dashboardCommand(['--help']);
    expect(exitCode).toBe(0);
  });

  it('passes output dir to generator with --output flag', async () => {
    const { generate } = await import('../../dashboard/generator.js');
    const { dashboardCommand } = await import('./dashboard.js');

    await dashboardCommand(['generate', '--output', '/tmp/test-dashboard']);

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        outputDir: '/tmp/test-dashboard',
      }),
    );
  });

  it('defaults to generate subcommand with empty args', async () => {
    const { generate } = await import('../../dashboard/generator.js');
    const { dashboardCommand } = await import('./dashboard.js');

    await dashboardCommand([]);

    expect(generate).toHaveBeenCalled();
  });

  it('passes short -o flag for output', async () => {
    const { generate } = await import('../../dashboard/generator.js');
    const { dashboardCommand } = await import('./dashboard.js');

    await dashboardCommand(['generate', '-o', '/tmp/short-flag']);

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        outputDir: '/tmp/short-flag',
      }),
    );
  });
});
