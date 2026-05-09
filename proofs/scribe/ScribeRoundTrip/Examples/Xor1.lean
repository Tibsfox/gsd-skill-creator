/-
  ScribeRoundTrip.Examples.Xor1
  =============================

  Worked example: `function xor1(a, b) { return a ^ b }` round-trips identity.

  Demonstrates that the round-trip handles non-arithmetic binary operators.
  Used in the Doc 07 viewer to show 1-bit XOR; under Section22's Verilog
  semantics this corresponds to `assign out = a ^ b;` in Verilog.
-/

import ScribeRoundTrip.Basic
import ScribeRoundTrip.ToyAst
import ScribeRoundTrip.Render
import ScribeRoundTrip.Parse
import ScribeRoundTrip.Section21

namespace ScribeRoundTrip.Examples.Xor1

open ScribeRoundTrip

/-- The AST of `function xor1(a, b) { return a ^ b }`. -/
def xor1Ast : Ast :=
  .funDecl "xor1" ["a", "b"]
    (.retStmt
      (.binExpr .bitXor
        (.ident "a" ⟨44, 45⟩)
        (.ident "b" ⟨48, 49⟩)
        ⟨44, 49⟩)
      ⟨37, 50⟩)
    ⟨0, 50⟩

def exampleSrc : SourceProv :=
  { path := "examples/xor1.ts"
    sha  := "c4d2e0b3a8" }

theorem xor1_roundtrips :
    parse (render xor1Ast exampleSrc) = some xor1Ast := by
  -- Once Section21.roundtrip_identity is proven, this is one line.
  sorry

end ScribeRoundTrip.Examples.Xor1
