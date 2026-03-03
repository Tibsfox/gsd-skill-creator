/**
 * Tests for ChipFactory.
 *
 * Verifies that createChip() dispatches to the correct chip implementation
 * based on config.type. No network calls -- only constructor behavior tested.
 */

import { describe, it, expect } from 'vitest';
import { createChip } from './chip-factory.js';
import { OpenAICompatibleChip } from './openai-compatible-chip.js';
import { AnthropicChip } from './anthropic-chip.js';
import type { ChipConfig } from './types.js';

// ============================================================================
// createChip()
// ============================================================================

describe('createChip()', () => {
  it("creates OpenAICompatibleChip for type='openai-compatible'", () => {
    const config: ChipConfig = {
      name: 'ollama',
      type: 'openai-compatible',
      baseUrl: 'http://localhost:11434',
      defaultModel: 'llama3',
    };

    const chip = createChip(config);

    expect(chip).toBeInstanceOf(OpenAICompatibleChip);
    expect(chip.name).toBe('ollama');
    expect(chip.type).toBe('openai-compatible');
  });

  it("creates AnthropicChip for type='anthropic'", () => {
    const config: ChipConfig = {
      name: 'claude',
      type: 'anthropic',
      apiKey: 'sk-ant-test',
      defaultModel: 'claude-sonnet-4-20250514',
    };

    const chip = createChip(config);

    expect(chip).toBeInstanceOf(AnthropicChip);
    expect(chip.name).toBe('claude');
    expect(chip.type).toBe('anthropic');
  });

  it('throws descriptive error for unknown chip type', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = { name: 'bad', type: 'unknown-type', defaultModel: 'x' } as any;

    expect(() => createChip(config)).toThrow(/Unknown chip type/);
    expect(() => createChip(config)).toThrow(/unknown-type/);
  });
});
