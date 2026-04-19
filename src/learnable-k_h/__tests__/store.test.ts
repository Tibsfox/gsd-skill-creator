/**
 * MD-5 — Store tests: per-skill isolation, CRUD, serialization round-trip.
 */

import { describe, it, expect } from 'vitest';
import { createHead } from '../head.js';
import {
  createStore,
  get,
  getOrCreate,
  has,
  put,
  remove,
  clear,
  size,
  serialize,
  deserialize,
  STORE_FORMAT_VERSION,
} from '../store.js';

describe('store — basic CRUD', () => {
  it('empty store has size 0', () => {
    const s = createStore();
    expect(size(s)).toBe(0);
    expect(has(s, 'foo')).toBe(false);
    expect(get(s, 'foo')).toBeUndefined();
  });

  it('put + get + remove', () => {
    const s = createStore();
    const h = createHead({ skillId: 'foo', dim: 2, kHMin: 0, kHMax: 1 });
    put(s, h);
    expect(size(s)).toBe(1);
    expect(has(s, 'foo')).toBe(true);
    expect(get(s, 'foo')).toBe(h);
    expect(remove(s, 'foo')).toBe(true);
    expect(remove(s, 'foo')).toBe(false);
    expect(size(s)).toBe(0);
  });

  it('clear removes all heads', () => {
    const s = createStore();
    put(s, createHead({ skillId: 'a', dim: 1, kHMin: 0, kHMax: 1 }));
    put(s, createHead({ skillId: 'b', dim: 1, kHMin: 0, kHMax: 1 }));
    clear(s);
    expect(size(s)).toBe(0);
  });
});

describe('getOrCreate — idempotent allocation', () => {
  it('returns existing head on repeat call', () => {
    const s = createStore();
    const first = getOrCreate(s, 'x', () =>
      createHead({ skillId: 'x', dim: 3, kHMin: 0.5, kHMax: 2.0 }),
    );
    let factoryCalls = 0;
    const second = getOrCreate(s, 'x', () => {
      factoryCalls += 1;
      return createHead({ skillId: 'x', dim: 3, kHMin: 0.5, kHMax: 2.0 });
    });
    expect(first).toBe(second);
    expect(factoryCalls).toBe(0);
  });

  it('rejects when factory produces a head with a different skillId', () => {
    const s = createStore();
    expect(() =>
      getOrCreate(s, 'x', () =>
        createHead({ skillId: 'y', dim: 1, kHMin: 0, kHMax: 1 }),
      ),
    ).toThrow();
  });
});

describe('store — per-skill isolation', () => {
  it('mutating skill A does not affect skill B', () => {
    const s = createStore();
    const a = getOrCreate(s, 'A', () =>
      createHead({ skillId: 'A', dim: 2, kHMin: 0, kHMax: 1 }),
    );
    const b = getOrCreate(s, 'B', () =>
      createHead({ skillId: 'B', dim: 2, kHMin: 0, kHMax: 1 }),
    );
    a.weights[0] = 42;
    a.bias = 3;
    a.updateCount = 5;
    expect(b.weights).toEqual([0, 0]);
    expect(b.bias).toBe(0);
    expect(b.updateCount).toBe(0);
  });
});

describe('serialize / deserialize — round-trip', () => {
  it('empty store: round-trip yields empty store with correct version', () => {
    const s = createStore();
    const json = serialize(s);
    const parsed = JSON.parse(json) as { version: number; heads: unknown[] };
    expect(parsed.version).toBe(STORE_FORMAT_VERSION);
    expect(parsed.heads).toEqual([]);
    const r = deserialize(json);
    expect(size(r)).toBe(0);
  });

  it('non-empty store: round-trips exactly (including updateCount + weights)', () => {
    const s = createStore();
    const a = getOrCreate(s, 'A', () =>
      createHead({ skillId: 'A', dim: 3, kHMin: 0.5, kHMax: 2.0 }),
    );
    a.weights[0] = 0.1;
    a.weights[1] = -0.7;
    a.weights[2] = 1.3;
    a.bias = -0.5;
    a.updateCount = 42;

    const b = getOrCreate(s, 'B', () =>
      createHead({ skillId: 'B', dim: 2, kHMin: 0, kHMax: 1 }),
    );
    b.bias = 0.25;
    b.updateCount = 1;

    const json = serialize(s);
    const r = deserialize(json);
    expect(size(r)).toBe(2);
    const ra = get(r, 'A')!;
    const rb = get(r, 'B')!;
    expect(ra.dim).toBe(3);
    expect(ra.kHMin).toBe(0.5);
    expect(ra.kHMax).toBe(2.0);
    expect(ra.weights).toEqual([0.1, -0.7, 1.3]);
    expect(ra.bias).toBe(-0.5);
    expect(ra.updateCount).toBe(42);
    expect(rb.dim).toBe(2);
    expect(rb.bias).toBe(0.25);
    expect(rb.updateCount).toBe(1);
  });

  it('deserialize: deterministic skill ordering in the payload (sorted ascending)', () => {
    const s = createStore();
    put(s, createHead({ skillId: 'zebra', dim: 1, kHMin: 0, kHMax: 1 }));
    put(s, createHead({ skillId: 'apple', dim: 1, kHMin: 0, kHMax: 1 }));
    put(s, createHead({ skillId: 'mango', dim: 1, kHMin: 0, kHMax: 1 }));
    const json = serialize(s);
    const parsed = JSON.parse(json) as { heads: Array<{ skillId: string }> };
    expect(parsed.heads.map((h) => h.skillId)).toEqual(['apple', 'mango', 'zebra']);
  });

  it('deserialize: malformed JSON → empty store (fail-safe)', () => {
    expect(size(deserialize('not-json'))).toBe(0);
    expect(size(deserialize('null'))).toBe(0);
    expect(size(deserialize('{}'))).toBe(0);
    expect(size(deserialize('{"version":999,"heads":[]}'))).toBe(0);
  });

  it('deserialize: skips entries with non-finite weights', () => {
    const poisoned = JSON.stringify({
      version: STORE_FORMAT_VERSION,
      heads: [
        {
          skillId: 'bad',
          dim: 2,
          kHMin: 0,
          kHMax: 1,
          weights: [1, Number.NaN],
          bias: 0,
          updateCount: 0,
        },
        {
          skillId: 'good',
          dim: 1,
          kHMin: 0,
          kHMax: 1,
          weights: [0.5],
          bias: 0,
          updateCount: 0,
        },
      ],
    });
    const r = deserialize(poisoned);
    expect(size(r)).toBe(1);
    expect(has(r, 'bad')).toBe(false);
    expect(has(r, 'good')).toBe(true);
  });
});
