/**
 * SVG network diagram renderer for the GSD Dashboard topology view.
 *
 * Renders nodes as distinct entity shapes (circle, rectangle, hexagon,
 * chevron, diamond, dot) with domain-colored fills, connected by bezier
 * curve edges. Enforces a 12-node maximum with collapse logic that
 * prioritizes active nodes.
 *
 * Pure render functions, no I/O. Follows established dashboard panel
 * patterns (renderXxxPanel + renderXxxStyles).
 *
 * @module dashboard/topology-renderer
 */

// ============================================================================
// Types
// ============================================================================

/** Node in the topology graph. */
export interface TopologyNode {
  id: string;
  label: string;
  type: 'agent' | 'skill' | 'team' | 'phase' | 'adapter' | 'plan';
  domain: string;
  active: boolean;
  x: number; // pre-computed position (0-1 normalized)
  y: number; // pre-computed position (0-1 normalized)
}

/** Edge connecting two topology nodes. */
export interface TopologyEdge {
  from: string;
  to: string;
  active: boolean;
  domain: string;
}

/** Complete topology data for rendering. */
export interface TopologyData {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  viewBox: { width: number; height: number };
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum visible nodes before collapse. */
const MAX_VISIBLE_NODES = 12;

/** Type priority for collapse sorting (higher = kept longer). */
const TYPE_PRIORITY: Record<TopologyNode['type'], number> = {
  agent: 5,
  team: 4,
  skill: 3,
  phase: 2,
  adapter: 1,
  plan: 0,
};

// ============================================================================
// Shape builders
// ============================================================================

/**
 * Build SVG element string for a node shape at the given pixel position.
 */
type ShapeBuilder = (px: number, py: number) => string;

const SHAPE_BUILDERS: Record<TopologyNode['type'], ShapeBuilder> = {
  agent: (px, py) =>
    `<circle cx="${px}" cy="${py}" r="12" />`,

  skill: (px, py) =>
    `<rect x="${px - 12}" y="${py - 8}" width="24" height="16" rx="3" />`,

  team: (px, py) => {
    // Regular hexagon centered at (px, py) with radius 12
    const r = 12;
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      return `${(px + r * Math.cos(angle)).toFixed(1)},${(py + r * Math.sin(angle)).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${points}" />`;
  },

  phase: (px, py) => {
    // Chevron/arrow shape
    const points = [
      `${px - 12},${py - 8}`,
      `${px + 4},${py - 8}`,
      `${px + 12},${py}`,
      `${px + 4},${py + 8}`,
      `${px - 12},${py + 8}`,
      `${px - 4},${py}`,
    ].join(' ');
    return `<polygon points="${points}" />`;
  },

  adapter: (px, py) => {
    // Diamond/rotated square
    const points = [
      `${px},${py - 12}`,
      `${px + 12},${py}`,
      `${px},${py + 12}`,
      `${px - 12},${py}`,
    ].join(' ');
    return `<polygon points="${points}" />`;
  },

  plan: (px, py) =>
    `<circle cx="${px}" cy="${py}" r="4" />`,
};

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Render a single node as an SVG group with shape + label.
 */
function renderNode(node: TopologyNode, vw: number, vh: number): string {
  const px = node.x * vw;
  const py = node.y * vh;
  const activeClass = node.active ? ' tp-active' : '';
  const shapeSvg = SHAPE_BUILDERS[node.type](px, py);

  return `<g class="tp-node-${node.type}${activeClass}" data-node-id="${node.id}" data-domain="${node.domain}">
      ${shapeSvg}
      <text x="${px}" y="${py + 20}" text-anchor="middle" class="tp-label">${node.label}</text>
    </g>`;
}

/**
 * Render a summary node for collapsed entries.
 */
function renderCollapsedNode(count: number, vw: number, vh: number): string {
  const px = vw * 0.85;
  const py = vh * 0.9;
  return `<g class="tp-collapsed" data-node-id="collapsed-summary" data-domain="collapsed">
      <circle cx="${px}" cy="${py}" r="4" />
      <text x="${px}" y="${py + 20}" text-anchor="middle" class="tp-label">+${count} more</text>
    </g>`;
}

/**
 * Render an edge as a cubic bezier path.
 */
function renderEdge(
  edge: TopologyEdge,
  nodeMap: Map<string, TopologyNode>,
  vw: number,
  vh: number,
): string {
  const fromNode = nodeMap.get(edge.from);
  const toNode = nodeMap.get(edge.to);
  if (!fromNode || !toNode) return '';

  const x1 = fromNode.x * vw;
  const y1 = fromNode.y * vh;
  const x2 = toNode.x * vw;
  const y2 = toNode.y * vh;

  // Control points: horizontal offset for smooth S-curve
  const dx = (x2 - x1) * 0.4;
  const cx1 = x1 + dx;
  const cy1 = y1;
  const cx2 = x2 - dx;
  const cy2 = y2;

  const stateClass = edge.active ? 'tp-edge-active' : 'tp-edge-dormant';

  return `<path class="tp-edge ${stateClass}" d="M ${x1},${y1} C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}" data-from="${edge.from}" data-to="${edge.to}" />`;
}

/**
 * Apply collapse logic: keep at most MAX_VISIBLE_NODES nodes,
 * prioritizing active nodes and higher-type-priority.
 */
function collapseNodes(nodes: TopologyNode[]): {
  visible: TopologyNode[];
  collapsedCount: number;
} {
  if (nodes.length <= MAX_VISIBLE_NODES) {
    return { visible: nodes, collapsedCount: 0 };
  }

  // Sort: active first, then by type priority descending
  const sorted = [...nodes].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return TYPE_PRIORITY[b.type] - TYPE_PRIORITY[a.type];
  });

  const visible = sorted.slice(0, MAX_VISIBLE_NODES - 1);
  const collapsedCount = nodes.length - visible.length;
  return { visible, collapsedCount };
}

// ============================================================================
// Main renderer
// ============================================================================

/**
 * Render the topology panel as an SVG network diagram.
 *
 * @param data - Topology nodes, edges, and viewBox dimensions.
 * @returns HTML string for the topology panel.
 */
export function renderTopologyPanel(data: TopologyData): string {
  // Empty state
  if (data.nodes.length === 0) {
    return `<div class="topology-panel">
  <h3 class="tp-title">Route Map</h3>
  <div class="tp-empty">No topology data</div>
</div>`;
  }

  const { width: vw, height: vh } = data.viewBox;

  // Apply collapse logic
  const { visible, collapsedCount } = collapseNodes(data.nodes);
  const visibleIds = new Set(visible.map((n) => n.id));

  // Build node map for edge lookups
  const nodeMap = new Map<string, TopologyNode>();
  for (const node of visible) {
    nodeMap.set(node.id, node);
  }

  // Filter edges to only reference visible nodes
  const visibleEdges = data.edges.filter(
    (e) => visibleIds.has(e.from) && visibleIds.has(e.to),
  );

  // Render edges first (behind), then nodes on top
  const edgesHtml = visibleEdges
    .map((e) => renderEdge(e, nodeMap, vw, vh))
    .filter(Boolean)
    .join('\n    ');

  const nodesHtml = visible
    .map((n) => renderNode(n, vw, vh))
    .join('\n    ');

  const collapsedHtml = collapsedCount > 0
    ? '\n    ' + renderCollapsedNode(collapsedCount, vw, vh)
    : '';

  return `<div class="topology-panel">
  <h3 class="tp-title">Route Map</h3>
  <svg viewBox="0 0 ${vw} ${vh}" class="tp-svg">
    ${edgesHtml}
    ${nodesHtml}${collapsedHtml}
  </svg>
</div>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the topology panel.
 *
 * Uses dashboard dark theme CSS custom properties. Active edges
 * animate via stroke-dashoffset for a flowing pulse effect.
 *
 * @returns CSS string.
 */
export function renderTopologyStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Topology Panel (Route Map)
   ----------------------------------------------------------------------- */

.topology-panel {
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-lg, 1.25rem);
  margin-bottom: var(--space-lg, 1.25rem);
  position: relative;
}

.tp-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary, #e0e0e0);
  margin: 0 0 var(--space-md, 1rem) 0;
}

.tp-svg {
  width: 100%;
  height: auto;
  display: block;
}

/* --- Node shapes --- */

.tp-node-agent circle {
  fill: var(--domain-backend, #3fb950);
  stroke: var(--border, #333);
  stroke-width: 1;
}

.tp-node-skill rect {
  fill: var(--domain-frontend, #58a6ff);
  stroke: var(--border, #333);
  stroke-width: 1;
}

.tp-node-team polygon {
  fill: var(--domain-infrastructure, #bc8cff);
  stroke: var(--border, #333);
  stroke-width: 1;
}

.tp-node-phase polygon {
  fill: var(--domain-observation, #39d2c0);
  stroke: var(--border, #333);
  stroke-width: 1;
}

.tp-node-adapter polygon {
  fill: var(--domain-silicon, #f778ba);
  stroke: var(--border, #333);
  stroke-width: 1;
}

.tp-node-plan circle {
  fill: var(--text-muted, #a0a0a0);
  stroke: none;
}

/* --- Active state --- */

.tp-active circle,
.tp-active rect,
.tp-active polygon {
  filter: brightness(1.3) drop-shadow(0 0 4px currentColor);
}

/* --- Labels --- */

.tp-label {
  font-size: 11px;
  fill: var(--text-muted, #a0a0a0);
  pointer-events: none;
}

/* --- Edges --- */

.tp-edge {
  stroke: var(--text-dim, #666);
  stroke-width: 1.5;
  fill: none;
}

.tp-edge-active {
  stroke: var(--domain-backend, #3fb950);
  stroke-width: 2;
  stroke-dasharray: 8 4;
  animation: tp-pulse 1.5s linear infinite;
}

.tp-edge-dormant {
  stroke-dasharray: 4 4;
  opacity: 0.5;
}

@keyframes tp-pulse {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -24; }
}

/* --- Collapsed summary --- */

.tp-collapsed circle {
  fill: var(--text-dim, #666);
  stroke: none;
}

.tp-collapsed .tp-label {
  font-style: italic;
  fill: var(--text-dim, #666);
}

/* --- Empty state --- */

.tp-empty {
  color: var(--text-muted, #a0a0a0);
  font-style: italic;
  padding: var(--space-md, 1rem) 0;
  text-align: center;
}

/* --- Detail panel (click-to-detail) --- */

.tp-detail-panel {
  position: absolute;
  top: var(--space-lg, 1.25rem);
  right: var(--space-lg, 1.25rem);
  width: 220px;
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-md, 6px);
  padding: var(--space-md, 1rem);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: tp-slide-in 0.2s ease-out;
  z-index: 10;
}

.tp-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm, 0.5rem);
}

.tp-detail-title {
  font-weight: 600;
  color: var(--text-primary, #e0e0e0);
}

.tp-detail-close {
  background: none;
  border: none;
  color: var(--text-muted, #a0a0a0);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0 4px;
}

.tp-detail-close:hover {
  color: var(--text-primary, #e0e0e0);
}

.tp-detail-field {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid var(--border, #333);
}

.tp-detail-label {
  font-size: 0.8rem;
  color: var(--text-muted, #a0a0a0);
}

.tp-detail-value {
  font-size: 0.8rem;
  color: var(--text-primary, #e0e0e0);
}

@keyframes tp-slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
`;
}
