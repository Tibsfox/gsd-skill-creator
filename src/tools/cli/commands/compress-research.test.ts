/**
 * Integration tests for the compress-research CLI command.
 *
 * Covers:
 * - compresses a research file and writes to skills directory
 * - dry-run mode shows output without writing files
 * - skips writing when manual skill with same name exists
 * - overwrites existing auto-generated skill
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import matter from 'gray-matter';

// Track log messages for assertions
const logMessages: string[] = [];
const logWarnMessages: string[] = [];
const logSuccessMessages: string[] = [];
const logErrorMessages: string[] = [];

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
let skillsDir: string;
let researchDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'compress-research-test-'));
  skillsDir = join(tempDir, 'skills');
  researchDir = join(tempDir, 'research');
  await mkdir(skillsDir, { recursive: true });
  await mkdir(researchDir, { recursive: true });
  logMessages.length = 0;
  logWarnMessages.length = 0;
  logSuccessMessages.length = 0;
  logErrorMessages.length = 0;
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(tempDir, { recursive: true, force: true });
});

/** Helper: create a mock research file with enough content for compression */
function createResearchContent(): string {
  return `---
title: Cache Ordering Research
---

# Cache Ordering Strategies

## Key Findings

- Static skills should be cached first for maximum prompt cache hits
- Session skills change per-conversation and belong in the middle tier
- Dynamic skills (context-dependent) should always be last

## Recommendations

- Use three-tier ordering: static > session > dynamic
- Avoid reordering within the same tier to maintain cache coherence
- Measure cache hit rates after deployment to validate ordering

## Architecture

The cache ordering pipeline stage runs after scoring and before loading.
It reorders skills within the pipeline context to optimize for prompt
caching behavior observed in Claude Code.

## Patterns

- Observer pattern for monitoring cache hit rates
- Strategy pattern for swappable tier assignment logic

## Implementation Details

This section has lots of prose that should be truncated during compression.
The implementation uses a simple sort comparator that assigns numeric values
to each cache tier and sorts ascending. Static gets 0, session gets 1, and
dynamic gets 2. This ensures deterministic ordering regardless of input order.

## See also

See also: Phase 57 planning documents
`;
}

describe('compressResearchCommand', () => {
  async function runCommand(args: string[], options?: Record<string, unknown>) {
    const { compressResearchCommand } = await import('./compress-research.js');
    return compressResearchCommand(args, options ?? { skillsDir });
  }

  it('compresses a research file and writes to skills directory', async () => {
    const researchPath = join(researchDir, '57-cache-ordering', 'research.md');
    await mkdir(join(researchDir, '57-cache-ordering'), { recursive: true });
    await writeFile(researchPath, createResearchContent(), 'utf-8');

    const exitCode = await runCommand([researchPath], { skillsDir });

    expect(exitCode).toBe(0);

    // Check that a skill was written
    const skillName = 'research-cache-ordering-compressed';
    const skillPath = join(skillsDir, skillName, 'SKILL.md');
    expect(existsSync(skillPath)).toBe(true);

    // Parse and verify metadata
    const content = await readFile(skillPath, 'utf-8');
    const parsed = matter(content);
    expect(parsed.data.name).toBe(skillName);
    expect(parsed.data.description).toContain('Cache Ordering');

    // Verify success message was printed
    expect(logSuccessMessages.some(m => m.includes(skillName))).toBe(true);
  });

  it('dry-run mode shows output without writing files', async () => {
    const researchPath = join(researchDir, 'test-research.md');
    await writeFile(researchPath, createResearchContent(), 'utf-8');

    const exitCode = await runCommand([researchPath, '--dry-run'], { skillsDir });

    expect(exitCode).toBe(0);

    // No skill file should be written
    const skillName = 'research-test-research-compressed';
    const skillPath = join(skillsDir, skillName, 'SKILL.md');
    expect(existsSync(skillPath)).toBe(false);

    // Should show compression summary in output
    const allOutput = logMessages.join('\n');
    expect(allOutput).toContain('Compression Summary');
  });

  it('skips writing when manual skill with same name exists', async () => {
    // Create a manual skill first (no source: 'auto-generated')
    const skillName = 'research-cache-ordering-compressed';
    const skillDir = join(skillsDir, skillName);
    await mkdir(skillDir, { recursive: true });
    const manualContent = matter.stringify('Manual skill content', {
      name: skillName,
      description: 'A manually created skill',
    });
    await writeFile(join(skillDir, 'SKILL.md'), manualContent, 'utf-8');

    // Now try to compress research with same derived name
    const researchPath = join(researchDir, '57-cache-ordering', 'research.md');
    await mkdir(join(researchDir, '57-cache-ordering'), { recursive: true });
    await writeFile(researchPath, createResearchContent(), 'utf-8');

    const exitCode = await runCommand([researchPath], { skillsDir });

    expect(exitCode).toBe(0);

    // Original manual content should be preserved
    const content = await readFile(join(skillDir, 'SKILL.md'), 'utf-8');
    expect(content).toContain('Manual skill content');

    // Should warn about manual skill
    expect(logWarnMessages.some(m => m.includes('manual'))).toBe(true);
  });

  it('overwrites existing auto-generated skill', async () => {
    // Create an auto-generated skill first
    const skillName = 'research-cache-ordering-compressed';
    const skillDir = join(skillsDir, skillName);
    await mkdir(skillDir, { recursive: true });
    const autoContent = matter.stringify('Old auto content', {
      name: skillName,
      description: 'Auto-generated skill',
      source: 'auto-generated',
      metadata: {
        extensions: {
          'gsd-skill-creator': {
            enabled: true,
            version: 1,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        },
      },
    });
    await writeFile(join(skillDir, 'SKILL.md'), autoContent, 'utf-8');

    // Compress research which derives the same skill name
    const researchPath = join(researchDir, '57-cache-ordering', 'research.md');
    await mkdir(join(researchDir, '57-cache-ordering'), { recursive: true });
    await writeFile(researchPath, createResearchContent(), 'utf-8');

    const exitCode = await runCommand([researchPath], { skillsDir });

    expect(exitCode).toBe(0);

    // Content should be updated (not old auto content)
    const content = await readFile(join(skillDir, 'SKILL.md'), 'utf-8');
    expect(content).not.toContain('Old auto content');

    // Should contain compressed content with Key Findings
    expect(content).toContain('Key Findings');
    expect(logSuccessMessages.some(m => m.includes(skillName))).toBe(true);
  });

  it('returns error when no file argument provided', async () => {
    const exitCode = await runCommand([]);

    expect(exitCode).toBe(1);
    expect(logErrorMessages.some(m => m.includes('Usage'))).toBe(true);
  });
});
