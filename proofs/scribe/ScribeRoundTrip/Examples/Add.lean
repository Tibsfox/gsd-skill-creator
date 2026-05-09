/-
  ScribeRoundTrip.Examples.Add
  ============================

  Worked example: `function add(a, b) { return a + b }` round-trips identity.

  This is the canonical first example from the Doc 07 viewer dropdown.
  The theorem statement is concrete; the proof is `sorry` until
  Section21.roundtrip_identity is discharged.

  Once Section21 is proven, this file should reduce to:
      exact Section21.roundtrip_identity addAst exampleSrc

  i.e., a one-line corollary of the general theorem.
-/

import ScribeRoundTrip.Basic
import ScribeRoundTrip.ToyAst
import ScribeRoundTrip.Render
import ScribeRoundTrip.Parse
import ScribeRoundTrip.Section21

namespace ScribeRoundTrip.Examples.Add

open ScribeRoundTrip

/-- The AST of `function add(a, b) { return a + b }`.

    Spans match the canonical example from Doc 06 §5:
      - FunctionDeclaration spans bytes 0..47
      - identifier `add` spans 9..12 (NOT modeled here; the funDecl carries the name)
      - parameter `a` spans 13..14
      - parameter `b` spans 22..23
      - ReturnStatement spans 34..47
      - BinaryExpression `+` spans 41..46
      - identifier `a` (rhs of return) spans 41..42
      - identifier `b` (rhs of return) spans 45..46
-/
def addAst : Ast :=
  .funDecl "add" ["a", "b"]
    (.retStmt
      (.binExpr .add
        (.ident "a" ⟨41, 42⟩)
        (.ident "b" ⟨45, 46⟩)
        ⟨41, 46⟩)
      ⟨34, 47⟩)
    ⟨0, 47⟩

def exampleSrc : SourceProv :=
  { path := "examples/add.ts"
    sha  := "b3a1c0a1f4" }

/-- The example's round-trip claim, specialized from Section21. -/
theorem add_roundtrips :
    parse (render addAst exampleSrc) = some addAst := by
  -- Once Section21.roundtrip_identity is proven, this is:
  --   exact Section21.roundtrip_identity addAst exampleSrc
  sorry

end ScribeRoundTrip.Examples.Add
