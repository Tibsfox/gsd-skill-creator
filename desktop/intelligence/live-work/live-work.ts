/**
 * Intelligence Dashboard — Live work UI entry point.
 *
 * Bootstraps live work views per project, subscribes to status events.
 * Phase 824 / C09.
 */

import type { StatusUpdateEvent } from '../../../src/intelligence/ipc.js';
import { intelligenceIpc } from '../../../src/intelligence/ipc.js';
import { createLiveWorkView, LiveWorkViewComponent } from './components/live-work-view.js';
import type { InFlightBundle } from './types.js';

const viewsByProject = new Map<string, LiveWorkViewComponent>();
const eventUnlisteners: Array<Promise<() => void>> = [];

function setupStatusListener(): void {
  eventUnlisteners.push(
    intelligenceIpc.on.statusUpdate((ev: StatusUpdateEvent) => {
      const view = viewsByProject.get(ev.project_id);
      if (view && ev.decision_id && ev.bundle_id) {
        view.handleStatusUpdate(ev);
      }
    }),
  );
}

export function mountLiveWorkView(
  rootEl: HTMLElement,
  projectId: string,
  initialBundles: InFlightBundle[],
): () => void {
  const existing = viewsByProject.get(projectId);
  existing?.unmount();

  const view = createLiveWorkView(projectId, initialBundles);
  view.mount(rootEl);
  viewsByProject.set(projectId, view);

  return () => {
    view.unmount();
    viewsByProject.delete(projectId);
  };
}

// Setup event subscriptions when running in browser
if (typeof document !== 'undefined' && typeof process === 'undefined') {
  setupStatusListener();
}
