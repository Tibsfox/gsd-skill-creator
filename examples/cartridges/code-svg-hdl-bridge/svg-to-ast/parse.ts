/**
 * SVG → AST reverse-direction parser (TypeScript reference).
 *
 * Two entry points:
 *   - parseSemantic(svgText): uses SCRIBE metadata. Lossless within the
 *     metadata's coverage. Throws if metadata is missing or malformed.
 *   - parseStructural(svgText): lossy fallback that recovers topology
 *     from visual elements only. Documented in mission Doc 02 §6.
 *     STUB at toy scope — throws Error('Not implemented at toy scope').
 *
 * The browser-resident version lives in ../viewer/viewer.js as
 * parseSvgToAst() (semantic only).
 *
 * Mission: SCRIBE (v1.49.621), Track T3 CODE-SVG-HDL-BRIDGE.
 * License: Apache-2.0.
 */

import { SCRIBE_NS, type AstNode, type SourceMeta } from '../ast-to-svg/render';

// Re-export for convenience
export { SCRIBE_NS, type AstNode, type SourceMeta };

interface ScribeNode {
  id: string;
  sub_type: string;
  label: string;
  span: [number, number];
  children: ScribeNode[];
  _order?: number;
}

export interface ParseResult {
  ast: AstNode;
  source: { path: string; sha: string };
}

/**
 * Semantic parse — uses SCRIBE metadata. Requires:
 *  - DOMParser available (Node + jsdom, Deno, browser)
 *  - <scribe:graph kind="ast"> in the SVG
 */
export function parseSemantic(svgText: string): ParseResult {
  // Defer DOMParser to runtime so this module can be imported in
  // environments that don't have it
  const Parser: any = (globalThis as any).DOMParser;
  if (!Parser) throw new Error('DOMParser not available in this environment');
  const doc = new Parser().parseFromString(svgText, 'image/svg+xml');
  const errs = doc.getElementsByTagName('parsererror');
  if (errs.length) throw new Error('SVG is not well-formed XML');

  const graphs = doc.getElementsByTagNameNS(SCRIBE_NS, 'graph');
  if (graphs.length === 0) {
    throw new Error('SVG lacks <scribe:graph> metadata. Use parseStructural() for lossy fallback.');
  }
  const graph = graphs[0];
  const kind = graph.getAttribute('kind');
  if (kind !== 'ast') {
    throw new Error(`Expected kind="ast"; got ${JSON.stringify(kind)}`);
  }

  const sourceEl = graph.getElementsByTagNameNS(SCRIBE_NS, 'source')[0];
  const sourcePath = sourceEl?.getAttribute('path') ?? '(unknown)';
  const sourceSha = sourceEl?.getAttribute('sha') ?? '';

  const nodeEls = graph.getElementsByTagNameNS(SCRIBE_NS, 'node');
  const edgeEls = graph.getElementsByTagNameNS(SCRIBE_NS, 'edge');

  const nodeMap = new Map<string, ScribeNode>();
  for (const ne of Array.from(nodeEls)) {
    const span = (ne.getAttribute('span') ?? '0..0').split('..').map(Number) as [number, number];
    nodeMap.set(ne.getAttribute('id')!, {
      id: ne.getAttribute('id')!,
      sub_type: ne.getAttribute('sub_type')!,
      label: ne.getAttribute('label') ?? '',
      span,
      children: [],
    });
  }

  const incomingChild = new Set<string>();
  for (const ee of Array.from(edgeEls)) {
    if (ee.getAttribute('rel') !== 'child') continue;
    const src = nodeMap.get(ee.getAttribute('src')!);
    const dst = nodeMap.get(ee.getAttribute('dst')!);
    if (!src || !dst) continue;
    let order = 0;
    const payloadAttr = ee.getAttribute('payload');
    if (payloadAttr) {
      try { order = JSON.parse(payloadAttr).order ?? 0; } catch { /* ignore */ }
    }
    dst._order = order;
    src.children.push(dst);
    incomingChild.add(dst.id);
  }
  for (const n of nodeMap.values()) {
    n.children.sort((a, b) => (a._order ?? 0) - (b._order ?? 0));
  }
  let root: ScribeNode | null = null;
  for (const n of nodeMap.values()) {
    if (!incomingChild.has(n.id)) { root = n; break; }
  }
  if (!root) throw new Error('No root node found in SCRIBE metadata');

  // Convert ScribeNode → AstNode (kind='ast' decoration)
  function toAst(n: ScribeNode): AstNode {
    return {
      id: n.id,
      kind: 'ast',
      sub_type: n.sub_type,
      label: n.label,
      span: n.span,
      children: n.children.map(toAst),
    };
  }
  return { ast: toAst(root), source: { path: sourcePath, sha: sourceSha } };
}

/**
 * Structural fallback — recover topology from visual elements only.
 * STUB at toy scope. Algorithm documented in mission Doc 02 §6.
 *
 * The algorithm:
 *   1. Find <g> elements with <rect> + <text> children → node candidates
 *   2. Find <path> elements with class="edge" → edge candidates
 *   3. Resolve endpoints via spatial nearest-neighbor lookup
 *   4. Recover labels from <text> contents
 *   5. Attempt sub_type recovery by label-pattern heuristics
 *
 * Result is a typed graph but loses: source spans, full sub_type taxonomy,
 * edge type relations, payload data.
 */
export function parseStructural(_svgText: string): ParseResult {
  throw new Error('parseStructural() not implemented at toy scope. See mission Doc 02 §6 for algorithm.');
}

/**
 * Regenerate TypeScript source from a parsed AST.
 * Toy-subset emitter. Mirrors viewer.js astToSource().
 */
export function astToSource(ast: AstNode): string {
  function emit(n: AstNode): string {
    switch (n.sub_type) {
      case 'FunctionDeclaration': {
        const nameNode = n.children.find(c => c.sub_type === 'Identifier');
        const params = n.children.filter(c => c.sub_type === 'Parameter');
        const ret = n.children.find(c => c.sub_type === 'ReturnStatement');
        const name = nameNode ? nameNode.label : (n.label || 'anonymous');
        const paramStr = params.map(p => p.label).join(', ');
        return `function ${name}(${paramStr}) { ${emit(ret!)} }`;
      }
      case 'ReturnStatement':
        return `return ${emit(n.children[0])}`;
      case 'BinaryExpression':
        return `${emit(n.children[0])} ${n.label} ${emit(n.children[1])}`;
      case 'ConditionalExpression':
        return `${emit(n.children[0])} ? ${emit(n.children[1])} : ${emit(n.children[2])}`;
      case 'Identifier':
      case 'NumericLiteral':
      case 'BooleanLiteral':
      case 'Parameter':
        return n.label;
      default:
        return `/* unsupported sub_type: ${n.sub_type} */`;
    }
  }
  return emit(ast);
}
