/**
 * Threads in flight + loose ends panels.
 * Phase 824 / C08 T7.
 */

import type { ProjectId } from '../../../../src/intelligence/types.js';
import type { Store, IntelligenceStore } from '../store.js';

export function createThreadsLooseEnds(
  projectId: ProjectId,
  store: Store<IntelligenceStore>,
): {
  mount(parent: HTMLElement): void;
  unmount(): void;
} {
  let container: HTMLElement | null = null;
  let unsubs: Array<() => void> = [];

  function render() {
    if (!container) return;
    container.innerHTML = '';

    const state = store.get();
    const inFlight = state.inFlightWork.get(projectId);
    const findings = state.findings.get(projectId) ?? [];

    const hasThreads = inFlight && (inFlight.bundles.length > 0 || inFlight.decisions.length > 0);
    const orphanDrafts = findings.filter(f => f.kind === 'orphan_draft' && f.status === 'open').length;
    const stalledMissions = findings.filter(f => f.kind === 'stalled_mission' && f.status === 'open').length;
    const openFindings = findings.filter(f => f.status === 'open').length;

    const hasLooseEnds = orphanDrafts > 0 || stalledMissions > 0 || openFindings > 0;

    if (!hasThreads && !hasLooseEnds) return;

    const row = document.createElement('div');
    row.className = 'threads-loose-ends-row';

    if (hasThreads && inFlight) {
      const panel = document.createElement('div');
      panel.className = 'threads-panel card';

      const title = document.createElement('h4');
      title.className = 'panel-title';
      title.textContent = 'Threads in flight';
      panel.appendChild(title);

      const list = document.createElement('ul');
      list.className = 'threads-list';
      for (const bundle of inFlight.bundles) {
        const item = document.createElement('li');
        const done = inFlight.decisions.filter(d => d.state === 'bundled').length;
        const total = inFlight.decisions.length;
        item.textContent = `• Bundle ${bundle.id} (${done}/${total})`;
        list.appendChild(item);
      }
      panel.appendChild(list);
      row.appendChild(panel);
    }

    if (hasLooseEnds) {
      const panel = document.createElement('div');
      panel.className = 'loose-ends-panel card';

      const title = document.createElement('h4');
      title.className = 'panel-title';
      title.textContent = 'Loose ends';
      panel.appendChild(title);

      const list = document.createElement('ul');
      list.className = 'loose-ends-list';

      if (orphanDrafts > 0) {
        const item = document.createElement('li');
        item.textContent = `• ${orphanDrafts} orphan vision draft${orphanDrafts !== 1 ? 's' : ''}`;
        list.appendChild(item);
      }
      if (stalledMissions > 0) {
        const item = document.createElement('li');
        item.textContent = `• ${stalledMissions} stalled mission${stalledMissions !== 1 ? 's' : ''}`;
        list.appendChild(item);
      }
      if (openFindings > 0) {
        const item = document.createElement('li');
        item.textContent = `• Unaddressed: ${openFindings} finding${openFindings !== 1 ? 's' : ''}`;
        list.appendChild(item);
      }
      panel.appendChild(list);
      row.appendChild(panel);
    }

    container.appendChild(row);
  }

  function mount(parent: HTMLElement) {
    container = document.createElement('div');
    container.className = 'threads-loose-ends';
    parent.appendChild(container);

    const unsub1 = store.subscribe(s => s.inFlightWork.get(projectId), () => render());
    const unsub2 = store.subscribe(s => s.findings.get(projectId), () => render());
    unsubs = [unsub1, unsub2];
    render();
  }

  function unmount() {
    unsubs.forEach(u => u());
    unsubs = [];
    container?.remove();
    container = null;
  }

  return { mount, unmount };
}
