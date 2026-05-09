# SCRIBE Round-Trip Proof Companion (Lean 4 scaffold)

**Mission:** SCRIBE (v1.49.621) · **Track:** T3 CODE-SVG-HDL-BRIDGE · **CAP:** CAP-047

This package contains the Lean 4 substrate for the formal proof obligations
specified in T3 doc 08 §2.1, §2.2, §2.3 (`08-formal-verification-angle.md`):

| § | Claim | Lean module |
|---|---|---|
| §2.1 | Round-trip preserves AST identity for the toy subset | `ScribeRoundTrip/Section21.lean` |
| §2.2 | Round-trip preserves Verilog emission semantics | `ScribeRoundTrip/Section22.lean` |
| §2.3 | Composition: §2.1 ∧ §2.2 → end-to-end semantic equivalence | `ScribeRoundTrip/Section23.lean` |

## Status: scaffold (proof obligations are `sorry`)

The file structure, type definitions, theorem statements, and proof
obligations are concrete. The actual proof terms (the bodies that fill
each `sorry`) are **not** filled — that work is multi-week formal-
verification effort tracked in `docs/proof-obligations.md`.

What's done:
- Lean toolchain pinned (`lean-toolchain` → `leanprover/lean4:v4.15.0`)
- Mathlib dependency declared with version pin in `lakefile.lean`
- Inductive types mirroring `src/scribe/types/metadata-namespace.ts` (Basic.lean, ToyAst.lean)
- Function signatures mirroring `parse.ts` and `render.ts` (Parse.lean, Render.lean)
- Theorem statements for §2.1, §2.2, §2.3 with documented obligations (Section21..23.lean)
- Three worked-example theorem statements (Examples/Add.lean, Xor1.lean, Mux.lean)

What's NOT done:
- Filling the `sorry`s — see `docs/proof-obligations.md` for the full list (9 obligations)
- Running `lake update` to populate `lake-manifest.json` with concrete commit hashes
  (operator must do this once on a machine with Lean 4 installed; result should be committed)

## Operator setup

### 1. Install Lean 4

The recommended installer is `elan` (Lean's toolchain manager):

```bash
curl https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -sSf | sh
# Reload PATH (or open a new shell)
source $HOME/.elan/env
```

Verify:

```bash
elan --version
```

### 2. Pin the project's toolchain

`elan` reads `lean-toolchain` automatically; the first `lake` command in
this directory will install Lean 4 v4.15.0 if not already cached.

### 3. Resolve and lock dependencies

From this directory:

```bash
cd proofs/scribe
lake update                # downloads Mathlib + transitive deps; populates lake-manifest.json
git add lake-manifest.json # commit the populated lockfile
```

This step takes ~10-30 minutes the first time (Mathlib is ~500 MB).
Subsequent operators get reproducible builds via the committed manifest.

### 4. Build (expect `sorry` warnings)

```bash
lake build
```

Expected output: build succeeds, with one `unsolved goals (sorry was used)`
warning per `sorry` in the source. Currently 9 such warnings; see
`docs/proof-obligations.md` for the obligation-by-obligation list.

This is the working state. The build *succeeding* (modulo `sorry`) means
all theorem statements are well-typed, and the proof-fill work can begin
in any Lean 4 IDE (VS Code with the Lean 4 extension is the standard).

## Layout

```
proofs/scribe/
├── lean-toolchain                  Lean 4 version pin
├── lakefile.lean                   Build + Mathlib dep declaration
├── lake-manifest.json              Lockfile (placeholder; populate with `lake update`)
├── README.md                       this file
├── ScribeRoundTrip/
│   ├── Basic.lean                  namespace URI + GraphKind + EdgeRel + Span types
│   ├── ToyAst.lean                 the toy AST inductive type + BinOp + node count
│   ├── Render.lean                 render : Ast → SvgArtifact (mirrors render.ts)
│   ├── Parse.lean                  parse  : SvgArtifact → Option Ast (mirrors parse.ts)
│   ├── Section21.lean              §2.1 round-trip identity (4 lemmas + theorem)
│   ├── Section22.lean              §2.2 Verilog semantic equivalence (toy semantics)
│   ├── Section23.lean              §2.3 composition + idempotency corollary
│   └── Examples/
│       ├── Add.lean                add(a,b) round-trip claim
│       ├── Xor1.lean               xor1(a,b) round-trip claim
│       └── Mux.lean                mux(c,a,b) round-trip claim
└── docs/
    ├── proof-obligations.md        per-`sorry` checklist + invariant mapping
    ├── mathlib-deps.md             Mathlib lemmas needed (with citations)
    └── operator-build-guide.md     step-by-step setup instructions
```

## What this proves vs. what it doesn't

When all `sorry`s are discharged, this package proves:

- For every well-formed toy AST `a`, `parse (render a src) = some a` (Section21)
- The round-tripped Verilog emission is semantically equivalent to the
  original (Section22, against the toy denotational semantics defined here)
- The round-trip is idempotent: `render (parse_then_get (render a src)) src = render a src` (Section23 corollary)

It does NOT prove:

- That the TypeScript implementation (`parse.ts`, `render.ts`) matches
  this Lean model. That is a *faithfulness* claim requiring manual review;
  it is not machine-checked. (See Doc 08 §5 limit 1.)
- That the SVG, once emitted as a string, parses back identically through
  arbitrary tools. That is a *toolchain* claim about SVGO, Inkscape, etc.
  (See Doc 08 §5 limit 2.)
- That synthesis tools (Yosys, ABC, etc.) preserve the SCRIBE-emitted
  Verilog's semantics through place-and-route. That is the *synthesis*
  tool's correctness obligation. (See Doc 08 §5 limit 3.)

These limits are honest scoping. The Lean proofs target *what we claim*
(round-trip metadata identity) and *what we model* (toy AST + toy Verilog
denotational semantics).

## Citations

- Doc 08 (`08-formal-verification-angle.md`) — the full design rationale
- Doc 06 (`06-the-round-trip-thesis.md`) — the round-trip invariants (I-AST-1..6, I-HDL-1..8, I-CROSS-1..3)
- arXiv:2510.04070 (Degenne et al. 2025) — Markov kernels in Lean Mathlib;
  pinned-commit discipline anchor (see `docs/mathlib-deps.md`)
- arXiv:2604.20874 (Root Theorem of Context Engineering) — bounded-tape
  framing; the C5 external-verification-gate consequence is the empirical
  analog of formal verification
- de Moura & Ullrich 2021 — *The Lean 4 Theorem Prover and Programming Language*
- Mathlib Community 2024 — Mathlib4 standard library
