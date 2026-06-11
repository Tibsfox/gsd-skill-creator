/-
  Lake build manifest for the SCRIBE round-trip proof companion.

  Mission: SCRIBE (v1.49.621), Track T3 CODE-SVG-HDL-BRIDGE.
  CAP: CAP-047 (Lean 4 formal verification scaffold).

  This package proves the round-trip preservation theorems specified in
  T3 doc 08 (`08-formal-verification-angle.md`) §2.1, §2.2, §2.3 against
  the toy-subset parser/renderer at:

    examples/cartridges/code-svg-hdl-bridge/svg-to-ast/parse.ts
    examples/cartridges/code-svg-hdl-bridge/ast-to-svg/render.ts

  Mathlib: NOT required (removed 2026-06-11). No module in ScribeRoundTrip/
  imports Mathlib — the inductive types and round-trip lemmas are elementary
  and build against bare Lean v4.15.0 in seconds, vs a multi-GB Mathlib
  fetch + build. Re-add the pinned `require mathlib ... @ "v4.15.0"`
  directive (see docs/mathlib-deps.md for the pin rationale) when a proof
  actually needs it (expected first at §2.2 semantics work, per
  docs/proof-obligations.md).
-/
import Lake
open Lake DSL

package «scribe-roundtrip» where
  -- Lean options for proof development
  leanOptions := #[
    ⟨`pp.unicode.fun, true⟩,
    ⟨`autoImplicit, false⟩
  ]

@[default_target]
lean_lib «ScribeRoundTrip» where
  -- All `.lean` files under ScribeRoundTrip/ are part of the library.
  globs := #[.submodules `ScribeRoundTrip]
