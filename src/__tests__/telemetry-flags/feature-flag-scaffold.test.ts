/**
 * CF-H-002 — Feature flag scaffolding (CC-6: aligned to the gsd-skill-creator namespace).
 *
 * Asserts:
 *  1. project-claude/settings.json exposes feature_flags under the
 *     `gsd-skill-creator` namespace (the config contract read by
 *     src/settings/read-settings.ts) and NOT as a top-level key, since the
 *     harness settings schema rejects unknown top-level keys.
 *  2. The object has >=44 slots
 *  3. Every slot defaults to boolean `false`
 *  4. The opt-in pattern is intact: no slot defaults to a truthy value
 *
 * Closes the test arm of OGA-002.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const SETTINGS = join(REPO_ROOT, 'project-claude', 'settings.json');

function readSettings(): Record<string, unknown> {
  return JSON.parse(readFileSync(SETTINGS, 'utf8'));
}

function featureFlags(): Record<string, unknown> {
  const scope = readSettings()['gsd-skill-creator'] as Record<string, unknown> | undefined;
  return scope?.feature_flags as Record<string, unknown>;
}

describe('CF-H-002: feature_flags scaffolding', () => {
  it('feature_flags lives under the gsd-skill-creator namespace, not top-level', () => {
    const settings = readSettings();
    expect(
      settings.feature_flags,
      'feature_flags must NOT be a top-level key — the harness settings schema rejects unknown top-level keys',
    ).toBeUndefined();
    const ff = featureFlags();
    expect(ff).toBeDefined();
    expect(typeof ff).toBe('object');
    expect(Array.isArray(ff)).toBe(false);
  });

  it('has >=44 slots', () => {
    expect(Object.keys(featureFlags()).length).toBeGreaterThanOrEqual(44);
  });

  it('every slot defaults to boolean false', () => {
    for (const [k, v] of Object.entries(featureFlags())) {
      expect(typeof v, `${k} must be a boolean`).toBe('boolean');
      expect(v, `${k} must default to false`).toBe(false);
    }
  });

  it('contains the documented anchor flags from C5 spec', () => {
    const ff = featureFlags();
    const anchors = [
      'autonomous_phase_execution',
      'memory_scorer_aggressive_threshold',
      'experimental_runtime_pi',
      'bounded_learning_disabled',
    ];
    for (const a of anchors) {
      expect(ff[a], `${a} must be present`).toBe(false);
    }
  });
});
