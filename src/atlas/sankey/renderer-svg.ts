/**
 * Render a computed Sankey layout as SVG strings.
 * Pure string generation — no DOM API usage.
 * Link paths use cubic Bézier curves.
 * @module atlas/sankey/renderer-svg
 */

import type { SankeyLayout, SankeyNode, SankeyLink } from './types.js';

export interface SankeyRenderOptions {
  nodeColor?: (node: SankeyNode) => string;
  linkColor?: (link: SankeyLink) => string;
  nodeOpacity?: number;
  linkOpacity?: number;
}

const DEFAULT_NODE_COLOR = '#4a90d9';
const DEFAULT_LINK_COLOR = '#aaa';

function cubicBezierPath(
  x0: number, y0: number,
  x1: number, y1: number,
  thickness: number,
): string {
  const cp1x = (x0 + x1) / 2;
  const cp2x = (x0 + x1) / 2;
  const half = thickness / 2;
  // Upper edge
  const topPath = `M${x0},${y0} C${cp1x},${y0} ${cp2x},${y1} ${x1},${y1}`;
  // Lower edge (reversed)
  const botPath = `L${x1},${y1 + thickness} C${cp2x},${y0 + thickness} ${cp1x},${y0 + thickness} ${x0},${y0 + thickness}`;
  return `${topPath} ${botPath} Z`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Render a Sankey layout as an SVG <g> element string.
 * Wrap in <svg width="..." height="..."> for a complete SVG document.
 */
export function sankeyToSvg(
  layout: SankeyLayout,
  opts: SankeyRenderOptions = {},
): string {
  const nodeColor = opts.nodeColor ?? (() => DEFAULT_NODE_COLOR);
  const linkColor = opts.linkColor ?? (() => DEFAULT_LINK_COLOR);
  const nodeOpacity = opts.nodeOpacity ?? 1;
  const linkOpacity = opts.linkOpacity ?? 0.4;

  const nodeMap = new Map(layout.nodes.map((n) => [n.id, n]));

  let linksSvg = '';
  for (const lk of layout.links) {
    const src = nodeMap.get(lk.source);
    const tgt = nodeMap.get(lk.target);
    if (!src || !tgt) continue;
    const x0 = (src.x ?? 0) + (src.width ?? 24);
    // sourceY / targetY are relative offsets within the node; add node.y for absolute position.
    const y0 = (src.y ?? 0) + (lk.sourceY ?? 0);
    const x1 = tgt.x ?? 0;
    const y1 = (tgt.y ?? 0) + (lk.targetY ?? 0);
    const thick = lk.thickness ?? 2;
    const d = cubicBezierPath(x0, y0, x1, y1, thick);
    const fill = esc(linkColor(lk));
    linksSvg += `<path d="${d}" fill="${fill}" opacity="${linkOpacity}"/>`;
  }

  let nodesSvg = '';
  for (const nd of layout.nodes) {
    const x = nd.x ?? 0;
    const y = nd.y ?? 0;
    const w = nd.width ?? 24;
    const h = nd.height ?? 10;
    const fill = esc(nodeColor(nd));
    nodesSvg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" opacity="${nodeOpacity}"/>`;
    if (nd.label) {
      const lx = x + w + 4;
      const ly = y + h / 2;
      nodesSvg += `<text x="${lx}" y="${ly}" dominant-baseline="middle" font-size="11">${esc(nd.label)}</text>`;
    }
  }

  return `<g class="sankey">${linksSvg}${nodesSvg}</g>`;
}
