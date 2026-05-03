/**
 * Phase 824 / C08 T5 — Briefing panel + suggested moves tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createIntelligenceStore } from '../store.js';
import { createBriefingPanel } from '../components/briefing-panel.js';
import { createSuggestedMoves } from '../components/suggested-moves.js';
import type { Briefing } from '../../../../src/intelligence/types.js';

vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    requestBriefingRefresh: vi.fn().mockResolvedValue({ id: 'req_test' }),
    addDecision: vi.fn().mockRejectedValue(new Error('stub')),
    startMeeting: vi.fn().mockRejectedValue(new Error('stub')),
    sendNow: vi.fn().mockRejectedValue(new Error('stub')),
    getBriefing: vi.fn().mockRejectedValue(new Error('stub')),
    listFindings: vi.fn().mockRejectedValue(new Error('stub')),
    parkMeeting: vi.fn().mockRejectedValue(new Error('stub')),
    commitBundle: vi.fn().mockRejectedValue(new Error('stub')),
    previewBundle: vi.fn().mockRejectedValue(new Error('stub')),
    editDecision: vi.fn().mockRejectedValue(new Error('stub')),
    listProjects: vi.fn().mockResolvedValue([]),
    on: {
      statusUpdate: vi.fn().mockResolvedValue(() => { }),
      briefingReady: vi.fn().mockResolvedValue(() => { }),
      findingsUpdated: vi.fn().mockResolvedValue(() => { }),
    },
  },
}));

function makeBriefing(): Briefing {
  return {
    id: 'B-001',
    project_id: 'proj-1',
    snapshot_id: 'snap-1',
    generated_at: '2026-05-03T04:00:00Z',
    body: 'Wave 2 calibration ~80% done.',
    confidence: 'medium',
    source_findings: ['F-001', 'F-002'],
    suggested_moves: [
      {
        rank: 1,
        title: 'Investigate DACP coupling spike',
        kind: 'research',
        rationale: 'Probable root cause',
        source_findings: ['F-001'],
      },
      {
        rank: 2,
        title: 'Clear CAPCOM gate',
        kind: 'review',
        rationale: '8h held — decide now',
        source_findings: ['F-002'],
      },
      {
        rank: 3,
        title: 'Pick up orphaned silicon-perf draft',
        kind: 'vision',
        rationale: 'Context is hot',
        source_findings: [],
      },
    ],
  };
}

describe('Briefing panel', () => {
  it('shows confidence label badge', () => {
    const store = createIntelligenceStore();
    const briefings = new Map(store.get().briefings);
    briefings.set('proj-1', makeBriefing());
    store.dispatch(() => ({ briefings }));

    const comp = createBriefingPanel('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    const badge = div.querySelector('.confidence-badge');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toContain('medium');
    comp.unmount();
  });

  it('shows empty state when briefing is null', () => {
    const store = createIntelligenceStore();
    const briefings = new Map(store.get().briefings);
    briefings.set('proj-1', null);
    store.dispatch(() => ({ briefings }));

    const comp = createBriefingPanel('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    expect(div.querySelector('.briefing-empty')).not.toBeNull();
    comp.unmount();
  });

  it('refresh button triggers requestBriefingRefresh IPC', async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    (intelligenceIpc.requestBriefingRefresh as ReturnType<typeof vi.fn>).mockClear();

    const store = createIntelligenceStore();
    const briefings = new Map(store.get().briefings);
    briefings.set('proj-1', makeBriefing());
    store.dispatch(() => ({ briefings }));

    const comp = createBriefingPanel('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    const refreshBtn = div.querySelector('.refresh-btn') as HTMLButtonElement;
    refreshBtn.click();

    await new Promise(r => setTimeout(r, 20));

    expect(intelligenceIpc.requestBriefingRefresh).toHaveBeenCalledWith('proj-1');
    comp.unmount();
  });
});

describe('Suggested moves', () => {
  it('renders ≥3 suggested moves from briefing', () => {
    const store = createIntelligenceStore();
    const briefings = new Map(store.get().briefings);
    briefings.set('proj-1', makeBriefing());
    store.dispatch(() => ({ briefings }));

    const comp = createSuggestedMoves('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    const items = div.querySelectorAll('.suggested-move-item');
    expect(items.length).toBe(3);
    comp.unmount();
  });

  it('"+ Add to tray" calls addDecision with correct args', async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    (intelligenceIpc.addDecision as ReturnType<typeof vi.fn>).mockClear();
    (intelligenceIpc.startMeeting as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'M-001', project_id: 'proj-1', started_at: '2026-05-03T04:00:00Z',
      committed_at: null, status: 'in_session', kb_snapshot: 'snap-1', briefing_at_start: null,
    });
    (intelligenceIpc.addDecision as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'dec-001', meeting_id: 'M-001', kind: 'research_mission', state: 'pending',
      ai_draft: { title: 'Investigate DACP coupling spike', body: '...' },
      developer_modifications: [], source_findings: ['F-001'],
      source_move_rank: 1, approved_at: null, emitted_at: null, emission_path: null,
    });

    const store = createIntelligenceStore();
    const briefings = new Map(store.get().briefings);
    briefings.set('proj-1', makeBriefing());
    store.dispatch(() => ({ briefings }));

    const comp = createSuggestedMoves('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    const addBtn = div.querySelector('.add-to-tray-btn') as HTMLButtonElement;
    addBtn.click();

    await new Promise(r => setTimeout(r, 30));

    expect(intelligenceIpc.addDecision).toHaveBeenCalled();
    const args = (intelligenceIpc.addDecision as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(args[1].source_move_rank).toBe(1);
    expect(args[1].ai_draft?.title).toBe('Investigate DACP coupling spike');
    comp.unmount();
  });

  it('"⚡ Send now" shown for review kind moves', () => {
    const store = createIntelligenceStore();
    const briefings = new Map(store.get().briefings);
    briefings.set('proj-1', makeBriefing());
    store.dispatch(() => ({ briefings }));

    const comp = createSuggestedMoves('proj-1', store);
    const div = document.createElement('div');
    comp.mount(div);

    const sendNowBtns = div.querySelectorAll('.send-now-btn');
    expect(sendNowBtns.length).toBe(1); // only the 'review' kind move has Send now
    comp.unmount();
  });
});
