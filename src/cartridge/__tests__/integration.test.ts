/**
 * IN-01 — Full lifecycle integration test.
 *
 * End-to-end in a tmpdir: scaffold a new cartridge, validate it,
 * collect metrics, eval it, dedup it, fork it, load the fork, and
 * confirm every step returns a clean result. Exercises every public
 * entry point under src/cartridge/ in a single flow.
 */

import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dedupCartridge } from '../dedup.js';
import { evalCartridge } from '../eval.js';
import { forkCartridge } from '../fork.js';
import { loadCartridge } from '../loader.js';
import { collectMetrics } from '../metrics.js';
import { scaffoldCartridge } from '../scaffold.js';
import { validateCartridge } from '../validator.js';

describe('IN-01: full cartridge lifecycle', () => {
  let workDir: string;

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'cartridge-integration-'));
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('scaffolds, validates, metrics, evals, dedups, forks, and reloads', () => {
    // 1. Scaffold
    const scaffoldResult = scaffoldCartridge({
      template: 'department',
      targetDir: join(workDir, 'in01'),
      name: 'integration-dept',
      trust: 'community',
    });
    const cartridgePath = join(scaffoldResult.targetDir, 'cartridge.yaml');
    expect(existsSync(cartridgePath)).toBe(true);
    expect(scaffoldResult.filesWritten.length).toBeGreaterThan(0);

    // 2. Load
    const cartridge = loadCartridge(cartridgePath);
    expect(cartridge.id).toBe('integration-dept');
    expect(cartridge.trust).toBe('community');
    expect(cartridge.chipsets.length).toBeGreaterThan(0);

    // 3. Validate
    const validation = validateCartridge(cartridge);
    if (!validation.valid) {
      const summary = validation.errors
        .map((e) => `  ${e.path}: ${e.message}`)
        .join('\n');
      throw new Error(`IN-01 scaffolded cartridge failed validation:\n${summary}`);
    }
    expect(validation.valid).toBe(true);

    // 4. Metrics
    const metrics = collectMetrics(cartridge);
    expect(metrics.chipsetKinds.length).toBeGreaterThan(0);
    expect(metrics.skillCount).toBeGreaterThanOrEqual(0);

    // 5. Eval
    const report = evalCartridge(cartridge);
    expect(report.failedCount).toBe(0);
    expect(report.passedCount + report.unsupportedCount).toBeGreaterThanOrEqual(
      0,
    );

    // 6. Dedup
    const dedup = dedupCartridge(cartridge);
    expect(dedup.collisions).toEqual([]);

    // 7. Fork
    const forked = forkCartridge(cartridge, {
      newId: 'integration-dept-fork',
      newName: 'Integration Department Fork',
    });
    expect(forked.id).toBe('integration-dept-fork');
    expect(forked.name).toBe('Integration Department Fork');
    expect(forked.provenance.origin).toBe('fork');
    expect(forked.provenance.forkOf).toBe('integration-dept');

    // 8. Fork round-trip: load the forked cartridge through the schema
    //    by re-parsing via validateCartridge
    const forkValidation = validateCartridge(forked);
    expect(forkValidation.valid).toBe(true);

    // 9. Original cartridge file still on disk and still loads
    const reloaded = loadCartridge(cartridgePath);
    expect(reloaded.id).toBe('integration-dept');

    // 10. Scaffolded yaml is readable bytes (ensures no write-corruption)
    const rawText = readFileSync(cartridgePath, 'utf8');
    expect(rawText.length).toBeGreaterThan(0);
    expect(rawText).toContain('integration-dept');
  });

  it('rejects a scaffold into a non-empty directory (safety)', () => {
    const targetDir = join(workDir, 'occupied');
    // First scaffold — works.
    scaffoldCartridge({
      template: 'department',
      targetDir,
      name: 'first',
      trust: 'system',
    });
    // Second scaffold into same dir — refuses.
    expect(() =>
      scaffoldCartridge({
        template: 'department',
        targetDir,
        name: 'second',
        trust: 'system',
      }),
    ).toThrow();
  });

  it('forge cartridge (SC-05) loads end-to-end through the same pipeline', () => {
    const forgePath = resolve(
      'examples',
      'cartridges',
      'cartridge-forge',
      'cartridge.yaml',
    );
    const cartridge = loadCartridge(forgePath);
    expect(cartridge.id).toBe('cartridge-forge');
    const validation = validateCartridge(cartridge);
    expect(validation.valid).toBe(true);
    const report = evalCartridge(cartridge);
    expect(report.failedCount).toBe(0);
    const metrics = collectMetrics(cartridge);
    expect(metrics.skillCount).toBe(6);
    expect(metrics.agentCount).toBe(5);
  });
});
