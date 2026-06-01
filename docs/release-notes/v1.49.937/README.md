---
title: "v1.49.937 — CF4d: algebrus.eigen complex-serialization wire fix"
version: v1.49.937
date: 2026-06-01
summary: >
  CF4d of the v929 carry-forward campaign — the deferred eigen wire fix discovered during
  the v935 recon, and the campaign's FINAL item. `algebrus.eigen` errored on every call
  through the typed MCP client because `scipy.linalg.eig` always returns a complex dtype
  (even for real eigenvalues) and the server's `json.dumps` had no complex encoder — the
  result was rewrapped as `{error, backend:"error"}` and the client correctly threw. The
  CPU fallback now force-casts both eigenvalues and eigenvectors to `complex128` and emits
  JSON-safe `{re, im}` pairs (a targeted source fix, NOT a blanket json encoder — per the
  failure-mode-contracts discipline #10427). The TS client gains a `Complex`/`EigenResult`
  contract. Orthogonal to the CF4c CPU-only verdict — eigen stays CPU-only; the fix only
  makes its existing result wire-safe. No GPU path added; det/inv were already wire-safe.
tags: [cf4d, coprocessor, eigen, wire-contract, complex, "#10427", bugfix, campaign-complete]
---

# v1.49.937 — CF4d: algebrus.eigen complex-serialization wire fix

**Shipped:** 2026-06-01

One-line: `algebrus.eigen` now returns over the wire instead of throwing — the CPU fallback emits JSON-safe `{re, im}` pairs for eigenvalues and eigenvectors, and the TS client exposes a typed `EigenResult`. This is the last item of the v929 carry-forward campaign.

## Why this ship

CF4d is the only remaining (and not-originally-scoped) item of the v929 carry-forward campaign — a defect surfaced during the v935 recon. `algebrus.eigen` failed on **every** call through the typed MCP client: `scipy.linalg.eig` always returns a complex dtype (even for a real-eigenvalue diagonal matrix, e.g. `[(2+0j), (3+0j)]`), and the server's `json.dumps` (`server.py:~293`) had no complex encoder, so it raised `TypeError: Object of type complex is not JSON serializable`. The blanket handler rewrapped that as `{error, backend:"error"}`, and `client.ts normalizeToolResult` correctly **threw** (`Coprocessor tool algebrus.eigen failed: …`). The dispatch path is pure delegation — `server.py` `algebrus.eigen` → chip `algebrus.eigen` (`return cpu.eigen(...)`) → `cpu.eigen` — so the entire wire is fixed at the CPU fallback. No GPU eigen path exists (eigen is intentionally CPU-only, the CF4c verdict).

## What shipped (9 files)

- **`coprocessors/math/math_coprocessor/fallback/cpu.py`** — a `_to_complex_pairs` recursive helper + `eigen()` now force-casts **both** `vals` and `vecs` to `np.complex128` before emitting `{re, im}` pairs. The force-cast is load-bearing: eigenvectors of a symmetric input come back as a real (`float64`) dtype, so without it the consuming type would be an unstable union (`Complex[]` eigenvalues but `number[][]` eigenvectors). Force-casting makes the wire shape uniform and the TS type stable.
- **`src/coprocessor/types.ts`** — new `Complex { re; im }` + `EigenResult { eigenvalues: Complex[]; eigenvectors: Complex[][] }`. Structurally identical to the holomorphic module's `ComplexNumber`, but declared locally so the coprocessor client stays standalone (no cross-module import).
- **`src/coprocessor/client.ts`** — `eigen()` return type → `ToolResult<EigenResult>`; the `normalizeToolResult` doc comment adds eigen to the spread-ops list.
- **`src/coprocessor/index.ts`** — barrel-exports `Complex` + `EigenResult`.
- **`src/coprocessor/__tests__/normalize.test.ts`** — a CI-safe `EIGEN_CPU` drift-guard pinning the `{re, im}` wire shape + meta stripping (mutation-proven).
- **`src/coprocessor/__tests__/numerical-analysis-coprocessor.integration.test.ts`** — two gated live oracle cases: a real diagonal (eigenvalues 2, 3; imag ≈ 0) and a rotation matrix (eigenvalues ±i; real ≈ 0).
- **`coprocessors/math/math_coprocessor/tests/test_correctness.py` + `test_edge_cases.py`** — decode `{re, im}` before asserting (the in-process eigen tests).
- **`coprocessors/math/PACKAGE.md`** — the CF4c verdict block's deferred-defect note rewritten to RESOLVED (CF4d).

## The design choice: targeted source fix, not a blanket encoder

The fix lives at the data source (`cpu.eigen`), not as a `default=` complex encoder at the server's `json.dumps` boundary. A blanket encoder would silently turn **any** future genuinely-unexpected complex value into `{re, im}` rather than failing loudly — masking contract gaps. Per the failure-mode-contracts discipline (#10427), a load-bearing compute result must fail loudly, not silently encode. Making eigen's own output explicitly wire-safe (the way `svd`/`fft` already shape their output) is the honest contract; any future complex-producing op that hasn't been made wire-safe will still throw loudly.

## Verification

- `tsc --noEmit` exit 0; TS unit (normalize + types) 19/19; **live integration 8/8 against the real Python MCP server** (incl. both new eigen cases); full Python suite 137/137 (in a venv with `mcp`/`numpy`/`scipy`/`pyyaml`).
- **Mutation-proven, both load-bearing tests:** reverting the `cpu.eigen` encoder reds exactly the two live eigen tests with the verbatim original error (`Object of type complex is not JSON serializable`); perturbing the `EIGEN_CPU` fixture reds only the eigen drift-guard.
- A 5-lens adversarial-verify Workflow returned 2 CLEAN / 3 NITS_ONLY (no blockers/concerns); the worthwhile NITs were folded (barrel export, precise docstring attribution).

## Engine state

NASA degree **1.178** (unchanged). Counter-cadence **20** (unchanged — forward fix work). Manifest **150** (no new lesson — an application of #10427, with a carried-forward candidate on force-casting for a stable wire contract). **This ship COMPLETES the v929 carry-forward campaign** (CF1 → CF2a → v932 recovery → CF2b → CF3 → CF4b+CF4c → CF4a → CF4d).
