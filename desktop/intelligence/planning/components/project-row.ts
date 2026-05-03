/**
 * Project row component — collapsed row + expanded planning meeting view.
 * D-24-16: single expansion at a time.
 * Phase 824 / C08 T4.
 */

import type { Project } from '../../../../src/intelligence/types.js';
import type { Store, IntelligenceStore } from '../store.js';
import { intelligenceIpc } from '../../../../src/intelligence/ipc.js';
import { createBriefingPanel } from './briefing-panel.js';
import { createSuggestedMoves } from './suggested-moves.js';
import { createPendingTray } from './pending-tray.js';
import { createMeetingActions } from './meeting-actions.js';
import { createThreadsLooseEnds } from './threads-loose-ends.js';
import { createConversationInput } from './conversation-input.js';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function createProjectRow(
  project: Project,
  store: Store<IntelligenceStore>,
): {
  mount(parent: HTMLElement): void;
  unmount(): void;
} {
  let rowEl: HTMLElement | null = null;
  let expandedEl: HTMLElement | null = null;
  let unsubs: Array<() => void> = [];
  let subComponentUnmounts: Array<() => void> = [];

  function isExpanded(): boolean {
    return store.get().expandedProjectId === project.id;
  }

  async function loadProjectData() {
    if (!isExpanded()) return;
    try {
      const [briefing, findings] = await Promise.all([
        intelligenceIpc.getBriefing(project.id).catch(() => null),
        intelligenceIpc.listFindings(project.id).catch(() => []),
      ]);
      const briefings = new Map(store.get().briefings);
      briefings.set(project.id, briefing);
      const findingsMap = new Map(store.get().findings);
      findingsMap.set(project.id, findings);
      store.dispatch(() => ({ briefings, findings: findingsMap }));
    } catch {
      // Non-fatal: briefing/findings may not be available in stub mode
    }
  }

  function renderExpanded(parent: HTMLElement) {
    expandedEl = document.createElement('div');
    expandedEl.className = 'project-row-expanded';

    // Briefing panel
    const briefingContainer = document.createElement('div');
    const briefingComp = createBriefingPanel(project.id, store);
    briefingComp.mount(briefingContainer);
    subComponentUnmounts.push(briefingComp.unmount);
    expandedEl.appendChild(briefingContainer);

    // Threads + loose ends
    const threadsContainer = document.createElement('div');
    const threadsComp = createThreadsLooseEnds(project.id, store);
    threadsComp.mount(threadsContainer);
    subComponentUnmounts.push(threadsComp.unmount);
    expandedEl.appendChild(threadsContainer);

    // Suggested moves
    const movesContainer = document.createElement('div');
    const movesComp = createSuggestedMoves(project.id, store);
    movesComp.mount(movesContainer);
    subComponentUnmounts.push(movesComp.unmount);
    expandedEl.appendChild(movesContainer);

    // Pending tray
    const trayContainer = document.createElement('div');
    const trayComp = createPendingTray(project.id, store);
    trayComp.mount(trayContainer);
    subComponentUnmounts.push(trayComp.unmount);
    expandedEl.appendChild(trayContainer);

    // Meeting actions
    const actionsContainer = document.createElement('div');
    const actionsComp = createMeetingActions(project.id, store);
    actionsComp.mount(actionsContainer);
    subComponentUnmounts.push(actionsComp.unmount);
    expandedEl.appendChild(actionsContainer);

    // Conversation input
    const convContainer = document.createElement('div');
    const convComp = createConversationInput(project.id, store);
    convComp.mount(convContainer);
    subComponentUnmounts.push(convComp.unmount);
    expandedEl.appendChild(convContainer);

    parent.appendChild(expandedEl);
    loadProjectData();
  }

  function collapseExpanded() {
    subComponentUnmounts.forEach(u => u());
    subComponentUnmounts = [];
    expandedEl?.remove();
    expandedEl = null;
  }

  function updateExpansionState() {
    if (!rowEl) return;
    if (isExpanded()) {
      rowEl.classList.add('expanded');
      rowEl.setAttribute('aria-expanded', 'true');
      if (!expandedEl) {
        renderExpanded(rowEl);
      }
    } else {
      rowEl.classList.remove('expanded');
      rowEl.setAttribute('aria-expanded', 'false');
      collapseExpanded();
    }
  }

  function mount(parent: HTMLElement) {
    rowEl = document.createElement('div');
    rowEl.className = 'project-row';
    rowEl.setAttribute('role', 'button');
    rowEl.setAttribute('tabindex', '0');
    rowEl.setAttribute('aria-expanded', 'false');
    rowEl.setAttribute('aria-label', `Project ${project.name}`);
    rowEl.dataset['projectId'] = project.id;

    const collapsed = document.createElement('div');
    collapsed.className = 'project-row-collapsed';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'project-name';
    nameSpan.textContent = `${project.name}`;

    const branchSpan = document.createElement('span');
    branchSpan.className = 'project-branch';
    if (project.branch) {
      branchSpan.textContent = `@ ${project.branch}`;
    }

    const metaSpan = document.createElement('span');
    metaSpan.className = 'project-meta';
    const activityTime = relativeTime(project.last_activity_at);
    metaSpan.textContent = `· ${activityTime}`;

    const arrow = document.createElement('span');
    arrow.className = 'project-row-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = isExpanded() ? '▾' : '▸';

    collapsed.appendChild(arrow);
    collapsed.appendChild(nameSpan);
    collapsed.appendChild(branchSpan);
    collapsed.appendChild(metaSpan);
    rowEl.appendChild(collapsed);

    // Click / keyboard expand/collapse
    const handleExpand = () => {
      const currentExpanded = store.get().expandedProjectId;
      if (currentExpanded === project.id) {
        // Collapse
        store.dispatch(() => ({ expandedProjectId: null }));
      } else {
        // Expand this row; collapses the previously expanded row via store subscription
        store.dispatch(() => ({ expandedProjectId: project.id }));
      }
    };

    collapsed.addEventListener('click', handleExpand);
    rowEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleExpand();
      }
    });

    parent.appendChild(rowEl);

    // Subscribe to expansion state changes
    const unsub = store.subscribe(s => s.expandedProjectId, () => {
      arrow.textContent = isExpanded() ? '▾' : '▸';
      updateExpansionState();
    });
    unsubs.push(unsub);

    // Initial expansion state
    if (isExpanded()) {
      updateExpansionState();
    }
  }

  function unmount() {
    collapseExpanded();
    unsubs.forEach(u => u());
    unsubs = [];
    rowEl?.remove();
    rowEl = null;
  }

  return { mount, unmount };
}
