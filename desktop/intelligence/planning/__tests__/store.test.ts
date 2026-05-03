/**
 * Phase 824 / C08 T2 — Observable store tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { Store, createIntelligenceStore } from '../store.js';

describe('Store — subscribe + dispatch', () => {
  it('subscribe fires callback on initial-change dispatch', () => {
    const store = new Store({ count: 0, name: 'a' });
    const cb = vi.fn();
    store.subscribe(s => s.count, cb);
    store.dispatch(() => ({ count: 1 }));
    expect(cb).toHaveBeenCalledWith(1);
  });

  it('subscribe does not fire if slice unchanged', () => {
    const store = new Store({ count: 0, name: 'a' });
    const cb = vi.fn();
    store.subscribe(s => s.count, cb);
    store.dispatch(() => ({ name: 'b' })); // only name changes
    expect(cb).not.toHaveBeenCalled();
  });

  it('two subscribers to different slices receive updates independently', () => {
    const store = new Store({ a: 1, b: 2 });
    const cbA = vi.fn();
    const cbB = vi.fn();
    store.subscribe(s => s.a, cbA);
    store.subscribe(s => s.b, cbB);
    store.dispatch(() => ({ a: 10 }));
    expect(cbA).toHaveBeenCalledWith(10);
    expect(cbB).not.toHaveBeenCalled();
    store.dispatch(() => ({ b: 20 }));
    expect(cbB).toHaveBeenCalledWith(20);
    expect(cbA).toHaveBeenCalledTimes(1); // still only once
  });

  it('unsubscribe stops further callbacks', () => {
    const store = new Store({ x: 0 });
    const cb = vi.fn();
    const unsub = store.subscribe(s => s.x, cb);
    store.dispatch(() => ({ x: 1 }));
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
    store.dispatch(() => ({ x: 2 }));
    expect(cb).toHaveBeenCalledTimes(1); // not called again
  });

  it('dispatch merges partial state', () => {
    const store = new Store({ a: 1, b: 2, c: 3 });
    store.dispatch(() => ({ a: 10 }));
    expect(store.get().b).toBe(2);
    expect(store.get().c).toBe(3);
    expect(store.get().a).toBe(10);
  });

  it('deep equal arrays — no spurious fire when contents unchanged', () => {
    const store = new Store({ items: [1, 2, 3] });
    const cb = vi.fn();
    store.subscribe(s => s.items, cb);
    store.dispatch(() => ({ items: [1, 2, 3] })); // same content
    expect(cb).not.toHaveBeenCalled();
  });

  it('deep equal arrays — fires when contents change', () => {
    const store = new Store({ items: [1, 2, 3] });
    const cb = vi.fn();
    store.subscribe(s => s.items, cb);
    store.dispatch(() => ({ items: [1, 2, 4] }));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('Map slice changes detected correctly', () => {
    const m1 = new Map([['k', 'v1']]);
    const store = new Store({ map: m1 });
    const cb = vi.fn();
    store.subscribe(s => s.map, cb);
    store.dispatch(() => ({ map: new Map([['k', 'v2']]) }));
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('createIntelligenceStore', () => {
  it('creates store with correct initial state', () => {
    const store = createIntelligenceStore();
    const state = store.get();
    expect(state.projects).toEqual([]);
    expect(state.expandedProjectId).toBeNull();
    expect(state.sortMode).toBe('recent');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.meetings instanceof Map).toBe(true);
    expect(state.briefings instanceof Map).toBe(true);
  });

  it('expandedProjectId can be updated', () => {
    const store = createIntelligenceStore();
    store.dispatch(() => ({ expandedProjectId: 'my-project' }));
    expect(store.get().expandedProjectId).toBe('my-project');
  });
});
