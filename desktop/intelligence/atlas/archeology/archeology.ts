/**
 * Mission Archeology View — composes timeline + Sankey + mission cards.
 *
 * Layout choice: THREE NESTED <svg> + <div> panes inside a host div, not one
 * mega-SVG.  Rationale: (a) timeline + Sankey are SVG (need pixel scales);
 * mission cards are flow-layout HTML (variable-height stacks of <li> rows
 * with text wrapping that SVG <foreignObject> handles awkwardly under jsdom).
 * (b) Independent re-render boundaries — picking a focus only re-renders the
 * cards pane and patches a class on the timeline; the Sankey SVG is stable.
 *
 * Cross-subcomponent interaction:
 *   timeline.click → setFocus(missionId)
 *   setFocus → Sankey gets `is-focused-column` class on the matching nodes
 *   setFocus → cards pane appends/replaces a card for the new focus
 *   onSelect callback fires for the host (system-map cross-highlight bridge)
 *
 * IPC: pulls `atlas_list_files_changed_by_mission` on focus-change for any
 * mission whose rows aren't already cached.  Hover→introducing-mission
 * resolution defers to the host (it owns line-level provenance via
 * atlas_list_provenance_for_line); we expose `getIntroducingMissionFor` only
 * as a typed shim.
 *
 * @module desktop/intelligence/atlas/archeology/archeology
 */

import { sankeyLayout, sankeyToSvg } from '../../../../src/atlas/sankey/index.js';
import type { SankeyLayout } from '../../../../src/atlas/sankey/index.js';
import { intelligenceIpc } from '../../../../src/intelligence/ipc.js';
import type { AtlasFilesChanged } from '../../../../src/intelligence/types.js';

import { createTimeline } from './timeline.js';
import type { TimelineComponent } from './timeline.js';
import { buildFileExistence } from './file-existence.js';
import type { FileExistenceState } from './file-existence.js';
import { createMissionCard } from './mission-card.js';
import type { MissionCardComponent } from './mission-card.js';
import { buildSankeyData } from './sankey-data.js';
import type { SankeyDataResult } from './sankey-data.js';
import type { ArcheologySelectEvent, MilestoneLink } from './types.js';

export interface ArcheologyOptions {
  width?: number;
  /** Height of the timeline pane in pixels. */
  timelineHeight?: number;
  /** Height of the Sankey pane in pixels. */
  sankeyHeight?: number;
}

export interface ArcheologyView {
  mount(host: HTMLElement): void;
  setMissions(missions: MilestoneLink[]): void;
  setFocus(missionId: string | null): void;
  /** Imperatively prime the per-mission rows cache (used by tests + warm hosts). */
  primeMissionRows(missionId: string, rows: AtlasFilesChanged[]): void;
  onSelect(cb: (e: ArcheologySelectEvent) => void): void;
  /**
   * Subscribe to time-lapse cursor changes.  Called each time the scrubber
   * advances (manually or via auto-play) with the files present at that
   * point in history.  Pass null to clear the time-lapse overlay.
   */
  onTimeLapseCursor(cb: (filesPresent: Set<string> | null, missionId: string | null) => void): void;
  unmount(): void;
}

const DEFAULTS: Required<ArcheologyOptions> = {
  width: 960,
  timelineHeight: 80,
  sankeyHeight: 320,
};

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createArcheologyView(opts: ArcheologyOptions = {}): ArcheologyView {
  const o: Required<ArcheologyOptions> = { ...DEFAULTS, ...opts };

  let host: HTMLElement | null = null;
  let timelineHost: HTMLDivElement | null = null;
  let sankeyHost: HTMLDivElement | null = null;
  let cardsHost: HTMLDivElement | null = null;

  let timeline: TimelineComponent | null = null;
  let missions: MilestoneLink[] = [];
  let focused: string | null = null;
  const rowsCache = new Map<string, AtlasFilesChanged[]>();
  const cards = new Map<string, MissionCardComponent>();
  let selectCb: (e: ArcheologySelectEvent) => void = () => {};
  let timeLapseCursorCb: (filesPresent: Set<string> | null, missionId: string | null) => void = () => {};
  let lastSankey: SankeyDataResult | null = null;
  let fileExistence: FileExistenceState | null = null;

  // ── Sankey layout cache ──────────────────────────────────────────────────
  interface SankeyCacheEntry {
    cacheKey: string;
    data: SankeyDataResult;
    layout: SankeyLayout;
  }
  let sankeyCache: SankeyCacheEntry | null = null;

  function buildSankeyCacheKey(
    missionList: MilestoneLink[],
    filesByMission: Map<string, AtlasFilesChanged[]>,
  ): string {
    const parts: string[] = missionList.map((m) => {
      const rows = filesByMission.get(m.missionId);
      const rowSig = rows ? rows.map((r) => `${r.file_path}:${r.added_lines}:${r.removed_lines}`).join(',') : '';
      return `${m.missionId}|${rowSig}`;
    });
    return parts.join(';');
  }

  function invalidateSankeyCache(): void {
    sankeyCache = null;
  }

  function mount(h: HTMLElement): void {
    host = h;
    host.classList.add('archeology-view');
    host.innerHTML = '';

    timelineHost = document.createElement('div');
    timelineHost.className = 'archeology-pane archeology-pane-timeline';
    sankeyHost = document.createElement('div');
    sankeyHost.className = 'archeology-pane archeology-pane-sankey';
    cardsHost = document.createElement('div');
    cardsHost.className = 'archeology-pane archeology-pane-cards';

    host.append(timelineHost, sankeyHost, cardsHost);

    timeline = createTimeline({ width: o.width, height: o.timelineHeight });
    timeline.onSelect((id) => setFocus(id));
    timeline.onCursor((missionId) => {
      const sorted = [...missions].sort((a, b) => a.shippedAt - b.shippedAt);
      const chronological = sorted.map((m) => m.missionId);
      if (fileExistence === null) {
        fileExistence = buildFileExistence({
          filesChangedByMission: rowsCache,
          missionsChronological: chronological,
        });
      }
      const filesPresent = fileExistence.filesAt(missionId);
      timeLapseCursorCb(filesPresent, missionId);
    });
    timeline.mount(timelineHost);

    renderSankey();
    renderCards();
  }

  function setMissions(next: MilestoneLink[]): void {
    missions = next;
    fileExistence = null;
    invalidateSankeyCache();
    if (timeline) timeline.setMissions(missions);
    renderSankey();
    if (focused && !missions.find((m) => m.missionId === focused)) {
      focused = null;
    }
    renderCards();
  }

  async function setFocus(id: string | null): Promise<void> {
    focused = id;
    if (timeline) timeline.setFocus(id);

    if (id && !rowsCache.has(id)) {
      try {
        const rows = await intelligenceIpc.listFilesChangedByMission(id);
        rowsCache.set(id, rows);
      } catch {
        rowsCache.set(id, []);
      }
    }

    renderSankey();
    renderCards();

    if (id) {
      const rows = rowsCache.get(id) ?? [];
      const touched = Array.from(new Set(rows.map((r) => r.file_path)));
      selectCb({ missionId: id, touchedFilePaths: touched });
    }
  }

  function primeMissionRows(missionId: string, rows: AtlasFilesChanged[]): void {
    rowsCache.set(missionId, rows);
    if (focused === missionId) {
      renderSankey();
      renderCards();
    }
  }

  function renderSankey(): void {
    if (!sankeyHost) return;
    sankeyHost.innerHTML = '';

    // Build (mission → rows) view from whatever's cached.  Missions with no
    // cached rows contribute zero nodes; that's fine for the initial render.
    const filesByMission = new Map<string, AtlasFilesChanged[]>();
    for (const m of missions) {
      const rows = rowsCache.get(m.missionId);
      if (rows && rows.length > 0) filesByMission.set(m.missionId, rows);
    }

    // Stable-layout cache: reuse the prior layout when (missions, filesByMission)
    // snapshot is identical. Focus changes update only the colour overlay, not
    // the layout geometry, so this covers the common repeat-focus pattern.
    const cacheKey = buildSankeyCacheKey(missions, filesByMission);
    let data: SankeyDataResult;
    let layout: SankeyLayout;

    if (sankeyCache && sankeyCache.cacheKey === cacheKey) {
      data = sankeyCache.data;
      layout = sankeyCache.layout;
    } else {
      data = buildSankeyData(missions, filesByMission);
      if (data.nodes.length > 0) {
        layout = sankeyLayout(data.nodes, data.links, {
          width: o.width,
          height: o.sankeyHeight,
          nodeWidth: 14,
          nodePadding: 4,
        });
        sankeyCache = { cacheKey, data, layout };
      } else {
        sankeyCache = null;
      }
    }

    lastSankey = data;

    if (data.nodes.length === 0) {
      sankeyHost.innerHTML = `<p class="archeology-empty">No file-flow data yet — focus a mission to load.</p>`;
      return;
    }

    const focusedNodeIds = focused ? new Set(data.nodesByMission.get(focused) ?? []) : null;

    const inner = sankeyToSvg(layout!, {
      nodeColor: (n) => {
        if (focusedNodeIds && focusedNodeIds.has(n.id)) return '#f29c2b';
        return '#4a90d9';
      },
      linkColor: (lk) => {
        if (focusedNodeIds && (focusedNodeIds.has(lk.source) || focusedNodeIds.has(lk.target))) {
          return '#f29c2b';
        }
        return '#aaa';
      },
    });

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', String(o.width));
    svg.setAttribute('height', String(o.sankeyHeight));
    svg.setAttribute('class', 'archeology-sankey');
    svg.innerHTML = inner;
    sankeyHost.appendChild(svg);
  }

  function renderCards(): void {
    if (!cardsHost) return;
    cardsHost.innerHTML = '';
    if (!focused) {
      cardsHost.innerHTML = `<p class="archeology-empty">Click a mission on the timeline to inspect its file changes.</p>`;
      return;
    }
    const m = missions.find((x) => x.missionId === focused);
    if (!m) return;
    const rows = rowsCache.get(focused) ?? [];

    let card = cards.get(focused);
    if (!card) {
      card = createMissionCard();
      card.onFileClick((fp) => {
        // Re-emit as an archeology select event so the host can cross-highlight
        // the system-map at this file.
        selectCb({ missionId: focused!, touchedFilePaths: [fp] });
      });
      cards.set(focused, card);
    }
    card.setData(m, rows);
    cardsHost.appendChild(card.el);
  }

  function unmount(): void {
    timeline?.unmount();
    if (host) host.innerHTML = '';
    host = null;
    timelineHost = null;
    sankeyHost = null;
    cardsHost = null;
    timeline = null;
    cards.clear();
    rowsCache.clear();
    lastSankey = null;
    sankeyCache = null;
    fileExistence = null;
  }

  return {
    mount,
    setMissions,
    setFocus: (id) => {
      void setFocus(id);
    },
    primeMissionRows,
    onSelect(cb) { selectCb = cb; },
    onTimeLapseCursor(cb) { timeLapseCursorCb = cb; },
    unmount,
  };
}

/** Test-only re-export so __tests__ can verify the rendered Sankey shape. */
export const __test = {
  buildSankeyData,
};
