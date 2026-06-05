# v1.49.979 — Retrospective

## What went right

- **Recon corrected the reachability model before any code moved.** The 8-agent recon (4 dimensions — reachability-chain / wire-ability / disposition-precedent / blast-radius, each classify→adversarial-verify) surfaced that the import closure is a *directional* chain — `scan-arxiv.ts → bridge.ts → sc-learn.ts → learn/*` — not a symmetric cycle. One recon agent wrongly claimed a cycle and another wrongly claimed `learn` would not flip; both were refuted by the graph-tracing verifiers and confirmed by hand. Registering scan-arxiv therefore over-determines all three module flips with one wire.
- **The cost-and-egress posture was made safe by default, not by documentation.** Recon flagged that scan-arxiv's native default billed an LLM judge and spawned a `claude -p` subprocess, and that its fetcher bypassed the EgressContext chokepoint. Both were closed structurally: the router forces local `embedding-only` unless `--rank` is passed, and an arxiv-scoped egress guard is hoisted before the fetch.
- **A dead line got repaired as a side effect.** Wiring `sc-learn`'s entrypoint also fixed the `bridge.ts` ingestion invocation that had been a silent no-op (`npx tsx src/commands/sc-learn.ts …` previously resolved to nothing).

## What went well in process

- Two operator round-trips (AskUserQuestion) decided the scope and the safety posture before the build — the irreversible/strategic calls stayed with the operator while the mechanical wiring proceeded.
- The drift-guard landed in the existing `tests/integration/learning-substrate-parked.test.ts` (`SHIP33_WIRED` block), so the gate denominator stayed 20.
- Step-P ran clean (0 confirmed across correctness / scope / guard-soundness / doc-accuracy / security); the two rejected findings were both sound rejections (a marginal missing-test and the intentional forward-looking v979-in-docs-vs-978-in-package.json pattern).

## What to watch

- **File-level reachability still masks sub-module shelfware.** Module-level `reachable=true` now holds for the three wired modules, but `learn/heuristics/*` (6 files, zero non-test importers), `commands/{sc-install,sc-unlearn,security-init}.ts`, and `scan-arxiv/{dedup-cli,aggregate-generators,primitive-enrichment}.ts` remain file-level unreachable — a future file-granularity disposition candidate, not a module row. `dedup-cli.ts` is a separate `process.argv` entrypoint, structurally unreachable to the static BFS.
- **The egress audit can't see the fetcher's indirected seam.** `src/security/egress-context-audit.test.ts` greps for `fetch(`; the fetcher's `getFetch()`/`fetchFn(` indirection is invisible to it, so the guard is explicit and the audit is intentionally unchanged (out of scope).
- **DRY debt.** The new `learn` `main()` is a 4th inline copy of the scLearn-wrapper logic (alongside the 3 `tools/ingest-*.mts` scripts); a shared `runLearn(argv)` refactor is deferred for scope discipline.
- The adjacent `src/initialization/dependency-checker.ts` orphan (a separate RETIRE candidate) and the dated 2027-06-04 / 2027-06-05 allowlist cohorts remain for review, not auto-renewal.
