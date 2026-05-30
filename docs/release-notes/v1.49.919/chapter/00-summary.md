# v1.49.919 — Summary

**GAP-table reconciliation.** The audit thread that produced M14–M16 left three Tier-3 items (T3.1 cross-platform CI, T3.3 Minecraft, T3.4 GPU E2E). Scoping all three against the live codebase found the audit had over-estimated each, and that two of the three "open gaps" were already-closed-but-unnamed or mislabeled-greenfield. This milestone reconciles the PROJECT.md gap table to the truth — closing GAP-4 with a real fix + a real GPU proof, and recording GAP-5 as intentional out-of-scope. No NASA degree advance (holds at 1.178). T3.1 cross-platform CI is deferred to its own ship (the repo is public, so free macOS/Windows runners make it low-cost when taken).

## GAP-4 — the gap was secretly broken, not "almost done"

The scout, reading the code, reported GAP-4 "already works E2E — just add a proof test." **Running** it told a different story:

- The v1.49.574 "megakernel" the audit named is a **pure-TypeScript Zod-schema substrate with zero GPU code** — it was never the E2E path (audit T3.4 conflated two GPU lineages).
- The real path is the **math coprocessor** (`skill-applicator` → `activateCoprocessor` → MCP → cuRAND), and it was **silently broken**: the Python server returns flat dicts (`{mean, …, backend}`, `{result, backend}`, `{chips, gpu, …}`) but the typed client expected a `{value, meta}` envelope the server never produces. `activateCoprocessor` threw on `caps.value.chips` (undefined); the default-on hook **swallowed** the throw → the GPU was never reached via skill activation. The one test that would have caught it (`live.integration.test.ts`) was skip-gated and its `.value`/`.meta` assertions were fiction.

This is the RC-04 "no shared schema between CLI and core types" tech debt, made concrete — and exactly the *intent-vs-execution* gap the audit exists to surface.

**The fix.** A single `normalizeToolResult(name, raw)` adapter in `client.ts` maps the server's flat response into the typed `{value, meta}` envelope for every tool:
- `meta.device` ← `backend` ("gpu" iff the op ran on the GPU); `meta.elapsed_ms` ← `computation_time_ms`.
- `value` ← `result` when present, else the payload with the meta keys stripped.
- server-side errors throw (load-bearing — a failed compute must not masquerade as a value, #10427).

With the adapter in place, `activation.ts` and `cli.ts` work unchanged (contained blast radius). Six drifted method/report types are corrected to the probed reality (`monteCarlo`/`describe`/`svd`/`verify`/`regression` payloads, `CapabilitiesReport`, `VramReport`), `cli.ts` reads the real `gpu_accelerated`/`cpu_fallback` chip fields, and `getSharedClient` honors `COPROCESSOR_PYTHON` so the default-on activation path can target a venv interpreter.

**The proof.** `gpu-e2e.integration.test.ts` (GPU-gated) drives the real activation pipeline — a `coprocessor: [statos]` skill flows through `createCoprocessorStage` → `activateCoprocessor` → the live MCP server → a cuRAND Monte-Carlo dispatch — and asserts `meta.device === 'gpu'` with a correct mean (E[x²+y] = 4/3). All 7 gated tests pass on the RTX 4060 Ti.

**The drift-guard.** `normalize.test.ts` pins `normalizeToolResult` to 10 verbatim-captured server wire shapes (CI-safe, no GPU/server needed). It is the regression layer that would have caught this bug — closing the root cause.

## GAP-5 — Minecraft scoped out

The v1.22 `infra/` Minecraft Knowledge World (289 files / ~4 MB; documentation + YAML layouts + bash deploy tooling) is a self-contained deliverable that was never wired into the adaptive-learning loop. The audit's "re-wire (skill-graph → voxel projection)" is mislabeled — it is greenfield: there is no voxel-render code anywhere, and the real skill/memory graph (`src/graph/` M1) has no coordinate/voxel projection surface (the "739-edge graph" is a research-citation graph). Recorded as **INTENTIONAL OUT-OF-SCOPE** in `docs/adr/0005-minecraft-knowledge-world-scope.md`, mirroring the GAP-3 "Intentional design" precedent. The `minecraft-knowledge-world` chipset stays maintained; nothing is deleted; a future product-surface decision would be a fresh milestone with its own SPEC.

## Result

GAP-4 CLOSED (proven), GAP-5 INTENTIONAL OUT-OF-SCOPE → 4 of 7 architecture gaps are now closed or intentional design. Coprocessor default run 39 pass / 7 skip (+10 CI drift-guard tests; +2 GPU-gated; live rewritten), 0 regressions, full repo typecheck clean. A latent default-on bug fixed and proven; no new deps.
