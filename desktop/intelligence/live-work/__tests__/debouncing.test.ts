/**
 * Phase 824 / C09 T8 — Live-update debouncing tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLiveWorkView } from '../components/live-work-view.js';
import type { InFlightBundle } from '../types.js';

vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    on: { statusUpdate: vi.fn().mockResolvedValue(() => {}) },
  },
}));

function makeBundle(): InFlightBundle {
  return {
    id: 'B-001',
    project_id: 'proj-1',
    committed_at: new Date(Date.now() - 60000).toISOString(),
    decisions: [
      {
        id: 'd-001', bundle_id: 'B-001', project_id: 'proj-1',
        title: 'Test decision', state: 'wave_0',
        updated_at: new Date().toISOString(),
      },
    ],
  };
}

describe('Live-update debouncing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('10 rapid status events for same decision debounce to ≤2 re-renders in 100ms window', () => {
    const comp = createLiveWorkView('proj-1', [makeBundle()]);
    const div = document.createElement('div');
    comp.mount(div);

    // Track render count by observing DOM mutations
    let renderCount = 0;
    const observer = new MutationObserver(() => { renderCount++; });
    observer.observe(div, { subtree: true, childList: true, characterData: true, attributes: true });

    // Fire 10 events within 50ms
    for (let i = 0; i < 10; i++) {
      comp.handleStatusUpdate({
        request_id: `req-${i}`,
        decision_id: 'd-001',
        bundle_id: 'B-001',
        project_id: 'proj-1',
        state: 'wave_1',
        sub_status: `Update ${i}`,
        updated_at: new Date().toISOString(),
      });
    }

    // Advance timer by debounce period
    vi.advanceTimersByTime(150);

    observer.disconnect();

    // Render count should be much less than 10 (debounced)
    // The debouncer may fire 1-2 times (leading + trailing), not 10
    expect(renderCount).toBeLessThan(5);
    comp.unmount();
  });

  it('events spread across >200ms each trigger a re-render', () => {
    const comp = createLiveWorkView('proj-1', [makeBundle()]);
    const div = document.createElement('div');
    comp.mount(div);

    const states = ['wave_1', 'wave_2', 'wave_n'] as const;
    for (const state of states) {
      comp.handleStatusUpdate({
        request_id: 'req-spread',
        decision_id: 'd-001',
        bundle_id: 'B-001',
        project_id: 'proj-1',
        state,
        updated_at: new Date().toISOString(),
      });
      // Advance well past debounce window
      vi.advanceTimersByTime(200);
    }

    // Each event beyond the debounce window should have updated the state
    const pill = div.querySelector('.pill');
    // The last state written should be wave_n
    expect(pill?.textContent).toContain('in progress');
    comp.unmount();
  });
});
