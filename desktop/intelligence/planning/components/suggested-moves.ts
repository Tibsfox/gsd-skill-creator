/**
 * Suggested moves component — ranked list with "Add to tray" and optional "Send now".
 * Phase 824 / C08 T5.
 */

import type { ProjectId, DecisionState, DecisionKind } from '../../../../src/intelligence/types.js';
import type { Store, IntelligenceStore } from '../store.js';
import { intelligenceIpc } from '../../../../src/intelligence/ipc.js';

export function createSuggestedMoves(
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
    const briefing = state.briefings.get(projectId);
    const meeting = state.meetings.get(projectId) ?? null;

    if (!briefing || briefing.suggested_moves.length === 0) return;

    const title = document.createElement('h3');
    title.className = 'panel-title';
    title.textContent = 'Suggested next moves';
    container.appendChild(title);

    const list = document.createElement('ol');
    list.className = 'suggested-moves-list';

    for (const move of briefing.suggested_moves) {
      const item = document.createElement('li');
      item.className = 'suggested-move-item';

      const titleEl = document.createElement('div');
      titleEl.className = 'move-title';
      titleEl.textContent = move.title;

      const rationaleEl = document.createElement('div');
      rationaleEl.className = 'move-rationale text-secondary';
      rationaleEl.textContent = move.rationale;

      const actions = document.createElement('div');
      actions.className = 'move-actions';

      const kindBadge = document.createElement('span');
      kindBadge.className = `kind-badge kind-${move.kind}`;
      kindBadge.textContent = `[${move.kind}]`;
      actions.appendChild(kindBadge);

      const addBtn = document.createElement('button');
      addBtn.className = 'add-to-tray-btn';
      addBtn.textContent = '+ Add to tray';
      addBtn.addEventListener('click', async () => {
        if (!meeting) {
          // Start a meeting first
          try {
            const newMeeting = await intelligenceIpc.startMeeting(projectId);
            const meetings = new Map(store.get().meetings);
            meetings.set(projectId, newMeeting);
            store.dispatch(() => ({ meetings }));
          } catch {
            return;
          }
        }
        const currentMeeting = store.get().meetings.get(projectId);
        if (!currentMeeting) return;
        try {
          const kindMap: Record<string, DecisionKind> = {
            research: 'research_mission',
            vision: 'vision_mission',
            review: 'analysis_run',
            analyze: 'analysis_run',
          };
          const decision = await intelligenceIpc.addDecision(currentMeeting.id, {
            kind: kindMap[move.kind] ?? 'analysis_run',
            ai_draft: {
              title: move.title,
              body: `${move.rationale}${move.source_findings.length ? `\n\nSource findings: ${move.source_findings.join(', ')}` : ''}`,
            },
            source_findings: move.source_findings,
            source_move_rank: move.rank,
          });
          const pendingDecisions = new Map(store.get().pendingDecisions);
          const existing = pendingDecisions.get(currentMeeting.id) ?? [];
          pendingDecisions.set(currentMeeting.id, [...existing, decision]);
          store.dispatch(() => ({ pendingDecisions }));
        } catch {
          // Stub rejection in Phase 824 — log silently
        }
      });
      actions.appendChild(addBtn);

      // Send now button — shown for "review" kind moves (eligible for immediate send)
      if (move.kind === 'review') {
        const sendNowBtn = document.createElement('button');
        sendNowBtn.className = 'send-now-btn';
        sendNowBtn.setAttribute('aria-label', `Send now: ${move.title}`);
        sendNowBtn.textContent = '⚡ Send now';
        sendNowBtn.addEventListener('click', async () => {
          // Add to tray first, then send now
          const currentMeeting = store.get().meetings.get(projectId);
          if (!currentMeeting) return;
          try {
            const decision = await intelligenceIpc.addDecision(currentMeeting.id, {
              kind: 'analysis_run',
              ai_draft: { title: move.title, body: move.rationale },
              source_findings: move.source_findings,
              source_move_rank: move.rank,
            });
            await intelligenceIpc.sendNow(decision.id);
            const decisions = store.get().pendingDecisions.get(currentMeeting.id) ?? [];
            const updated = decisions.map(d =>
              d.id === decision.id ? { ...d, state: 'sent_now' as DecisionState } : d,
            );
            const pendingDecisions = new Map(store.get().pendingDecisions);
            pendingDecisions.set(currentMeeting.id, updated);
            store.dispatch(() => ({ pendingDecisions }));
          } catch {
            // Stub rejection
          }
        });
        actions.appendChild(sendNowBtn);
      }

      item.appendChild(titleEl);
      item.appendChild(rationaleEl);
      item.appendChild(actions);
      list.appendChild(item);
    }

    container.appendChild(list);
  }

  function mount(parent: HTMLElement) {
    container = document.createElement('div');
    container.className = 'suggested-moves card';
    parent.appendChild(container);

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
    container?.remove();
    container = null;
  }

  return { mount, unmount };
}
