/**
 * SCRIBE Build-Out v1.49.621 — Component 09 substrate-conformance test.
 *
 * Both SVGO config modes (preserveRoundTrip true + false) must opt out of
 *   - removeTitle
 *   - removeDesc
 *   - removeMetadata
 *
 * Title + desc are the accessible name + description; metadata carries
 * SCRIBE round-trip provenance. Silently dropping any of these would
 * delete a11y semantics and round-trip provenance simultaneously.
 */
import { describe, it, expect } from 'vitest';

import { createSvgoConfig } from '../../../svg-validator/svgo-config.js';

interface PluginOverrides {
  readonly overrides?: Record<string, unknown>;
}

function findPresetDefaultOverrides(
  config: ReturnType<typeof createSvgoConfig>,
): Record<string, unknown> {
  const presetDefault = config.plugins.find((p) => p.name === 'preset-default');
  expect(presetDefault).toBeDefined();
  const params = presetDefault?.params as PluginOverrides | undefined;
  expect(params).toBeDefined();
  expect(params?.overrides).toBeDefined();
  return params!.overrides as Record<string, unknown>;
}

describe('substrate-conformance: SVGO config opts out of metadata stripping', () => {
  for (const preserveRoundTrip of [true, false]) {
    describe(`preserveRoundTrip=${preserveRoundTrip}`, () => {
      const config = createSvgoConfig({ preserveRoundTrip });

      it('opts out of removeTitle (BLOCKER substrate invariant)', () => {
        const overrides = findPresetDefaultOverrides(config);
        expect(overrides.removeTitle).toBe(false);
      });

      it('opts out of removeDesc (BLOCKER substrate invariant)', () => {
        const overrides = findPresetDefaultOverrides(config);
        expect(overrides.removeDesc).toBe(false);
      });

      it('opts out of removeMetadata (BLOCKER substrate invariant)', () => {
        const overrides = findPresetDefaultOverrides(config);
        expect(overrides.removeMetadata).toBe(false);
      });

      it('preserves aria-* attributes via the removeAttrs preserveAttrs list', () => {
        const removeAttrs = config.plugins.find((p) => p.name === 'removeAttrs');
        expect(removeAttrs).toBeDefined();
        const params = removeAttrs?.params as
          | { preserveAttrs?: ReadonlyArray<string> }
          | undefined;
        expect(params?.preserveAttrs).toBeDefined();
        expect(params?.preserveAttrs).toContain('aria-.*');
        expect(params?.preserveAttrs).toContain('role');
      });
    });
  }

  it('round-trip mode additionally pins cleanupIds=false to keep SCRIBE node IDs stable', () => {
    const config = createSvgoConfig({ preserveRoundTrip: true });
    const overrides = findPresetDefaultOverrides(config);
    expect(overrides.cleanupIds).toBe(false);
  });
});
