/-
  ScribeRoundTrip.Basic
  =====================

  Common types used by the SCRIBE round-trip proof companion.

  Mirrors:
    src/scribe/types/metadata-namespace.ts (TS source-of-truth, NOT modified)

  Substrate decisions reproduced:
    - SCRIBE namespace URI is a fixed string identifier (Berners-Lee 1996
      URI-as-identifier sense; not necessarily resolvable). Per metadata-spec §1.
    - Schema version is currently '1'; consumers MUST check the version on
      `<scribe:graph>`. Per metadata-spec §10.
    - GraphKind is a closed enum; we model it as an inductive type so that
      Lean exhaustiveness checking enforces the closed-set discipline.

  The Lean inductive types intentionally mirror the TypeScript shape so that
  proof obligations refer to the same constructors that the parser/renderer
  branch on at runtime. This is a faithfulness obligation, not a correctness
  obligation: the TS implementation may diverge from this model; correctness
  is established only when the obligations in Section21/Section22/Section23
  are discharged AND the operator confirms the model matches the
  implementation (manual review; not machine-checked at this scaffold stage).
-/

namespace ScribeRoundTrip

/-- The SCRIBE namespace URI; mirrors `NAMESPACE_URI` in
    `src/scribe/types/metadata-namespace.ts`. -/
def namespaceUri : String := "https://tibsfox.com/Research/SCRIBE/ns#"

/-- Current schema version; mirrors `NAMESPACE_VERSION`. -/
def namespaceVersion : String := "1"

/-- Closed enum of graph kinds; mirrors the TS `GraphKind` type. -/
inductive GraphKind where
  | ast
  | callgraph
  | dfg
  | cfg
  | netlist
  | fsm
  deriving DecidableEq, Repr

/-- Closed enum of source languages; mirrors `SourceLanguage`. -/
inductive SourceLanguage where
  | typescript
  | verilog
  | systemverilog
  | vhdl
  | chisel
  | amaranth
  | spinalhdl
  | c
  | cpp
  | python
  deriving DecidableEq, Repr

/-- Closed enum of edge relations; mirrors `ScribeEdgeRel`.
    Distinct from PROV-O's `ProvRelation`: the SVG `rel` attribute is a
    graph-structure relation, with a SUBSET of PROV relations available
    for persistence-bridging edges. -/
inductive EdgeRel where
  -- Tree / graph structural
  | child
  -- Netlist
  | wire
  -- Callgraph
  | calls
  -- DFG
  | uses
  | defines
  -- CFG
  | next
  | trueBranch
  | falseBranch
  -- Module instantiation
  | instantiates
  -- PROV-O persistence bridging (subset of ProvRelation)
  | wasDerivedFrom
  | wasGeneratedBy
  | used
  deriving DecidableEq, Repr

/-- Source-byte span: a half-open interval `[start, stop)` into the source.
    Mirrors `[number, number]` in `AstNode.span`. -/
structure Span where
  start : Nat
  stop  : Nat
  deriving DecidableEq, Repr

/-- Source provenance; mirrors `SourceProvenance` in TS. -/
structure SourceProv where
  path : String
  sha  : String
  deriving DecidableEq, Repr

end ScribeRoundTrip
