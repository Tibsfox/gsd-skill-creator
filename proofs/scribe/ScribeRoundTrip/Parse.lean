/-
  ScribeRoundTrip.Parse
  =====================

  The `parse : SvgArtifact → Option Ast` function — Lean mirror of:
    examples/cartridges/code-svg-hdl-bridge/svg-to-ast/parse.ts (parseSemantic)

  Returns `Option Ast` because the parser can fail (no root node, malformed
  metadata, unknown sub_type, etc.). Mirrors the `throw new Error(...)`
  failure modes in parseSemantic, lifted into `Option.none`.

  Round-trip discipline: per Doc 06 §3.1, the parser MUST recover the AST
  from the SCRIBE metadata block alone (the visual layer is redundant).
  This is what `parseSemantic` does in TS; this is what `parse` does here.
-/

import ScribeRoundTrip.Basic
import ScribeRoundTrip.ToyAst
import ScribeRoundTrip.Render

namespace ScribeRoundTrip

/-- Find the root node: the unique node with no incoming `child` edge.
    Mirrors the loop at parseSemantic.ts §"let root: ScribeNode | null = null;". -/
def findRoot (g : ScribeGraph) : Option SvgScribeNode :=
  let dstIds : List String :=
    g.edges.filterMap fun e => if e.rel = .child then some e.dst else none
  g.nodes.find? fun n => ¬ dstIds.contains n.id

/-- Look up a node by ID. -/
def lookupNode (g : ScribeGraph) (id : String) : Option SvgScribeNode :=
  g.nodes.find? fun n => n.id = id

/-- Get the ordered list of children of a given node ID.
    Mirrors the `children.sort((a, b) => (a._order ?? 0) - (b._order ?? 0))`
    step in parseSemantic.ts. -/
def childrenOf (g : ScribeGraph) (parentId : String) : List SvgScribeNode :=
  let childEdges := g.edges.filter fun e => e.rel = .child ∧ e.src = parentId
  let sorted := childEdges.mergeSort (fun a b => a.order ≤ b.order)
  sorted.filterMap fun e => lookupNode g e.dst

/-- Convert a `SvgScribeNode` plus its already-parsed children back into an
    `Ast`. The conversion is a switch on `subType`, mirroring the toAst
    function in parseSemantic.ts.

    Returns `none` if the sub_type is unknown, the child arity doesn't
    match the constructor, a label fails to parse (e.g. NumericLiteral
    label is not a Nat), etc. -/
partial def reconstructAst (g : ScribeGraph) (n : SvgScribeNode) : Option Ast :=
  -- Detailed implementation deferred to proof-fill stage.
  -- The shape follows parseSemantic.ts toAst() + astToSource() switch
  -- on n.sub_type. See Section21 for the round-trip identity statement
  -- this function must satisfy.
  sorry

/-- Top-level parser. Mirrors `parseSemantic` in parse.ts.

    Returns `none` if:
      - there's no root node (no node lacks an incoming `child` edge)
      - the graph kind is not `.ast`
      - the version is not `"1"`
      - any sub_type is unknown / arity mismatch / label-parse failure
-/
def parse (svg : SvgArtifact) : Option Ast :=
  if svg.graph.kind ≠ GraphKind.ast then none
  else if svg.graph.version ≠ namespaceVersion then none
  else
    match findRoot svg.graph with
    | none      => none
    | some root => reconstructAst svg.graph root

end ScribeRoundTrip
