/**
 * Phase 824 / C08 T9 — Live update reactivity tests.
 * Verifies that status_update/briefingReady events update the store within 50ms.
 */

import { describe, it, expect, vi } from 'vitest';
import { createIntelligenceStore } from '../store.js';
import type { Briefing } from '../../../../src/intelligence/types.js';

describe('Live update reactivity', () => {
  it('store update for briefings triggers subscriber within 50ms', async () => {
    const store = createIntelligenceStore();
    const cb = vi.fn();
    store.subscribe(s => s.briefings.get('proj-1'), cb);

    const start = performance.now();

    // Simulate a briefingReady event handler updating the store
    const briefing: Briefing = {
      id: 'B-001', project_id: 'proj-1', snapshot_id: 'snap-1',
      generated_at: '2026-05-03T04:00:00Z', body: 'New briefing',
      confidence: 'high', source_findings: [], suggested_moves: [],
    };
    const briefings = new Map(store.get().briefings);
    briefings.set('proj-1', briefing);
    store.dispatch(() => ({ briefings }));

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
    expect(cb).toHaveBeenCalledOnce();
  });

  it('two simultaneous status updates do not cause race condition', async () => {
    const store = createIntelligenceStore();
    const updates: string[] = [];

    store.subscribe(s => s.sortMode, (mode) => {
      updates.push(mode);
    });

    // Simulate two rapid dispatches
    store.dispatch(() => ({ sortMode: 'priority' }));
    store.dispatch(() => ({ sortMode: 'findings' }));

    // Both updates should have fired
    expect(updates).toEqual(['priority', 'findings']);
    expect(store.get().sortMode).toBe('findings');
  });

  it('status event for known decision updates decision state in store', () => {
    const store = createIntelligenceStore();
    const projectId = 'proj-live';

    // Set up in-flight work with a known decision
    const inFlightWork = new Map(store.get().inFlightWork);
    inFlightWork.set(projectId, {
      bundles: [],
      decisions: [{
        id: 'dec-known', meeting_id: 'M-001', kind: 'vision_mission',
        state: 'pending', ai_draft: null, developer_modifications: [],
        source_findings: [], approved_at: null, emitted_at: null, emission_path: null,
      }],
    });
    store.dispatch(() => ({ inFlightWork }));

    const cb = vi.fn();
    store.subscribe(s => s.inFlightWork.get(projectId)?.decisions[0]?.state, cb);

    // Simulate status update handler
    const updatedWork = new Map(store.get().inFlightWork);
    const current = updatedWork.get(projectId)!;
    const updatedDecisions = current.decisions.map(d =>
      d.id === 'dec-known' ? { ...d, state: 'bundled' as const } : d,
    );
    updatedWork.set(projectId, { ...current, decisions: updatedDecisions });
    store.dispatch(() => ({ inFlightWork: updatedWork }));

    expect(cb).toHaveBeenCalledWith('bundled');
  });
});
