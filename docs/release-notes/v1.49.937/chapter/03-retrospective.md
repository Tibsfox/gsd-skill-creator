# v1.49.937 — Retrospective

## What went right

- **The recon nailed the wire shape before a line was written.** A live probe of `scipy.linalg.eig` against the venv confirmed two non-obvious facts up front: eigenvalues come back complex even for a real diagonal matrix, AND eigenvectors of a symmetric input come back *real*-dtype. The second fact is the one that would have bitten a naive fix — a per-element "convert complex to {re,im}, leave floats alone" encoder produces an unstable union type (`Complex[]` eigenvalues but `number[][]` eigenvectors). The probe surfaced it, so the fix force-casts both arrays to complex and the TS contract is stable from the start.

- **The targeted-vs-blanket decision was made on principle, not convenience.** The quick fix would have been a `default=` complex encoder at the server's single `json.dumps` call — one line, catches everything. It was rejected: a blanket encoder silently encodes any *future* genuinely-unexpected complex value instead of failing loudly, which is exactly the silent-failure anti-pattern #10427 warns against. Fixing eigen's output at the source keeps loud failures loud.

- **Mutation-proof caught the real bug, twice.** Reverting the encoder reproduced the *verbatim* original error string in the two live eigen tests; perturbing the static fixture reds only the drift-guard. Both load-bearing tests are demonstrably non-vacuous.

- **The adversarial verify earned its keep on coverage, not correctness.** Five lenses returned no blockers, but the test-quality lens made explicit that the live eigen tests are gated (skip in CI) — which is why the CI-safe `normalize.test` drift-guard is the load-bearing CI assertion. When that drift-guard was reverted mid-session, restoring it (operator-confirmed) preserved the only ungated runtime check of the contract.

## What to watch

- **CF4d changed a result CONTRACT, not just an internal.** Any consumer that assumed `eigen().value.eigenvalues` was `number[]` now gets `Complex[]`. A repo-wide sweep found no such consumer (the only `.eigen()` caller is the gated test), but a future caller must read eigenvalues as `{re, im}`. The `EigenResult` type and the barrel export make that explicit.

- **The eigen tests need a provisioned environment.** The full Python suite is 137/137 only with `mcp`/`numpy`/`scipy`/`pyyaml` installed; the live TS integration test is gated behind `COPROCESSOR_LIVE_TESTS`. CI runs neither (no GPU, no Python `mcp`). The `tsc` type-check + the `normalize.test` drift-guard are the CI-visible coverage.

- **`det`/`inv` share the CPU-only role and stay wire-safe** because they emit real floats. If a future op produces complex output, it will throw loudly at `json.dumps` until it is made wire-safe the same way — that is the intended (#10427) behavior, not a regression.

## Process note

The campaign's HARD ship discipline (code commit → chapters → STORY → bump → gate → chore/tag → push → RH → state) held end-to-end across v933–v936; CF4d reuses it verbatim. This ship is the eighth and final originally-tracked item of the v929 carry-forward campaign.
