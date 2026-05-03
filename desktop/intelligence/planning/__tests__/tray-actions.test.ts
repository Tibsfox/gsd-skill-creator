/**
 * Phase 824 / C08 T6 — Pending tray + meeting actions tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createIntelligenceStore } from '../store.js';
import { createPendingTray } from '../components/pending-tray.js';
import { createMeetingActions } from '../components/meeting-actions.js';
import type { Decision, Meeting } from '../../../../src/intelligence/types.js';

vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    parkMeeting: vi.fn().mockRejectedValue(new Error('stub')),
    commitBundle: vi.fn().mockRejectedValue(new Error('stub')),
    previewBundle: vi.fn().mockRejectedValue(new Error('stub')),
    editDecision: vi.fn().mockRejectedValue(new Error('stub')),
    getBriefing: vi.fn().mockRejectedValue(new Error('stub')),
    listFindings: vi.fn().mockRejectedValue(new Error('stub')),
    startMeeting: vi.fn().mockRejectedValue(new Error('stub')),
    addDecision: vi.fn().mockRejectedValue(new Error('stub')),
    requestBriefingRefresh: vi.fn().mockRejectedValue(new Error('stub')),
    sendNow: vi.fn().mockRejectedValue(new Error('stub')),
    listProjects: vi.fn().mockResolvedValue([]),
    on: {
      statusUpdate: vi.fn().mockResolvedValue(() => { }),
    },
  },
}));

function makeMeeting(status: Meeting['status'] = 'in_session'): Meeting {
  return {
    id: 'M-001',
    project_id: 'proj-1',
    started_at: '2026-05-03T04:00:00Z',
    committed_at: null,
    status,
    kb_snapshot: 'snap-1',
    briefing_at_start: null,
  };
}

function makeDecision(state: Decision['state'] = 'pending', emitted_at?: string): Decision {
  return {
    id: `dec-${Math.random().toString(36).slice(2, 6)}`,
    meeting_id: 'M-001',
    kind: 'vision_mission',
    state,
    ai_draft: { title: 'Test decision', body: 'Details' },
    developer_modifications: [],
    source_findings: [],
    approved_at: null,
    emitted_at: emitted_at ?? null,
    emission_path: null,
  };
}

describe('Pending tray', () => {
  beforeEach(async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    (intelligenceIpc.parkMeeting as ReturnType<typeof vi.fn>).mockClear();
    (intelligenceIpc.commitBundle as ReturnType<typeof vi.fn>).mockClear();
  });

  it('renders nothing when meeting is absent', () => {
    const store = createIntelligenceStore();
    const comp = createPendingTray('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);
    expect(div.children.length).toBe(1); // outer .pending-tray only
    expect(div.querySelector('.pending-tray-list')).toBeNull();
    comp.unmount();
  });

  it('renders decision list with state pills', () => {
    const store = createIntelligenceStore();
    const meetings = new Map(store.get().meetings);
    meetings.set('proj-1', makeMeeting());
    const pendingDecisions = new Map(store.get().pendingDecisions);
    pendingDecisions.set('M-001', [makeDecision('pending'), makeDecision('bundled')]);
    store.dispatch(() => ({ meetings, pendingDecisions }));

    const comp = createPendingTray('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    const items = div.querySelectorAll('.pending-tray-item');
    expect(items.length).toBe(2);
    comp.unmount();
  });

  it('sent_now decisions show faded (opacity 0.5)', () => {
    const store = createIntelligenceStore();
    const meetings = new Map(store.get().meetings);
    meetings.set('proj-1', makeMeeting());
    const pendingDecisions = new Map(store.get().pendingDecisions);
    const sentDecision = makeDecision('sent_now', '2026-05-03T04:24:00Z');
    pendingDecisions.set('M-001', [sentDecision]);
    store.dispatch(() => ({ meetings, pendingDecisions }));

    const comp = createPendingTray('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    const fadedItem = div.querySelector('.pending-tray-item.sent-now') as HTMLElement;
    expect(fadedItem).not.toBeNull();
    expect(fadedItem.style.opacity).toBe('0.5');
    comp.unmount();
  });

  it('bundle commit count excludes sent_now decisions', () => {
    const store = createIntelligenceStore();
    const meetings = new Map(store.get().meetings);
    meetings.set('proj-1', makeMeeting());
    const pendingDecisions = new Map(store.get().pendingDecisions);
    pendingDecisions.set('M-001', [
      makeDecision('pending'),
      makeDecision('pending'),
      makeDecision('sent_now', '2026-05-03T04:24:00Z'),
    ]);
    store.dispatch(() => ({ meetings, pendingDecisions }));

    const comp = createPendingTray('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    const commitBtn = div.querySelector('.commit-bundle-btn');
    // 2 pending decisions (not sent_now)
    expect(commitBtn?.textContent).toContain('2');
    comp.unmount();
  });
});

describe('Meeting actions — park', () => {
  beforeEach(async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    (intelligenceIpc.parkMeeting as ReturnType<typeof vi.fn>).mockClear();
  });

  it('renders park button for active meeting', () => {
    const store = createIntelligenceStore();
    const meetings = new Map(store.get().meetings);
    meetings.set('proj-1', makeMeeting('in_session'));
    store.dispatch(() => ({ meetings }));

    const comp = createMeetingActions('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    expect(div.querySelector('.park-btn')).not.toBeNull();
    comp.unmount();
  });

  it('park action shows parked badge and updates store', async () => {
    const { intelligenceIpc: ipc } = await import('../../../../src/intelligence/ipc.js');
    (ipc.parkMeeting as ReturnType<typeof vi.fn>).mockClear();

    const store = createIntelligenceStore();
    const meetings = new Map(store.get().meetings);
    meetings.set('proj-1', makeMeeting('in_session'));
    store.dispatch(() => ({ meetings }));

    const comp = createMeetingActions('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    const parkBtn = div.querySelector('.park-btn') as HTMLButtonElement;
    parkBtn.click();

    await new Promise(r => setTimeout(r, 20));

    // After park (stub rejection), local update still applies
    const status = store.get().meetings.get('proj-1')?.status;
    expect(status).toBe('parked');

    // After re-render, shows parked badge
    const badge = div.querySelector('.parked-badge');
    expect(badge).not.toBeNull();
    comp.unmount();
  });
});
