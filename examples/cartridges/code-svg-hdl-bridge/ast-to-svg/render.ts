/**
 * AST → SCRIBE-compliant SVG renderer (TypeScript reference).
 *
 * Standalone function suitable for Node, Deno, or bundling for browser use.
 * The in-browser version with a fully-wired UI is at ../viewer/viewer.js.
 *
 * Mission: SCRIBE (v1.49.621), Track T3 CODE-SVG-HDL-BRIDGE.
 * License: Apache-2.0.
 */

export const SCRIBE_NS = 'https://tibsfox.com/Research/SCRIBE/ns#';

export interface AstNode {
  id?: string;
  kind: 'ast';
  sub_type: string;       // e.g. 'FunctionDeclaration', 'BinaryExpression'
  label: string;
  span: [number, number]; // byte offsets into source
  children: AstNode[];
  // Layout-assigned (filled by layoutTree)
  x?: number;
  y?: number;
  depth?: number;
}

export interface SourceMeta {
  path: string;
  sha: string;       // hex digest (SHA-1 or SHA-256 — implementation choice)
  bytes: number;
  generator?: string;
}

export interface RenderOptions {
  xGap?: number;
  yGap?: number;
}

/**
 * Reingold-Tilford-style hierarchical layout. Mutates the tree in place.
 */
export function layoutTree(root: AstNode, opts: RenderOptions = {}): void {
  const xGap = opts.xGap ?? 110;
  const yGap = opts.yGap ?? 60;
  let nextX = 0;
  function walk(node: AstNode, depth: number) {
    node.depth = depth;
    if (node.children.length === 0) {
      node.x = nextX * xGap + 60;
      nextX++;
    } else {
      for (const c of node.children) walk(c, depth + 1);
      const first = node.children[0];
      const last = node.children[node.children.length - 1];
      node.x = ((first.x ?? 0) + (last.x ?? 0)) / 2;
    }
    node.y = depth * yGap + 40;
  }
  walk(root, 0);
}

function esc(s: unknown): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nodeWidth(n: AstNode): number {
  return Math.max(60, ((n.label || n.sub_type).length) * 7 + 16);
}

function collectNodesAndEdges(root: AstNode): {
  nodes: AstNode[];
  edges: { id: string; src: string; dst: string; rel: string; order: number }[];
} {
  const nodes: AstNode[] = [];
  const edges: { id: string; src: string; dst: string; rel: string; order: number }[] = [];
  let edgeIdx = 0;
  function visit(n: AstNode, parent: AstNode | null, order: number) {
    nodes.push(n);
    if (parent) edges.push({
      id: 'e' + (edgeIdx++),
      src: parent.id!,
      dst: n.id!,
      rel: 'child',
      order,
    });
    n.children.forEach((c, i) => visit(c, n, i));
  }
  visit(root, null, 0);
  return { nodes, edges };
}

/**
 * Main entry. Returns the SCRIBE-compliant SVG string.
 *
 * Precondition: every node in the AST has an `id` assigned.
 * The viewer's parse() assigns IDs post-order; the cartridge user
 * is responsible for ID assignment if calling render() directly.
 */
export function renderAstSvg(root: AstNode, sourceMeta: SourceMeta): string {
  layoutTree(root);
  // Compute bounding box
  let maxX = 0;
  let maxY = 0;
  function findMax(n: AstNode) {
    if ((n.x ?? 0) > maxX) maxX = n.x!;
    if ((n.y ?? 0) > maxY) maxY = n.y!;
    for (const c of n.children) findMax(c);
  }
  findMax(root);
  const W = maxX + 100;
  const H = maxY + 60;

  const { nodes, edges } = collectNodesAndEdges(root);

  // Metadata block (machine-canonical form)
  const metaNodes = nodes.map(n =>
    `      <scribe:node id="${n.id}" sub_type="${esc(n.sub_type)}" label="${esc(n.label)}" span="${n.span[0]}..${n.span[1]}"/>`
  ).join('\n');
  const metaEdges = edges.map(e =>
    `      <scribe:edge id="${e.id}" rel="${e.rel}" src="${e.src}" dst="${e.dst}" payload='{"order":${e.order}}'/>`
  ).join('\n');

  const generator = sourceMeta.generator ?? 'scribe-ast-to-svg/1.0';
  const metadata = [
    '  <metadata>',
    `    <scribe:graph version="1" kind="ast" language="typescript">`,
    `      <scribe:source path="${esc(sourceMeta.path)}" sha="${sourceMeta.sha}" bytes="${sourceMeta.bytes}" generator="${esc(generator)}"/>`,
    '      <scribe:nodes>',
    metaNodes,
    '      </scribe:nodes>',
    '      <scribe:edges>',
    metaEdges,
    '      </scribe:edges>',
    '    </scribe:graph>',
    '  </metadata>',
  ].join('\n');

  // Visual layer 1: edges (cubic Bezier connectors)
  const edgeEls = edges.map(e => {
    const src = nodes.find(n => n.id === e.src)!;
    const dst = nodes.find(n => n.id === e.dst)!;
    const x1 = src.x!;
    const y1 = src.y! + 16;
    const x2 = dst.x!;
    const y2 = dst.y! - 16;
    const cy = (y1 + y2) / 2;
    return `    <path class="edge" data-rel="child" data-src="${e.src}" data-dst="${e.dst}" d="M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}"/>`;
  }).join('\n');

  // Visual layer 2: nodes (with redundant data-* + per-node title/desc)
  const nodeEls = nodes.map(n => {
    const w = nodeWidth(n);
    const x = n.x! - w / 2;
    const y = n.y! - 16;
    const subTitle = `${n.label || '(' + n.sub_type + ')'} (${n.sub_type}, ${n.span[0]}..${n.span[1]})`;
    return [
      `    <g class="node" id="${n.id}" data-node-id="${n.id}" data-sub_type="${esc(n.sub_type)}" data-span="${n.span[0]}..${n.span[1]}">`,
      `      <rect x="${x.toFixed(1)}" y="${y}" width="${w}" height="32" rx="4"/>`,
      `      <text x="${n.x!.toFixed(1)}" y="${(n.y! + 4).toFixed(1)}" text-anchor="middle">${esc(n.label || n.sub_type)}</text>`,
      `      <title>${esc(subTitle)}</title>`,
      `      <desc>${esc(n.sub_type)} node spanning bytes ${n.span[0]}..${n.span[1]}</desc>`,
      `    </g>`,
    ].join('\n');
  }).join('\n');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:scribe="${SCRIBE_NS}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="graphics-document" aria-labelledby="t">`,
    `  <title id="t">${esc(sourceMeta.path)} AST</title>`,
    `  <desc>SCRIBE round-trip artifact: ${esc(sourceMeta.path)} (${sourceMeta.bytes} bytes) parsed to AST. SHA ${sourceMeta.sha.slice(0, 16)}…</desc>`,
    metadata,
    `  <g class="layer edges">`,
    edgeEls,
    `  </g>`,
    `  <g class="layer nodes">`,
    nodeEls,
    `  </g>`,
    `</svg>`,
  ].join('\n');
}
