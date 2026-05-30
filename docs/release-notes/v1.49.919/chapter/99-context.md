# v1.49.919 — Context

## Milestone metadata

- **Version:** v1.49.919
- **Type:** Feature + maintenance (architecture-gap reconciliation — GAP-4 close + GAP-5 scope-out)
- **Predecessor:** v1.49.918
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 18 (unchanged — audit-driven forward gap-closure, not a cleanup-mission)
- **Source:** audit items T3.3 + T3.4 (`.planning/AUDIT-2026-05-26-core-functions-retrospective.md`), re-scoped against the live codebase 2026-05-30

## Files changed

- `src/coprocessor/client.ts` — new `normalizeToolResult` adapter (flat server dict → `{value, meta}` envelope; throws on server error); `callTool` routes through it; 6 drifted method return types corrected to the probed reality
- `src/coprocessor/types.ts` — `CapabilitiesReport` + `VramReport` corrected to the real server shape; new `ChipCapability` / `GpuInfo` / `StreamsReport` types
- `src/coprocessor/activation.ts` — `getSharedClient` honors `COPROCESSOR_PYTHON`
- `src/coprocessor/cli.ts` — `list-tools` reads real `gpu_accelerated` / `cpu_fallback` chip fields (were `gpu_ops` / `cpu_ops`)
- `src/coprocessor/applicator-hook.ts` — docstring corrected ("default-off" → "default-on")
- `src/coprocessor/__tests__/normalize.test.ts` — NEW: 10 fixture-based drift-guard unit tests (CI-safe)
- `src/coprocessor/__tests__/gpu-e2e.integration.test.ts` — NEW: GPU-gated GAP-4 E2E proof (skill-activation → GPU)
- `src/coprocessor/__tests__/live.integration.test.ts` — assertions rewritten to the real wire shapes
- `docs/adr/0005-minecraft-knowledge-world-scope.md` — NEW: GAP-5 intentional-out-of-scope record
- `.planning/PROJECT.md` — GAP-4 row → CLOSED; GAP-5 row → INTENTIONAL OUT-OF-SCOPE

## Test posture

- Coprocessor default run: **39 pass / 7 skip** (was 29 pass / 5 skip). +10 `normalize.test.ts` CI tests; +2 GPU-gated `gpu-e2e` tests (skip in CI); 5 `live` tests rewritten (still gated).
- Main vitest suite: +10 CI tests from `normalize.test.ts` (≈ 35,572; pre-tag-gate confirms the exact total).
- GPU-gated proof: **7/7 pass** on the RTX 4060 Ti (`COPROCESSOR_LIVE_TESTS=1 COPROCESSOR_GPU_E2E=1 COPROCESSOR_PYTHON=<venv>`), incl. `coprocessor:[statos]` skill-activation → cuRAND Monte-Carlo with `meta.device === 'gpu'`. Locally-verified-only (CI has no GPU and does not provision the Python `mcp` server).
- Full repo typecheck (`npm run build`): clean.

## Verification provenance

- A 3-scout scoping workflow (T3.1 / T3.3 / T3.4) against the live codebase; T3.1 re-run as a single scout. Findings overturned the audit's per-item estimates.
- GAP-4 root cause found by *running* the path: provisioned a venv (`mcp`/`numpy`/`scipy`), probed all 19 tools through the real `CoprocessorClient` → MCP server → GPU, captured verbatim wire shapes (now the `normalize.test.ts` fixtures).

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + #10184 (single-step main FF) +
#10197 (STORY-gate post-bump-version). Canonical sequence at
`docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- No `www/` change → no FTP sync, no chapter-gen needed.
- GH release publish remains batch-deferred (since v886).
- Operator retains the G3 (dev→main) gate.

## Engine state at close

- NASA degree 1.178 (136 consecutive ships)
- Counter-cadence count 18
- Manifest: 24 domains, 149 lessons (lesson candidate noted in 04-lessons, not yet codified)
- KNOWN_UNWIRED Process/Egress/Loader: 0/0/0
- Architecture gaps: GAP-1 CLOSED, GAP-2 IN PROGRESS, GAP-3 intentional, GAP-4 **CLOSED (this ship)**, GAP-5 **INTENTIONAL OUT-OF-SCOPE (this ship)**, GAP-6 CLOSED, GAP-7 open → 4/7 closed-or-intentional
- Memory Arena: M16; remaining non-goal = datatypes plugin pattern
- Open follow-ons: T3.1 cross-platform CI (own ship); a real `coprocessor:` skill consumer; `algebrus.eigen` Python-side error
