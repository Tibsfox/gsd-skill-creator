/**
 * Tests for the `predict-next` CLI command (v1.49.845).
 *
 * Smoke-tests argument parsing, JSON output shape, and the
 * unsupported-args exit path. The full predict path (with a real
 * college graph and settings file) is covered by the predictive-skill-
 * loader's own integration tests; these tests cover the CLI wrapper
 * surface only.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { predictNextCommand } from './predict-next.js';

describe('predict-next CLI command (v1.49.845)', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  function collectStdout(): string {
    return consoleLogSpy.mock.calls.map((args: unknown[]) => args[0] as string).join('\n');
  }

  it('returns 1 when no currentSkill argument provided', async () => {
    const exit = await predictNextCommand([]);
    expect(exit).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
  });

  it('returns 0 with --json output for any currentSkill', async () => {
    const exit = await predictNextCommand(['some-skill', '--json', '--no-record']);
    expect(exit).toBe(0);
    const output = collectStdout();
    expect(output).toContain('"currentSkill": "some-skill"');
  });

  it('JSON output has all expected schema fields', async () => {
    await predictNextCommand(['test-skill', '--json', '--no-record']);
    const output = collectStdout();
    const parsed = JSON.parse(output);
    expect(parsed).toMatchObject({
      currentSkill: 'test-skill',
      disabled: expect.any(Boolean),
      predictions: expect.any(Array),
      maxScore: expect.any(Number),
      lowConfidenceThreshold: expect.any(Number),
      isLowConfidence: expect.any(Boolean),
      eventRecorded: false,
      eventKind: null,
    });
    expect(parsed).toHaveProperty('predictError');
    expect(parsed).toHaveProperty('recordError');
  });

  it('parses --useful flag (event-kind option)', async () => {
    // --no-record so we don't actually write; just verify the parser
    // accepts the flag without crashing and produces valid output.
    const exit = await predictNextCommand(['some-skill', '--useful', '--no-record', '--json']);
    expect(exit).toBe(0);
    const output = collectStdout();
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('parses --not-useful flag (event-kind option)', async () => {
    const exit = await predictNextCommand(['some-skill', '--not-useful', '--no-record', '--json']);
    expect(exit).toBe(0);
    const output = collectStdout();
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('--no-record skips event recording even when low-confidence', async () => {
    const exit = await predictNextCommand(['some-skill', '--no-record', '--json']);
    expect(exit).toBe(0);
    const output = collectStdout();
    const parsed = JSON.parse(output);
    expect(parsed.eventRecorded).toBe(false);
    expect(parsed.eventKind).toBe(null);
  });

  it('positional argument is preserved through flag positions', async () => {
    // currentSkill can appear before or after flags
    await predictNextCommand(['--json', '--no-record', 'middle-skill']);
    const output1 = collectStdout();
    consoleLogSpy.mockClear();
    await predictNextCommand(['final-skill', '--json', '--no-record']);
    const output2 = collectStdout();
    expect(output1).toContain('"currentSkill": "middle-skill"');
    expect(output2).toContain('"currentSkill": "final-skill"');
  });
});
