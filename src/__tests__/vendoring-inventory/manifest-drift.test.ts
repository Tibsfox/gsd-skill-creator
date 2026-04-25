/**
 * OOPS-GSD v1.49.576 — C6 / OGA-065 (inventory drift-control)
 *
 * Verifies INVENTORY-MANIFEST.json matches what the regenerator would
 * produce from the current project-claude/ source-of-truth tree. If a
 * maintainer adds a new command/agent/hook to project-claude/ without
 * regenerating the manifest, this test fails — forcing the manifest
 * to stay in lockstep with the SOT.
 *
 *   CF-MED-065a — INVENTORY-MANIFEST.json exists at repo root
 *   CF-MED-065b — running scripts/generate-inventory-manifest.py --check exits 0
 *   CF-MED-065c — manifest counts are non-negative integers
 *   CF-MED-065d — every committed command/agent/hook entry has a path that exists
 *
 * @module __tests__/vendoring-inventory/manifest-drift
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();
const MANIFEST_PATH = join(REPO_ROOT, 'INVENTORY-MANIFEST.json');
const SCRIPT_PATH = join(REPO_ROOT, 'scripts', 'generate-inventory-manifest.py');

interface Manifest {
  generated_at: string;
  generator_version: string;
  milestone: string;
  counts: {
    commands: number;
    agents_total: number;
    agents_gsd_prefix: number;
    hooks: number;
    src_subsystems: number;
  };
  commands: Array<{ name: string; path: string; origin: string }>;
  agents: Array<{ name: string; path: string; origin: string }>;
  hooks: Array<{ name: string; path: string; origin: string }>;
  src_subsystems?: string[];
}

describe('OGA-065 — INVENTORY-MANIFEST.json drift control', () => {
  it('CF-MED-065a — INVENTORY-MANIFEST.json exists at repo root', () => {
    expect(existsSync(MANIFEST_PATH), `missing ${MANIFEST_PATH}`).toBe(true);
  });

  it('CF-MED-065a-2 — generator script exists', () => {
    expect(existsSync(SCRIPT_PATH), `missing ${SCRIPT_PATH}`).toBe(true);
  });

  it('CF-MED-065b — generator --check passes (no drift)', () => {
    const result = spawnSync('python3', [SCRIPT_PATH, '--check'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(
      result.status,
      `drift detected — regenerate with scripts/generate-inventory-manifest.sh\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    ).toBe(0);
  });

  it('CF-MED-065c — manifest counts are non-negative integers', () => {
    const m: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    for (const [key, val] of Object.entries(m.counts)) {
      expect(Number.isInteger(val), `counts.${key} not integer`).toBe(true);
      expect(val, `counts.${key} negative`).toBeGreaterThanOrEqual(0);
    }
    expect(m.counts.commands).toBe(m.commands.length);
    expect(m.counts.agents_total).toBe(m.agents.length);
    expect(m.counts.hooks).toBe(m.hooks.length);
  });

  it('CF-MED-065d — every committed entry path exists on disk', () => {
    const m: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    for (const entry of [...m.commands, ...m.agents, ...m.hooks]) {
      const full = join(REPO_ROOT, entry.path);
      expect(existsSync(full), `manifest entry path missing: ${entry.path}`).toBe(true);
    }
  });
});
