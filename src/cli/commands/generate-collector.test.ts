/**
 * Integration tests for the generate-collector CLI command.
 *
 * Covers:
 * - generates a collector agent file in output directory
 * - returns exit code 1 when missing required args
 * - generated file has correct frontmatter fields
 * - generated file contains only read-only tools
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Track log messages for assertions
const logMessages: string[] = [];
const logErrorMessages: string[] = [];
const logSuccessMessages: string[] = [];
const logWarnMessages: string[] = [];

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: {
    message: vi.fn((msg: string) => { logMessages.push(msg); }),
    info: vi.fn(),
    error: vi.fn((msg: string) => { logErrorMessages.push(msg); }),
    warn: vi.fn((msg: string) => { logWarnMessages.push(msg); }),
    success: vi.fn((msg: string) => { logSuccessMessages.push(msg); }),
  },
}));

vi.mock('picocolors', () => ({
  default: {
    bgCyan: (s: string) => s,
    black: (s: string) => s,
    bold: (s: string) => s,
    dim: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    cyan: (s: string) => s,
    white: (s: string) => s,
  },
}));

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'generate-collector-test-'));
  logMessages.length = 0;
  logErrorMessages.length = 0;
  logSuccessMessages.length = 0;
  logWarnMessages.length = 0;
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(tempDir, { recursive: true, force: true });
});

describe('generateCollectorCommand', () => {
  async function runCommand(args: string[], options?: Record<string, unknown>) {
    const { generateCollectorCommand } = await import('./generate-collector.js');
    return generateCollectorCommand(args, options ?? { outputDir: tempDir });
  }

  it('generates a collector agent file in output directory', async () => {
    const exitCode = await runCommand([
      'codebase-scanner',
      'Scan codebase for patterns',
      'Gather structural information about the codebase',
    ]);

    expect(exitCode).toBe(0);

    const filePath = join(tempDir, 'codebase-scanner.md');
    expect(existsSync(filePath)).toBe(true);

    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('codebase-scanner');
    expect(content).toContain('Scan codebase for patterns');
    expect(logSuccessMessages.some(m => m.includes('codebase-scanner'))).toBe(true);
  });

  it('returns exit code 1 when missing required args', async () => {
    const exitCode = await runCommand([]);

    expect(exitCode).toBe(1);
    expect(logErrorMessages.some(m => m.includes('Usage'))).toBe(true);
  });

  it('returns exit code 1 when only name provided', async () => {
    const exitCode = await runCommand(['my-agent']);

    expect(exitCode).toBe(1);
    expect(logErrorMessages.some(m => m.includes('Usage'))).toBe(true);
  });

  it('generated file has correct frontmatter fields', async () => {
    await runCommand([
      'file-analyzer',
      'Analyze file structures',
      'Gather file metadata and structure information',
    ]);

    const filePath = join(tempDir, 'file-analyzer.md');
    const content = await readFile(filePath, 'utf-8');

    // Check frontmatter format
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('name: file-analyzer');
    expect(content).toContain('description: "Analyze file structures"');
    expect(content).toContain('tools: Read, Glob, Grep, WebFetch');
    expect(content).toMatch(/---\n\n/);
  });

  it('generated file contains only read-only tools', async () => {
    await runCommand([
      'test-collector',
      'Collect test info',
      'Gather test coverage data',
    ]);

    const filePath = join(tempDir, 'test-collector.md');
    const content = await readFile(filePath, 'utf-8');

    // Should have read-only tools
    expect(content).toContain('Read, Glob, Grep, WebFetch');

    // Should NOT have write tools
    expect(content).not.toContain('Write');
    expect(content).not.toContain('Bash');
    expect(content).not.toContain('Edit');
  });

  it('generated file contains gathering steps and output format', async () => {
    await runCommand([
      'pattern-finder',
      'Find code patterns',
      'Discover recurring patterns in source code',
    ]);

    const filePath = join(tempDir, 'pattern-finder.md');
    const content = await readFile(filePath, 'utf-8');

    // Body content
    expect(content).toContain('Discover recurring patterns in source code');
    expect(content).toContain('## Gathering Steps');
    expect(content).toContain('## Output Format');
  });
});
