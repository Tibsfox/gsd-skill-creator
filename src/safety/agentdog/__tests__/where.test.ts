/**
 * HB-02 AgentDoG — `Where` axis tests.
 */

import { describe, it, expect } from 'vitest';
import { captureWhereAxis } from '../where.js';

describe('AgentDoG — Where axis', () => {
  it('captures component + invocation context verbatim', () => {
    const w = captureWhereAxis({
      component: 'skill:foo',
      invocationContext: 'phase:807,wave:HB-02',
    });
    expect(w.component).toBe('skill:foo');
    expect(w.invocationContext).toBe('phase:807,wave:HB-02');
  });

  it('returns empty strings on missing inputs (BLOCK never lost)', () => {
    const w = captureWhereAxis({});
    expect(w.component).toBe('');
    expect(w.invocationContext).toBe('');
  });

  it('returns empty strings on non-string inputs (defensive)', () => {
    const w = captureWhereAxis({
      component: 42 as unknown as string,
      invocationContext: undefined,
    });
    expect(w.component).toBe('');
    expect(w.invocationContext).toBe('');
  });

  it('captured axis is frozen (immutable)', () => {
    const w = captureWhereAxis({ component: 'x', invocationContext: 'y' });
    expect(Object.isFrozen(w)).toBe(true);
    expect(() => {
      (w as { component: string }).component = 'mutated';
    }).toThrow();
  });
});
