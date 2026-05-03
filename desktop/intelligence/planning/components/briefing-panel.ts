/**
 * Briefing panel + suggested moves container.
 * Shows AI briefing body, confidence badge, source finding count, refresh button.
 * Phase 824 / C08 T5.
 */

import type { ProjectId } from '../../../../src/intelligence/types.js';
import type { Store, IntelligenceStore } from '../store.js';
import { intelligenceIpc } from '../../../../src/intelligence/ipc.js';

export function createBriefingPanel(
  projectId: ProjectId,
  store: Store<IntelligenceStore>,
): {
  mount(parent: HTMLElement): void;
  unmount(): void;
} {
  let panel: HTMLElement | null = null;
  let unsubs: Array<() => void> = [];

  function render() {
    if (!panel) return;
    panel.innerHTML = '';

    const state = store.get();
    const briefing = state.briefings.get(projectId) ?? null;

    const header = document.createElement('div');
    header.className = 'panel-header';

    const title = document.createElement('h3');
    title.className = 'panel-title';
    title.textContent = 'AI briefing';
    header.appendChild(title);

    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'refresh-btn';
    refreshBtn.setAttribute('aria-label', 'Refresh AI briefing');
    refreshBtn.textContent = '↻ Refresh';
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      try {
        await intelligenceIpc.requestBriefingRefresh(projectId);
        // Optimistic: show "Refreshing…" until status event arrives
        if (panel) {
          const hint = panel.querySelector('.briefing-refreshing');
          if (!hint) {
            const p = document.createElement('p');
            p.className = 'briefing-refreshing text-secondary';
            p.textContent = 'Refreshing briefing…';
            panel.appendChild(p);
          }
        }
      } catch {
        // Non-fatal in stub mode
      } finally {
        refreshBtn.disabled = false;
      }
    });
    header.appendChild(refreshBtn);
    panel.appendChild(header);

    if (!briefing) {
      const empty = document.createElement('p');
      empty.className = 'briefing-empty text-secondary';
      empty.textContent = 'No briefing yet — click ↻ Refresh';
      panel.appendChild(empty);
      return;
    }

    // Briefing body
    const body = document.createElement('p');
    body.className = 'briefing-body';
    body.textContent = briefing.body;
    panel.appendChild(body);

    // Confidence + source count
    const meta = document.createElement('div');
    meta.className = 'briefing-meta';

    const badge = document.createElement('span');
    badge.className = `confidence-badge confidence-${briefing.confidence}`;
    badge.textContent = `Confidence: ${briefing.confidence}`;
    meta.appendChild(badge);

    const findingCount = document.createElement('span');
    findingCount.className = 'finding-count text-secondary';
    findingCount.textContent = ` · ${briefing.source_findings.length} source findings`;
    meta.appendChild(findingCount);

    panel.appendChild(meta);
  }

  function mount(parent: HTMLElement) {
    panel = document.createElement('div');
    panel.className = 'briefing-panel card';
    parent.appendChild(panel);

    const unsub = store.subscribe(
      s => s.briefings.get(projectId),
      () => render(),
    );
    unsubs.push(unsub);
    render();
  }

  function unmount() {
    unsubs.forEach(u => u());
    unsubs = [];
    panel?.remove();
    panel = null;
  }

  return { mount, unmount };
}
