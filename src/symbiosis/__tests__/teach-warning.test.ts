/**
 * ME-4 teach-warning tests
 *
 * Covers acceptance gates:
 *   CF-ME4-01  warning emitted for coin-flip/unknown skills
 *   CF-ME4-02  no warning for tractable skills
 *   CF-ME4-03  warning copy passes parasocial-guard on 100 synthesised entries
 *   CF-ME4-05  --force flag bypasses the interactive gate (CLI layer)
 *   SC-ME4-01  no first-person-plural / emotional / relational registers in text
 */

import { describe, it, expect } from 'vitest';
import { validateOffering } from '../parasocial-guard.js';
import {
  composeTeachWarning,
  formatTeachWarningBlock,
  WARN_COIN_FLIP,
  WARN_UNKNOWN,
  NOTE_TRACTABLE,
} from '../teach-warning.js';
import { teachCliCommand } from '../cli.js';

// ─── CF-ME4-01: warning for coin-flip / unknown ───────────────────────────────

describe('CF-ME4-01: warning emitted for coin-flip and unknown skills', () => {
  it('shouldWarn is true for coin-flip tractability', () => {
    const result = composeTeachWarning('low', 'coin-flip');
    expect(result.shouldWarn).toBe(true);
    expect(result.level).toBe('low');
    expect(result.tractabilityClass).toBe('coin-flip');
  });

  it('shouldWarn is true for unknown tractability', () => {
    const result = composeTeachWarning('low', 'unknown');
    expect(result.shouldWarn).toBe(true);
    expect(result.level).toBe('low');
    expect(result.tractabilityClass).toBe('unknown');
  });

  it('shouldWarn is true for medium level (conservative)', () => {
    const result = composeTeachWarning('medium', undefined);
    expect(result.shouldWarn).toBe(true);
  });

  it('warning text is non-empty for coin-flip', () => {
    const result = composeTeachWarning('low', 'coin-flip');
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('warning text is non-empty for unknown', () => {
    const result = composeTeachWarning('low', 'unknown');
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('coin-flip uses WARN_COIN_FLIP template', () => {
    const result = composeTeachWarning('low', 'coin-flip');
    expect(result.text).toBe(WARN_COIN_FLIP);
  });

  it('unknown uses WARN_UNKNOWN template', () => {
    const result = composeTeachWarning('low', 'unknown');
    expect(result.text).toBe(WARN_UNKNOWN);
  });
});

// ─── CF-ME4-02: no warning for tractable skills ───────────────────────────────

describe('CF-ME4-02: no warning for tractable skills', () => {
  it('shouldWarn is false for high level (tractable)', () => {
    const result = composeTeachWarning('high', 'tractable');
    expect(result.shouldWarn).toBe(false);
    expect(result.level).toBe('high');
  });

  it('tractable result uses NOTE_TRACTABLE text', () => {
    const result = composeTeachWarning('high', 'tractable');
    expect(result.text).toBe(NOTE_TRACTABLE);
  });

  it('formatTeachWarningBlock omits [WARN] prefix for tractable', () => {
    const result = composeTeachWarning('high', 'tractable');
    const block = formatTeachWarningBlock(result);
    expect(block).not.toContain('[WARN]');
    expect(block).toContain('high');
  });

  it('formatTeachWarningBlock includes [WARN] prefix for coin-flip', () => {
    const result = composeTeachWarning('low', 'coin-flip');
    const block = formatTeachWarningBlock(result);
    expect(block).toContain('[WARN]');
  });
});

// ─── CF-ME4-03 / SC-ME4-01: parasocial-guard on static strings ───────────────

describe('SC-ME4-01: static warning strings pass parasocial-guard', () => {
  it('WARN_COIN_FLIP passes validateOffering', () => {
    const r = validateOffering(WARN_COIN_FLIP);
    expect(r.ok).toBe(true);
  });

  it('WARN_UNKNOWN passes validateOffering', () => {
    const r = validateOffering(WARN_UNKNOWN);
    expect(r.ok).toBe(true);
  });

  it('NOTE_TRACTABLE passes validateOffering', () => {
    const r = validateOffering(NOTE_TRACTABLE);
    expect(r.ok).toBe(true);
  });
});

// ─── CF-ME4-03: 100 synthesised entries — parasocial audit ───────────────────

describe('CF-ME4-03: warning text passes parasocial-guard for 100 synthesised cases', () => {
  // Synthesise 100 (level, tractabilityClass) pairs covering the full matrix.
  // Each produces a TeachWarningResult; we validate the text field.
  type Level = 'low' | 'medium' | 'high';
  type TClass = 'tractable' | 'coin-flip' | 'unknown' | undefined;

  const levels: Level[] = ['low', 'medium', 'high'];
  const classes: TClass[] = ['tractable', 'coin-flip', 'unknown', undefined];

  // Generate 100 cases by cycling through the matrix with varied index offsets.
  const cases: Array<{ level: Level; cls: TClass }> = [];
  for (let i = 0; i < 100; i++) {
    const level = levels[i % levels.length]!;
    const cls = classes[i % classes.length];
    cases.push({ level, cls });
  }

  for (let i = 0; i < cases.length; i++) {
    const { level, cls } = cases[i]!;
    it(`case ${i + 1}: level=${level} cls=${String(cls)} — warning text passes guard`, () => {
      const result = composeTeachWarning(level, cls as TClass extends undefined ? undefined : Exclude<TClass, undefined>);
      const guardResult = validateOffering(result.text);
      expect(guardResult.ok).toBe(true);
    });
  }
});

// ─── CF-ME4-05: --force flag bypasses interactive gate ───────────────────────

describe('CF-ME4-05: --force flag bypasses warning interactive gate', () => {
  it('with --force and coin-flip skill, command succeeds without blocking', async () => {
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { mkdirSync } = await import('node:fs');
    const { randomUUID } = await import('node:crypto');

    const dir = join(tmpdir(), `me4-force-test-${randomUUID()}`);
    mkdirSync(dir, { recursive: true });
    const ledgerPath = join(dir, 'teaching.jsonl');

    const lines: string[] = [];
    const exitCode = await teachCliCommand(
      ['--category=correction', '--content=Fix prose skill output', '--force'],
      {
        ledgerPath,
        now: 1_000_000,
        rawOutputStructure: { kind: 'prose' }, // coin-flip skill
        force: true,
        logger: (line) => lines.push(line),
        noWarning: false, // warning display is on but --force acknowledges it
      },
    );

    expect(exitCode).toBe(0);
    // Warning block should still be displayed (--force doesn't suppress display)
    const fullOutput = lines.join('\n');
    expect(fullOutput).toContain('[WARN]');
    // But it also shows the gate message
    expect(fullOutput).toContain('recorded');
  });

  it('with --no-warning and coin-flip skill, warning is suppressed', async () => {
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { mkdirSync } = await import('node:fs');
    const { randomUUID } = await import('node:crypto');

    const dir = join(tmpdir(), `me4-nowarn-test-${randomUUID()}`);
    mkdirSync(dir, { recursive: true });
    const ledgerPath = join(dir, 'teaching.jsonl');

    const lines: string[] = [];
    const exitCode = await teachCliCommand(
      ['--category=pattern', '--content=CI check step', '--no-warning'],
      {
        ledgerPath,
        now: 1_000_001,
        rawOutputStructure: { kind: 'prose' }, // coin-flip skill
        noWarning: true,
        logger: (line) => lines.push(line),
      },
    );

    expect(exitCode).toBe(0);
    const fullOutput = lines.join('\n');
    // Warning should NOT appear
    expect(fullOutput).not.toContain('[WARN]');
    // Entry should still be recorded
    expect(fullOutput).toContain('recorded');
  });

  it('with tractable skill, no warning shown and entry recorded', async () => {
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { mkdirSync } = await import('node:fs');
    const { randomUUID } = await import('node:crypto');

    const dir = join(tmpdir(), `me4-tractable-test-${randomUUID()}`);
    mkdirSync(dir, { recursive: true });
    const ledgerPath = join(dir, 'teaching.jsonl');

    const lines: string[] = [];
    const exitCode = await teachCliCommand(
      ['--category=constraint', '--content=Never skip schema validation'],
      {
        ledgerPath,
        now: 1_000_002,
        rawOutputStructure: { kind: 'json-schema', schema: '{"type":"object"}' },
        logger: (line) => lines.push(line),
      },
    );

    expect(exitCode).toBe(0);
    const fullOutput = lines.join('\n');
    expect(fullOutput).not.toContain('[WARN]');
    expect(fullOutput).toContain('recorded');
    expect(fullOutput).toContain('high');
  });
});

// ─── formatTeachWarningBlock structural checks ────────────────────────────────

describe('formatTeachWarningBlock structure', () => {
  it('coin-flip block contains "Expected effect: low"', () => {
    const result = composeTeachWarning('low', 'coin-flip');
    const block = formatTeachWarningBlock(result);
    expect(block).toContain('Expected effect: low');
  });

  it('tractable block contains "Expected effect: high"', () => {
    const result = composeTeachWarning('high', 'tractable');
    const block = formatTeachWarningBlock(result);
    expect(block).toContain('Expected effect: high');
  });

  it('coin-flip block mentions Zhang 2026', () => {
    const result = composeTeachWarning('low', 'coin-flip');
    const block = formatTeachWarningBlock(result);
    expect(block).toContain('Zhang 2026');
  });
});
