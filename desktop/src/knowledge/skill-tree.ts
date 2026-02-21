/**
 * Skill tree radial SVG visualization for knowledge pack progression.
 *
 * Renders packs as nodes in a radial graph:
 * - Center: focused pack
 * - Inner ring: prerequisites
 * - Outer ring: dependents (packs this enables)
 *
 * Full graph view (no focus pack) arranges all nodes in concentric rings
 * by tier: core innermost, applied middle, specialized outermost.
 *
 * @module knowledge/skill-tree
 */

import type { SkillTreeData, SkillTreeNode, SkillTreeEdge, ProgressState } from "./types";

// ============================================================================
// Options
// ============================================================================

/** Options for constructing a SkillTree */
export interface SkillTreeOptions {
  container: HTMLElement;
  width?: number; // default: 600
  height?: number; // default: 600
  onNodeClick?: (packId: string) => void; // highlight connections
  onNodeOpen?: (packId: string) => void; // open pack detail
}

// ============================================================================
// Constants
// ============================================================================

const SVG_NS = "http://www.w3.org/2000/svg";

const PROGRESS_COLORS: Record<ProgressState, string> = {
  "not-started": "#444",
  "in-progress": "#f0a500",
  completed: "#00c853",
};

const PROGRESS_STROKES: Record<ProgressState, string> = {
  "not-started": "#666",
  "in-progress": "#ffc107",
  completed: "#69f0ae",
};

const CSS = `
.skill-tree { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--kp-bg, #1a1a2e); }
.skill-tree svg { max-width: 100%; max-height: 100%; }
.skill-tree__node { cursor: pointer; transition: opacity 0.2s; }
.skill-tree__node:hover { opacity: 0.85; }
.skill-tree__node--dimmed { opacity: 0.3; }
.skill-tree__edge { transition: opacity 0.2s; }
.skill-tree__edge--dimmed { opacity: 0.1; }
.skill-tree__edge--highlighted { opacity: 1; stroke-width: 2.5; }
.skill-tree__label { fill: #fff; font-family: system-ui, sans-serif; font-size: 10px; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
.skill-tree__label--center { font-size: 12px; font-weight: bold; }
`;

// ============================================================================
// SVG class helpers (JSDOM lacks classList on SVG elements)
// ============================================================================

/** Get current class tokens from an SVG element */
function svgClasses(el: Element): string[] {
  const attr = el.getAttribute("class") ?? "";
  return attr.split(/\s+/).filter(Boolean);
}

/** Add a CSS class to an SVG element */
function svgAddClass(el: Element, cls: string): void {
  const classes = svgClasses(el);
  if (!classes.includes(cls)) {
    classes.push(cls);
    el.setAttribute("class", classes.join(" "));
  }
}

/** Remove a CSS class from an SVG element */
function svgRemoveClass(el: Element, cls: string): void {
  const classes = svgClasses(el).filter((c) => c !== cls);
  el.setAttribute("class", classes.join(" "));
}

// ============================================================================
// SkillTree
// ============================================================================

/**
 * Radial SVG skill tree visualization.
 *
 * Renders focused view (center + inner/outer rings) or full graph
 * (all nodes in tier-based concentric rings).
 */
export class SkillTree {
  private readonly root: HTMLDivElement;
  private readonly svg: SVGSVGElement;
  private readonly width: number;
  private readonly height: number;
  private readonly onNodeClick: ((packId: string) => void) | undefined;
  private readonly onNodeOpen: ((packId: string) => void) | undefined;
  private readonly cleanups: Array<() => void> = [];

  private data: SkillTreeData | null = null;
  private focusPack: string | null = null;
  private nodeElements: Map<string, SVGGElement> = new Map();
  private edgeElements: Map<string, SVGLineElement> = new Map();
  private highlightedPackId: string | null = null;
  private destroyed = false;

  constructor(options: SkillTreeOptions) {
    this.width = options.width ?? 600;
    this.height = options.height ?? 600;
    this.onNodeClick = options.onNodeClick;
    this.onNodeOpen = options.onNodeOpen;

    // Inject CSS (once per document)
    this.injectStyles();

    // Root element
    this.root = document.createElement("div");
    this.root.className = "skill-tree";

    // SVG element
    this.svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
    this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    this.svg.setAttribute("width", String(this.width));
    this.svg.setAttribute("height", String(this.height));

    // Background click clears highlights
    const bgHandler = (e: Event) => {
      if (e.target === this.svg) {
        this.clearHighlights();
      }
    };
    this.svg.addEventListener("click", bgHandler);
    this.cleanups.push(() => this.svg.removeEventListener("click", bgHandler));

    this.root.appendChild(this.svg);
    options.container.appendChild(this.root);
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /** Renders the skill tree graph from data. Uses data.centerPack as focus if non-empty. */
  setData(data: SkillTreeData): void {
    this.data = data;
    // Auto-set focus from data.centerPack when present
    if (data.centerPack) {
      this.focusPack = data.centerPack;
    }
    this.render();
  }

  /**
   * Switch between focused view and full graph overview.
   * null = full graph (all nodes by tier rings).
   * packId = focused radial view for that pack.
   */
  setFocusPack(packId: string | null): void {
    this.focusPack = packId;
    if (this.data) {
      this.render();
    }
  }

  /** Update a single node's fill color without full re-render */
  updateProgress(packId: string, progress: ProgressState): void {
    const group = this.nodeElements.get(packId);
    if (!group) return;

    const circle = group.querySelector("circle");
    if (circle) {
      circle.setAttribute("fill", PROGRESS_COLORS[progress]);
      circle.setAttribute("stroke", PROGRESS_STROKES[progress]);
    }

    // Update stored data too
    if (this.data) {
      const node = this.data.nodes.find((n) => n.packId === packId);
      if (node) node.progress = progress;
    }
  }

  /** Remove DOM and clean up event listeners */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    for (const cleanup of this.cleanups) {
      cleanup();
    }
    this.cleanups.length = 0;
    this.nodeElements.clear();
    this.edgeElements.clear();

    if (this.root.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
  }

  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------

  private render(): void {
    // Clear SVG content
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }
    this.nodeElements.clear();
    this.edgeElements.clear();
    this.highlightedPackId = null;

    if (!this.data) return;

    if (this.focusPack === null) {
      this.renderFullGraph();
    } else {
      this.renderFocusedView();
    }
  }

  private renderFocusedView(): void {
    if (!this.data) return;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const innerRadius = Math.min(this.width, this.height) * 0.35;
    const outerRadius = Math.min(this.width, this.height) * 0.75;

    const innerNodes = this.data.nodes.filter((n) => n.ring === "inner");
    const outerNodes = this.data.nodes.filter((n) => n.ring === "outer");
    const centerNode = this.data.nodes.find((n) => n.ring === "center");

    // Draw edges first (behind nodes)
    for (const edge of this.data.edges) {
      this.drawEdge(edge, cx, cy, innerRadius, outerRadius, innerNodes, outerNodes);
    }

    // Draw ring nodes
    for (let i = 0; i < innerNodes.length; i++) {
      const pos = this.positionOnRing(i, innerNodes.length, cx, cy, innerRadius);
      this.drawNode(innerNodes[i], pos.x, pos.y, 22, false);
    }

    for (let i = 0; i < outerNodes.length; i++) {
      const pos = this.positionOnRing(i, outerNodes.length, cx, cy, outerRadius);
      this.drawNode(outerNodes[i], pos.x, pos.y, 22, false);
    }

    // Draw center node last (on top)
    if (centerNode) {
      this.drawNode(centerNode, cx, cy, 30, true);
    }
  }

  private renderFullGraph(): void {
    if (!this.data) return;

    const cx = this.width / 2;
    const cy = this.height / 2;

    // Separate nodes by tier/classification
    const core = this.data.nodes.filter((n) => n.classification === "core_academic");
    const applied = this.data.nodes.filter((n) => n.classification === "applied");
    const specialized = this.data.nodes.filter(
      (n) => n.classification !== "core_academic" && n.classification !== "applied",
    );

    const r1 = Math.min(this.width, this.height) * 0.18; // core ring
    const r2 = Math.min(this.width, this.height) * 0.35; // applied ring
    const r3 = Math.min(this.width, this.height) * 0.48; // specialized ring (fit within viewBox)

    // Draw edges first at low opacity
    for (const edge of this.data.edges) {
      this.drawFullGraphEdge(edge, cx, cy, core, applied, specialized, r1, r2, r3);
    }

    // Draw nodes on concentric rings
    for (let i = 0; i < core.length; i++) {
      const pos = this.positionOnRing(i, core.length, cx, cy, r1);
      this.drawNode(core[i], pos.x, pos.y, 16, false);
    }

    for (let i = 0; i < applied.length; i++) {
      const pos = this.positionOnRing(i, applied.length, cx, cy, r2);
      this.drawNode(applied[i], pos.x, pos.y, 16, false);
    }

    for (let i = 0; i < specialized.length; i++) {
      const pos = this.positionOnRing(i, specialized.length, cx, cy, r3);
      this.drawNode(specialized[i], pos.x, pos.y, 16, false);
    }
  }

  // --------------------------------------------------------------------------
  // Drawing helpers
  // --------------------------------------------------------------------------

  private drawNode(
    node: SkillTreeNode,
    x: number,
    y: number,
    radius: number,
    isCenter: boolean,
  ): void {
    const group = document.createElementNS(SVG_NS, "g") as SVGGElement;
    group.setAttribute("class", "skill-tree__node");
    group.setAttribute("data-pack-id", node.packId);

    const circle = document.createElementNS(SVG_NS, "circle") as SVGCircleElement;
    circle.setAttribute("cx", String(x));
    circle.setAttribute("cy", String(y));
    circle.setAttribute("r", String(radius));
    circle.setAttribute("fill", PROGRESS_COLORS[node.progress]);
    circle.setAttribute("stroke", PROGRESS_STROKES[node.progress]);
    circle.setAttribute("stroke-width", isCenter ? "3" : "2");
    group.appendChild(circle);

    const labelClasses = isCenter
      ? "skill-tree__label skill-tree__label--center"
      : "skill-tree__label";
    const label = document.createElementNS(SVG_NS, "text") as SVGTextElement;
    label.setAttribute("class", labelClasses);
    label.setAttribute("x", String(x));
    label.setAttribute("y", String(y));
    label.textContent = this.abbreviateName(node.packId);
    group.appendChild(label);

    // Click handler: highlight connections
    const clickHandler = (e: Event) => {
      e.stopPropagation();
      this.highlightConnections(node.packId);
      if (this.onNodeClick) {
        this.onNodeClick(node.packId);
      }
    };
    group.addEventListener("click", clickHandler);
    this.cleanups.push(() => group.removeEventListener("click", clickHandler));

    // Double-click handler: open pack
    const dblClickHandler = (e: Event) => {
      e.stopPropagation();
      if (this.onNodeOpen) {
        this.onNodeOpen(node.packId);
      }
    };
    group.addEventListener("dblclick", dblClickHandler);
    this.cleanups.push(() => group.removeEventListener("dblclick", dblClickHandler));

    this.svg.appendChild(group);
    this.nodeElements.set(node.packId, group);
  }

  private drawEdge(
    edge: SkillTreeEdge,
    cx: number,
    cy: number,
    innerRadius: number,
    outerRadius: number,
    innerNodes: SkillTreeNode[],
    outerNodes: SkillTreeNode[],
  ): void {
    const line = document.createElementNS(SVG_NS, "line") as SVGLineElement;
    line.setAttribute("class", "skill-tree__edge");
    line.setAttribute("data-from", edge.from);
    line.setAttribute("data-to", edge.to);

    // Determine positions
    let x1: number, y1: number, x2: number, y2: number;

    if (edge.type === "prerequisite") {
      // Inner node -> center
      const innerIdx = innerNodes.findIndex((n) => n.packId === edge.from);
      if (innerIdx >= 0) {
        const pos = this.positionOnRing(innerIdx, innerNodes.length, cx, cy, innerRadius);
        x1 = pos.x;
        y1 = pos.y;
      } else {
        x1 = cx;
        y1 = cy;
      }
      x2 = cx;
      y2 = cy;
    } else {
      // Center -> outer node
      x1 = cx;
      y1 = cy;
      const outerIdx = outerNodes.findIndex((n) => n.packId === edge.to);
      if (outerIdx >= 0) {
        const pos = this.positionOnRing(outerIdx, outerNodes.length, cx, cy, outerRadius);
        x2 = pos.x;
        y2 = pos.y;
      } else {
        x2 = cx;
        y2 = cy;
      }
    }

    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    line.setAttribute("stroke", edge.type === "prerequisite" ? "#5c6bc0" : "#26a69a");
    line.setAttribute("stroke-width", "1.5");
    line.setAttribute("opacity", "0.5");

    this.svg.appendChild(line);
    this.edgeElements.set(`${edge.from}->${edge.to}`, line);
  }

  private drawFullGraphEdge(
    edge: SkillTreeEdge,
    cx: number,
    cy: number,
    core: SkillTreeNode[],
    applied: SkillTreeNode[],
    specialized: SkillTreeNode[],
    r1: number,
    r2: number,
    r3: number,
  ): void {
    const line = document.createElementNS(SVG_NS, "line") as SVGLineElement;
    line.setAttribute("class", "skill-tree__edge");
    line.setAttribute("data-from", edge.from);
    line.setAttribute("data-to", edge.to);

    const fromPos = this.findNodePosition(edge.from, cx, cy, core, applied, specialized, r1, r2, r3);
    const toPos = this.findNodePosition(edge.to, cx, cy, core, applied, specialized, r1, r2, r3);

    line.setAttribute("x1", String(fromPos.x));
    line.setAttribute("y1", String(fromPos.y));
    line.setAttribute("x2", String(toPos.x));
    line.setAttribute("y2", String(toPos.y));
    line.setAttribute("stroke", edge.type === "prerequisite" ? "#5c6bc0" : "#26a69a");
    line.setAttribute("stroke-width", "1");
    line.setAttribute("opacity", "0.25");

    this.svg.appendChild(line);
    this.edgeElements.set(`${edge.from}->${edge.to}`, line);
  }

  private findNodePosition(
    packId: string,
    cx: number,
    cy: number,
    core: SkillTreeNode[],
    applied: SkillTreeNode[],
    specialized: SkillTreeNode[],
    r1: number,
    r2: number,
    r3: number,
  ): { x: number; y: number } {
    let idx = core.findIndex((n) => n.packId === packId);
    if (idx >= 0) return this.positionOnRing(idx, core.length, cx, cy, r1);

    idx = applied.findIndex((n) => n.packId === packId);
    if (idx >= 0) return this.positionOnRing(idx, applied.length, cx, cy, r2);

    idx = specialized.findIndex((n) => n.packId === packId);
    if (idx >= 0) return this.positionOnRing(idx, specialized.length, cx, cy, r3);

    // Fallback: center
    return { x: cx, y: cy };
  }

  // --------------------------------------------------------------------------
  // Interaction
  // --------------------------------------------------------------------------

  private highlightConnections(packId: string): void {
    this.highlightedPackId = packId;

    // Find connected pack IDs
    const connected = new Set<string>([packId]);
    if (this.data) {
      for (const edge of this.data.edges) {
        if (edge.from === packId) connected.add(edge.to);
        if (edge.to === packId) connected.add(edge.from);
      }
    }

    // Dim unconnected nodes
    for (const [id, group] of this.nodeElements) {
      if (connected.has(id)) {
        svgRemoveClass(group, "skill-tree__node--dimmed");
      } else {
        svgAddClass(group, "skill-tree__node--dimmed");
      }
    }

    // Highlight connected edges, dim others
    for (const [key, line] of this.edgeElements) {
      const [from] = key.split("->");
      const to = key.slice(key.indexOf("->") + 2);
      if (from === packId || to === packId) {
        svgAddClass(line, "skill-tree__edge--highlighted");
        svgRemoveClass(line, "skill-tree__edge--dimmed");
      } else {
        svgRemoveClass(line, "skill-tree__edge--highlighted");
        svgAddClass(line, "skill-tree__edge--dimmed");
      }
    }
  }

  private clearHighlights(): void {
    this.highlightedPackId = null;

    for (const group of this.nodeElements.values()) {
      svgRemoveClass(group, "skill-tree__node--dimmed");
    }

    for (const line of this.edgeElements.values()) {
      svgRemoveClass(line, "skill-tree__edge--highlighted");
      svgRemoveClass(line, "skill-tree__edge--dimmed");
    }
  }

  // --------------------------------------------------------------------------
  // Layout helpers
  // --------------------------------------------------------------------------

  /**
   * Position a node on a ring.
   * Distributes nodes evenly around a circle starting from top (angle -PI/2).
   */
  private positionOnRing(
    index: number,
    total: number,
    centerX: number,
    centerY: number,
    radius: number,
  ): { x: number; y: number } {
    if (total === 0) return { x: centerX, y: centerY };
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  }

  /**
   * Abbreviates a pack ID or name for display.
   * "MATH-101" -> "MATH", "some-long-name" -> "some"
   */
  abbreviateName(packIdOrName: string): string {
    const hyphenIdx = packIdOrName.indexOf("-");
    if (hyphenIdx > 0) {
      return packIdOrName.slice(0, hyphenIdx);
    }
    return packIdOrName.slice(0, 4);
  }

  // --------------------------------------------------------------------------
  // CSS injection
  // --------------------------------------------------------------------------

  private injectStyles(): void {
    const styleId = "skill-tree-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = CSS;
    document.head.appendChild(style);
    this.cleanups.push(() => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    });
  }
}
