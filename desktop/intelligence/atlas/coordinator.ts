/**
 * Atlas Coordinator — central focus-state manager.
 *
 * Single source of truth for {kind, id} selection. On any view's onSelect:
 *   1. Updates internal state.
 *   2. Writes URL hash (debounced 150ms).
 *   3. Broadcasts setFocus to every OTHER registered view.
 *   4. Notifies subscribe() listeners.
 *
 * Guard: views call setFocus internally when they receive the broadcast, but
 * because setFocus is not wired to onSelect inside each view, there is no
 * re-emission from that path. The coordinator further guards by comparing
 * new focus against current before broadcasting.
 */

import { parseHash, serializeHash } from './focus-state.js';
import type { Focus } from './focus-state.js';

/**
 * Minimal view interface the coordinator cares about.
 *
 * `setMissionFilter` is optional: only views that support mission-scoped
 * filtering (e.g. SymbolGraphView) need to implement it. The coordinator
 * calls it when focus changes to/from `kind: 'mission'`.
 *
 * Auto-apply rule: mission focus → apply; any non-mission focus → clear.
 * This prevents stuck-filter syndrome when the user clicks a file or symbol
 * after browsing a mission.
 */
export interface CoordinatedView {
  setFocus(focus: Focus): void;
  setMissionFilter?(missionId: string | null): void | Promise<void>;
}

export type FocusSubscriber = (focus: Focus | null) => void;

export interface Coordinator {
  /** Register a view. Returns an unregister function. */
  registerView(view: CoordinatedView): () => void;
  /** Called by a view (or palette) when the user makes a selection. */
  dispatch(focus: Focus | null): void;
  /** Subscribe to every focus change. Returns unsubscribe. */
  subscribe(handler: FocusSubscriber): () => void;
  /** Read current focus. */
  current(): Focus | null;
  /** Attach hashchange listener and seed from current URL hash. */
  attachHashRouting(): () => void;
  /**
   * Attach an ARIA live-region element that receives announcements on each
   * focus change. The coordinator updates `announcer.textContent` on every
   * dispatch so screen readers announce the new focus context.
   */
  attachAnnouncer(announcer: HTMLElement): () => void;
}

export function createCoordinator(): Coordinator {
  const views = new Set<CoordinatedView>();
  const subscribers = new Set<FocusSubscriber>();
  let currentFocus: Focus | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function broadcast(focus: Focus | null, sourceView?: CoordinatedView): void {
    const missionId = focus?.kind === 'mission' ? focus.id : null;
    for (const v of views) {
      if (v === sourceView) continue;
      if (focus !== null) v.setFocus(focus);
      if (v.setMissionFilter) void v.setMissionFilter(missionId);
    }
    for (const s of subscribers) s(focus);
  }

  function scheduleHashWrite(focus: Focus | null): void {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (typeof window !== 'undefined') {
        const next = focus ? serializeHash(focus) : '#';
        if (window.location.hash !== next) {
          window.history.pushState(null, '', next);
        }
      }
    }, 150);
  }

  return {
    registerView(view: CoordinatedView): () => void {
      views.add(view);
      if (currentFocus !== null) view.setFocus(currentFocus);
      return () => views.delete(view);
    },

    dispatch(focus: Focus | null, sourceView?: CoordinatedView): void {
      if (
        focus?.kind === currentFocus?.kind &&
        focus?.id === currentFocus?.id
      ) return;
      currentFocus = focus;
      broadcast(focus, sourceView);
      scheduleHashWrite(focus);
    },

    subscribe(handler: FocusSubscriber): () => void {
      subscribers.add(handler);
      return () => subscribers.delete(handler);
    },

    current(): Focus | null {
      return currentFocus;
    },

    attachHashRouting(): () => void {
      if (typeof window === 'undefined') return () => {};

      const onHashChange = (): void => {
        const parsed = parseHash(window.location.hash);
        if (
          parsed?.kind === currentFocus?.kind &&
          parsed?.id === currentFocus?.id
        ) return;
        currentFocus = parsed;
        broadcast(parsed);
      };

      window.addEventListener('hashchange', onHashChange);

      // Seed from current URL
      const initial = parseHash(window.location.hash);
      if (initial) {
        currentFocus = initial;
        broadcast(initial);
      }

      return () => window.removeEventListener('hashchange', onHashChange);
    },

    attachAnnouncer(announcer: HTMLElement): () => void {
      function announceFocus(focus: Focus | null): void {
        if (focus === null) {
          announcer.textContent = '';
          return;
        }
        const label = focus.kind === 'symbol'
          ? `focused symbol: ${focus.id}`
          : focus.kind === 'mission'
            ? `focused mission: ${focus.id}`
            : focus.kind === 'file'
              ? `focused file: ${focus.id}`
              : `focused ${focus.kind}: ${focus.id}`;
        announcer.textContent = label;
      }

      subscribers.add(announceFocus);
      return () => subscribers.delete(announceFocus);
    },
  };
}
