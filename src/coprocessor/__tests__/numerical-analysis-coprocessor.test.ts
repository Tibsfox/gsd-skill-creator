/**
 * Always-on regression guard for the FIRST shipped skill that declares a
 * `coprocessor:` frontmatter block.
 *
 * `examples/skills/math/numerical-analysis/SKILL.md` is the reference consumer
 * of the math coprocessor (CF4b). This test reads that REAL shipped file from
 * disk and asserts its frontmatter round-trips through the exact production
 * extract → parse chain the activation pipeline uses
 * (`extractCoprocessorRaw` → `parseCoprocessorSpec`). It is NOT gated and runs
 * under default `npm test` / CI — no Python server, no subprocess — so a future
 * edit that breaks or drops the declaration reds here immediately.
 *
 * The live end-to-end activation (frontmatter → activateCoprocessor → live MCP
 * server → chip availability + oracle compute) is proven separately in the
 * gated `numerical-analysis-coprocessor.integration.test.ts`.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { extractCoprocessorRaw } from '../applicator-hook.js';
import { parseCoprocessorSpec } from '../activation.js';
import type { ChipName } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_PATH = resolve(
  __dirname,
  '../../../examples/skills/math/numerical-analysis/SKILL.md',
);

/** The five chips the math coprocessor exposes (see types.ts ChipName). */
const VALID_CHIPS: readonly ChipName[] = ['algebrus', 'fourier', 'vectora', 'statos', 'symbex'];

describe('numerical-analysis SKILL.md declares a consumable coprocessor spec (CF4b)', () => {
  const content = readFileSync(SKILL_PATH, 'utf8');

  it('extracts the shipped frontmatter to the declared chip list', () => {
    const raw = extractCoprocessorRaw(content);
    expect(raw).toEqual(['algebrus', 'statos']);
  });

  it('parses the extracted spec into a CoprocessorActivationSpec', () => {
    const spec = parseCoprocessorSpec(extractCoprocessorRaw(content));
    expect(spec).toEqual({ required: ['algebrus', 'statos'] });
  });

  it('declares only valid chip names', () => {
    const spec = parseCoprocessorSpec(extractCoprocessorRaw(content));
    expect(spec?.required).toBeDefined();
    for (const chip of spec!.required!) {
      expect(VALID_CHIPS).toContain(chip);
    }
  });
});
