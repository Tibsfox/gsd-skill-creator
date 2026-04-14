/**
 * Hand-migration tests — MI-01..MI-06.
 *
 * Each hand-migrated cartridge must load, validate, and eval without
 * errors. These are the canonical Wave 2B targets that prove the Wave 0
 * schema freeze held against real-world existing chipsets.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadCartridge } from '../loader.js';
import { collectMetrics } from '../metrics.js';
import { validateCartridge } from '../validator.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..');
const CARTRIDGES = resolve(REPO_ROOT, 'examples', 'cartridges');

function forgePath(name: string): string {
  return resolve(CARTRIDGES, name, 'cartridge.yaml');
}

interface Expectation {
  name: string;
  minChipsets: number;
  minSkills?: number;
  minAgents?: number;
}

const HAND_MIGRATIONS: Expectation[] = [
  { name: 'math-department', minChipsets: 3, minSkills: 5, minAgents: 5 },
  { name: 'math-coprocessor', minChipsets: 1 },
  { name: 'rca-department', minChipsets: 3, minSkills: 3, minAgents: 3 },
  { name: 'space-between', minChipsets: 2 },
];

describe('W2B hand migrations', () => {
  for (const exp of HAND_MIGRATIONS) {
    describe(`MI ${exp.name}`, () => {
      it(`${exp.name}: loads via unified loader`, () => {
        const cartridge = loadCartridge(forgePath(exp.name));
        expect(cartridge.id).toBeTruthy();
        expect(cartridge.chipsets.length).toBeGreaterThanOrEqual(exp.minChipsets);
      });

      it(`${exp.name}: passes cross-chipset validation`, () => {
        const cartridge = loadCartridge(forgePath(exp.name));
        const result = validateCartridge(cartridge);
        if (!result.valid) {
          const summary = result.errors
            .map((e) => `  ${e.path}: ${e.message}`)
            .join('\n');
          throw new Error(`${exp.name} failed validation:\n${summary}`);
        }
        expect(result.valid).toBe(true);
      });

      if (exp.minSkills !== undefined || exp.minAgents !== undefined) {
        it(`${exp.name}: metrics match expected shape`, () => {
          const cartridge = loadCartridge(forgePath(exp.name));
          const m = collectMetrics(cartridge);
          if (exp.minSkills !== undefined) {
            expect(m.skillCount).toBeGreaterThanOrEqual(exp.minSkills);
          }
          if (exp.minAgents !== undefined) {
            expect(m.agentCount).toBeGreaterThanOrEqual(exp.minAgents);
          }
        });
      }
    });
  }
});
