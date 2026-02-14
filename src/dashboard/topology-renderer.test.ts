import { describe, it, expect } from 'vitest';
import {
  renderTopologyPanel,
  renderTopologyStyles,
  type TopologyNode,
  type TopologyEdge,
  type TopologyData,
} from './topology-renderer.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(overrides: Partial<TopologyNode> = {}): TopologyNode {
  return {
    id: overrides.id ?? 'node-1',
    label: overrides.label ?? 'Test Node',
    type: overrides.type ?? 'agent',
    domain: overrides.domain ?? 'backend',
    active: overrides.active ?? false,
    x: overrides.x ?? 0.5,
    y: overrides.y ?? 0.5,
  };
}

function makeEdge(overrides: Partial<TopologyEdge> = {}): TopologyEdge {
  return {
    from: overrides.from ?? 'node-1',
    to: overrides.to ?? 'node-2',
    active: overrides.active ?? false,
    domain: overrides.domain ?? 'backend',
  };
}

function emptyData(): TopologyData {
  return { nodes: [], edges: [], viewBox: { width: 800, height: 600 } };
}

// ---------------------------------------------------------------------------
// renderTopologyPanel -- Empty state
// ---------------------------------------------------------------------------

describe('renderTopologyPanel', () => {
  describe('empty state', () => {
    it('returns container with .topology-panel class', () => {
      const html = renderTopologyPanel(emptyData());
      expect(html).toContain('topology-panel');
    });

    it('shows "No topology data" message with .tp-empty class', () => {
      const html = renderTopologyPanel(emptyData());
      expect(html).toContain('tp-empty');
      expect(html).toContain('No topology data');
    });

    it('does NOT render SVG when no nodes', () => {
      const html = renderTopologyPanel(emptyData());
      expect(html).not.toContain('<svg');
    });
  });

  // -------------------------------------------------------------------------
  // Node rendering (6 entity shapes)
  // -------------------------------------------------------------------------

  describe('node rendering', () => {
    it('renders agent nodes as <circle> with class .tp-node-agent', () => {
      const data: TopologyData = {
        nodes: [makeNode({ type: 'agent' })],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('<circle');
      expect(html).toContain('tp-node-agent');
    });

    it('renders skill nodes as <rect> with class .tp-node-skill', () => {
      const data: TopologyData = {
        nodes: [makeNode({ type: 'skill' })],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('<rect');
      expect(html).toContain('tp-node-skill');
    });

    it('renders team nodes as <polygon> (hexagon) with class .tp-node-team', () => {
      const data: TopologyData = {
        nodes: [makeNode({ type: 'team' })],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('<polygon');
      expect(html).toContain('tp-node-team');
    });

    it('renders phase nodes as <polygon> (chevron) with class .tp-node-phase', () => {
      const data: TopologyData = {
        nodes: [makeNode({ type: 'phase' })],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('<polygon');
      expect(html).toContain('tp-node-phase');
    });

    it('renders adapter nodes as <polygon> (diamond) with class .tp-node-adapter', () => {
      const data: TopologyData = {
        nodes: [makeNode({ type: 'adapter' })],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('<polygon');
      expect(html).toContain('tp-node-adapter');
    });

    it('renders plan nodes as <circle> (small dot, r=4) with class .tp-node-plan', () => {
      const data: TopologyData = {
        nodes: [makeNode({ type: 'plan' })],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('<circle');
      expect(html).toContain('tp-node-plan');
      expect(html).toContain('r="4"');
    });

    it('each node has data-node-id attribute matching node.id', () => {
      const data: TopologyData = {
        nodes: [makeNode({ id: 'test-agent-42' })],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('data-node-id="test-agent-42"');
    });

    it('each node has data-domain attribute for domain coloring', () => {
      const data: TopologyData = {
        nodes: [makeNode({ domain: 'frontend' })],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('data-domain="frontend"');
    });

    it('active nodes get .tp-active class', () => {
      const data: TopologyData = {
        nodes: [makeNode({ active: true })],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('tp-active');
    });

    it('inactive nodes do not get .tp-active class', () => {
      const data: TopologyData = {
        nodes: [makeNode({ active: false })],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).not.toContain('tp-active');
    });
  });

  // -------------------------------------------------------------------------
  // Labels
  // -------------------------------------------------------------------------

  describe('labels', () => {
    it('each node has a <text> label positioned near it', () => {
      const data: TopologyData = {
        nodes: [makeNode({ label: 'Auth Agent' })],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('<text');
      expect(html).toContain('Auth Agent');
    });

    it('label text matches node.label for each node', () => {
      const data: TopologyData = {
        nodes: [
          makeNode({ id: 'a', label: 'Alpha' }),
          makeNode({ id: 'b', label: 'Bravo', x: 0.2, y: 0.2 }),
        ],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('Alpha');
      expect(html).toContain('Bravo');
    });
  });

  // -------------------------------------------------------------------------
  // Edge rendering
  // -------------------------------------------------------------------------

  describe('edge rendering', () => {
    it('edges rendered as <path> elements', () => {
      const data: TopologyData = {
        nodes: [
          makeNode({ id: 'n1', x: 0.2, y: 0.3 }),
          makeNode({ id: 'n2', x: 0.8, y: 0.7 }),
        ],
        edges: [makeEdge({ from: 'n1', to: 'n2' })],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('<path');
    });

    it('each edge has class .tp-edge', () => {
      const data: TopologyData = {
        nodes: [
          makeNode({ id: 'n1', x: 0.2, y: 0.3 }),
          makeNode({ id: 'n2', x: 0.8, y: 0.7 }),
        ],
        edges: [makeEdge({ from: 'n1', to: 'n2' })],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('tp-edge');
    });

    it('active edges get .tp-edge-active class', () => {
      const data: TopologyData = {
        nodes: [
          makeNode({ id: 'n1', x: 0.2, y: 0.3 }),
          makeNode({ id: 'n2', x: 0.8, y: 0.7 }),
        ],
        edges: [makeEdge({ from: 'n1', to: 'n2', active: true })],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('tp-edge-active');
    });

    it('inactive edges get .tp-edge-dormant class', () => {
      const data: TopologyData = {
        nodes: [
          makeNode({ id: 'n1', x: 0.2, y: 0.3 }),
          makeNode({ id: 'n2', x: 0.8, y: 0.7 }),
        ],
        edges: [makeEdge({ from: 'n1', to: 'n2', active: false })],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('tp-edge-dormant');
    });

    it('edge has data-from and data-to attributes', () => {
      const data: TopologyData = {
        nodes: [
          makeNode({ id: 'source', x: 0.2, y: 0.3 }),
          makeNode({ id: 'target', x: 0.8, y: 0.7 }),
        ],
        edges: [makeEdge({ from: 'source', to: 'target' })],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('data-from="source"');
      expect(html).toContain('data-to="target"');
    });
  });

  // -------------------------------------------------------------------------
  // Collapse logic (12-node max)
  // -------------------------------------------------------------------------

  describe('collapse logic', () => {
    it('when >12 nodes, only 12 rendered', () => {
      const nodes: TopologyNode[] = [];
      for (let i = 0; i < 15; i++) {
        nodes.push(makeNode({
          id: `node-${i}`,
          label: `Node ${i}`,
          x: (i % 5) * 0.2 + 0.1,
          y: Math.floor(i / 5) * 0.3 + 0.1,
        }));
      }
      const data: TopologyData = {
        nodes,
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      // Count data-node-id attributes
      const nodeMatches = html.match(/data-node-id=/g) || [];
      expect(nodeMatches.length).toBe(12);
    });

    it('active nodes prioritized during collapse', () => {
      const nodes: TopologyNode[] = [];
      // 14 inactive + 1 active (last one)
      for (let i = 0; i < 14; i++) {
        nodes.push(makeNode({
          id: `inactive-${i}`,
          label: `Inactive ${i}`,
          active: false,
          x: (i % 5) * 0.2 + 0.1,
          y: Math.floor(i / 5) * 0.3 + 0.1,
        }));
      }
      nodes.push(makeNode({
        id: 'active-special',
        label: 'Active Special',
        active: true,
        x: 0.9,
        y: 0.9,
      }));
      const data: TopologyData = {
        nodes,
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      // Active node should be preserved
      expect(html).toContain('data-node-id="active-special"');
    });

    it('collapsed nodes replaced by summary node with .tp-collapsed', () => {
      const nodes: TopologyNode[] = [];
      for (let i = 0; i < 15; i++) {
        nodes.push(makeNode({
          id: `node-${i}`,
          label: `Node ${i}`,
          x: (i % 5) * 0.2 + 0.1,
          y: Math.floor(i / 5) * 0.3 + 0.1,
        }));
      }
      const data: TopologyData = {
        nodes,
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('tp-collapsed');
    });

    it('summary node label shows count like "+3 more"', () => {
      const nodes: TopologyNode[] = [];
      for (let i = 0; i < 15; i++) {
        nodes.push(makeNode({
          id: `node-${i}`,
          label: `Node ${i}`,
          x: (i % 5) * 0.2 + 0.1,
          y: Math.floor(i / 5) * 0.3 + 0.1,
        }));
      }
      const data: TopologyData = {
        nodes,
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      // 15 - 11 = 4 collapsed
      expect(html).toContain('+4 more');
    });
  });

  // -------------------------------------------------------------------------
  // Panel structure
  // -------------------------------------------------------------------------

  describe('panel structure', () => {
    it('wraps SVG in .topology-panel container div', () => {
      const data: TopologyData = {
        nodes: [makeNode()],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('<div class="topology-panel"');
      expect(html).toContain('<svg');
    });

    it('has panel title "Route Map" with class .tp-title', () => {
      const data: TopologyData = {
        nodes: [makeNode()],
        edges: [],
        viewBox: { width: 800, height: 600 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('tp-title');
      expect(html).toContain('Route Map');
    });

    it('SVG has viewBox attribute from data.viewBox', () => {
      const data: TopologyData = {
        nodes: [makeNode()],
        edges: [],
        viewBox: { width: 1000, height: 500 },
      };
      const html = renderTopologyPanel(data);
      expect(html).toContain('viewBox="0 0 1000 500"');
    });
  });
});

// ---------------------------------------------------------------------------
// renderTopologyStyles
// ---------------------------------------------------------------------------

describe('renderTopologyStyles', () => {
  it('returns non-empty CSS string', () => {
    const css = renderTopologyStyles();
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains .topology-panel rule', () => {
    const css = renderTopologyStyles();
    expect(css).toContain('.topology-panel');
  });

  it('contains node type rules', () => {
    const css = renderTopologyStyles();
    expect(css).toContain('.tp-node-agent');
    expect(css).toContain('.tp-node-skill');
    expect(css).toContain('.tp-node-team');
    expect(css).toContain('.tp-node-phase');
    expect(css).toContain('.tp-node-adapter');
    expect(css).toContain('.tp-node-plan');
  });

  it('contains edge rules', () => {
    const css = renderTopologyStyles();
    expect(css).toContain('.tp-edge');
    expect(css).toContain('.tp-edge-active');
    expect(css).toContain('.tp-edge-dormant');
  });

  it('contains CSS animation for .tp-edge-active (animated pulse)', () => {
    const css = renderTopologyStyles();
    expect(css).toContain('@keyframes tp-pulse');
  });

  it('uses dashboard CSS custom properties', () => {
    const css = renderTopologyStyles();
    expect(css).toContain('var(--surface');
    expect(css).toContain('var(--border');
  });

  it('contains .tp-collapsed styling', () => {
    const css = renderTopologyStyles();
    expect(css).toContain('.tp-collapsed');
  });

  it('contains .tp-empty styling', () => {
    const css = renderTopologyStyles();
    expect(css).toContain('.tp-empty');
  });
});
