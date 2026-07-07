/**
 * Hand-migration tests — MI-01..MI-06.
 *
 * Each hand-migrated cartridge must load, validate, and eval without
 * errors. These are the canonical Wave 2B targets that prove the Wave 0
 * schema freeze held against real-world existing chipsets.
 */

import { readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadAnyCartridge, loadCartridge } from '../loader.js';
import { collectMetrics } from '../metrics.js';
import { isResearchOutputCartridge } from '../types.js';
import { validateCartridge, validateResearchOutputCartridge } from '../validator.js';

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
  { name: 'math-department', minChipsets: 4, minSkills: 5, minAgents: 5 },
  { name: 'math-coprocessor', minChipsets: 1 },
  { name: 'rca-department', minChipsets: 4, minSkills: 3, minAgents: 3 },
  { name: 'space-between', minChipsets: 2 },
];

const BULK_MIN_COUNT = 35;

/**
 * Cartridges that still carry pre-existing source-chipset drift the unified
 * loader surfaces (agent_affinity names absent from the agents block, or
 * evaluation benchmark.domains_covered entries no skill mentions). Members
 * skip the cross-chipset validation assertion. Any cartridge added here must
 * carry a TODO to fix the underlying chipset before the next cartridge release.
 *
 * 2026-07-06: the original 22-department debt (10 Category-A agent_affinity +
 * 12 Category-B domains_covered) was repaired — the Category-A departments had
 * their already-authored specialist agents wired into the chipset agents block,
 * restoring the designed 7-agent rosters, and the Category-B benchmarks were
 * reconciled with skill coverage. All 63 example cartridges now pass
 * cross-chipset validation, so the set is empty. See
 * docs/cartridge/KNOWN-VALIDATION-DEBT.md.
 */
const KNOWN_VALIDATION_DEBT = new Set<string>([]);

function bulkCartridges(): string[] {
  return readdirSync(CARTRIDGES)
    .filter((name) => {
      const p = resolve(CARTRIDGES, name, 'cartridge.yaml');
      return existsSync(p) && statSync(p).isFile();
    })
    .sort();
}

describe('W2B.2 bulk department migrations (MI-05)', () => {
  const all = bulkCartridges();

  it(`finds at least ${BULK_MIN_COUNT} migrated cartridges`, () => {
    expect(all.length).toBeGreaterThanOrEqual(BULK_MIN_COUNT);
  });

  for (const cart of all) {
    it(`${cart}: loads under the unified loader`, () => {
      const cartridge = loadAnyCartridge(resolve(CARTRIDGES, cart, 'cartridge.yaml'));
      expect(cartridge.id).toBe(cart);
      if (isResearchOutputCartridge(cartridge)) {
        // Research-output cartridges have artifacts instead of chipsets.
        expect(cartridge.artifacts.length).toBeGreaterThanOrEqual(1);
      } else {
        expect(cartridge.chipsets.length).toBeGreaterThanOrEqual(1);
      }
    });

    if (!KNOWN_VALIDATION_DEBT.has(cart)) {
      it(`${cart}: passes cross-chipset validation`, () => {
        const cartridge = loadAnyCartridge(resolve(CARTRIDGES, cart, 'cartridge.yaml'));
        const result = isResearchOutputCartridge(cartridge)
          ? validateResearchOutputCartridge(cartridge)
          : validateCartridge(cartridge);
        if (!result.valid) {
          const summary = result.errors
            .map((e) => `  ${e.path}: ${e.message}`)
            .join('\n');
          throw new Error(`${cart} failed validation:\n${summary}`);
        }
        expect(result.valid).toBe(true);
      });
    }
  }

  it('known-debt set has at most 25 entries', () => {
    expect(KNOWN_VALIDATION_DEBT.size).toBeLessThanOrEqual(25);
  });
});

describe('W2B hand migrations', () => {
  for (const exp of HAND_MIGRATIONS) {
    describe(`MI ${exp.name}`, () => {
      it(`${exp.name}: loads via unified loader`, () => {
        const cartridge = loadCartridge(forgePath(exp.name));
        expect(cartridge.id).toBeTruthy();
        expect(cartridge.chipsets.length).toBeGreaterThanOrEqual(exp.minChipsets);
      });

      if (!KNOWN_VALIDATION_DEBT.has(exp.name)) {
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
      }

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
