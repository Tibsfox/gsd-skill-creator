/-
  ScribeRoundTrip.Examples.Mux
  ============================

  Worked example: `function mux(c, a, b) { return c ? a : b }` round-trips identity.

  Demonstrates that the round-trip handles conditional expressions
  (3-arg constructor `.condExpr`). Used in the Doc 07 viewer to show
  the canonical 2:1 multiplexer pattern; under Section22's Verilog
  semantics this corresponds to `assign out = c ? a : b;` in Verilog
  (synthesizes to a 2:1 mux).
-/

import ScribeRoundTrip.Basic
import ScribeRoundTrip.ToyAst
import ScribeRoundTrip.Render
import ScribeRoundTrip.Parse
import ScribeRoundTrip.Section21

namespace ScribeRoundTrip.Examples.Mux

open ScribeRoundTrip

/-- The AST of `function mux(c, a, b) { return c ? a : b }`. -/
def muxAst : Ast :=
  .funDecl "mux" ["c", "a", "b"]
    (.retStmt
      (.condExpr
        (.ident "c" ⟨42, 43⟩)
        (.ident "a" ⟨46, 47⟩)
        (.ident "b" ⟨50, 51⟩)
        ⟨42, 51⟩)
      ⟨35, 52⟩)
    ⟨0, 52⟩

def exampleSrc : SourceProv :=
  { path := "examples/mux.ts"
    sha  := "d5e3f1c4b9" }

theorem mux_roundtrips :
    parse (render muxAst exampleSrc) = some muxAst := by
  -- Once Section21.roundtrip_identity is proven, this is one line.
  sorry

end ScribeRoundTrip.Examples.Mux
