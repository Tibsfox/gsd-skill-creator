/**
 * Mission Archeology — Sankey data shaping.
 *
 * Transforms `(mission_id, file_path)` pairs from the files_changed table into
 * Sankey nodes + links.  Each (mission, file) pair becomes ONE node; consecutive
 * missions touching the same file produce ONE weighted link between those nodes.
 * Link weight = added_lines + removed_lines (churn).  Rename rows are joined
 * via `rename_from` so a renamed file's history is one chain, not two.
 *
 * @module desktop/intelligence/atlas/archeology/sankey-data
 */

import type { SankeyNode, SankeyLink } from '../../../../src/atlas/sankey/index.js';
import type { AtlasFilesChanged } from '../../../../src/intelligence/types.js';
import type { MilestoneLink } from './types.js';

export interface SankeyDataResult {
  nodes: SankeyNode[];
  links: SankeyLink[];
  /** mission_id → ordered list of node ids in that column (for cross-highlight). */
  nodesByMission: Map<string, string[]>;
  /** node id → file path (for cross-view highlighting / hover). */
  filePathByNode: Map<string, string>;
}

/** Stable node id from (missionId, filePath). */
export function nodeIdFor(missionId: string, filePath: string): string {
  return `${missionId}::${filePath}`;
}

/**
 * Build a Sankey graph from heterogeneous files-changed rows.
 *
 * Algorithm:
 *   1. Order missions by shippedAt ascending — that's the temporal axis.
 *   2. For each mission, the rows give the touched file set; add one node per row.
 *   3. For each file, walk its mission-ordered touch sequence; emit a link
 *      between consecutive touches, value = sum churn of the *target* touch
 *      (the link's weight reflects "how much that file changed at the next
 *      mission").  This keeps links interpretable as "X bytes/lines flowed
 *      from mission M to mission M+1 along file F".
 *   4. Rename rows: when row.change_kind === 'R' && row.rename_from is set,
 *      treat rename_from as the canonical key for prior history so the chain
 *      is unbroken across the rename.
 */
export function buildSankeyData(
  missions: MilestoneLink[],
  filesByMission: Map<string, AtlasFilesChanged[]>,
): SankeyDataResult {
  const ordered = [...missions].sort((a, b) => a.shippedAt - b.shippedAt);
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];
  const nodesByMission = new Map<string, string[]>();
  const filePathByNode = new Map<string, string>();

  // canonicalFilePath → ordered list of (missionId, nodeId, churn) touches.
  const fileTouches = new Map<string, { missionId: string; nodeId: string; churn: number }[]>();
  // alias map: post-rename path → canonical pre-rename path (transitive resolve).
  const renameAlias = new Map<string, string>();

  function canonical(path: string): string {
    let cur = path;
    const seen = new Set<string>();
    while (renameAlias.has(cur) && !seen.has(cur)) {
      seen.add(cur);
      cur = renameAlias.get(cur)!;
    }
    return cur;
  }

  for (const m of ordered) {
    const rows = filesByMission.get(m.missionId) ?? [];
    const colNodeIds: string[] = [];

    for (const row of rows) {
      // Resolve rename: alias the new path to the prior canonical path.
      if (row.change_kind === 'R' && row.rename_from) {
        renameAlias.set(row.file_path, canonical(row.rename_from));
      }
      const key = canonical(row.file_path);
      const id = nodeIdFor(m.missionId, row.file_path);

      // De-dupe: the same (mission, file) row should produce one node even if
      // the IPC returns duplicates (defensive against schema drift).
      if (!filePathByNode.has(id)) {
        nodes.push({ id, label: shortLabel(row.file_path) });
        filePathByNode.set(id, row.file_path);
        colNodeIds.push(id);
      }

      const churn = (row.added_lines | 0) + (row.removed_lines | 0);
      const arr = fileTouches.get(key) ?? [];
      arr.push({ missionId: m.missionId, nodeId: id, churn: Math.max(1, churn) });
      fileTouches.set(key, arr);
    }
    nodesByMission.set(m.missionId, colNodeIds);
  }

  // Emit links between consecutive touches per file.
  for (const touches of fileTouches.values()) {
    for (let i = 1; i < touches.length; i++) {
      const prev = touches[i - 1];
      const cur = touches[i];
      links.push({
        source: prev.nodeId,
        target: cur.nodeId,
        value: cur.churn,
      });
    }
  }

  return { nodes, links, nodesByMission, filePathByNode };
}

/** "src/foo/bar.ts" → "bar.ts"; cap to 24 chars for legibility. */
function shortLabel(filePath: string): string {
  const base = filePath.split('/').pop() ?? filePath;
  return base.length > 24 ? base.slice(0, 23) + '…' : base;
}
