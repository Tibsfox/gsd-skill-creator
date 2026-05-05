/**
 * coordinator.ts — unit tests (minimum 8).
 *
 * No DOM globals needed beyond what jsdom provides.
 * hashchange events are fired manually.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCoordinator } from '../coordinator.js';
import type { CoordinatedView } from '../coordinator.js';
import type { Focus } from '../focus-state.js';

function makeView(): CoordinatedView & { calls: Focus[]; missionCalls: Array<string | null> } {
  const calls: Focus[] = [];
  const missionCalls: Array<string | null> = [];
  return {
    calls,
    missionCalls,
    setFocus(f: Focus) { calls.push(f); },
    setMissionFilter(id: string | null) { missionCalls.push(id); },
  };
}

describe('Coordinator', () => {
  it('dispatches focus to all registered views', () => {
    const c = createCoordinator();
    const v1 = makeView();
    const v2 = makeView();
    c.registerView(v1);
    c.registerView(v2);

    c.dispatch({ kind: 'file', id: 'src/foo.ts' });

    expect(v1.calls).toHaveLength(1);
    expect(v1.calls[0]).toEqual({ kind: 'file', id: 'src/foo.ts' });
    expect(v2.calls).toHaveLength(1);
    expect(v2.calls[0]).toEqual({ kind: 'file', id: 'src/foo.ts' });
  });

  it('does NOT send setFocus back to the source view', () => {
    const c = createCoordinator();
    const src = makeView();
    const other = makeView();
    c.registerView(src);
    c.registerView(other);

    c.dispatch({ kind: 'symbol', id: 'sym-1' }, src);

    expect(src.calls).toHaveLength(0);
    expect(other.calls).toHaveLength(1);
  });

  it('no-ops when focus is identical to current', () => {
    const c = createCoordinator();
    const v = makeView();
    c.registerView(v);
    const focus: Focus = { kind: 'mission', id: 'v1.49.606' };

    c.dispatch(focus);
    c.dispatch({ ...focus }); // same kind + id

    expect(v.calls).toHaveLength(1);
  });

  it('subscribe API receives every change', () => {
    const c = createCoordinator();
    const received: Array<Focus | null> = [];
    c.subscribe((f) => received.push(f));

    c.dispatch({ kind: 'file', id: 'a.ts' });
    c.dispatch({ kind: 'folder', id: 'src' });
    c.dispatch(null);

    expect(received).toHaveLength(3);
    expect(received[2]).toBeNull();
  });

  it('unsubscribe stops notifications', () => {
    const c = createCoordinator();
    const received: Array<Focus | null> = [];
    const unsub = c.subscribe((f) => received.push(f));

    c.dispatch({ kind: 'file', id: 'a.ts' });
    unsub();
    c.dispatch({ kind: 'file', id: 'b.ts' });

    expect(received).toHaveLength(1);
  });

  it('current() returns the last dispatched focus', () => {
    const c = createCoordinator();
    expect(c.current()).toBeNull();

    c.dispatch({ kind: 'symbol', id: 's1' });
    expect(c.current()).toEqual({ kind: 'symbol', id: 's1' });
  });

  it('hashchange event triggers setFocus on views', () => {
    const c = createCoordinator();
    const v = makeView();
    c.registerView(v);
    const detach = c.attachHashRouting();

    // Manually set hash and fire hashchange
    window.location.hash = '#atlas/file/src/bar.ts';
    window.dispatchEvent(new Event('hashchange'));

    expect(v.calls.length).toBeGreaterThanOrEqual(1);
    const last = v.calls[v.calls.length - 1];
    expect(last).toEqual({ kind: 'file', id: 'src/bar.ts' });

    detach();
  });

  it('unregistered view no longer receives focus updates', () => {
    const c = createCoordinator();
    const v = makeView();
    const unreg = c.registerView(v);
    c.dispatch({ kind: 'file', id: 'a.ts' });
    unreg();
    c.dispatch({ kind: 'file', id: 'b.ts' });

    expect(v.calls).toHaveLength(1);
  });

  it('newly registered view receives current focus immediately', () => {
    const c = createCoordinator();
    c.dispatch({ kind: 'mission', id: 'm1' });
    const v = makeView();
    c.registerView(v);

    expect(v.calls).toHaveLength(1);
    expect(v.calls[0]).toEqual({ kind: 'mission', id: 'm1' });
  });

  it('announcer text is updated on symbol focus', () => {
    const c = createCoordinator();
    const el = document.createElement('div');
    c.attachAnnouncer(el);
    c.dispatch({ kind: 'symbol', id: 'parseHash' });
    expect(el.textContent).toBe('focused symbol: parseHash');
  });

  it('announcer text is updated on mission focus and cleared on null', () => {
    const c = createCoordinator();
    const el = document.createElement('div');
    c.attachAnnouncer(el);
    c.dispatch({ kind: 'mission', id: 'v1.49.607' });
    expect(el.textContent).toBe('focused mission: v1.49.607');
    c.dispatch(null);
    expect(el.textContent).toBe('');
  });

  it('mission focus → setMissionFilter dispatched with mission ID', () => {
    const c = createCoordinator();
    const v = makeView();
    c.registerView(v);

    c.dispatch({ kind: 'mission', id: 'v1.49.605' });

    expect(v.missionCalls).toContain('v1.49.605');
  });

  it('non-mission focus → setMissionFilter dispatched with null (auto-clear)', () => {
    const c = createCoordinator();
    const v = makeView();
    c.registerView(v);

    c.dispatch({ kind: 'mission', id: 'v1.49.605' });
    c.dispatch({ kind: 'file', id: 'src/foo.ts' });

    const last = v.missionCalls[v.missionCalls.length - 1];
    expect(last).toBeNull();
  });

  it('view without setMissionFilter still receives setFocus normally', () => {
    const c = createCoordinator();
    const minimal: CoordinatedView & { calls: Focus[] } = {
      calls: [],
      setFocus(f: Focus) { this.calls.push(f); },
    };
    c.registerView(minimal);

    expect(() => {
      c.dispatch({ kind: 'mission', id: 'v1.49.605' });
    }).not.toThrow();
    expect(minimal.calls).toHaveLength(1);
  });
});
