/**
 * Tests for the bounded-learning CLI command wired to the
 * `amiga.min_sequence_count` threshold (v1.49.1027).
 *
 * Covers:
 *   - dry-run (default): threshold present, suggestions filtered by source tag
 *   - refused-on-insufficient-evidence: no amiga entries → hold (no change)
 *   - apply path: 20 dismissed sequence_repetition entries → increase 2→3
 *   - e-process fixture outcome: recorded for operator information
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock('picocolors', () => ({
  default: {
    bold: (s: string) => s,
    dim: (s: string) => s,
    cyan: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
  },
}));

import { boundedLearningCommand } from './bounded-learning.js';

let tmpRoot: string;
let suggestionsPath: string;
let configPath: string;
let auditLogPath: string;
let logSpy: ReturnType<typeof vi.spyOn>;

/** Build a suggestion entry tagged as AMIGA sequence_repetition. */
function makeSeqEntry(id: string, state: 'dismissed' | 'accepted') {
  return {
    id,
    candidate: {
      id,
      suggestedDescription: `Repeating sequence: FOO->BAR detected 2 times [source: AMIGA sequence_repetition]`,
    },
    state,
    decidedAt: '2026-06-10T00:00:00.000Z',
  };
}

/** Build a suggestion entry tagged as a DIFFERENT source (should be ignored). */
function makeNonSeqEntry(id: string, state: 'dismissed' | 'accepted') {
  return {
    id,
    candidate: {
      id,
      suggestedDescription: `Some pattern [source: AMIGA attribution_cluster]`,
    },
    state,
    decidedAt: '2026-06-10T00:00:00.000Z',
  };
}

function writeConfig(value: unknown): void {
  writeFileSync(configPath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeSuggestions(value: unknown): void {
  writeFileSync(suggestionsPath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function collectLog(): string {
  return logSpy.mock.calls.map((c: unknown[]) => String(c[0] ?? '')).join('\n');
}

function baseArgs(extra: string[] = []): string[] {
  return [
    '--threshold', 'amiga.min_sequence_count',
    '--suggestions', suggestionsPath,
    '--config', configPath,
    '--audit-log', auditLogPath,
    ...extra,
  ];
}

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'bl-amiga-test-'));
  suggestionsPath = join(tmpRoot, 'suggestions.json');
  configPath = join(tmpRoot, 'skill-creator.json');
  auditLogPath = join(tmpRoot, 'bounded-learning-log.jsonl');
  // Config with amiga.min_sequence_count = 2 (the default bar).
  writeConfig({ amiga: { min_sequence_count: 2 } });
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

// ---------------------------------------------------------------------------
// Threshold recognition
// ---------------------------------------------------------------------------

describe('bounded-learning amiga.min_sequence_count — threshold registration', () => {
  it('accepts amiga.min_sequence_count as a valid --threshold', async () => {
    writeSuggestions([]);
    const code = await boundedLearningCommand(baseArgs(['--json']));
    // Should not return 1 (invalid-flag) — 0 = success even with no observations
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.threshold).toBe('amiga.min_sequence_count');
  });

  it('appears in SUPPORTED_THRESHOLDS (wrong value produces invalid-flag error)', async () => {
    // Pass a clearly-not-supported key to confirm the error path exercises the list.
    writeSuggestions([]);
    const code = await boundedLearningCommand([
      '--threshold', 'amiga.not_a_key',
      '--suggestions', suggestionsPath,
      '--config', configPath,
      '--audit-log', auditLogPath,
      '--json',
    ]);
    expect(code).toBe(1);
    const out = JSON.parse(collectLog());
    expect(out.error).toBe('invalid-flag');
  });
});

// ---------------------------------------------------------------------------
// Evidence filtering
// ---------------------------------------------------------------------------

describe('bounded-learning amiga.min_sequence_count — evidence filtering', () => {
  it('holds with no suggestions (no evidence)', async () => {
    writeSuggestions([]);
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.direction).toBe('hold');
    expect(out.observations).toBe(0);
  });

  it('holds when suggestions exist but none are tagged sequence_repetition', async () => {
    writeSuggestions([
      makeNonSeqEntry('attr-1', 'dismissed'),
      makeNonSeqEntry('attr-2', 'dismissed'),
    ]);
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.direction).toBe('hold');
    expect(out.observations).toBe(0);
  });

  it('counts only sequence_repetition-tagged entries as observations', async () => {
    writeSuggestions([
      makeSeqEntry('seq-1', 'dismissed'),
      makeNonSeqEntry('attr-1', 'dismissed'),
      makeSeqEntry('seq-2', 'dismissed'),
    ]);
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    // Only the 2 seq entries should be counted.
    expect(out.observations).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Dry-run (default)
// ---------------------------------------------------------------------------

describe('bounded-learning amiga.min_sequence_count — dry-run', () => {
  it('reports dry-run when evidence crosses threshold', async () => {
    // 10 unanimous dismissals should cross alpha=0.05 with high confidence.
    writeSuggestions(
      Array.from({ length: 10 }, (_, i) => makeSeqEntry(`s-${i}`, 'dismissed')),
    );
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.direction).toBe('increase');
    expect(out.rejected).toBe(true);
    expect(out.applied).toBe('dry-run');
    // Config must NOT be written in dry-run.
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(onDisk.amiga.min_sequence_count).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Apply path
// ---------------------------------------------------------------------------

describe('bounded-learning amiga.min_sequence_count — apply path', () => {
  it('writes 2→3 when 20 dismissed sequence_repetition entries + --apply (honest e-process outcome)', async () => {
    // Fixture: 20 dismissed AMIGA sequence_repetition entries.
    // E-process outcome (verified via runCalibrationLoop directly):
    //   direction = increase, evidence ≈ 1808, proposedValue = 3.
    // This test asserts that honest outcome propagates through the CLI.
    writeSuggestions(
      Array.from({ length: 20 }, (_, i) => makeSeqEntry(`s-${i}`, 'dismissed')),
    );
    const code = await boundedLearningCommand(baseArgs(['--apply', '--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.direction).toBe('increase');
    expect(out.rejected).toBe(true);
    expect(out.proposedValue).toBe(3);
    expect(out.applied).toBe('applied');
    // Config IS written.
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(onDisk.amiga.min_sequence_count).toBe(3);
  });

  it('holds (noop) when evidence does not cross alpha — accepted and dismissed entries cancel', async () => {
    // 1 accepted + 1 dismissed → hold (no evidence of directional bias).
    writeSuggestions([
      makeSeqEntry('s-accept', 'accepted'),
      makeSeqEntry('s-dismiss', 'dismissed'),
    ]);
    const code = await boundedLearningCommand(baseArgs(['--apply', '--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.direction).toBe('hold');
    expect(out.applied).toBe('noop');
    // Config unchanged.
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(onDisk.amiga.min_sequence_count).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// observationSource metadata
// ---------------------------------------------------------------------------

describe('bounded-learning amiga.min_sequence_count — observation source metadata', () => {
  it('reports wired=true for amiga.min_sequence_count', async () => {
    writeSuggestions([]);
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.observationSource.wired).toBe(true);
    expect(out.observationSource.sourceId).toContain('suggestions.json');
  });
});
