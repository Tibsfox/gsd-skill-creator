/**
 * Tests for the amiga.min_sequence_count config key (v1.49.1027).
 *
 * Covers schema acceptance, clamping, and default behavior.
 */

import { describe, it, expect } from 'vitest';
import { IntegrationConfigSchema } from './schema.js';

describe('amiga.min_sequence_count config schema (v1.49.1027)', () => {
  it('defaults to 2 when amiga block is absent', () => {
    const cfg = IntegrationConfigSchema.parse({});
    expect(cfg.amiga.min_sequence_count).toBe(2);
  });

  it('defaults to 2 when amiga block is present but key absent', () => {
    const cfg = IntegrationConfigSchema.parse({ amiga: {} });
    expect(cfg.amiga.min_sequence_count).toBe(2);
  });

  it('accepts min value 1', () => {
    const cfg = IntegrationConfigSchema.parse({ amiga: { min_sequence_count: 1 } });
    expect(cfg.amiga.min_sequence_count).toBe(1);
  });

  it('accepts max value 20', () => {
    const cfg = IntegrationConfigSchema.parse({ amiga: { min_sequence_count: 20 } });
    expect(cfg.amiga.min_sequence_count).toBe(20);
  });

  it('accepts an intermediate value', () => {
    const cfg = IntegrationConfigSchema.parse({ amiga: { min_sequence_count: 5 } });
    expect(cfg.amiga.min_sequence_count).toBe(5);
  });

  it('rejects values below 1', () => {
    expect(() => IntegrationConfigSchema.parse({ amiga: { min_sequence_count: 0 } })).toThrow();
  });

  it('rejects values above 20', () => {
    expect(() => IntegrationConfigSchema.parse({ amiga: { min_sequence_count: 21 } })).toThrow();
  });

  it('rejects non-integer float values', () => {
    expect(() => IntegrationConfigSchema.parse({ amiga: { min_sequence_count: 2.5 } })).toThrow();
  });

  it('rejects string values', () => {
    expect(() => IntegrationConfigSchema.parse({ amiga: { min_sequence_count: 'three' } })).toThrow();
  });
});
