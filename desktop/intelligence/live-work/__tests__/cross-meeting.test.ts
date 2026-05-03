/**
 * Phase 824 / C09 T6 — Cross-meeting persistence tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { createLiveWorkView } from '../components/live-work-view.js';
import type { InFlightBundle } from '../types.js';

vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    on: { statusUpdate: vi.fn().mockResolvedValue(() => {}) },
  },
}));

function makeBundle(id: string, committed_at: string): InFlightBundle {
  return {
    id,
    project_id: 'proj-1',
    committed_at,
    decisions: [
      { id: `d-${id}-1`, bundle_id: id, project_id: 'proj-1', title: 'Decision', state: 'wave_1', updated_at: committed_at },
    ],
  };
}

describe('Cross-meeting persistence', () => {
  it('project with active bundle renders live-work content', () => {
    const bundles = [makeBundle('B-001', new Date(Date.now() - 60000).toISOString())];
    const comp = createLiveWorkView('proj-1', bundles);
    const div = document.createElement('div');
    comp.mount(div);

    // Should have bundle summary card content
    expect(div.querySelector('.live-work-view')).not.toBeNull();
    expect(div.querySelector('.bundle-summary-card')).not.toBeNull();
    comp.unmount();
  });

  it('project with no bundles renders nothing (zero-height)', () => {
    const comp = createLiveWorkView('proj-1', []);
    const div = document.createElement('div');
    comp.mount(div);

    // Should render nothing (or only an invisible container)
    const view = div.querySelector('.live-work-view');
    expect(view).not.toBeNull(); // container exists
    expect(div.querySelector('.bundle-summary-card')).toBeNull(); // but no content
    comp.unmount();
  });

  it('bundle completes during planning — live work stays rendered', () => {
    const bundles = [makeBundle('B-001', new Date(Date.now() - 60000).toISOString())];
    const comp = createLiveWorkView('proj-1', bundles);
    const div = document.createElement('div');
    comp.mount(div);

    // Simulate all decisions completing
    comp.handleStatusUpdate({
      request_id: 'req-001',
      decision_id: 'd-B-001-1',
      bundle_id: 'B-001',
      project_id: 'proj-1',
      state: 'complete',
      updated_at: new Date().toISOString(),
    });

    // Live work still renders after complete
    expect(div.querySelector('.bundle-summary-card')).not.toBeNull();
    comp.unmount();
  });
});
