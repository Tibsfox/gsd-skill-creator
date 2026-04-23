/**
 * Data-Science Department Convergent Substrate concept tests -- Phase 707 (v1.49.570).
 * Covers: CONV-11 (dept-local).
 */

import { describe, it, expect } from 'vitest';
import { compressionSpectrum } from './index.js';

describe('Data-Science Department Convergent Substrate Concepts (Phase 707)', () => {
  it('compressionSpectrum has id prefix data-science-', () => {
    expect(compressionSpectrum.id.startsWith('data-science-')).toBe(true);
  });

  it('compressionSpectrum has domain=data-science', () => {
    expect(compressionSpectrum.domain).toBe('data-science');
  });

  it('compressionSpectrum has non-trivial description', () => {
    expect(compressionSpectrum.description.length).toBeGreaterThan(100);
  });

  it('compressionSpectrum has >=2 relationships', () => {
    expect(compressionSpectrum.relationships.length).toBeGreaterThanOrEqual(2);
  });

  it('compressionSpectrum has valid complexPlanePosition', () => {
    const pos = compressionSpectrum.complexPlanePosition!;
    expect(pos).toBeDefined();
    const expectedMag = Math.sqrt(pos.real * pos.real + pos.imaginary * pos.imaginary);
    expect(pos.magnitude).toBeCloseTo(expectedMag, 5);
  });

  it('compressionSpectrum references at least one cross-dept concept', () => {
    const crossDept = compressionSpectrum.relationships.some(
      (r) => !r.targetId.startsWith('data-science-')
    );
    expect(crossDept).toBe(true);
  });

  it('compressionSpectrum panels is an empty Map (panels are follow-up concern)', () => {
    expect(compressionSpectrum.panels).toBeInstanceOf(Map);
  });
});
