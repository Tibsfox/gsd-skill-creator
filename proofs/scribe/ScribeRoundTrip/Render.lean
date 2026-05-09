/-
  ScribeRoundTrip.Render
  ======================

  The `render : Ast → SvgNode` function — Lean mirror of:
    examples/cartridges/code-svg-hdl-bridge/ast-to-svg/render.ts

  We model the SVG artifact as a structured graph (not a string of XML),
  containing the SCRIBE metadata block and the visual layer's per-node
  redundant `data-*` attributes. This is the same shape the TS renderer
  produces; we elide string-formatting concerns (whitespace, attribute
  ordering) since the proof obligations operate on the graph-structure
  level — see T3 doc 06 §3.1 invariants I-AST-1..6.

  Round-trip discipline (per render.ts §collectNodesAndEdges):
    - IDs are assigned post-order; we follow the same convention.
    - Every non-root node has exactly one incoming `child` edge with
      `payload='{"order":N}'` where N is the sibling index.
    - The metadata block carries the canonical graph; the visual layer
      carries redundant `data-*` for fallback recovery (Doc 02 §3.3).
-/

import ScribeRoundTrip.Basic
import ScribeRoundTrip.ToyAst

namespace ScribeRoundTrip

/-- A SCRIBE-namespaced node element: `<scribe:node id=... sub_type=... label=... span=.../>`.
    Mirrors the metadata-block emission in render.ts. -/
structure SvgScribeNode where
  id       : String
  subType  : String
  label    : String
  span     : Span
  deriving Repr

/-- A SCRIBE-namespaced edge element: `<scribe:edge id=... rel=... src=... dst=... payload='{"order":N}'/>`. -/
structure SvgScribeEdge where
  id      : String
  rel     : EdgeRel
  src     : String
  dst     : String
  /-- For `rel = .child` this is the `order` field of the JSON payload. -/
  order   : Nat
  deriving Repr

/-- The SCRIBE metadata graph carried inside `<metadata><scribe:graph>`.
    Mirrors the `metadata` string assembly in render.ts. -/
structure ScribeGraph where
  version  : String
  kind     : GraphKind
  language : Option SourceLanguage
  source   : SourceProv
  nodes    : List SvgScribeNode
  edges    : List SvgScribeEdge
  deriving Repr

/-- The full SVG artifact at the proof level.
    We omit visual layout (x/y coordinates) since the round-trip is layout-
    independent (Doc 06 §10 limit 1: layout is regenerated each time).

    The proof model captures EXACTLY the round-trippable state. -/
structure SvgArtifact where
  graph : ScribeGraph
  deriving Repr

/-! ## ID assignment

The renderer assigns IDs post-order via `collectNodesAndEdges`. We model
this as a state-monadic walk; for the proof scaffold we use a simple
counter-threaded recursion. -/

/-- Generate a fresh ID of the form `n<counter>`. -/
def freshId (counter : Nat) : String := s!"n{counter}"

/-- Recursive ID-and-node assignment: post-order walk over the AST,
    accumulating `(nodes, next_counter)`. -/
partial def assignNodes (a : Ast) (counter : Nat) :
    List SvgScribeNode × Nat × String :=
  -- This is a placeholder shape; the actual recursion needs to mirror
  -- render.ts's collectNodesAndEdges. The detailed implementation is
  -- left to the proof-fill stage; obligations in Section21 reference
  -- this function abstractly.
  sorry

/-- Edge collection: for every parent-child relation in the AST, emit a
    `<scribe:edge rel="child" payload='{"order":N}'/>`. -/
partial def assignEdges (a : Ast) (idMap : List (Ast × String)) :
    List SvgScribeEdge :=
  sorry

/-- The full renderer: AST → SVG artifact.

    Mirrors `renderAstSvg` in render.ts, modulo:
      - we elide the `layoutTree` step (layout is not a round-trip invariant)
      - we elide string serialization (we work on the graph-structure level)

    The proof obligations target `render` and `parse` as pure functions
    between `Ast` and `SvgArtifact`. -/
def render (a : Ast) (src : SourceProv) : SvgArtifact :=
  let (nodes, _, _) := assignNodes a 1
  let idMap : List (Ast × String) := []  -- TODO: populate during assignNodes
  let edges := assignEdges a idMap
  { graph :=
    { version  := namespaceVersion
      kind     := .ast
      language := some .typescript
      source   := src
      nodes    := nodes
      edges    := edges } }

end ScribeRoundTrip
