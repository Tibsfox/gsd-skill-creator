# Proof obligations checklist

This document enumerates every `sorry` in `proofs/scribe/ScribeRoundTrip/`
along with:

- the round-trip invariant it discharges (per T3 doc 06 §3.1: I-AST-1..6),
- the tractability rating from T3 doc 08 (Easy / Medium / Hard),
- the estimated time-to-proof for an experienced Lean operator,
- the Mathlib lemmas likely needed,
- the operator action required to fill it.

All references to "Doc N" are to the T3 spec under
`.planning/missions/v1-49-621-scribe/t3-code-svg-hdl-bridge/`.

## Inventory: 9 `sorry` obligations

### P-RENDER-1 (Render.lean — `assignNodes`)

- **What it is:** post-order ID-and-node assignment walk over the AST,
  mirroring render.ts §`collectNodesAndEdges`.
- **Tractability:** Easy (definitional; not a theorem).
- **Mathlib needs:** none — pure Lean recursion.
- **ETA:** half a day. The shape mirrors `Ast.nodeCount` recursion.
- **Operator action:** replace `sorry` with the explicit recursion, return
  type `(List SvgScribeNode × Nat × String)`. The String component is
  the ID assigned to the AST root after the walk (used by Render's
  caller to build edges).

### P-RENDER-2 (Render.lean — `assignEdges`)

- **What it is:** for every parent-child relation in the AST, emit a
  `<scribe:edge rel="child" payload='{"order":N}'/>` with the sibling index.
- **Tractability:** Easy.
- **Mathlib needs:** none.
- **ETA:** half a day. Depends on P-RENDER-1's idMap output shape.
- **Operator action:** mirror render.ts §`collectNodesAndEdges` `if (parent) edges.push(...)`.

### P-PARSE-1 (Parse.lean — `reconstructAst`)

- **What it is:** convert a `SvgScribeNode` plus its already-parsed
  children back into an `Ast`. Mirrors parseSemantic.ts toAst() switch
  on `n.sub_type`.
- **Tractability:** Medium (definitional but with arity validation).
- **Mathlib needs:** `Option.bind`, `String.toNat?` for NumericLiteral.
- **ETA:** 2-3 days. Care needed for arity mismatches (e.g. binary
  expression with 3 children should return `none`).
- **Operator action:** `match n.subType with | "FunctionDeclaration" => ... | "Parameter" => ... | ...`.

### P1 — `binop_label_roundtrip` (Section21.lean)

- **Invariant:** I-AST-6 for binary-operator labels.
- **Statement:** `BinOp.fromLabel (BinOp.toLabel op) = some op`
- **Tractability:** Trivial. Case analysis over 8 BinOp constructors.
- **Mathlib needs:** none — `decide` should work, or 8 `rfl`s after `simp`.
- **ETA:** 30 minutes.
- **Operator action:** `intro op; cases op <;> rfl` — likely closes the goal.

### P2 — `render_preserves_node_count` (Section21.lean)

- **Invariant:** I-AST-1 (node-count preservation).
- **Statement:** `(render a src).graph.nodes.length = a.nodeCount`
- **Tractability:** Medium.
- **Mathlib needs:** `List.length_filterMap`, `List.length_mergeSort`,
  `List.length_append`, `Nat.add_assoc`.
- **ETA:** 3-5 days. Requires P-RENDER-1 done first.
- **Operator action:** structural induction on `a`; for each constructor
  unfold `render`, `assignNodes`, `Ast.nodeCount` and apply the IHs.

### P3 — `render_child_edge_arity` (Section21.lean)

- **Invariant:** I-AST-4 (every non-root has exactly one incoming child edge).
- **Statement:** for every node in the rendered graph, the count of
  incoming child edges is ≤ 1.
- **Tractability:** Medium.
- **Mathlib needs:** `List.countP_eq_zero`, `List.countP_le_length`.
- **ETA:** 2-3 days.
- **Operator action:** show post-order ID assignment makes IDs unique,
  hence at most one parent emits an edge with `dst = n.id`.

### P4 — `render_sibling_order` (Section21.lean)

- **Invariant:** I-AST-5 (sibling order preserved via `payload='{"order":N}'`).
- **Statement:** **placeholder** (currently `True := sorry`); needs to be
  strengthened to the actual sibling-order claim.
- **Tractability:** Medium-hard.
- **Mathlib needs:** `List.Sorted.mergeSort_eq`, `List.Pairwise`,
  `List.Nodup` for the sorting key.
- **ETA:** 3-4 days (including time to formulate the strong statement).
- **Operator action:** rewrite the theorem statement to talk about the
  child ID list ordered by `.order`; prove that mergeSort recovers the
  original child sequence.

### P5 — `roundtrip_identity` (Section21.lean)

- **Invariant:** I-AST-1..6 composed; the headline §2.1 claim.
- **Statement:** `parse (render a src) = some a`
- **Tractability:** Medium (depends on P1-P4).
- **Mathlib needs:** as in P1-P4 plus `Option.some.injEq` for the
  inductive-step plumbing.
- **ETA:** 1 week after P1-P4. Total Section21 effort: ~3 weeks.
- **Operator action:** structural induction on `a`. See the proof comment
  in Section21.lean for the per-constructor case strategy.

### P6 — `emitVerilog` (Section22.lean)

- **What it is:** AST → toy Verilog module. Definitional `sorry` to
  unblock the §2.2 theorem statements.
- **Tractability:** Easy (definitional).
- **Mathlib needs:** none.
- **ETA:** 1-2 days.
- **Operator action:** case analysis on `a`; assume top-level is `.funDecl`,
  build the `VModule` from its parameters and body.

### P7 — `denoteAst`, `denoteVExpr` (Section22.lean)

- **What it is:** denotational semantics for the toy AST and toy Verilog.
- **Tractability:** Easy (definitional, but care needed around partial
  semantics — division-by-zero is excluded from the toy subset; identifier-
  not-in-environment returns `none`).
- **Mathlib needs:** none for the definitions; `Nat.div`, `Nat.mod` if
  arithmetic operators are extended.
- **ETA:** 2-3 days (combined for both denotation functions).
- **Operator action:** mirror the case splits in `Ast` and `VExpr`;
  use `Option.bind` for environment lookup failures.

### P8 — `emit_preserves_semantics`, `roundtrip_preserves_verilog_semantics`,
        `verilogSemEquiv` reflexivity (Section22.lean)

- **Invariant:** §2.2 — semantic equivalence of round-tripped Verilog.
- **Tractability:** Hard (4-8 weeks for the toy subset; published
  precedent in CompCert / CakeML / Kami lineage per Doc 08 §3.2).
- **Mathlib needs:** `Function.LeftInverse`, `Equiv` lemmas; the
  Markov-kernel formalization (arXiv:2510.04070) for any future
  probabilistic extension.
- **ETA:** 4-8 weeks. Operators should scope this as a multi-month
  commitment, not a sprint task.
- **Operator action:** see Doc 08 §3.2 for the architectural plan;
  the core insight is to define `denoteAst` and `denoteVExpr`
  symmetrically so that emit-preservation is by structural induction.

### P9 — `roundtrip_idempotent` (Section23.lean)

- **Invariant:** Doc 06 §8 SHA-stability test.
- **Statement:** `render (the AST returned by parsing the rendered SVG) src = original SVG`
- **Tractability:** Trivial (depends on P5 only).
- **Mathlib needs:** `Option.some.inj`.
- **ETA:** 1 day after P5.
- **Operator action:** apply Section21.roundtrip_identity, combine
  with the `parse svg = some a'` hypothesis via `Option.some.inj` to
  get `a' = a`, then `render a' src = render a src = svg` by `rfl`.

## Per-section summary

| Section | # `sorry` | Total ETA | Tractability of hardest |
|---|---|---|---|
| Render.lean (def) | 2 | ~1 day | Easy |
| Parse.lean (def) | 1 | 2-3 days | Medium |
| Section21 | 5 | ~3 weeks | Medium |
| Section22 | 3 (composite) | 4-8 weeks | Hard |
| Section23 | 1 | 1 day | Trivial |
| Examples/* | 3 (one per file) | ~1 day total | Trivial (corollaries of P5) |
| **Total** | **15 logical / 9 unique numbered** | **~3 months focused work** | — |

(Note: Section22 collapses three `sorry`s into one obligation because
they're tightly coupled. Examples are one-line corollaries.)

## Recommended fill order

Per the dependency graph:

1. P-RENDER-1, P-RENDER-2, P-PARSE-1 (definitional `sorry`s — unblock everything else)
2. P1 (BinOp roundtrip — trivial; warm-up)
3. P2, P3, P4 (Section21 lemmas — paving)
4. P5 (Section21 main theorem — the §2.1 deliverable)
5. Examples/{Add,Xor1,Mux} (one-line corollaries — milestone for
   "the proof companion has its first machine-checked round-trip")
6. P9 (Section23 idempotency — easy win after P5)
7. P6, P7, P8 (Section22 — multi-month effort; consider a separate milestone)

Operators should consider P5 + the three Examples as the natural first
shipping milestone. The §2.2 work is research-paper-sized.
