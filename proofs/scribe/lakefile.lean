/-
  Lake build manifest for the SCRIBE round-trip proof companion.

  Mission: SCRIBE (v1.49.621), Track T3 CODE-SVG-HDL-BRIDGE.
  CAP: CAP-047 (Lean 4 formal verification scaffold).

  This package proves the round-trip preservation theorems specified in
  T3 doc 08 (`08-formal-verification-angle.md`) §2.1, §2.2, §2.3 against
  the toy-subset parser/renderer at:

    examples/cartridges/code-svg-hdl-bridge/svg-to-ast/parse.ts
    examples/cartridges/code-svg-hdl-bridge/ast-to-svg/render.ts

  Mathlib pin rationale: per CLAUDE.md "External Citations" §JULIA-PARAMETER,
  the v1.50 proof companion compiles against the Markov-kernel formalization
  upstreamed by Degenne et al. (arXiv:2510.04070). This package follows the
  same pinning discipline; see `docs/mathlib-deps.md`.
-/
import Lake
open Lake DSL

package «scribe-roundtrip» where
  -- Lean options for proof development
  leanOptions := #[
    ⟨`pp.unicode.fun, true⟩,
    ⟨`autoImplicit, false⟩
  ]

require mathlib from git
  "https://github.com/leanprover-community/mathlib4.git" @ "v4.15.0"

@[default_target]
lean_lib «ScribeRoundTrip» where
  -- All `.lean` files under ScribeRoundTrip/ are part of the library.
  globs := #[.submodules `ScribeRoundTrip]
