/**
 * Interval-Algebra Temporal Retrieval -- logic concept (June-2026 arXiv additional scan, T2).
 * @module departments/logic/concepts/interval-algebra-temporal-retrieval
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 5 * 2 * Math.PI / 7;
const radius = 0.72;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const intervalAlgebraTemporalRetrieval: RosettaConcept = {
  id: "logic-interval-algebra-temporal-retrieval",
  name: "Interval-Algebra Temporal Retrieval",
  domain: 'logic',
  description:
    "Interval-Algebra Temporal Retrieval (IA-RAG) is a hierarchical temporal retrieval-augmented generation framework that treats knowledge not as static text but as time intervals, so retrieval can honor duration, overlap, and containment rather than coarse timestamps (arXiv 2606.06044, 2026). Facts become Interval Event Units organized into a hierarchical Thematic Forest whose temporal dependencies are governed by Allen's Interval Algebra, the calculus of the thirteen basic relations between two intervals (before, meets, overlaps, during, contains, and their inverses, plus equals). Its distinct contribution is a Sub-graph Time Tightening mechanism that refines fuzzy or incomplete interval boundaries by propagating logical constraints across connected event subgraphs, plus interval-algebra-guided traversal for implicit temporal semantics. On temporal question-answering benchmarks — TimeQA, TempReason, and ComplexTR — IA-RAG's gains concentrate on complex compositional temporal reasoning, where formal interval constraints outperform coarse timestamp matching. For agent systems, this suggests time-stamped memory should store validity intervals and reason over them formally, letting an agent answer compositional temporal questions instead of matching literal dates.",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Store each Interval Event Unit as two numpy arrays `lo` and `hi`; the thirteen Allen relations become vectorized endpoint comparisons — `before = hi[:,None] < lo[None,:]`, `during = (lo[None,:] < lo[:,None]) & (hi[:,None] < hi[None,:])` — yielding a boolean relation tensor over all event pairs. Sub-graph Time Tightening is a fixpoint loop: repeatedly `lo = np.maximum(lo, neighbor_lo)` and `hi = np.minimum(hi, neighbor_hi)` all-reduced across each node's subgraph adjacency until no bound moves. Interval-algebra-guided traversal is then a masked BFS over the relation tensor.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "Model an interval as `struct IEU { double lo, hi; };` and encode Allen relations with a templated predicate `template<Rel R> bool relate(const IEU&, const IEU&)`, specialized per relation so the compiler inlines each test. Hold the Thematic Forest as an RAII-owned adjacency list of node indices. Time-tightening iterates Eigen array reductions — `lo = lo.cwiseMax(parentLo); hi = hi.cwiseMin(parentHi);` — over connected subgraphs to a fixpoint, letting Eigen's lazy expression templates fuse the min/max sweeps.",
    }],
    ['unison', {
      panelId: 'unison',
      explanation: "Define `type IEU = { lo : Nat, hi : Nat }` and a `Relation` sum type over Allen's thirteen relations; because Unison terms are content-addressed, structurally identical event units hash to one node in the Thematic Forest automatically. Expose retrieval as an `ability Temporal` with operations `tighten : IEU -> IEU` and `traverse : Relation -> [IEU]`, and write a handler that runs constraint propagation to a fixpoint. A temporal query is then an effectful computation the handler interprets, keeping the interval algebra separate from its search strategy.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "log-predicate-logic",
      description: "IA-RAG's Allen relations (before, meets, overlaps, during, ...) are predicate-logic constraints over interval endpoints, so the Thematic Forest depends on this formalism to represent temporal dependencies precisely.",
    },
    {
      type: "cross-reference",
      targetId: "log-causal-reasoning",
      description: "Interval-algebra-guided traversal reconstructs the precedence and overlap ordering of events that causal reasoning relies on to separate genuine cause from mere temporal coincidence.",
    },
    {
      type: "dependency",
      targetId: "log-formal-proof-systems",
      description: "The Sub-graph Time Tightening mechanism refines fuzzy interval bounds by deductively propagating logical constraints to a fixpoint, a proof-style inference step within each connected event subgraph.",
    },
    {
      type: "analogy",
      targetId: "logic-deontic-logic",
      description: "Both formalize reasoning over a structured relation: Allen's interval algebra composes qualitative relations between time intervals, while deontic logic composes accessibility relations between deontic worlds via Kripke frames — the same 'formal relation over a domain of structures' shape.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
