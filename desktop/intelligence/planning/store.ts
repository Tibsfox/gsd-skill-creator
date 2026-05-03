/**
 * Intelligence Dashboard — observable state store.
 *
 * Tiny observable: no React/Vue/Redux/Zustand. Plain ES modules.
 * D-24-15: state via plain ES modules + tiny observable store.
 *
 * Phase 824 / C08.
 */

import type { Briefing, Bundle, Decision, Finding, Meeting, Project, ProjectId } from '../../../src/intelligence/types.js';

// ─── Store shape ───────────────────────────────────────────────────────────────

export interface InFlightWork {
  bundles: Bundle[];
  decisions: Decision[];
}

export interface IntelligenceStore {
  projects: Project[];
  expandedProjectId: ProjectId | null;
  /** Current active meeting per project (null = none). */
  meetings: Map<ProjectId, Meeting | null>;
  briefings: Map<ProjectId, Briefing | null>;
  findings: Map<ProjectId, Finding[]>;
  pendingDecisions: Map<string, Decision[]>;
  inFlightWork: Map<ProjectId, InFlightWork>;
  sortMode: 'recent' | 'priority' | 'findings';
  /** Whether the project list is loading. */
  loading: boolean;
  /** Error message, if any. */
  error: string | null;
}

// ─── Deep equality helper ──────────────────────────────────────────────────────

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) {
      if (!b.has(k) || !deepEqual(v, b.get(k))) return false;
    }
    return true;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const aa = a as unknown[];
    const bb = b as unknown[];
    if (aa.length !== bb.length) return false;
    return aa.every((v, i) => deepEqual(v, bb[i]));
  }
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(k => deepEqual(aObj[k], bObj[k]));
}

// ─── Subscriber ───────────────────────────────────────────────────────────────

export type Selector<T, S> = (state: T) => S;
export type Callback<S> = (slice: S) => void;
export type UnsubscribeFn = () => void;

interface Subscription<T, S> {
  selector: Selector<T, S>;
  callback: Callback<S>;
  lastSlice: S;
}

// ─── Store class ──────────────────────────────────────────────────────────────

export class Store<T extends object> {
  private _state: T;
  private _subs: Set<Subscription<T, unknown>> = new Set();

  constructor(initial: T) {
    this._state = initial;
  }

  get(): T {
    return this._state;
  }

  /**
   * Subscribe to a slice of state. Callback fires only when the slice's
   * deep-equal value changes.
   */
  subscribe<S>(selector: Selector<T, S>, callback: Callback<S>): UnsubscribeFn {
    const sub: Subscription<T, S> = {
      selector,
      callback,
      lastSlice: selector(this._state),
    };
    this._subs.add(sub as unknown as Subscription<T, unknown>);
    return () => {
      this._subs.delete(sub as unknown as Subscription<T, unknown>);
    };
  }

  /**
   * Dispatch an update. `updater` receives the current state and returns a
   * partial state to merge. After merge, all subscriptions are evaluated and
   * callbacks fire for changed slices.
   */
  dispatch(updater: (state: T) => Partial<T>): void {
    const patch = updater(this._state);
    this._state = { ...this._state, ...patch };
    for (const sub of this._subs) {
      const newSlice = sub.selector(this._state);
      if (!deepEqual(sub.lastSlice, newSlice)) {
        sub.lastSlice = newSlice;
        sub.callback(newSlice);
      }
    }
  }
}

// ─── Default store factory ─────────────────────────────────────────────────────

export function createIntelligenceStore(): Store<IntelligenceStore> {
  return new Store<IntelligenceStore>({
    projects: [],
    expandedProjectId: null,
    meetings: new Map(),
    briefings: new Map(),
    findings: new Map(),
    pendingDecisions: new Map(),
    inFlightWork: new Map(),
    sortMode: 'recent',
    loading: false,
    error: null,
  });
}
