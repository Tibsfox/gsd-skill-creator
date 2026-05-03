/**
 * Intelligence Dashboard — Planning meeting UI entry point.
 *
 * Bootstraps the store, subscribes to IPC events, mounts the project list.
 * Phase 824 / C08.
 */

import { createIntelligenceStore } from './store.js';
import { createProjectList } from './components/project-list.js';
import { intelligenceIpc } from '../../../src/intelligence/ipc.js';
import type { StatusUpdateEvent } from '../../../src/intelligence/ipc.js';
import type { BriefingReadyEvent, FindingsUpdatedEvent } from '../../../src/intelligence/ipc.js';
import type { Briefing, Finding } from '../../../src/intelligence/types.js';

const store = createIntelligenceStore();

// ── Subscribe to live events ─────────────────────────────────────────────────

const eventUnlisteners: Array<Promise<() => void>> = [];

function setupEventSubscriptions() {
  // Status updates (D-24-18: dispatch within 50ms of event arrival)
  eventUnlisteners.push(
    intelligenceIpc.on.statusUpdate((ev: StatusUpdateEvent) => {
      const state = store.get();
      // Update in-flight work for the relevant project
      if (ev.project_id) {
        const inFlightWork = new Map(state.inFlightWork);
        const current = inFlightWork.get(ev.project_id) ?? { bundles: [], decisions: [] };
        // Update decision state if present
        if (ev.decision_id) {
          const updatedDecisions = current.decisions.map(d =>
            d.id === ev.decision_id ? { ...d, state: ev.state as never } : d,
          );
          inFlightWork.set(ev.project_id, { ...current, decisions: updatedDecisions });
          store.dispatch(() => ({ inFlightWork }));
        }
      }
    }),
  );

  eventUnlisteners.push(
    intelligenceIpc.on.briefingReady((ev: BriefingReadyEvent) => {
      // Trigger a briefing fetch for the project
      intelligenceIpc.getBriefing(ev.project_id)
        .then((briefing: Briefing | null) => {
          const briefings = new Map(store.get().briefings);
          briefings.set(ev.project_id, briefing);
          store.dispatch(() => ({ briefings }));
        })
        .catch(() => null);
    }),
  );

  eventUnlisteners.push(
    intelligenceIpc.on.findingsUpdated((ev: FindingsUpdatedEvent) => {
      intelligenceIpc.listFindings(ev.project_id)
        .then((findings: Finding[]) => {
          const findingsMap = new Map(store.get().findings);
          findingsMap.set(ev.project_id, findings);
          store.dispatch(() => ({ findings: findingsMap }));
        })
        .catch(() => null);
    }),
  );
}

// ── Mount the UI ─────────────────────────────────────────────────────────────

export function mountPlanningUI(rootEl: HTMLElement): () => void {
  const projectList = createProjectList(store);
  projectList.mount(rootEl);
  setupEventSubscriptions();

  return () => {
    projectList.unmount();
    // Unlisten from all events
    eventUnlisteners.forEach(p => p.then(fn => fn()).catch(() => null));
  };
}

// Auto-mount if running in browser (not in test environment)
if (typeof document !== 'undefined' && typeof process === 'undefined') {
  const root = document.getElementById('planning-root');
  if (root) {
    mountPlanningUI(root);
  }
}
