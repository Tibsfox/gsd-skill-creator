# v1.49.919 — Retrospective

## What went well

- **Running the path beat reading it.** The scoping scout, reading the coprocessor code, concluded GAP-4 "already works E2E — just add a proof test." Actually executing the path (provisioning `mcp`/`numpy`/`scipy`, spawning the real server, dumping the JSON) exposed a contract drift that made the default-on activation hook a silent no-op. Had the milestone trusted the read, it would have stamped GAP-4 "CLOSED" over a path the pipeline never actually uses — the exact intent-vs-execution gap the audit was created to catch.

- **Verify-before-write caught the eigen error and the envelope fiction for free.** Probing all 19 tools (not just the two needed for the proof) surfaced the pervasiveness of the drift — `svd` returns capitalised `U`/`Vt`, `describe` uses `std`/`var`/`q25`/`q75`, `verify` returns `verified` not `passed`, `algebrus.eigen` returns an *error* — so the fix could be correct generally rather than patched per-test.

- **One adapter, contained blast radius.** Normalizing in `callTool` (rather than rewriting every typed method or changing the public `{value, meta}` contract) meant `activation.ts` and `cli.ts` — the only two real consumers — work unchanged. No unit test mocked the envelope, so the 34 existing coprocessor tests stayed green.

- **The drift-guard closes the root cause.** `normalize.test.ts` pins the adapter to 10 verbatim server wire-shape fixtures and runs in CI without a GPU or a live server. This is the layer that was missing: the only test exercising real shapes was the skip-gated live test, so the drift hid for the life of the typed client (born in `ffea51a33`).

- **The audit's scope estimates were honestly over — and saying so was the value.** T3.1 (3–4 ships) is really 1–2; T3.3 (1–3) is a 1-fragment scope-out; T3.4 (4–6) was ~1 ship of fix+proof. Two of the three gaps were already closed-but-unnamed or greenfield-mislabeled. Reconciling the gap table to that truth is the deliverable.

## What was tricky

- **The MCP server needs Python deps the default env lacks.** Proving the path required `mcp` + `numpy` + `scipy` in a venv (system `python3` had none), then pointing `COPROCESSOR_PYTHON` at it — which is also why `getSharedClient` gained the env-var override (the default-on hook was hardcoded to `python3` and could never have reached a venv interpreter on a real machine).

- **Distinguishing "broken" from "dormant."** The hook is default-on AND no shipped skill declares `coprocessor:` frontmatter, so the path was doubly dormant — the drift never bit because the hook never triggered, and even if it had, the throw was swallowed. Calling GAP-4 "closed" demanded fixing the path so it actually works, not just asserting the GPU computes.

- **GPU verification is local-only.** Every GPU assertion runs on the operator's RTX 4060 Ti and is gated behind `COPROCESSOR_GPU_E2E=1`; CI has no GPU and does not provision the Python server. Consistent with the Memory Arena cuda-path convention — stated plainly so the verification surface is honest.

## Forward

- **Lesson candidate (not yet codified):** "Run the path, don't read it — a default-on hook whose activation error is swallowed can silently no-op against contract drift; pin the real wire shape with fixture tests so drift fails loudly in CI." Sibling of failure-mode-contracts #10427 + static-analysis-tool-discipline #10450. Deferred to the codify-axis cadence.
- **Eigen bug surfaced, not fixed:** `algebrus.eigen` returns `{error, backend:"error"}` for a simple diagonal matrix. Out of scope here; the normalizer now throws on it (load-bearing) instead of returning a bogus value. Worth a follow-on Python-side fix.
- **T3.1 cross-platform CI** remains open as its own ship — public repo means free macOS/Windows runners; a single macOS vitest matrix job is the high-value first step (Rust-in-CI is a separate, larger item since Rust has zero CI on any OS today).
- **No skill declares `coprocessor:` frontmatter yet** — the path is proven but has no production consumer. A real consumer (e.g. a stats-heavy skill) would move the coprocessor from "proven capability" to "living code" (meta-cadence consume axis #10438).
