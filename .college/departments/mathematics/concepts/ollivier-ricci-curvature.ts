/**
 * Ollivier-Ricci Curvature concept — signed scalar on graph edges via optimal transport.
 *
 * Geometry / Topology wing.
 * Ollivier-Ricci curvature of an edge (u,v) in a graph is
 *   κ(u,v) = 1 − W_1(m_u, m_v) / d(u,v)
 * where W_1 is the Wasserstein-1 distance between one-step random-walk
 * distributions at u and v. Positive κ indicates a well-connected
 * neighbourhood; negative κ indicates a bottleneck where information must
 * funnel between communities. The April 2026 cluster paper (arXiv:2604.14211)
 * develops the directed-graph variant and supplies numerical recipes for
 * the Wasserstein core. This is the M4 substrate for the Phase 746
 * Ricci-Curvature Audit in src/ricci-curvature-audit/.
 *
 * Milestone: v1.49.572 math-foundations-apr2026.
 *
 * @module departments/mathematics/concepts/ollivier-ricci-curvature
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~5*2pi/29, radius ~0.88 (topological-geometric ring)
const theta = 5 * 2 * Math.PI / 29;
const radius = 0.88;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const ollivierRicciCurvature: RosettaConcept = {
  id: 'mathematics-ollivier-ricci-curvature',
  name: 'Ollivier-Ricci Curvature',
  domain: 'mathematics',
  description: 'Ollivier-Ricci curvature assigns a signed scalar κ(u,v) to each ' +
    'edge of a graph via optimal transport: κ = 1 − W_1(m_u, m_v) / d(u,v), ' +
    'where m_u and m_v are one-step random-walk distributions at the endpoints ' +
    'and W_1 is the Wasserstein-1 distance. Positive curvature means a walker ' +
    'at u and a walker at v are close in distribution after one step — the ' +
    'neighbourhood is well-connected. Negative curvature means the edge is a ' +
    'bottleneck between two otherwise well-connected regions. The April 2026 ' +
    'cluster paper (arXiv:2604.14211) extends the construction to directed ' +
    'graphs, which is the variant needed for gsd-skill-creator\'s skill-DAG. ' +
    'Phase 746 ships src/ricci-curvature-audit/ as a read-only diagnostic — ' +
    'negative-curvature edges are surfaced as structured findings for human ' +
    'review, never as writes to the skill library.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'POT (Python Optimal Transport) supplies ot.emd2 for the exact Wasserstein-1 distance on the support of m_u and m_v. For large skill-DAGs the cluster paper recommends the Sinkhorn approximation via ot.bregman.sinkhorn for throughput. Edge-curvature results are stored in a pandas DataFrame indexed by (source, target). See arXiv:2604.14211.',
    }],
    ['typescript', {
      panelId: 'typescript',
      explanation: 'The Phase 746 Ricci-Curvature Audit reads a directed skill-DAG (nodes: SkillId, edges: SkillEdge), computes W_1 via a port of the linprog assignment solver, and emits a typed AuditFinding[] consumable by the session-observatory pipeline. Read-only discipline is enforced at the type level — no AuditFinding producer may write to SkillStore. See arXiv:2604.14211.',
    }],
    ['rust', {
      panelId: 'rust',
      explanation: 'A Rust implementation uses the pathfinding crate for shortest-path d(u,v) and a small custom solver for the Wasserstein-1 linear program on the discrete supports. The bottleneck-detection routine is parallelisable by edge via rayon. See arXiv:2604.14211.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mathematics-fractal-geometry',
      description: 'Ollivier-Ricci curvature on fractal lattices recovers the analytic Ricci curvature in the limit; fractal geometry wing supplies the continuous analogue',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-harness-as-object',
      description: 'The harness-as-object graph is the natural target of a Ricci-curvature audit: edges that are bottlenecks in harness composition appear as negative-curvature edges',
    },
    {
      type: 'dependency',
      targetId: 'mathematics-exponential-decay',
      description: 'Heat-kernel smoothing for Ricci-curvature flows depends on exponential decay of the random-walk transition probabilities',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
