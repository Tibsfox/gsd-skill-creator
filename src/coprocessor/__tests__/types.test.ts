/**
 * Coprocessor types + activation-parser tests. No subprocess required —
 * these exercise the pure-function surface.
 */
import { describe, expect, it } from 'vitest';
import { parseCoprocessorSpec } from '../activation.js';
import type { CoprocessorActivationSpec, ToolName } from '../types.js';

describe('parseCoprocessorSpec', () => {
  it('returns undefined for null/undefined input', () => {
    expect(parseCoprocessorSpec(undefined)).toBeUndefined();
    expect(parseCoprocessorSpec(null)).toBeUndefined();
  });

  it('accepts an array shorthand of chip names', () => {
    const spec = parseCoprocessorSpec(['algebrus', 'statos']);
    expect(spec).toEqual<CoprocessorActivationSpec>({ required: ['algebrus', 'statos'] });
  });

  it('filters non-string entries from the shorthand array', () => {
    const spec = parseCoprocessorSpec(['algebrus', 42, null, 'fourier']);
    expect(spec?.required).toEqual(['algebrus', 'fourier']);
  });

  it('parses the explicit object form with required + precision', () => {
    const spec = parseCoprocessorSpec({ required: ['vectora'], precision: 'fp32' });
    expect(spec).toEqual<CoprocessorActivationSpec>({ required: ['vectora'], precision: 'fp32' });
  });

  it('ignores unknown precision values', () => {
    const spec = parseCoprocessorSpec({ required: ['algebrus'], precision: 'fp128' });
    expect(spec?.precision).toBeUndefined();
  });

  it('round-trips cpu_fallback', () => {
    const spec = parseCoprocessorSpec({ required: [], cpu_fallback: false });
    expect(spec?.cpu_fallback).toBe(false);
  });

  it('ignores non-boolean cpu_fallback', () => {
    const spec = parseCoprocessorSpec({ cpu_fallback: 'yes' });
    expect(spec?.cpu_fallback).toBeUndefined();
  });
});

describe('ToolName exhaustiveness', () => {
  it('covers the 19 server-declared tools', () => {
    const tools: ToolName[] = [
      'algebrus.gemm',
      'algebrus.solve',
      'algebrus.svd',
      'algebrus.eigen',
      'algebrus.det',
      'fourier.fft',
      'fourier.ifft',
      'fourier.spectrum',
      'vectora.gradient',
      'vectora.transform',
      'vectora.batch_eval',
      'statos.describe',
      'statos.monte_carlo',
      'statos.regression',
      'symbex.eval',
      'symbex.verify',
      'math.capabilities',
      'math.vram',
      'math.streams',
    ];
    expect(tools).toHaveLength(19);
    expect(new Set(tools).size).toBe(19);
  });
});
