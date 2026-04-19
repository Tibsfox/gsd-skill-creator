/**
 * CF-M7-01 + SC-M7-IND — Markov-blanket type enforcement.
 *
 * The positive suite asserts the runtime helpers produce well-formed
 * states. The negative suite uses `// @ts-expect-error` to force the
 * TypeScript compiler to prove that illegal cross-category assignments
 * fail type-checking. If any of these `@ts-expect-error` lines start
 * compiling, the build breaks — that IS the SC-M7-IND enforcement.
 */

import { describe, it, expect } from 'vitest';
import {
  makeActive,
  makeExternalProxy,
  makeInternal,
  makeSensory,
  makeUniformInternal,
  isWellFormedInternal,
  type ActiveState,
  type ExternalObservationProxy,
  type InternalState,
  type SensoryState,
} from '../blanket.js';

describe('blanket constructors — positive suite', () => {
  it('makeSensory returns a well-formed SensoryState', () => {
    const s = makeSensory(['read:file.ts', 'exec:npm test'], 42);
    expect(s.observations).toEqual(['read:file.ts', 'exec:npm test']);
    expect(s.ts).toBe(42);
  });

  it('makeActive returns a well-formed ActiveState', () => {
    const a = makeActive(['suggest:gsd-docs-update'], 99);
    expect(a.actions).toEqual(['suggest:gsd-docs-update']);
    expect(a.ts).toBe(99);
  });

  it('makeInternal normalises the intent distribution', () => {
    const i = makeInternal({ refactor: 2, ship: 3, explore: 5 });
    expect(isWellFormedInternal(i)).toBe(true);
    const sum = Object.values(i.intentDist).reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(1, 9);
    expect(i.intentDist.refactor).toBeCloseTo(0.2, 9);
    expect(i.intentDist.ship).toBeCloseTo(0.3, 9);
    expect(i.intentDist.explore).toBeCloseTo(0.5, 9);
  });

  it('makeUniformInternal distributes mass evenly', () => {
    const i = makeUniformInternal(['a', 'b', 'c', 'd']);
    for (const v of Object.values(i.intentDist)) expect(v).toBeCloseTo(0.25, 9);
    expect(isWellFormedInternal(i)).toBe(true);
  });

  it('makeUniformInternal on empty list is well-formed (trivially)', () => {
    const i = makeUniformInternal([]);
    expect(isWellFormedInternal(i)).toBe(true);
    expect(Object.keys(i.intentDist)).toHaveLength(0);
  });

  it('makeInternal with all-zero weights produces zero-normalised dist', () => {
    const i = makeInternal({ a: 0, b: 0 });
    expect(i.intentDist.a).toBe(0);
    expect(i.intentDist.b).toBe(0);
  });

  it('makeExternalProxy only carries the identifier', () => {
    const e = makeExternalProxy('developer-mind');
    expect(e.proxyOf).toBe('developer-mind');
  });
});

describe('CF-M7-01 / SC-M7-IND — illegal cross-category references don’t compile', () => {
  it('rejects SensoryState being passed where ActiveState is required', () => {
    const s: SensoryState = makeSensory(['x']);
    function needsActive(_a: ActiveState): void {}
    // @ts-expect-error SensoryState is not assignable to ActiveState
    needsActive(s);
    expect(s.observations).toEqual(['x']); // runtime no-op to keep suite green
  });

  it('rejects ActiveState being passed where InternalState is required', () => {
    const a: ActiveState = makeActive(['a']);
    function needsInternal(_i: InternalState): void {}
    // @ts-expect-error ActiveState is not assignable to InternalState
    needsInternal(a);
    expect(a.actions).toEqual(['a']);
  });

  it('rejects InternalState being passed where SensoryState is required', () => {
    const i: InternalState = makeUniformInternal(['p', 'q']);
    function needsSensory(_s: SensoryState): void {}
    // @ts-expect-error InternalState is not assignable to SensoryState
    needsSensory(i);
    expect(Object.keys(i.intentDist)).toHaveLength(2);
  });

  it('rejects ExternalObservationProxy being passed where SensoryState is required', () => {
    const e: ExternalObservationProxy = makeExternalProxy('developer');
    function needsSensory(_s: SensoryState): void {}
    // @ts-expect-error ExternalObservationProxy is not assignable to SensoryState
    needsSensory(e);
    expect(e.proxyOf).toBe('developer');
  });

  it('rejects plain object literal (no brand) being passed as SensoryState', () => {
    function needsSensory(_s: SensoryState): void {}
    // @ts-expect-error unbranded object literal is not assignable to SensoryState
    needsSensory({ observations: ['x'], ts: 0 });
    expect(true).toBe(true);
  });
});

describe('isWellFormedInternal', () => {
  it('accepts a normalised distribution', () => {
    expect(
      isWellFormedInternal(makeInternal({ a: 0.3, b: 0.7 })),
    ).toBe(true);
  });

  it('rejects a non-normalised distribution built by bypassing the constructor', () => {
    const malformed = { intentDist: { a: 0.3, b: 0.3 } } as unknown as InternalState;
    expect(isWellFormedInternal(malformed)).toBe(false);
  });

  it('rejects NaN / negative / infinite probabilities', () => {
    const nanDist = { intentDist: { a: Number.NaN, b: 1 } } as unknown as InternalState;
    expect(isWellFormedInternal(nanDist)).toBe(false);
    const negDist = { intentDist: { a: -0.1, b: 1.1 } } as unknown as InternalState;
    expect(isWellFormedInternal(negDist)).toBe(false);
  });
});
