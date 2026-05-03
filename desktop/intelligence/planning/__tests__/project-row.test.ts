/**
 * Phase 824 / C08 T4 — Project row component tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { createIntelligenceStore } from '../store.js';
import { createProjectRow } from '../components/project-row.js';
import type { Project } from '../../../../src/intelligence/types.js';

vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    getBriefing: vi.fn().mockRejectedValue(new Error('stub')),
    listFindings: vi.fn().mockRejectedValue(new Error('stub')),
    startMeeting: vi.fn().mockRejectedValue(new Error('stub')),
    addDecision: vi.fn().mockRejectedValue(new Error('stub')),
    requestBriefingRefresh: vi.fn().mockRejectedValue(new Error('stub')),
    parkMeeting: vi.fn().mockRejectedValue(new Error('stub')),
    commitBundle: vi.fn().mockRejectedValue(new Error('stub')),
    previewBundle: vi.fn().mockRejectedValue(new Error('stub')),
    editDecision: vi.fn().mockRejectedValue(new Error('stub')),
    sendNow: vi.fn().mockRejectedValue(new Error('stub')),
    listProjects: vi.fn().mockResolvedValue([]),
    on: {
      statusUpdate: vi.fn().mockResolvedValue(() => { }),
      briefingReady: vi.fn().mockResolvedValue(() => { }),
      findingsUpdated: vi.fn().mockResolvedValue(() => { }),
    },
  },
}));

function makeProject(id: string): Project {
  return {
    id,
    name: `Project ${id}`,
    path: `/repo/${id}`,
    branch: 'dev',
    kind: 'code',
    priority: 'high',
    last_activity_at: '2026-05-03T04:00:00Z',
    last_snapshot_id: null,
  };
}

describe('Project row', () => {
  it('renders collapsed row with project name', () => {
    const store = createIntelligenceStore();
    const project = makeProject('test-proj');
    const comp = createProjectRow(project, store);
    const div = document.createElement('div');
    comp.mount(div);

    expect(div.textContent).toContain('Project test-proj');
    comp.unmount();
  });

  it('click row → expandedProjectId updates in store', () => {
    const store = createIntelligenceStore();
    const project = makeProject('expand-test');
    const comp = createProjectRow(project, store);
    const div = document.createElement('div');
    comp.mount(div);

    const collapsed = div.querySelector('.project-row-collapsed') as HTMLElement;
    collapsed.click();

    expect(store.get().expandedProjectId).toBe('expand-test');
    comp.unmount();
  });

  it('expanding row B collapses row A (single expansion invariant)', () => {
    const store = createIntelligenceStore();
    const projA = makeProject('row-a');
    const projB = makeProject('row-b');

    const rowA = createProjectRow(projA, store);
    const rowB = createProjectRow(projB, store);

    const divA = document.createElement('div');
    const divB = document.createElement('div');
    rowA.mount(divA);
    rowB.mount(divB);

    // Expand A
    (divA.querySelector('.project-row-collapsed') as HTMLElement).click();
    expect(store.get().expandedProjectId).toBe('row-a');

    // Expand B — should collapse A
    (divB.querySelector('.project-row-collapsed') as HTMLElement).click();
    expect(store.get().expandedProjectId).toBe('row-b');

    rowA.unmount();
    rowB.unmount();
  });

  it('second click on same row collapses it', () => {
    const store = createIntelligenceStore();
    const project = makeProject('toggle-test');
    const comp = createProjectRow(project, store);
    const div = document.createElement('div');
    comp.mount(div);

    const collapsed = div.querySelector('.project-row-collapsed') as HTMLElement;
    collapsed.click(); // expand
    expect(store.get().expandedProjectId).toBe('toggle-test');
    collapsed.click(); // collapse
    expect(store.get().expandedProjectId).toBeNull();
    comp.unmount();
  });

  it('shows empty briefing state when briefing is null', async () => {
    const store = createIntelligenceStore();
    const project = makeProject('briefing-null');
    store.dispatch(() => ({ expandedProjectId: 'briefing-null' }));
    const briefings = new Map(store.get().briefings);
    briefings.set('briefing-null', null);
    store.dispatch(() => ({ briefings }));

    const comp = createProjectRow(project, store);
    const div = document.createElement('div');
    comp.mount(div);

    await new Promise(r => setTimeout(r, 20));

    const emptyEl = div.querySelector('.briefing-empty');
    expect(emptyEl).not.toBeNull();
    comp.unmount();
  });

  it('row has aria-label and role=button for accessibility', () => {
    const store = createIntelligenceStore();
    const project = makeProject('a11y-test');
    const comp = createProjectRow(project, store);
    const div = document.createElement('div');
    comp.mount(div);

    const row = div.querySelector('.project-row');
    expect(row?.getAttribute('role')).toBe('button');
    expect(row?.getAttribute('tabindex')).toBe('0');
    expect(row?.getAttribute('aria-label')).toContain('a11y-test');
    comp.unmount();
  });

  it('keyboard Enter key expands the row', () => {
    const store = createIntelligenceStore();
    const project = makeProject('keyboard-test');
    const comp = createProjectRow(project, store);
    const div = document.createElement('div');
    comp.mount(div);

    const row = div.querySelector('.project-row') as HTMLElement;
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(store.get().expandedProjectId).toBe('keyboard-test');
    comp.unmount();
  });
});
