/**
 * Meeting actions — Park meeting.
 * Phase 824 / C08 T6.
 */

import type { ProjectId } from '../../../../src/intelligence/types.js';
import type { Store, IntelligenceStore } from '../store.js';
import { intelligenceIpc } from '../../../../src/intelligence/ipc.js';

export function createMeetingActions(
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
    const meeting = meetingId ? store.get().meetings.get(projectId) : null;
    if (!meeting || meeting.status === 'parked') {
      if (meeting?.status === 'parked') {
        const badge = document.createElement('span');
        badge.className = 'parked-badge';
        badge.textContent = '[parked]';
        container.appendChild(badge);
      }
      return;
    }

    const parkBtn = document.createElement('button');
    parkBtn.className = 'park-btn';
    parkBtn.textContent = 'Park';
    parkBtn.setAttribute('aria-label', 'Park this meeting');
    parkBtn.addEventListener('click', async () => {
      if (!meetingId) return;
      try {
        const parked = await intelligenceIpc.parkMeeting(meetingId as import('../../../../src/intelligence/types.js').MeetingId);
        const meetings = new Map(store.get().meetings);
        meetings.set(projectId, parked);
        store.dispatch(() => ({ meetings }));
      } catch {
        // Stub — update locally
        const meetings = new Map(store.get().meetings);
        const m = meetings.get(projectId);
        if (m) meetings.set(projectId, { ...m, status: 'parked' });
        store.dispatch(() => ({ meetings }));
      }
    });

    container.appendChild(parkBtn);
  }

  function mount(parent: HTMLElement) {
    container = document.createElement('div');
    container.className = 'meeting-actions';
    parent.appendChild(container);

    const unsub = store.subscribe(
      s => s.meetings.get(projectId)?.status,
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
