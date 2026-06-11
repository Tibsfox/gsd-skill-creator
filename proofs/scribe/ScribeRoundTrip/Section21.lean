/-
  ScribeRoundTrip.Section21
  =========================

  Theorem corresponding to T3 doc 08 §2.1 + §2.2:
  Round-trip identity for the toy AST subset.

  The composite claim:
      ∀ (a : Ast) (src : SourceProv),
        parse (render a src) = some a

  This is the formal statement of the empirical claim verified by the
  Doc 07 viewer: that any toy-subset AST round-trips losslessly through
  the SVG metadata layer.

  Proof obligations enumerated below as `sorry` placeholders. Each is
  tagged with the round-trip invariant it discharges (I-AST-1..6 from
  Doc 06 §3.1) and the operator action required to fill it.

  Reference: arXiv:2510.04070 (Degenne et al.) Mathlib formalization
  for the basic equivalence-relation lemmas; see `docs/mathlib-deps.md`.
-/

import ScribeRoundTrip.Basic
import ScribeRoundTrip.ToyAst
import ScribeRoundTrip.Render
import ScribeRoundTrip.Parse

namespace ScribeRoundTrip
namespace Section21

/-! ## Lemma 1 — BinOp label round-trip

    Discharges I-AST-6 for binary-operator labels: `BinOp.fromLabel`
    is a left-inverse of `BinOp.toLabel` on the closed BinOp set.

    Tractability: trivial. `decide` or case analysis over the 8
    constructors. ETA: 1 day for an experienced Lean operator.
-/

theorem binop_label_roundtrip (op : BinOp) :
    BinOp.fromLabel (BinOp.toLabel op) = some op := by
  -- Proof obligation P1 (CLOSED 2026-06-11 — first machine-checked lemma in
  -- this package): case analysis over the 8 BinOp constructors
  -- {.add, .sub, .mul, .bitAnd, .bitOr, .bitXor, .eq, .lt}; each case
  -- reduces definitionally.
  cases op <;> rfl

/-! ## Lemma 2 — node-count preservation (I-AST-1)

    `render` emits exactly one `<scribe:node>` per AST node; `parse`
    reconstructs exactly one AST node per `<scribe:node>` it sees.

    Tractability: medium. Requires induction on Ast and a counting
    lemma about `assignNodes`. The recursion structure mirrors
    `Ast.nodeCount`; the proof should be a structural induction
    aligning the renderer's traversal with `nodeCount`.

    ETA: 3-5 days. Key Mathlib lemmas: `List.length_filterMap`,
    `List.length_mergeSort` (for the sibling-order sort).
-/

theorem render_preserves_node_count (a : Ast) (src : SourceProv) :
    (render a src).graph.nodes.length = a.nodeCount := by
  -- Proof obligation P2: induction on `a`. Each constructor case unfolds
  -- `render`, `assignNodes`, and `Ast.nodeCount` and applies the
  -- inductive hypotheses. Function-declaration case requires care
  -- because parameters become individual nodes (per I-AST-2 + I-AST-6).
  sorry

/-! ## Lemma 3 — child-edge arity (I-AST-4)

    Every non-root node has exactly one incoming `<scribe:edge rel="child">`.

    Tractability: medium. Requires defining "non-root" formally and
    inducting on the AST. Mathlib's `List.countP` is the natural tool.

    ETA: 2-3 days.
-/

theorem render_child_edge_arity (a : Ast) (src : SourceProv) :
    ∀ n ∈ (render a src).graph.nodes,
      let incomingChildEdges :=
        (render a src).graph.edges.countP fun e =>
          e.rel = .child ∧ e.dst = n.id
      incomingChildEdges ≤ 1 := by
  -- Proof obligation P3: each node id is fresh (post-order assignment)
  -- and the renderer emits exactly one parent→child edge per
  -- non-root descent.
  sorry

/-! ## Lemma 4 — sibling-order preservation (I-AST-5)

    The `payload='{"order":N}'` field on each child edge equals the
    sibling index in the source AST; `parse`'s `mergeSort` recovers
    the original order.

    Tractability: medium-hard. Requires a lemma that `mergeSort` on
    a strictly-ordered key produces the original sequence. Mathlib
    has `List.Sorted.mergeSort_eq` and friends.

    ETA: 3-4 days.
-/

theorem render_sibling_order (a : Ast) (src : SourceProv) :
    -- For every parent node in the rendered graph, the child edges
    -- ordered by `.order` match the original AST's child sequence.
    True := by
  -- Proof obligation P4: needs a careful statement of "matches the
  -- original AST's child sequence" — this requires the AST→ID map to
  -- be threaded through. Currently a placeholder TRUE statement.
  -- TODO: strengthen to the actual sibling-order claim.
  sorry

/-! ## Theorem (top-level) — round-trip identity

    Composes the four lemmas above with `reconstructAst` correctness
    to conclude `parse (render a src) = some a`.

    Tractability: depends on Lemmas 1-4. Once those are discharged,
    the top-level theorem follows by structural induction on `Ast`
    with one case per constructor.

    ETA: 1 week after Lemmas 1-4. Total: ~3 weeks of focused Lean
    work for the toy subset.

    Note on equivalence: in some scopes "round-trip identity" is
    proven up to alpha-equivalence (Doc 06 §3.1 lossy-by-design list).
    For the toy subset there are no binders that need alpha-renaming
    so we can prove strict equality.
-/

theorem roundtrip_identity (a : Ast) (src : SourceProv) :
    parse (render a src) = some a := by
  -- Proof obligation P5: structural induction on `a`. Cases:
  --   .funDecl name params body span =>
  --     unfold render, parse; apply Lemmas 2, 3, 4 + IH on `body`
  --   .param name span => trivial after unfolding
  --   .retStmt expr span => apply IH on `expr`
  --   .binExpr op lhs rhs span => apply Lemma 1 + IH on `lhs`, `rhs`
  --   .condExpr c t f span => apply IH on `c`, `t`, `f`
  --   .ident name span => trivial
  --   .numLit n span => trivial after Nat.toString round-trip lemma
  --   .boolLit b span => trivial after Bool round-trip lemma
  sorry

end Section21
end ScribeRoundTrip
