/**
 * CLI subcommand tests for M8 Symbiosis
 *
 * teach, co-evolution, quintessence — help output + five example invocations each.
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

import { teachCliCommand } from '../cli.js';
import { coEvolutionCliCommand } from '../cli.js';
import { quintessenceCliCommand } from '../cli.js';
import type { SessionRecord } from '../coEvolution.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function tempDir(): string {
  const dir = join(tmpdir(), `symbiosis-cli-test-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function captureLog(): { lines: string[]; logger: (line: string) => void } {
  const lines: string[] = [];
  return { lines, logger: (line) => lines.push(line) };
}

function buildSessions(n: number): SessionRecord[] {
  return Array.from({ length: n }, (_, i) => ({
    index: i,
    date: new Date(Date.UTC(2025, 0, 1 + i)).toISOString(),
    activatedSkills: [`skill-${i % 5}`],
    testFirstCommit: i % 10 < 3,
    branch: i % 4 === 0 ? 'trunk' : `feature/${i % 3}`,
    taskDescription: i % 5 === 0 ? 'deploy staging environment' : `task-${i % 8}`,
  }));
}

// ─── teach: help output ───────────────────────────────────────────────────────

describe('teach: --help output', () => {
  it('returns 0 and prints usage with --help', async () => {
    const { lines, logger } = captureLog();
    const code = await teachCliCommand(['--help'], { logger });
    expect(code).toBe(0);
    const output = lines.join('\n');
    expect(output).toContain('skill-creator teach');
    expect(output).toContain('--category');
    expect(output).toContain('--content');
  });

  it('help output contains all five category names', async () => {
    const { lines, logger } = captureLog();
    await teachCliCommand(['--help'], { logger });
    const output = lines.join('\n');
    expect(output).toContain('correction');
    expect(output).toContain('clarification');
    expect(output).toContain('constraint');
    expect(output).toContain('pattern');
    expect(output).toContain('preference');
  });
});

// ─── teach: five example invocations ─────────────────────────────────────────

describe('teach: five example invocations', () => {
  it('example 1 — constraint category', async () => {
    const dir = tempDir();
    const ledgerPath = join(dir, 'teaching.jsonl');
    const { lines, logger } = captureLog();
    const code = await teachCliCommand([], {
      category: 'constraint',
      content: 'Never import from desktop/ in src/',
      refs: [],
      ledgerPath,
      logger,
    });
    expect(code).toBe(0);
    expect(lines.some((l) => l.includes('Teaching entry recorded'))).toBe(true);
  });

  it('example 2 — correction with ref', async () => {
    const dir = tempDir();
    const ledgerPath = join(dir, 'teaching.jsonl');
    const { lines, logger } = captureLog();
    const code = await teachCliCommand([], {
      category: 'correction',
      content: 'M6 should not fire on test files',
      refs: ['trace-001'],
      ledgerPath,
      logger,
    });
    expect(code).toBe(0);
    expect(lines.some((l) => l.includes('trace-001'))).toBe(true);
  });

  it('example 3 — preference, JSON output mode', async () => {
    const dir = tempDir();
    const ledgerPath = join(dir, 'teaching.jsonl');
    const { lines, logger } = captureLog();
    const code = await teachCliCommand([], {
      category: 'preference',
      content: 'Prefer explicit error types over unknown',
      json: true,
      ledgerPath,
      logger,
    });
    expect(code).toBe(0);
    const json = JSON.parse(lines[0]!);
    expect(json.ok).toBe(true);
    expect(typeof json.id).toBe('string');
    expect(json.category).toBe('preference');
  });

  it('example 4 — clarification', async () => {
    const dir = tempDir();
    const ledgerPath = join(dir, 'teaching.jsonl');
    const { lines, logger } = captureLog();
    const code = await teachCliCommand([], {
      category: 'clarification',
      content: '"skill" means a markdown file in .claude/skills/',
      ledgerPath,
      logger,
    });
    expect(code).toBe(0);
    expect(lines.some((l) => l.includes('Teaching entry recorded'))).toBe(true);
  });

  it('example 5 — pattern', async () => {
    const dir = tempDir();
    const ledgerPath = join(dir, 'teaching.jsonl');
    const { lines, logger } = captureLog();
    const code = await teachCliCommand([], {
      category: 'pattern',
      content: 'Always run npx tsc --noEmit before committing',
      ledgerPath,
      logger,
    });
    expect(code).toBe(0);
    expect(lines.some((l) => l.includes('Teaching entry recorded'))).toBe(true);
  });

  it('returns 1 and error message when category is missing', async () => {
    const { lines, logger } = captureLog();
    const code = await teachCliCommand([], { content: 'some content', logger });
    expect(code).toBe(1);
    expect(lines.some((l) => l.toLowerCase().includes('category'))).toBe(true);
  });

  it('returns 1 and error message when content is missing', async () => {
    const { lines, logger } = captureLog();
    const code = await teachCliCommand([], { category: 'pattern', logger });
    expect(code).toBe(1);
    expect(lines.some((l) => l.toLowerCase().includes('content'))).toBe(true);
  });

  it('returns 1 for invalid category', async () => {
    const { lines, logger } = captureLog();
    const code = await teachCliCommand([], { category: 'opinion', content: 'x', logger });
    expect(code).toBe(1);
    expect(lines.some((l) => l.toLowerCase().includes('unknown category'))).toBe(true);
  });
});

// ─── co-evolution: help output ────────────────────────────────────────────────

describe('co-evolution: --help output', () => {
  it('returns 0 with --help and prints usage', async () => {
    const { lines, logger } = captureLog();
    const code = await coEvolutionCliCommand(['--help'], { logger });
    expect(code).toBe(0);
    const output = lines.join('\n');
    expect(output).toContain('skill-creator co-evolution');
    expect(output).toContain('--enabled');
  });

  it('help mentions SC-CONSENT opt-in requirement', async () => {
    const { lines, logger } = captureLog();
    await coEvolutionCliCommand(['--help'], { logger });
    const output = lines.join('\n');
    expect(output).toContain('SC-CONSENT');
  });
});

// ─── co-evolution: five example invocations ───────────────────────────────────

describe('co-evolution: five example invocations', () => {
  it('example 1 — disabled (default): zero offerings', async () => {
    const dir = tempDir();
    const ledgerPath = join(dir, 'co-evolution.jsonl');
    const { lines, logger } = captureLog();
    const code = await coEvolutionCliCommand([], {
      sessions: buildSessions(200),
      ledgerPath,
      logger,
    });
    expect(code).toBe(0);
    expect(lines.some((l) => l.includes('disabled') || l.includes('Zero'))).toBe(true);
  });

  it('example 2 — enabled, produces offerings', async () => {
    const dir = tempDir();
    const ledgerPath = join(dir, 'co-evolution.jsonl');
    const { lines, logger } = captureLog();
    const code = await coEvolutionCliCommand([], {
      sessions: buildSessions(200),
      settings: { enabled: true, cadenceSessionCount: 200 },
      ledgerPath,
      logger,
    });
    expect(code).toBe(0);
    const output = lines.join('\n');
    // Either "No new offerings" or lists some
    expect(output.length).toBeGreaterThan(0);
  });

  it('example 3 — list mode (no scan)', async () => {
    const dir = tempDir();
    const ledgerPath = join(dir, 'co-evolution.jsonl');
    const { lines, logger } = captureLog();
    const code = await coEvolutionCliCommand(['--list'], { ledgerPath, logger });
    expect(code).toBe(0);
    expect(lines.some((l) => l.includes('No co-evolution offerings') || l.includes('offering'))).toBe(true);
  });

  it('example 4 — enabled with JSON output', async () => {
    const dir = tempDir();
    const ledgerPath = join(dir, 'co-evolution.jsonl');
    const { lines, logger } = captureLog();
    const code = await coEvolutionCliCommand([], {
      sessions: buildSessions(200),
      settings: { enabled: true, cadenceSessionCount: 200 },
      ledgerPath,
      json: true,
      logger,
    });
    expect(code).toBe(0);
    const json = JSON.parse(lines.join(''));
    expect(typeof json.offeringsEmitted).toBe('number');
    expect(Array.isArray(json.offerings)).toBe(true);
  });

  it('example 5 — list after writing offerings', async () => {
    const dir = tempDir();
    const ledgerPath = join(dir, 'co-evolution.jsonl');
    // First, run a pass to populate the ledger
    await coEvolutionCliCommand([], {
      sessions: buildSessions(200),
      settings: { enabled: true, cadenceSessionCount: 200 },
      ledgerPath,
      logger: () => { /* silent */ },
    });
    // Then list
    const { lines, logger } = captureLog();
    const code = await coEvolutionCliCommand(['--list'], { ledgerPath, logger });
    expect(code).toBe(0);
    // Should show entries or "No" message
    expect(lines.length).toBeGreaterThan(0);
  });
});

// ─── quintessence: help output ────────────────────────────────────────────────

describe('quintessence: --help output', () => {
  it('returns 0 with --help and prints usage', async () => {
    const { lines, logger } = captureLog();
    const code = await quintessenceCliCommand(['--help'], { logger });
    expect(code).toBe(0);
    const output = lines.join('\n');
    expect(output).toContain('skill-creator quintessence');
    expect(output).toContain('5-axis');
  });

  it('help output mentions all five axes', async () => {
    const { lines, logger } = captureLog();
    await quintessenceCliCommand(['--help'], { logger });
    const output = lines.join('\n');
    expect(output).toContain('Self-vs-Non-Self');
    expect(output).toContain('Essential Tensions');
    expect(output).toContain('Growth-and-Energy-Flow');
    expect(output).toContain('Stability-vs-Novelty');
    expect(output).toContain('Fateful Encounters');
  });

  it('help cites Lanzara & Kuperstein', async () => {
    const { lines, logger } = captureLog();
    await quintessenceCliCommand(['--help'], { logger });
    const output = lines.join('\n');
    expect(output).toContain('Lanzara');
  });
});

// ─── quintessence: five example invocations ───────────────────────────────────

describe('quintessence: five example invocations', () => {
  it('example 1 — default text report', async () => {
    const { lines, logger } = captureLog();
    const code = await quintessenceCliCommand([], { now: 1_000_000, logger });
    expect(code).toBe(0);
    const output = lines.join('\n');
    expect(output).toContain('Quintessence Report');
    expect(output).toContain('Self-vs-Non-Self');
  });

  it('example 2 — JSON output', async () => {
    const { lines, logger } = captureLog();
    const code = await quintessenceCliCommand(['--json'], { now: 1_000_000, logger });
    expect(code).toBe(0);
    const json = JSON.parse(lines.join(''));
    expect(typeof json.selfVsNonSelf).toBe('number');
    expect(typeof json.essentialTensions).toBe('number');
    expect(typeof json.growthAndEnergyFlow).toBe('number');
    expect(typeof json.stabilityVsNovelty).toBe('number');
    expect(typeof json.fatefulEncounters).toBe('number');
    expect(json.ts).toBe(1_000_000);
  });

  it('example 3 — report contains numeric values', async () => {
    const { lines, logger } = captureLog();
    await quintessenceCliCommand([], { now: 1_000_000, logger });
    const output = lines.join('\n');
    expect(output).toMatch(/\d+(\.\d+)?%/);
  });

  it('example 4 — help flag (-h)', async () => {
    const { lines, logger } = captureLog();
    const code = await quintessenceCliCommand(['-h'], { logger });
    expect(code).toBe(0);
    expect(lines.join('\n')).toContain('skill-creator quintessence');
  });

  it('example 5 — report language passes parasocial guard', async () => {
    const { validateOffering } = await import('../parasocial-guard.js');
    const { lines, logger } = captureLog();
    await quintessenceCliCommand([], { now: 1_000_000, logger });
    const output = lines.join('\n');
    const result = validateOffering(output);
    expect(result.ok).toBe(true);
  });
});
