/**
 * Pending decisions tray + bundle preview.
 * Phase 824 / C08 T6.
 */

import type { ProjectId } from '../../../../src/intelligence/types.js';
import type { Store, IntelligenceStore } from '../store.js';
import { intelligenceIpc } from '../../../../src/intelligence/ipc.js';

export function createPendingTray(
  projectId: ProjectId,
  store: Store<IntelligenceStore>,
): {
  mount(parent: HTMLElement): void;
  unmount(): void;
} {
  let container: HTMLElement | null = null;
  let unsubs: Array<() => void> = [];

  function getMeetingId(): string | null {
    return store.get().meetings.get(projectId)?.id ?? null;
  }

  function render() {
    if (!container) return;
    container.innerHTML = '';

    const meetingId = getMeetingId();
    if (!meetingId) return;

    const decisions = store.get().pendingDecisions.get(meetingId) ?? [];
    if (decisions.length === 0) return;

    const title = document.createElement('h3');
    title.className = 'panel-title';
    title.textContent = 'Pending decisions tray';
    container.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'pending-tray-list';

    for (const decision of decisions) {
      const isSentNow = decision.state === 'sent_now';
      const item = document.createElement('li');
      item.className = `pending-tray-item${isSentNow ? ' sent-now' : ''}`;
      if (isSentNow) {
        item.style.opacity = '0.5';
      }

      const pill = document.createElement('span');
      pill.className = `decision-state-pill pill-${decision.state}`;
      pill.textContent = isSentNow
        ? `✓ sent at ${new Date(decision.emitted_at ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : `[${decision.state}]`;
      item.appendChild(pill);

      const titleEl = document.createElement('span');
      titleEl.className = 'decision-title';
      titleEl.textContent = decision.ai_draft?.title ?? 'Draft decision';
      item.appendChild(titleEl);

      if (!isSentNow) {
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'edit';
        editBtn.setAttribute('aria-label', `Edit decision: ${decision.ai_draft?.title ?? 'decision'}`);

        let editArea: HTMLTextAreaElement | null = null;
        editBtn.addEventListener('click', () => {
          if (editArea) {
            // Save modification
            const text = editArea.value.trim();
            if (text) {
              intelligenceIpc.editDecision(decision.id, [text]).catch(() => null);
            }
            editArea.remove();
            editArea = null;
            editBtn.textContent = 'edit';
          } else {
            // Open textarea
            editArea = document.createElement('textarea');
            editArea.className = 'edit-textarea';
            editArea.value = decision.ai_draft?.body ?? '';
            editArea.rows = 3;
            item.appendChild(editArea);
            editBtn.textContent = 'save';
            editArea.focus();
          }
        });
        item.appendChild(editBtn);
      }

      list.appendChild(item);
    }

    container.appendChild(list);

    // Bundle actions bar
    const bundledCount = decisions.filter(d => d.state !== 'sent_now' && d.state !== 'withdrawn').length;
    if (bundledCount > 0) {
      const actionsBar = document.createElement('div');
      actionsBar.className = 'tray-actions-bar';

      const previewBtn = document.createElement('button');
      previewBtn.className = 'preview-bundle-btn';
      previewBtn.textContent = 'Preview bundle';
      previewBtn.addEventListener('click', async () => {
        if (!meetingId) return;
        try {
          const preview = await intelligenceIpc.previewBundle(meetingId as import('../../../../src/intelligence/types.js').MeetingId);
          // Show simple popover
          const popover = document.createElement('div');
          popover.className = 'bundle-preview-popover';
          popover.innerHTML = `<strong>Bundle preview</strong><br>${preview.decision_count} decisions`;
          previewBtn.parentElement?.appendChild(popover);
          setTimeout(() => popover.remove(), 3000);
        } catch {
          // Stub — show count from local state
        }
      });
      actionsBar.appendChild(previewBtn);

      const commitBtn = document.createElement('button');
      commitBtn.className = 'commit-bundle-btn';
      commitBtn.textContent = `Commit & send (${bundledCount}) ↗`;
      commitBtn.setAttribute('aria-label', `Commit and send ${bundledCount} decisions`);
      commitBtn.addEventListener('click', async () => {
        if (!meetingId) return;
        // Show confirmation
        const confirmed = window.confirm(`Commit and send ${bundledCount} decision(s)?`);
        if (!confirmed) return;
        try {
          await intelligenceIpc.commitBundle(meetingId as import('../../../../src/intelligence/types.js').MeetingId);
          const meetings = new Map(store.get().meetings);
          const meeting = meetings.get(projectId);
          if (meeting) {
            meetings.set(projectId, { ...meeting, status: 'committed' });
          }
          store.dispatch(() => ({ meetings }));
        } catch {
          // Stub rejection
        }
      });
      actionsBar.appendChild(commitBtn);

      container.appendChild(actionsBar);
    }
  }

  function mount(parent: HTMLElement) {
    container = document.createElement('div');
    container.className = 'pending-tray card';
    parent.appendChild(container);

    const unsub = store.subscribe(
      s => {
        const mid = s.meetings.get(projectId)?.id;
        return mid ? s.pendingDecisions.get(mid) : undefined;
      },
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
