/**
 * Sankey layout via iterative barycentric relaxation.
 *
 * Reference: Riehmann, P., Hanfler, M., & Froehlich, B. (2005).
 * Interactive Sankey diagrams. IEEE Symposium on Information Visualization
 * (InfoVis 2005), 233–240. https://doi.org/10.1109/INFVIS.2005.1532152
 *
 * Column assignment: topological sort + longest-path layering (source nodes
 * in column 0, sink nodes in the rightmost column).
 * Vertical placement: barycentric-relaxation (5–15 iterations typically
 * sufficient to minimize link crossings).
 *
 * @module atlas/sankey/layout
 */

import type { SankeyNode, SankeyLink, SankeyLayout } from './types.js';

export interface SankeyOptions {
  /** Total width in pixels. */
  width?: number;
  /** Total height in pixels. */
  height?: number;
  /** Fixed node width in pixels. */
  nodeWidth?: number;
  /** Vertical gap between nodes in the same column (pixels). */
  nodePadding?: number;
  /** Relaxation iterations. Default 12. */
  iterations?: number;
}

const DEFAULTS: Required<SankeyOptions> = {
  width: 960,
  height: 500,
  nodeWidth: 24,
  nodePadding: 8,
  iterations: 12,
};

/** Assign columns via longest-path layering (Kahn's BFS on reversed graph). */
function assignColumns(
  nodeIds: string[],
  links: SankeyLink[],
): Map<string, number> {
  const inDegree = new Map<string, number>(nodeIds.map((id) => [id, 0]));
  const succ = new Map<string, string[]>(nodeIds.map((id) => [id, []]));
  const pred = new Map<string, string[]>(nodeIds.map((id) => [id, []]));

  for (const lk of links) {
    inDegree.set(lk.target, (inDegree.get(lk.target) ?? 0) + 1);
    succ.get(lk.source)!.push(lk.target);
    pred.get(lk.target)!.push(lk.source);
  }

  // Longest path from source (BFS over topological order).
  const col = new Map<string, number>(nodeIds.map((id) => [id, 0]));
  const queue: string[] = [];
  const remaining = new Map(inDegree);

  for (const [id, deg] of remaining) {
    if (deg === 0) queue.push(id);
  }

  let qi = 0;
  while (qi < queue.length) {
    const cur = queue[qi++];
    const curCol = col.get(cur)!;
    for (const next of succ.get(cur)!) {
      const candidate = curCol + 1;
      if (candidate > (col.get(next) ?? 0)) {
        col.set(next, candidate);
      }
      const newDeg = (remaining.get(next) ?? 0) - 1;
      remaining.set(next, newDeg);
      if (newDeg === 0) queue.push(next);
    }
  }

  // Sink nodes: push to last column.
  const maxCol = Math.max(...col.values());
  for (const id of nodeIds) {
    if ((succ.get(id)?.length ?? 0) === 0 && (pred.get(id)?.length ?? 0) > 0) {
      col.set(id, maxCol);
    }
  }

  return col;
}

/** Sum of link values flowing through a node (max of in-flow, out-flow). */
function nodeValue(
  id: string,
  links: SankeyLink[],
): number {
  const inFlow = links.filter((l) => l.target === id).reduce((s, l) => s + l.value, 0);
  const outFlow = links.filter((l) => l.source === id).reduce((s, l) => s + l.value, 0);
  return Math.max(inFlow, outFlow, 1);
}

/**
 * Compute Sankey layout.
 * @param nodes  Input nodes (must have unique `id`).
 * @param links  Input links (source/target refer to node ids).
 * @param opts   Layout options.
 */
export function sankeyLayout(
  nodes: SankeyNode[],
  links: SankeyLink[],
  opts: SankeyOptions = {},
): SankeyLayout {
  const o = { ...DEFAULTS, ...opts };
  const nodeIds = nodes.map((n) => n.id);
  const nodeMap = new Map<string, SankeyNode>(nodes.map((n) => [n.id, { ...n }]));

  // ── 1. Assign columns ──────────────────────────────────────────────────────
  const colMap = assignColumns(nodeIds, links);
  const numCols = Math.max(...colMap.values()) + 1;

  for (const [id, col] of colMap) {
    nodeMap.get(id)!.column = col;
  }

  // ── 2. Compute node heights proportional to value ─────────────────────────
  const colNodes = new Map<number, string[]>();
  for (let c = 0; c < numCols; c++) colNodes.set(c, []);
  for (const [id, col] of colMap) colNodes.get(col)!.push(id);

  // Scale heights per column so they fill the available height.
  for (let c = 0; c < numCols; c++) {
    const ids = colNodes.get(c)!;
    const totalVal = ids.reduce((s, id) => s + nodeValue(id, links), 0);
    const availHeight = o.height - (ids.length - 1) * o.nodePadding;
    const scale = totalVal > 0 ? availHeight / totalVal : 1;
    let yOffset = 0;
    for (const id of ids) {
      const nd = nodeMap.get(id)!;
      nd.height = Math.max(4, nodeValue(id, links) * scale);
      nd.y = yOffset;
      yOffset += nd.height + o.nodePadding;
    }
  }

  // ── 3. Assign x positions ─────────────────────────────────────────────────
  const colSpacing = numCols > 1 ? (o.width - o.nodeWidth) / (numCols - 1) : 0;
  for (const [id, col] of colMap) {
    const nd = nodeMap.get(id)!;
    nd.x = col * colSpacing;
    nd.width = o.nodeWidth;
  }

  // ── 4. Barycentric relaxation ─────────────────────────────────────────────
  for (let iter = 0; iter < o.iterations; iter++) {
    // Forward pass: adjust y from barycenter of predecessors.
    for (let c = 1; c < numCols; c++) {
      for (const id of colNodes.get(c)!) {
        const incoming = links.filter((l) => l.target === id);
        if (incoming.length === 0) continue;
        const nd = nodeMap.get(id)!;
        const h = nd.height ?? 0;
        let weightedY = 0;
        let totalW = 0;
        for (const lk of incoming) {
          const src = nodeMap.get(lk.source)!;
          const srcMid = (src.y ?? 0) + (src.height ?? 0) / 2;
          weightedY += srcMid * lk.value;
          totalW += lk.value;
        }
        if (totalW > 0) nd.y = Math.max(0, weightedY / totalW - h / 2);
      }
      resolveCollisions(colNodes.get(c)!, nodeMap, o.nodePadding);
    }
    // Backward pass: adjust y from barycenter of successors.
    for (let c = numCols - 2; c >= 0; c--) {
      for (const id of colNodes.get(c)!) {
        const outgoing = links.filter((l) => l.source === id);
        if (outgoing.length === 0) continue;
        const nd = nodeMap.get(id)!;
        const h = nd.height ?? 0;
        let weightedY = 0;
        let totalW = 0;
        for (const lk of outgoing) {
          const tgt = nodeMap.get(lk.target)!;
          const tgtMid = (tgt.y ?? 0) + (tgt.height ?? 0) / 2;
          weightedY += tgtMid * lk.value;
          totalW += lk.value;
        }
        if (totalW > 0) nd.y = Math.max(0, weightedY / totalW - h / 2);
      }
      resolveCollisions(colNodes.get(c)!, nodeMap, o.nodePadding);
    }
  }

  // ── 5. Assign link offsets ────────────────────────────────────────────────
  // Link y-offsets are relative to node top (not absolute coords).
  const outFlowY = new Map<string, number>(nodeIds.map((id) => [id, 0]));
  const inFlowY = new Map<string, number>(nodeIds.map((id) => [id, 0]));

  // Compute total flow per column to scale link thickness.
  const maxFlow = Math.max(...links.map((l) => l.value), 1);
  const heightScale = o.height / maxFlow;

  const resultLinks: SankeyLink[] = links.map((lk) => {
    const src = nodeMap.get(lk.source)!;
    const tgt = nodeMap.get(lk.target)!;
    const srcTotalOut = links.filter((l) => l.source === lk.source).reduce((s, l) => s + l.value, 0);
    const tgtTotalIn = links.filter((l) => l.target === lk.target).reduce((s, l) => s + l.value, 0);
    const srcH = src.height ?? 0;
    const tgtH = tgt.height ?? 0;
    const thick = Math.max(1, lk.value * Math.min(srcH / srcTotalOut, tgtH / tgtTotalIn));
    const sy = outFlowY.get(lk.source)!;
    const ty = inFlowY.get(lk.target)!;
    outFlowY.set(lk.source, sy + thick);
    inFlowY.set(lk.target, ty + thick);
    return { ...lk, thickness: thick, sourceY: sy, targetY: ty };
  });

  return {
    nodes: [...nodeMap.values()],
    links: resultLinks,
    columns: numCols,
  };
}

function resolveCollisions(
  ids: string[],
  nodeMap: Map<string, SankeyNode>,
  padding: number,
): void {
  // Sort by y, then push down to eliminate overlaps.
  ids.sort((a, b) => (nodeMap.get(a)!.y ?? 0) - (nodeMap.get(b)!.y ?? 0));
  let cursor = 0;
  for (const id of ids) {
    const nd = nodeMap.get(id)!;
    if ((nd.y ?? 0) < cursor) nd.y = cursor;
    cursor = (nd.y ?? 0) + (nd.height ?? 0) + padding;
  }
}
