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

function makeView(): CoordinatedView & {
  calls: Focus[];
  missionCalls: Array<string | null>;
  timeLapseCalls: Array<{ files: Set<string> | null; missionId: string | null }>;
} {
  const calls: Focus[] = [];
  const missionCalls: Array<string | null> = [];
  const timeLapseCalls: Array<{ files: Set<string> | null; missionId: string | null }> = [];
  return {
    calls,
    missionCalls,
    timeLapseCalls,
    setFocus(f: Focus) { calls.push(f); },
    setMissionFilter(id: string | null) { missionCalls.push(id); },
    setTimeLapseFiles(files: Set<string> | null, missionId: string | null) {
      timeLapseCalls.push({ files, missionId });
    },
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

  it('dispatchTimeLapse: time-lapse cursor broadcast reaches all registered views', () => {
    const c = createCoordinator();
    const v1 = makeView();
    const v2 = makeView();
    c.registerView(v1);
    c.registerView(v2);

    const files = new Set(['src/a.ts', 'src/b.ts']);
    c.dispatchTimeLapse(files, 'm1');

    expect(v1.timeLapseCalls).toHaveLength(1);
    expect(v1.timeLapseCalls[0].files).toBe(files);
    expect(v1.timeLapseCalls[0].missionId).toBe('m1');

    expect(v2.timeLapseCalls).toHaveLength(1);
    expect(v2.timeLapseCalls[0].missionId).toBe('m1');
  });

  it('dispatchTimeLapse(null) clears time-lapse on all views', () => {
    const c = createCoordinator();
    const v = makeView();
    c.registerView(v);

    c.dispatchTimeLapse(new Set(['src/a.ts']), 'm1');
    c.dispatchTimeLapse(null, null);

    expect(v.timeLapseCalls).toHaveLength(2);
    expect(v.timeLapseCalls[1].files).toBeNull();
  });

  it('subscribeTimeLapse receives cursor updates and unsubscribe stops them', () => {
    const c = createCoordinator();
    const received: Array<Set<string> | null> = [];
    const unsub = c.subscribeTimeLapse((files) => received.push(files));

    c.dispatchTimeLapse(new Set(['x.ts']), 'm1');
    unsub();
    c.dispatchTimeLapse(new Set(['y.ts']), 'm2');

    expect(received).toHaveLength(1);
  });
});

// ─── J3: Multi-project state ──────────────────────────────────────────────────

import { MAX_SELECTED_PROJECTS } from '../coordinator.js';
import { parseHash, serializeHash } from '../focus-state.js';

describe('Coordinator — setSelectedProjects (J3)', () => {
  it('setSelectedProjects(["a","b"]) updates state and returns true', () => {
    const c = createCoordinator('a');
    const result = c.setSelectedProjects(['a', 'b']);
    expect(result).toBe(true);
    expect(c.selectedProjects()).toEqual(['a', 'b']);
  });

  it('setSelectedProjects with 5 IDs is rejected (returns false, no state change)', () => {
    const c = createCoordinator('a');
    c.setSelectedProjects(['a', 'b']);
    const fiveIds = ['a', 'b', 'c', 'd', 'e'];
    expect(fiveIds.length).toBeGreaterThan(MAX_SELECTED_PROJECTS);
    const result = c.setSelectedProjects(fiveIds);
    expect(result).toBe(false);
    expect(c.selectedProjects()).toEqual(['a', 'b']);
  });

  it(`MAX_SELECTED_PROJECTS exported constant equals ${MAX_SELECTED_PROJECTS}`, () => {
    expect(MAX_SELECTED_PROJECTS).toBe(4);
  });

  it('setSelectedProjects does NOT dispatch a focus change to subscribers', () => {
    const c = createCoordinator('proj-1');
    const received: Array<Focus | null> = [];
    c.subscribe((f) => received.push(f));
    c.setSelectedProjects(['proj-1', 'proj-2']);
    expect(received).toHaveLength(0);
  });
});

describe('Focus — project_id round-trips through URL hash codec (J3)', () => {
  it('serializeHash includes ?pid= when project_id is set', () => {
    const focus: Focus = { kind: 'file', id: 'src/foo.ts', project_id: 'proj-b' };
    const hash = serializeHash(focus);
    expect(hash).toContain('?pid=proj-b');
  });

  it('parseHash recovers project_id from ?pid= query', () => {
    const hash = '#atlas/file/src/foo.ts?pid=proj-b';
    const focus = parseHash(hash);
    expect(focus).not.toBeNull();
    expect(focus!.project_id).toBe('proj-b');
    expect(focus!.id).toBe('src/foo.ts');
  });

  it('existing hash without ?pid= parses with project_id undefined (backward compat)', () => {
    const hash = '#atlas/symbol/ts%3Asrc%2Ffoo.ts%3AMyClass';
    const focus = parseHash(hash);
    expect(focus).not.toBeNull();
    expect(focus!.project_id).toBeUndefined();
  });

  it('round-trips a focus with project_id through serialize then parse', () => {
    const original: Focus = { kind: 'symbol', id: 'ts:src/bar.ts:MyFn', project_id: 'proj-x' };
    const hash = serializeHash(original);
    const recovered = parseHash(hash);
    expect(recovered).toEqual(original);
  });
});
