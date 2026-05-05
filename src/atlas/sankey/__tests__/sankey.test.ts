import { describe, it, expect } from 'vitest';
import { sankeyLayout } from '../layout.js';
import { sankeyToSvg } from '../renderer-svg.js';
import type { SankeyNode, SankeyLink } from '../types.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function simpleDAG(): { nodes: SankeyNode[]; links: SankeyLink[] } {
  return {
    nodes: [
      { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' },
    ],
    links: [
      { source: 'A', target: 'B', value: 10 },
      { source: 'A', target: 'C', value: 5 },
      { source: 'B', target: 'D', value: 10 },
      { source: 'C', target: 'D', value: 5 },
    ],
  };
}

// ── Column assignment ─────────────────────────────────────────────────────────

describe('sankeyLayout – column assignment', () => {
  it('assigns source nodes to column 0', () => {
    const { nodes, links } = simpleDAG();
    const layout = sankeyLayout(nodes, links);
    const a = layout.nodes.find((n) => n.id === 'A')!;
    expect(a.column).toBe(0);
  });

  it('assigns sink nodes to the last column', () => {
    const { nodes, links } = simpleDAG();
    const layout = sankeyLayout(nodes, links);
    const d = layout.nodes.find((n) => n.id === 'D')!;
    expect(d.column).toBe(layout.columns - 1);
  });

  it('intermediate nodes get columns between 0 and max', () => {
    const { nodes, links } = simpleDAG();
    const layout = sankeyLayout(nodes, links);
    const b = layout.nodes.find((n) => n.id === 'B')!;
    const c = layout.nodes.find((n) => n.id === 'C')!;
    expect(b.column).toBeGreaterThan(0);
    expect(c.column).toBeGreaterThan(0);
    expect(b.column).toBeLessThan(layout.columns - 1);
  });

  it('3-level chain assigns correct columns 0→1→2', () => {
    const nodes: SankeyNode[] = [{ id: 'X' }, { id: 'Y' }, { id: 'Z' }];
    const links: SankeyLink[] = [
      { source: 'X', target: 'Y', value: 3 },
      { source: 'Y', target: 'Z', value: 3 },
    ];
    const layout = sankeyLayout(nodes, links);
    const x = layout.nodes.find((n) => n.id === 'X')!;
    const y = layout.nodes.find((n) => n.id === 'Y')!;
    const z = layout.nodes.find((n) => n.id === 'Z')!;
    expect(x.column).toBe(0);
    expect(y.column).toBe(1);
    expect(z.column).toBe(2);
  });
});

// ── Link-flow conservation ────────────────────────────────────────────────────

describe('sankeyLayout – flow conservation', () => {
  it('sum of incoming link values equals sum of outgoing for transit nodes', () => {
    const { nodes, links } = simpleDAG();
    const layout = sankeyLayout(nodes, links);
    // B is a transit node: total in = 10, total out = 10
    const bIn = layout.links.filter((l) => l.target === 'B').reduce((s, l) => s + l.value, 0);
    const bOut = layout.links.filter((l) => l.source === 'B').reduce((s, l) => s + l.value, 0);
    expect(bIn).toBe(bOut);
  });

  it('all link values are preserved in output (no mutation)', () => {
    const { nodes, links } = simpleDAG();
    const layout = sankeyLayout(nodes, links);
    const origValues = links.map((l) => l.value);
    const outValues = layout.links.map((l) => l.value);
    expect(outValues).toEqual(origValues);
  });

  it('sourceY + thickness offsets stay within source node height', () => {
    const { nodes, links } = simpleDAG();
    const layout = sankeyLayout(nodes, links);
    for (const lk of layout.links) {
      const src = layout.nodes.find((n) => n.id === lk.source)!;
      const endY = (lk.sourceY ?? 0) + (lk.thickness ?? 0);
      expect(endY).toBeLessThanOrEqual((src.height ?? 0) + 1e-6);
    }
  });
});

// ── SVG renderer ──────────────────────────────────────────────────────────────

describe('sankeyToSvg', () => {
  it('produces a <g class="sankey"> root element', () => {
    const { nodes, links } = simpleDAG();
    const layout = sankeyLayout(nodes, links);
    const svg = sankeyToSvg(layout);
    expect(svg).toMatch(/^<g class="sankey">/);
    expect(svg).toMatch(/<\/g>$/);
  });

  it('contains a <rect> per node', () => {
    const { nodes, links } = simpleDAG();
    const layout = sankeyLayout(nodes, links);
    const svg = sankeyToSvg(layout);
    const rectCount = (svg.match(/<rect/g) ?? []).length;
    expect(rectCount).toBe(nodes.length);
  });

  it('contains a <path> per link', () => {
    const { nodes, links } = simpleDAG();
    const layout = sankeyLayout(nodes, links);
    const svg = sankeyToSvg(layout);
    const pathCount = (svg.match(/<path/g) ?? []).length;
    expect(pathCount).toBe(links.length);
  });

  it('bezier paths use cubic C command', () => {
    const { nodes, links } = simpleDAG();
    const layout = sankeyLayout(nodes, links);
    const svg = sankeyToSvg(layout);
    expect(svg).toContain(' C');
  });

  it('node labels appear as <text> elements when provided', () => {
    const nodes: SankeyNode[] = [
      { id: 'P', label: 'Producer' },
      { id: 'Q', label: 'Consumer' },
    ];
    const links: SankeyLink[] = [{ source: 'P', target: 'Q', value: 7 }];
    const layout = sankeyLayout(nodes, links);
    const svg = sankeyToSvg(layout);
    expect(svg).toContain('Producer');
    expect(svg).toContain('Consumer');
  });

  it('respects custom node color callback', () => {
    const { nodes, links } = simpleDAG();
    const layout = sankeyLayout(nodes, links);
    const svg = sankeyToSvg(layout, { nodeColor: () => '#ff0000' });
    expect(svg).toContain('#ff0000');
  });
});

// ── Performance sanity ────────────────────────────────────────────────────────

describe('sankeyLayout – performance', () => {
  it('handles 50 nodes × 200 links under 300ms', () => {
    const nodeCount = 50;
    const linkCount = 200;
    const nodes: SankeyNode[] = Array.from({ length: nodeCount }, (_, i) => ({ id: `n${i}` }));
    const links: SankeyLink[] = [];
    // Build a layered DAG: 5 columns of 10 nodes, ~40 links per column boundary.
    const cols = 5;
    const perCol = nodeCount / cols;
    for (let c = 0; c < cols - 1; c++) {
      for (let i = 0; i < perCol; i++) {
        for (let j = 0; j < perCol; j++) {
          if (links.length >= linkCount) break;
          links.push({
            source: `n${c * perCol + i}`,
            target: `n${(c + 1) * perCol + j}`,
            value: Math.random() * 10 + 1,
          });
        }
        if (links.length >= linkCount) break;
      }
    }
    const start = Date.now();
    const layout = sankeyLayout(nodes, links);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(300);
    expect(layout.nodes.length).toBe(nodeCount);
  });
});
