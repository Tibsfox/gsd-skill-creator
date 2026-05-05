/**
 * Mission Archeology View — composition + cross-subcomponent tests.
 *
 * jsdom environment via the `intelligence-ui` vitest project.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AtlasFilesChanged } from '../../../../../src/intelligence/types.js';

vi.mock('../../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    listFilesChangedByMission: vi.fn().mockResolvedValue([]),
  },
}));

import { createArcheologyView } from '../archeology.js';
import { layoutTimeline } from '../timeline.js';
import { createMissionCard } from '../mission-card.js';
import { buildSankeyData, nodeIdFor } from '../sankey-data.js';
import type { MilestoneLink } from '../types.js';

// ── Fixtures ────────────────────────────────────────────────────────────────

const MISSIONS: MilestoneLink[] = [
  { missionId: 'm1', label: 'v1.49.581', shippedAt: 1714000000000 },
  { missionId: 'm2', label: 'v1.49.597', shippedAt: 1715000000000, linkedDecisionId: 'd-42' },
  { missionId: 'm3', label: 'v1.49.607', shippedAt: 1716000000000 },
];

function row(
  mission: string,
  file: string,
  kind: 'A' | 'M' | 'D' | 'R',
  added = 10,
  removed = 2,
  renameFrom: string | null = null,
): AtlasFilesChanged {
  return {
    id: `${mission}:${file}` as unknown as AtlasFilesChanged['id'],
    mission_id: mission,
    commit_sha: 'deadbeef',
    file_path: file,
    change_kind: kind,
    rename_from: renameFrom,
    added_lines: added,
    removed_lines: removed,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('layoutTimeline', () => {
  it('produces one tick position per mission', () => {
    const r = layoutTimeline(MISSIONS, { width: 800, height: 60 });
    expect(r.tickPositions.size).toBe(3);
    expect(r.tickPositions.has('m1')).toBe(true);
    expect(r.tickPositions.has('m3')).toBe(true);
  });

  it('orders ticks chronologically (m1 < m2 < m3 in pixel space)', () => {
    const r = layoutTimeline(MISSIONS, { width: 800, height: 60 });
    const x1 = r.tickPositions.get('m1')!;
    const x2 = r.tickPositions.get('m2')!;
    const x3 = r.tickPositions.get('m3')!;
    expect(x1).toBeLessThan(x2);
    expect(x2).toBeLessThan(x3);
  });

  it('rotates labels when mission count exceeds threshold', () => {
    const many: MilestoneLink[] = Array.from({ length: 20 }, (_, i) => ({
      missionId: `m${i}`,
      label: `v1.49.${500 + i}`,
      shippedAt: 1714000000000 + i * 86400000,
    }));
    const r = layoutTimeline(many, { width: 800, height: 60, rotateThreshold: 8 });
    expect(r.rotated).toBe(true);
  });

  it('handles empty mission list without throwing', () => {
    const r = layoutTimeline([], { width: 800, height: 60 });
    expect(r.tickPositions.size).toBe(0);
    expect(r.axisSvg).toBe('');
  });
});

describe('buildSankeyData', () => {
  it('emits one node per (mission, file) pair', () => {
    const filesByMission = new Map([
      ['m1', [row('m1', 'src/foo.ts', 'A', 100, 0)]],
      ['m2', [row('m2', 'src/foo.ts', 'M', 20, 5)]],
    ]);
    const data = buildSankeyData(MISSIONS.slice(0, 2), filesByMission);
    expect(data.nodes).toHaveLength(2);
    expect(data.nodes.map((n) => n.id).sort()).toEqual([
      nodeIdFor('m1', 'src/foo.ts'),
      nodeIdFor('m2', 'src/foo.ts'),
    ].sort());
  });

  it('emits a link between consecutive missions touching the same file', () => {
    const filesByMission = new Map([
      ['m1', [row('m1', 'src/foo.ts', 'A', 100, 0)]],
      ['m2', [row('m2', 'src/foo.ts', 'M', 20, 5)]],
    ]);
    const data = buildSankeyData(MISSIONS.slice(0, 2), filesByMission);
    expect(data.links).toHaveLength(1);
    expect(data.links[0].source).toBe(nodeIdFor('m1', 'src/foo.ts'));
    expect(data.links[0].target).toBe(nodeIdFor('m2', 'src/foo.ts'));
    expect(data.links[0].value).toBe(25); // 20 + 5 churn at the target touch
  });

  it('emits no links when files do not flow across missions', () => {
    const filesByMission = new Map([
      ['m1', [row('m1', 'src/foo.ts', 'A', 50, 0)]],
      ['m2', [row('m2', 'src/bar.ts', 'A', 30, 0)]],
    ]);
    const data = buildSankeyData(MISSIONS.slice(0, 2), filesByMission);
    expect(data.links).toHaveLength(0);
  });

  it('threads renames so a renamed file is one chain not two', () => {
    const filesByMission = new Map([
      ['m1', [row('m1', 'src/old.ts', 'A', 80, 0)]],
      ['m2', [row('m2', 'src/new.ts', 'R', 5, 5, 'src/old.ts')]],
      ['m3', [row('m3', 'src/new.ts', 'M', 10, 2)]],
    ]);
    const data = buildSankeyData(MISSIONS, filesByMission);
    // Three nodes (one per touch), two links (m1→m2 across the rename, m2→m3 normal).
    expect(data.nodes).toHaveLength(3);
    expect(data.links).toHaveLength(2);
    const sources = data.links.map((l) => l.source).sort();
    expect(sources).toContain(nodeIdFor('m1', 'src/old.ts'));
    expect(sources).toContain(nodeIdFor('m2', 'src/new.ts'));
  });

  it('exposes nodesByMission and filePathByNode lookup tables', () => {
    const filesByMission = new Map([
      ['m1', [row('m1', 'a.ts', 'A'), row('m1', 'b.ts', 'A')]],
    ]);
    const data = buildSankeyData(MISSIONS.slice(0, 1), filesByMission);
    expect(data.nodesByMission.get('m1')).toHaveLength(2);
    expect(data.filePathByNode.get(nodeIdFor('m1', 'a.ts'))).toBe('a.ts');
  });

  it('flow conservation: sum(out-links) per node ≤ sum(in-links to next column for that file)', () => {
    // For a simple chain A→B→C on one file, the m1→m2 link weight should equal
    // m2's churn, and the m2→m3 link weight should equal m3's churn.
    const filesByMission = new Map([
      ['m1', [row('m1', 'f.ts', 'A', 100, 0)]],
      ['m2', [row('m2', 'f.ts', 'M', 12, 3)]],
      ['m3', [row('m3', 'f.ts', 'M', 7, 8)]],
    ]);
    const data = buildSankeyData(MISSIONS, filesByMission);
    expect(data.links.map((l) => l.value)).toEqual([15, 15]);
  });
});

describe('createMissionCard', () => {
  it('renders one row per files-changed entry with the correct badge', () => {
    const card = createMissionCard();
    card.setData(MISSIONS[1], [
      row('m2', 'a.ts', 'A', 10, 0),
      row('m2', 'b.ts', 'M', 4, 4),
      row('m2', 'c.ts', 'D', 0, 20),
    ]);
    const rows = card.el.querySelectorAll('li.archeology-file-row');
    expect(rows).toHaveLength(3);
    expect(card.el.querySelector('.archeology-badge-A')).not.toBeNull();
    expect(card.el.querySelector('.archeology-badge-M')).not.toBeNull();
    expect(card.el.querySelector('.archeology-badge-D')).not.toBeNull();
  });

  it('shows an empty-state message for missions with zero rows', () => {
    const card = createMissionCard();
    card.setData(MISSIONS[0], []);
    expect(card.el.querySelector('.archeology-empty')).not.toBeNull();
  });

  it('emits onFileClick when a file row is clicked', () => {
    const card = createMissionCard();
    const cb = vi.fn();
    card.onFileClick(cb);
    card.setData(MISSIONS[0], [row('m1', 'src/foo.ts', 'M')]);
    const li = card.el.querySelector<HTMLLIElement>('li.archeology-file-row')!;
    li.click();
    expect(cb).toHaveBeenCalledWith('src/foo.ts');
  });

  it('renders a linked-decision anchor when linkedDecisionId is present', () => {
    const card = createMissionCard();
    const cb = vi.fn();
    card.onDecisionClick(cb);
    card.setData(MISSIONS[1], [row('m2', 'a.ts', 'A')]);
    const link = card.el.querySelector<HTMLAnchorElement>('.archeology-decision-link');
    expect(link).not.toBeNull();
    link!.click();
    expect(cb).toHaveBeenCalledWith('d-42');
  });

  it('escapes HTML in file paths to prevent injection', () => {
    const card = createMissionCard();
    card.setData(MISSIONS[0], [row('m1', '<script>x</script>.ts', 'A')]);
    // No real <script> child element should be parsed into the DOM.
    expect(card.el.querySelector('script')).toBeNull();
    // Visible text must show the escaped form.
    expect(card.el.querySelector('.archeology-file-path')!.textContent)
      .toBe('<script>x</script>.ts');
    expect(card.el.innerHTML).toContain('&lt;script&gt;');
  });
});

describe('createArcheologyView — composition', () => {
  beforeEach(async () => {
    const { intelligenceIpc } = await import('../../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listFilesChangedByMission as ReturnType<typeof vi.fn>).mockClear();
  });

  it('mounts three panes (timeline / sankey / cards) inside the host', () => {
    const view = createArcheologyView({ width: 600, sankeyHeight: 200 });
    const host = document.createElement('div');
    view.mount(host);
    expect(host.querySelector('.archeology-pane-timeline')).not.toBeNull();
    expect(host.querySelector('.archeology-pane-sankey')).not.toBeNull();
    expect(host.querySelector('.archeology-pane-cards')).not.toBeNull();
    view.unmount();
  });

  it('clicking a timeline tick dispatches setFocus and onSelect', async () => {
    const view = createArcheologyView({ width: 600, sankeyHeight: 200 });
    const host = document.createElement('div');
    view.mount(host);
    view.setMissions(MISSIONS);
    view.primeMissionRows('m2', [row('m2', 'src/foo.ts', 'M', 20, 5)]);

    const onSel = vi.fn();
    view.onSelect(onSel);

    const tick = host.querySelector<SVGGElement>('[data-mission-id="m2"]');
    expect(tick).not.toBeNull();
    tick!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // setFocus is async-but-fire-and-forget; flush microtasks twice.
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(onSel).toHaveBeenCalled();
    const evt = onSel.mock.calls[0][0];
    expect(evt.missionId).toBe('m2');
    expect(evt.touchedFilePaths).toEqual(['src/foo.ts']);
    view.unmount();
  });

  it('focus propagation: focused mission card appears in the cards pane', async () => {
    const view = createArcheologyView({ width: 600, sankeyHeight: 200 });
    const host = document.createElement('div');
    view.mount(host);
    view.setMissions(MISSIONS);
    view.primeMissionRows('m1', [row('m1', 'src/x.ts', 'A', 5, 0)]);
    view.setFocus('m1');
    await new Promise((r) => setTimeout(r, 0));
    const card = host.querySelector('.archeology-pane-cards .archeology-mission-card');
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain('v1.49.581');
    view.unmount();
  });

  it('renders Sankey rectangles when at least one mission has cached rows', () => {
    const view = createArcheologyView({ width: 600, sankeyHeight: 200 });
    const host = document.createElement('div');
    view.mount(host);
    view.setMissions(MISSIONS);
    view.primeMissionRows('m1', [row('m1', 'src/foo.ts', 'A', 50, 0)]);
    view.primeMissionRows('m2', [row('m2', 'src/foo.ts', 'M', 10, 2)]);
    view.setFocus('m2');
    const rects = host.querySelectorAll('.archeology-sankey rect');
    expect(rects.length).toBeGreaterThan(0);
    view.unmount();
  });

  it('unmount clears the host DOM and the rows cache', () => {
    const view = createArcheologyView();
    const host = document.createElement('div');
    view.mount(host);
    view.setMissions(MISSIONS);
    view.primeMissionRows('m1', [row('m1', 'a.ts', 'A')]);
    view.unmount();
    expect(host.children.length).toBe(0);
  });

  it('IPC fetch is triggered on first focus, cached on subsequent focus', async () => {
    const { intelligenceIpc } = await import('../../../../../src/intelligence/ipc.js');
    const fetchMock = intelligenceIpc.listFilesChangedByMission as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce([row('m3', 'src/y.ts', 'A')]);

    const view = createArcheologyView();
    const host = document.createElement('div');
    view.mount(host);
    view.setMissions(MISSIONS);

    view.setFocus('m3');
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    view.setFocus(null);
    view.setFocus('m3');
    await new Promise((r) => setTimeout(r, 0));
    expect(fetchMock).toHaveBeenCalledTimes(1); // cached, no second call
    view.unmount();
  });
});
