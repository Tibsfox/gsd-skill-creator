/**
 * Phase 824 / C09 T9 — Empty state tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { createLiveWorkView } from '../components/live-work-view.js';

vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    on: { statusUpdate: vi.fn().mockResolvedValue(() => {}) },
  },
}));

describe('Empty state', () => {
  it('no in-flight bundles → component mounts without throwing', () => {
    expect(() => {
      const comp = createLiveWorkView('proj-1', []);
      const div = document.createElement('div');
      comp.mount(div);
      comp.unmount();
    }).not.toThrow();
  });

  it('no in-flight bundles → no bundle summary card rendered', () => {
    const comp = createLiveWorkView('proj-1', []);
    const div = document.createElement('div');
    comp.mount(div);
    expect(div.querySelector('.bundle-summary-card')).toBeNull();
    comp.unmount();
  });

  it('no in-flight bundles → no decision rows rendered', () => {
    const comp = createLiveWorkView('proj-1', []);
    const div = document.createElement('div');
    comp.mount(div);
    expect(div.querySelector('.decision-row')).toBeNull();
    comp.unmount();
  });

  it('status event for unknown bundle_id is silently ignored', () => {
    const comp = createLiveWorkView('proj-1', []);
    const div = document.createElement('div');
    comp.mount(div);

    expect(() => {
      comp.handleStatusUpdate({
        request_id: 'req-unknown',
        decision_id: 'd-unknown',
        bundle_id: 'B-UNKNOWN',
        project_id: 'proj-1',
        state: 'complete',
        updated_at: new Date().toISOString(),
      });
    }).not.toThrow();

    comp.unmount();
  });

  it('status event for unknown decision_id is silently ignored', () => {
    const comp = createLiveWorkView('proj-1', [{
      id: 'B-001',
      project_id: 'proj-1',
      committed_at: new Date().toISOString(),
      decisions: [],
    }]);
    const div = document.createElement('div');
    comp.mount(div);

    expect(() => {
      comp.handleStatusUpdate({
        request_id: 'req-001',
        decision_id: 'd-NONEXISTENT',
        bundle_id: 'B-001',
        project_id: 'proj-1',
        state: 'blocked',
        updated_at: new Date().toISOString(),
      });
    }).not.toThrow();

    comp.unmount();
  });
});
