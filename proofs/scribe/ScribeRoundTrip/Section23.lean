/-
  ScribeRoundTrip.Section23
  =========================

  Composition theorem corresponding to T3 doc 08 §2.3:
  End-to-end semantic equivalence — Section21 ∧ Section22 imply that the
  full pipeline (TS source → AST → SVG → AST → Verilog) preserves the
  semantics of the original source.

  This document does NOT model the TypeScript-source layer (that would
  require formalizing a fragment of TS parsing); it composes at the AST
  layer. Operators extending the proof to source-level should add a
  module `Lex.lean` + `TsParse.lean` and re-derive Section23 with the
  TS-AST round-trip.

  Tractability: trivial once Section21 and Section22 are discharged.
  ETA: 1-2 days after Sections 21 and 22 are complete.
-/

import ScribeRoundTrip.Basic
import ScribeRoundTrip.ToyAst
import ScribeRoundTrip.Render
import ScribeRoundTrip.Parse
import ScribeRoundTrip.Section21
import ScribeRoundTrip.Section22

namespace ScribeRoundTrip
namespace Section23

open Section21 Section22

/-! ## Theorem — full-pipeline semantic equivalence

    For every well-formed toy AST, going through the full pipeline
    produces a Verilog module with the same semantics as the original.

    This is the headline claim of the SCRIBE round-trip: the SVG
    metadata layer is a *lossless* intermediate representation between
    code and HDL.
-/

theorem full_pipeline_preserves_semantics
    (a : Ast) (src : SourceProv) :
    let svg := render a src
    ∀ a', parse svg = some a' →
      verilogSemEquiv (emitVerilog a) (emitVerilog a') := by
  intro svg a' hParse
  -- Direct application of Section22.roundtrip_preserves_verilog_semantics
  -- which already composes Section21's identity at its first step.
  exact Section22.roundtrip_preserves_verilog_semantics a src a' hParse

/-! ## Corollary — idempotency of the round-trip

    Doc 06 §8 calls out the SHA-stability test:
       forward(reverse(forward(source))) == forward(source)

    Translated to the AST level: rendering twice through a round-trip
    produces the same SVG artifact.
-/

theorem roundtrip_idempotent (a : Ast) (src : SourceProv) :
    let svg1 := render a src
    ∀ a', parse svg1 = some a' →
      render a' src = svg1 := by
  intro svg1 a' hParse
  -- By Section21.roundtrip_identity, parse svg1 = some a, so a' = a
  -- by `Option.some.injEq`. Then render a' src = render a src = svg1.
  --
  -- Proof obligation P9 (trivial): apply Section21.roundtrip_identity,
  -- combine with the hypothesis hParse via Option.some.inj.
  sorry

end Section23
end ScribeRoundTrip
