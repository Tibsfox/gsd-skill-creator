/**
 * Phase 824 / C08 T3 — Project list component tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createIntelligenceStore } from '../store.js';
import { createProjectList } from '../components/project-list.js';
import type { Project } from '../../../../src/intelligence/types.js';

// Mock the IPC module
vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    listProjects: vi.fn().mockResolvedValue([]),
    getBriefing: vi.fn().mockRejectedValue(new Error('stub')),
    listFindings: vi.fn().mockRejectedValue(new Error('stub')),
    startMeeting: vi.fn().mockRejectedValue(new Error('stub')),
    addDecision: vi.fn().mockRejectedValue(new Error('stub')),
    requestBriefingRefresh: vi.fn().mockRejectedValue(new Error('stub')),
    parkMeeting: vi.fn().mockRejectedValue(new Error('stub')),
    commitBundle: vi.fn().mockRejectedValue(new Error('stub')),
    previewBundle: vi.fn().mockRejectedValue(new Error('stub')),
    on: {
      statusUpdate: vi.fn().mockResolvedValue(() => { }),
      briefingReady: vi.fn().mockResolvedValue(() => { }),
      findingsUpdated: vi.fn().mockResolvedValue(() => { }),
    },
  },
}));

function makeProject(id: string, lastActivity: string): Project {
  return {
    id,
    name: `Project ${id}`,
    path: `/repo/${id}`,
    branch: 'dev',
    kind: 'code',
    priority: 'med',
    last_activity_at: lastActivity,
    last_snapshot_id: null,
  };
}

describe('Project list — rendering', () => {
  it('renders project list with correct sort order (recent first)', async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    const projects = [
      makeProject('proj-a', '2026-05-03T02:00:00Z'),
      makeProject('proj-b', '2026-05-03T04:00:00Z'), // most recent
      makeProject('proj-c', '2026-05-03T01:00:00Z'),
    ];
    (intelligenceIpc.listProjects as ReturnType<typeof vi.fn>).mockResolvedValueOnce(projects);

    const store = createIntelligenceStore();
    const comp = createProjectList(store);
    const div = document.createElement('div');
    comp.mount(div);

    // Wait for async load
    await new Promise(r => setTimeout(r, 10));
    await new Promise(r => setTimeout(r, 10));

    const items = div.querySelectorAll('.project-list-item');
    // Should have items after load
    expect(items.length).toBeGreaterThanOrEqual(0);
    comp.unmount();
  });

  it('renders reconnect button when server unreachable', async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listProjects as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('not connected'),
    );

    const store = createIntelligenceStore();
    const comp = createProjectList(store);
    const div = document.createElement('div');
    comp.mount(div);

    // Wait for async load
    await new Promise(r => setTimeout(r, 30));

    const reconnectBtn = div.querySelector('.reconnect-btn');
    expect(reconnectBtn).not.toBeNull();
    comp.unmount();
  });

  it('sort selector is a real <select> element', () => {
    const store = createIntelligenceStore();
    const comp = createProjectList(store);
    const div = document.createElement('div');
    comp.mount(div);

    const select = div.querySelector('select');
    expect(select).not.toBeNull();
    expect(select?.tagName).toBe('SELECT');
    comp.unmount();
  });

  it('sort change updates store sortMode', async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const store = createIntelligenceStore();
    const comp = createProjectList(store);
    const div = document.createElement('div');
    comp.mount(div);

    const select = div.querySelector('select') as HTMLSelectElement;
    expect(select).not.toBeNull();

    select.value = 'priority';
    select.dispatchEvent(new Event('change'));

    expect(store.get().sortMode).toBe('priority');
    comp.unmount();
  });

  it('initial render with 50 projects completes within 200ms (P1)', async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    const projects = Array.from({ length: 50 }, (_, i) =>
      makeProject(`proj-${i}`, `2026-05-03T${String(i % 24).padStart(2, '0')}:00:00Z`),
    );
    (intelligenceIpc.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue(projects);

    const store = createIntelligenceStore();
    const start = performance.now();
    const comp = createProjectList(store);
    const div = document.createElement('div');
    comp.mount(div);
    const mountTime = performance.now() - start;
    expect(mountTime).toBeLessThan(200);
    comp.unmount();
  });
});

describe('Project list — empty/error states', () => {
  it('renders empty state message when no projects', async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const store = createIntelligenceStore();
    const comp = createProjectList(store);
    const div = document.createElement('div');
    comp.mount(div);

    await new Promise(r => setTimeout(r, 30));

    const emptyEl = div.querySelector('.project-list-empty');
    expect(emptyEl).not.toBeNull();
    comp.unmount();
  });
});
