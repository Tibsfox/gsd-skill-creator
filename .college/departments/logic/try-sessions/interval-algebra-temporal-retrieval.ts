/**
 * Interval-Algebra Temporal Retrieval try-session -- logic (June-2026 arXiv additional scan, T2).
 * @module departments/logic/try-sessions/interval-algebra-temporal-retrieval
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const intervalAlgebraTemporalRetrievalSession: TrySessionDefinition = {
  id: 'logic-interval-algebra-temporal-retrieval-first-steps',
  title: "Build a Tiny Interval-Algebra Temporal Store",
  description:
    "Hands-on construction of a miniature IA-RAG: represent events as intervals, compute Allen relations, tighten a fuzzy boundary by constraint propagation, and answer a compositional temporal question by interval-guided traversal instead of keyword or timestamp matching.",
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Take two events — 'Project Alpha ran 2020-2023' and 'Bob was CEO 2021-2022' — write each as an interval [lo, hi] and decide by hand which Allen relation holds between them.",
      expectedOutcome:
        "You identify Bob's tenure as 'during' Project Alpha (strictly contained) and can state the inverse relation 'contains'.",
      hint: "Compare the endpoint orderings: do both of one interval's endpoints fall strictly inside the other's?",
      conceptsExplored: ["Interval Event Units", "Allen's Interval Algebra", "during/contains relation"],
    },
    {
      instruction:
        "List all thirteen basic Allen relations (before, meets, overlaps, starts, during, finishes, equals, and their inverses) and mark which relation is its own inverse.",
      expectedOutcome:
        "A table of 13 relations where only 'equals' is self-inverse and the other twelve form six inverse pairs.",
      hint: "Six relations plus their six inverses plus symmetric 'equals' gives thirteen.",
      conceptsExplored: ["thirteen basic relations", "relation inverses", "temporal structure vs timestamps"],
    },
    {
      instruction:
        "In Python/numpy, store five events as `lo` and `hi` arrays and compute the boolean 'before' and 'during' relation matrices via broadcasted endpoint comparisons.",
      expectedOutcome:
        "Two N-by-N boolean matrices whose true cells match your hand analysis of the sample events.",
      hint: "`before = hi[:,None] < lo[None,:]`; 'during' needs both endpoints of A strictly inside B.",
      conceptsExplored: ["vectorized relation computation", "relation matrix", "broadcasting"],
    },
    {
      instruction:
        "Give one event a fuzzy interval (lower bound unknown, upper bound 2022) plus constraints 'it is during Project Alpha (2020-2023)' and 'after Bob's start 2021'; propagate these to tighten its lower bound to a fixpoint.",
      expectedOutcome:
        "The lower bound tightens from unknown to 2021, and re-running propagation changes nothing.",
      hint: "Take the max of all lower-bound constraints and the min of all upper-bound constraints, then iterate until no bound moves.",
      conceptsExplored: ["Sub-graph Time Tightening", "constraint propagation", "fixpoint"],
    },
    {
      instruction:
        "Group your events into a two-level Thematic Forest (a 'Leadership' theme and a 'Projects' theme) and record parent-child containment edges.",
      expectedOutcome:
        "A small hierarchy where each theme's interval contains its children's intervals, forming a navigable event subgraph.",
      hint: "A parent theme's [lo, hi] should be the min lo and max hi of its child events.",
      conceptsExplored: ["hierarchical Thematic Forest", "containment hierarchy", "event subgraph"],
    },
    {
      instruction:
        "Answer 'Who was CEO while Project Alpha was running?' by traversing the forest with the overlaps-or-during interval relation rather than a keyword match.",
      expectedOutcome:
        "Traversal returns Bob by matching the temporal relation, even though the query names no date.",
      hint: "Filter candidate leadership events by whether their interval overlaps or is contained by the Project Alpha interval.",
      conceptsExplored: ["interval-algebra-guided traversal", "implicit temporal semantics", "compositional temporal QA"],
    },
    {
      instruction:
        "Contrast your interval store with a coarse-timestamp RAG that tags each fact with a single year; find one question the timestamp version answers wrong.",
      expectedOutcome:
        "You articulate that single-timestamp tagging discards duration and overlap, so 'during'/'overlaps' questions fail, motivating interval representation.",
      hint: "Pick a question about two things being true at the same time — one year cannot express an ongoing span.",
      conceptsExplored: ["duration vs timestamp", "failure modes of static RAG", "agent temporal memory"],
    },
  ],
};
