/**
 * Dogfood self-eval test — SC-05.
 *
 * The cartridge-forge cartridge must load, validate, and eval itself
 * successfully. If this test ever fails, the forge is no longer able to
 * ship itself — which is the single most important tripwire in the
 * milestone.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadCartridge } from '../loader.js';
import { collectMetrics } from '../metrics.js';
import { validateCartridge } from '../validator.js';
import { evalCartridge } from '../eval.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FORGE_CARTRIDGE_PATH = resolve(
  HERE,
  '..',
  '..',
  '..',
  'examples',
  'cartridges',
  'cartridge-forge',
  'cartridge.yaml',
);

describe('cartridge-forge dogfood (SC-05)', () => {
  it('loads the forge cartridge via the unified loader', () => {
    const cartridge = loadCartridge(FORGE_CARTRIDGE_PATH);
    expect(cartridge.id).toBe('cartridge-forge');
    expect(cartridge.trust).toBe('system');
    expect(cartridge.chipsets.length).toBeGreaterThanOrEqual(4);
  });

  it('resolves all 4 external chipset references (department, grove, metrics, evaluation)', () => {
    const cartridge = loadCartridge(FORGE_CARTRIDGE_PATH);
    const kinds = cartridge.chipsets.map((c) => c.kind).sort();
    expect(kinds).toEqual(['department', 'evaluation', 'grove', 'metrics']);
  });

  it('has the expected shape: 6 skills, 5 agents, 3 teams', () => {
    const cartridge = loadCartridge(FORGE_CARTRIDGE_PATH);
    const metrics = collectMetrics(cartridge);
    expect(metrics.skillCount).toBe(6);
    expect(metrics.agentCount).toBe(5);
    expect(metrics.teamCount).toBe(3);
    expect(metrics.groveRecordTypeCount).toBe(5);
  });

  it('passes cross-chipset validation with zero errors', () => {
    const cartridge = loadCartridge(FORGE_CARTRIDGE_PATH);
    const result = validateCartridge(cartridge);
    if (!result.valid) {
      const summary = result.errors
        .map((e) => `  ${e.path}: ${e.message}`)
        .join('\n');
      throw new Error(`forge cartridge failed validation:\n${summary}`);
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('opts out of the college chipset (Category B)', () => {
    const cartridge = loadCartridge(FORGE_CARTRIDGE_PATH);
    const hasCollege = cartridge.chipsets.some((c) => c.kind === 'college');
    expect(hasCollege).toBe(false);
  });

  it('self-evals with zero failed gates (SC-05 critical tripwire)', () => {
    const cartridge = loadCartridge(FORGE_CARTRIDGE_PATH);
    const report = evalCartridge(cartridge);
    if (report.failedCount > 0) {
      const failures = report.gates
        .filter((g) => g.outcome === 'failed')
        .map((g) => `  [FAIL] ${g.gate}${g.message ? ` — ${g.message}` : ''}`)
        .join('\n');
      throw new Error(`forge self-eval failed:\n${failures}`);
    }
    expect(report.failedCount).toBe(0);
    expect(report.passedCount).toBeGreaterThanOrEqual(4);
  });
});
