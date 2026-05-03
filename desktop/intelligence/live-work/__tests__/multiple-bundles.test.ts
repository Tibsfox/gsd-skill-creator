/**
 * Phase 824 / C09 T7 — Multiple bundles in flight tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { createLiveWorkView } from '../components/live-work-view.js';
import type { InFlightBundle } from '../types.js';

vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    on: { statusUpdate: vi.fn().mockResolvedValue(() => {}) },
  },
}));

function makeBundle(id: string, committedMsAgo: number): InFlightBundle {
  return {
    id,
    project_id: 'proj-1',
    committed_at: new Date(Date.now() - committedMsAgo).toISOString(),
    decisions: [
      { id: `d-${id}-1`, bundle_id: id, project_id: 'proj-1', title: `Decision for ${id}`, state: 'wave_1', updated_at: new Date().toISOString() },
    ],
  };
}

describe('Multiple bundles in flight', () => {
  it('2 bundles render 2 bundle summary cards', () => {
    const bundles = [
      makeBundle('B-001', 2 * 60 * 60 * 1000), // 2h ago
      makeBundle('B-002', 30 * 60 * 1000),        // 30min ago
    ];
    const comp = createLiveWorkView('proj-1', bundles);
    const div = document.createElement('div');
    comp.mount(div);

    const cards = div.querySelectorAll('.bundle-summary-card');
    expect(cards.length).toBe(2);
    comp.unmount();
  });

  it('most recent bundle appears first', () => {
    const bundles = [
      makeBundle('B-001', 2 * 60 * 60 * 1000), // 2h ago (older)
      makeBundle('B-002', 30 * 60 * 1000),        // 30min ago (newer)
    ];
    const comp = createLiveWorkView('proj-1', bundles);
    const div = document.createElement('div');
    comp.mount(div);

    const cards = div.querySelectorAll('.bundle-id');
    // Most recent first
    expect(cards[0]?.textContent).toContain('B-002');
    expect(cards[1]?.textContent).toContain('B-001');
    comp.unmount();
  });

  it('completed bundle panel stays rendered with all-complete decisions', async () => {
    const bundles = [
      makeBundle('B-001', 60000),
    ];
    const comp = createLiveWorkView('proj-1', bundles);
    const div = document.createElement('div');
    comp.mount(div);

    // Complete the decision
    comp.handleStatusUpdate({
      request_id: 'req-001',
      decision_id: 'd-B-001-1',
      bundle_id: 'B-001',
      project_id: 'proj-1',
      state: 'complete',
      updated_at: new Date().toISOString(),
    });

    // Wait for debounce to fire (100ms + margin)
    await new Promise(r => setTimeout(r, 150));

    // Bundle card still present
    expect(div.querySelector('.bundle-summary-card')).not.toBeNull();
    // And it shows the bundle-complete class
    expect(div.querySelector('.bundle-summary-card.bundle-complete')).not.toBeNull();
    comp.unmount();
  });
});
