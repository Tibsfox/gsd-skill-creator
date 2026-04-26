/**
 * CF-H-002 — Feature flag scaffolding.
 *
 * Asserts:
 *  1. project-claude/settings.json contains a top-level `feature_flags` object
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

describe('CF-H-002: feature_flags scaffolding', () => {
  it('feature_flags object is present at the top level', () => {
    const settings = JSON.parse(readFileSync(SETTINGS, 'utf8'));
    expect(settings.feature_flags).toBeDefined();
    expect(typeof settings.feature_flags).toBe('object');
    expect(Array.isArray(settings.feature_flags)).toBe(false);
  });

  it('has >=44 slots', () => {
    const settings = JSON.parse(readFileSync(SETTINGS, 'utf8'));
    const keys = Object.keys(settings.feature_flags);
    expect(keys.length).toBeGreaterThanOrEqual(44);
  });

  it('every slot defaults to boolean false', () => {
    const settings = JSON.parse(readFileSync(SETTINGS, 'utf8'));
    for (const [k, v] of Object.entries(settings.feature_flags)) {
      expect(typeof v, `${k} must be a boolean`).toBe('boolean');
      expect(v, `${k} must default to false`).toBe(false);
    }
  });

  it('contains the documented anchor flags from C5 spec', () => {
    const settings = JSON.parse(readFileSync(SETTINGS, 'utf8'));
    const anchors = [
      'autonomous_phase_execution',
      'memory_scorer_aggressive_threshold',
      'experimental_runtime_pi',
      'bounded_learning_disabled',
    ];
    for (const a of anchors) {
      expect(settings.feature_flags[a], `${a} must be present`).toBe(false);
    }
  });
});
