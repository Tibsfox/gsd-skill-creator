/**
 * Component 03 — svgo-config.ts unit tests.
 *
 * Verifies the SVGO config builder:
 *   - preserveRoundTrip=false: a11y-only config
 *   - preserveRoundTrip=true: adds round-trip protections
 *   - Substrate invariants: removeTitle/removeDesc/removeMetadata ALWAYS false
 */

import { describe, it, expect } from 'vitest';
import { createSvgoConfig } from '../svgo-config.js';

describe('createSvgoConfig — default (preserveRoundTrip=false)', () => {
  it('returns a config with multipass=true', () => {
    const config = createSvgoConfig();
    expect(config.multipass).toBe(true);
  });

  it('has a preset-default plugin', () => {
    const config = createSvgoConfig();
    const preset = config.plugins.find((p) => p.name === 'preset-default');
    expect(preset).toBeDefined();
  });

  it('SUBSTRATE INVARIANT: removeTitle is false', () => {
    const config = createSvgoConfig({ preserveRoundTrip: false });
    const preset = config.plugins.find((p) => p.name === 'preset-default');
    const overrides = (preset?.params as Record<string, unknown>)?.['overrides'] as Record<string, unknown>;
    expect(overrides?.['removeTitle']).toBe(false);
  });

  it('SUBSTRATE INVARIANT: removeDesc is false', () => {
    const config = createSvgoConfig({ preserveRoundTrip: false });
    const preset = config.plugins.find((p) => p.name === 'preset-default');
    const overrides = (preset?.params as Record<string, unknown>)?.['overrides'] as Record<string, unknown>;
    expect(overrides?.['removeDesc']).toBe(false);
  });

  it('SUBSTRATE INVARIANT: removeMetadata is false', () => {
    const config = createSvgoConfig({ preserveRoundTrip: false });
    const preset = config.plugins.find((p) => p.name === 'preset-default');
    const overrides = (preset?.params as Record<string, unknown>)?.['overrides'] as Record<string, unknown>;
    expect(overrides?.['removeMetadata']).toBe(false);
  });

  it('preserves aria-* attributes via removeAttrs plugin', () => {
    const config = createSvgoConfig();
    const removeAttrs = config.plugins.find((p) => p.name === 'removeAttrs');
    expect(removeAttrs).toBeDefined();
    const preserveAttrs = (removeAttrs?.params as Record<string, unknown>)?.['preserveAttrs'] as string[];
    expect(preserveAttrs).toContain('aria-.*');
    expect(preserveAttrs).toContain('role');
  });

  it('does NOT include extra round-trip plugins when preserveRoundTrip=false', () => {
    const config = createSvgoConfig({ preserveRoundTrip: false });
    const removeUnknowns = config.plugins.find(
      (p) => p.name === 'removeUnknownsAndDefaults',
    );
    expect(removeUnknowns).toBeUndefined();
  });

  it('no js2svg pretty-printing in baseline mode', () => {
    const config = createSvgoConfig();
    expect(config.js2svg).toBeUndefined();
  });
});

describe('createSvgoConfig — preserveRoundTrip=true', () => {
  it('SUBSTRATE INVARIANT: removeTitle is false', () => {
    const config = createSvgoConfig({ preserveRoundTrip: true });
    const preset = config.plugins.find((p) => p.name === 'preset-default');
    const overrides = (preset?.params as Record<string, unknown>)?.['overrides'] as Record<string, unknown>;
    expect(overrides?.['removeTitle']).toBe(false);
  });

  it('SUBSTRATE INVARIANT: removeDesc is false', () => {
    const config = createSvgoConfig({ preserveRoundTrip: true });
    const preset = config.plugins.find((p) => p.name === 'preset-default');
    const overrides = (preset?.params as Record<string, unknown>)?.['overrides'] as Record<string, unknown>;
    expect(overrides?.['removeDesc']).toBe(false);
  });

  it('SUBSTRATE INVARIANT: removeMetadata is false', () => {
    const config = createSvgoConfig({ preserveRoundTrip: true });
    const preset = config.plugins.find((p) => p.name === 'preset-default');
    const overrides = (preset?.params as Record<string, unknown>)?.['overrides'] as Record<string, unknown>;
    expect(overrides?.['removeMetadata']).toBe(false);
  });

  it('cleanupIds is false to preserve SCRIBE node IDs', () => {
    const config = createSvgoConfig({ preserveRoundTrip: true });
    const preset = config.plugins.find((p) => p.name === 'preset-default');
    const overrides = (preset?.params as Record<string, unknown>)?.['overrides'] as Record<string, unknown>;
    expect(overrides?.['cleanupIds']).toBe(false);
  });

  it('removeUnknownsAndDefaults preserves data-* and aria attrs', () => {
    const config = createSvgoConfig({ preserveRoundTrip: true });
    const preset = config.plugins.find((p) => p.name === 'preset-default');
    const overrides = (preset?.params as Record<string, unknown>)?.['overrides'] as Record<string, unknown>;
    const rud = overrides?.['removeUnknownsAndDefaults'] as Record<string, unknown>;
    expect(rud?.['keepDataAttrs']).toBe(true);
    expect(rud?.['keepAriaAttrs']).toBe(true);
    expect(rud?.['unknownContent']).toBe(false);
  });

  it('includes explicit removeUnknownsAndDefaults standalone plugin', () => {
    const config = createSvgoConfig({ preserveRoundTrip: true });
    const standalone = config.plugins.find(
      (p) => p.name === 'removeUnknownsAndDefaults',
    );
    expect(standalone).toBeDefined();
  });

  it('adds js2svg pretty-printing for human-readable round-trip SVGs', () => {
    const config = createSvgoConfig({ preserveRoundTrip: true });
    expect(config.js2svg).toBeDefined();
    expect((config.js2svg as Record<string, unknown>)?.['pretty']).toBe(true);
  });
});

describe('createSvgoConfig — config object shape', () => {
  it('returns a frozen-like object (plugins is a readonly array)', () => {
    const config = createSvgoConfig();
    // plugins is ReadonlyArray — attempting mutation should be a TS error,
    // but we verify the array exists and has the right entries.
    expect(Array.isArray(config.plugins)).toBe(true);
    expect(config.plugins.length).toBeGreaterThanOrEqual(2);
  });

  it('default call (no args) returns the same as preserveRoundTrip=false', () => {
    const a = createSvgoConfig();
    const b = createSvgoConfig({ preserveRoundTrip: false });
    // Both should have the same plugin count and same plugin names.
    expect(a.plugins.length).toBe(b.plugins.length);
    expect(a.plugins.map((p) => p.name)).toEqual(b.plugins.map((p) => p.name));
  });
});
