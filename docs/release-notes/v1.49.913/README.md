# v1.49.913 — Tools-Suite Gate Wiring + Silent-Rot Green-Up + Layer-2 Drift-Guard

**Released:** 2026-05-29

Counter-cadence gate-hardening ship (counter-cadence #14) — operator-selected (via AskUserQuestion) over the recommended NASA-1.179 default, then scope-confirmed once the suite turned out to be silently red. The `vitest.tools.config.mjs` suite (the ~40 tools/ + scripts/ tests, including v912's own gate-critical `check-discipline-coverage` test) ran **nowhere enforced** — `npx vitest run` (pre-tag-gate step 2 + CI) scopes only to `src/ .college/ tests/ www/`. Wiring it into the gate first required greening a suite that had silently rotted red across 3+ subsystems, undetected for ~2 weeks.

- **NEW gate step — `tools-suite`** (`tools/pre-tag-gate.sh` step 2.5, exit 21, `SC_PRE_TAG_GATE_BYPASS=tools-suite`). Runs `npx vitest run --config vitest.tools.config.mjs`. Layer 1 of a two-layer closure (#10431/#10436): the enforcement layer.
- **NEW Layer-2 drift-guard** — `tools/check-tools-test-coverage.mjs` + `tools/__tests__/tools-config-coverage.test.mjs`. The include list is EXPLICIT (a glob would sweep up `node:test` files vitest can't run), and an explicit list silently drifts. The guard fails if any tools/ or scripts/ vitest file is missing from the list, if an include entry is stale, or if a `node:test` file was wrongly added. Runs inside the suite, so Layer 1 enforces Layer 2 automatically.
- **Green-up — 8 silently-red test files fixed** (18 failing assertions + 2 suites that wouldn't load), across 3+ subsystems:
  - **FTP** (`ftp-sync.mjs` + `ftp-delete.mjs`) — `basic-ftp` (undeclared/uninstalled) was imported at module top-level, so the pure-helper suites failed at import. Lazy-imported inside the live (`!dryRun`) path; no new dependency.
  - **Catalog** (`update-catalog-indexes.test.mjs`) — the v1.49.658 W2.2 template BLOCKER gate out-evolved the test's pre-W2.2 minimal fixtures. Fixtures made template-compliant; production tool untouched.
  - **Scorer** (`score-completeness.test.mjs` + `-c5`) — the 2026-05-25 "lift quality" commits rewrote the release-notes corpus these tests scored against. **Frozen** the calibration-era corpus (commit `557182042`) into committed fixtures rather than reverting real docs; no assertion weakened, scorer untouched.
  - **Reconciliation casualties** — `chapter-idempotent` (stub-rule vs <200-byte fixture), `classify-types-chip` (name-based degree check gated behind `if(readmeText)`), `run-with-pg-env` (broken `||`-of-`expect` + `.env` coupling) — all surfaced only once the 5 drifted-out files were added to the include list.
- **Include-list reconciliation** — 5 vitest files that existed on disk but were never registered (so ran nowhere enforced) added to `vitest.tools.config.mjs`; 2 `node:test` files correctly reported + excluded.

Counter-cadence count: 13 → 14. Tools suite **609 → 660** tests and now **GATE-ENFORCED**. Main suite **35,562 UNCHANGED**. No manifest codification (one candidate lesson #10461 recorded, below the 3-instance bar). UNCODIFIED 0 / PARTIAL 0 UNCHANGED. KNOWN_UNWIRED Process/Egress/Loader UNCHANGED at 0/0/0. NASA degree UNCHANGED at 1.178 (**131 consecutive ships**).

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons codified
- [99-context.md](chapter/99-context.md) — provenance + forward path

## What this ship is

- A counter-cadence gate-hardening ship (#14), per the #10430 finer-grained ~5-ship maintenance cadence.
- A two-layer closure (#10431/#10436): a gate step (enforcement) + a drift-guard (detection) for the tools-test suite.
- A deferred-maintenance closure (#10415): a silently-red test suite, closed within the ship that discovered it rather than deferred.

## What this ship is not

- Not a codify ship — no `tools/render-claude-md/disciplines.json` change, no new manifest lessons, CLAUDE.md unchanged.
- Not a chokepoint chip (all three Tier-E ledgers remain at KNOWN_UNWIRED 0).
- Not a NASA degree advance (still 1.178; 131 consecutive ships at the margin record).
- Not a production-behavior change to any shipped tool: the FTP lazy-import, the catalog fixtures, and the scorer freeze are all behavior-preserving; the only production-code edit (`classify-types.mjs`) is a verified no-op on the README-present path.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **131 consecutive ships**; pressure-margin record extended by 1).
**Counter-cadence count: 13 → 14** (+1).
**Manifest entries: 24** (UNCHANGED); **lessons in manifest: 147** (UNCHANGED — no codification this ship).
**Discipline-coverage: UNCODIFIED 0 / PARTIAL 0** (both UNCHANGED).
KNOWN_UNWIRED Process / Egress / Loader UNCHANGED at 0 / 0 / 0.
Wired calibratable thresholds 7 of 7 (UNCHANGED); verify-axis 7 COVERED + 0 PENDING-TEST (UNCHANGED).
Pre-tag-gate step count: **18 → 19** (+1: the new `tools-suite` step 2.5).
Vitest main suite: **35,562** (UNCHANGED). Tools suite (`vitest.tools.config.mjs`): **609 → 660** and now gate-enforced (+1 file net: drift-guard test; +5 reconciled files; −0).

## Files touched

- `tools/pre-tag-gate.sh` (UPDATED — NEW step 2.5 `tools-suite`, exit 21, legend + step-name vocab)
- `tools/check-tools-test-coverage.mjs` (NEW — Layer-2 drift-guard for the include list)
- `tools/__tests__/tools-config-coverage.test.mjs` (NEW — drift-guard test, ground-truth fixtures + live apply-to-self)
- `vitest.tools.config.mjs` (UPDATED — header + 6 include additions; reconciled to disk)
- `tools/ftp-sync.mjs` + `tools/ftp-delete.mjs` (UPDATED — lazy-import `basic-ftp` on the live path)
- `tools/__tests__/update-catalog-indexes.test.mjs` (UPDATED — template-compliant MUS/ELC fixtures)
- `tools/release-history/__tests__/score-completeness.test.mjs` + `score-completeness-c5.test.mjs` (UPDATED — prefer frozen corpus)
- `tools/release-history/__tests__/fixtures/{frozen-corpus.mjs, build-frozen-corpus.mjs, corpus/v1.49.{585,634,587}.corpus.md}` (NEW — frozen calibration corpus + regenerator)
- `tools/release-history/__tests__/chapter-idempotent.test.mjs` (UPDATED — ≥200-byte byte-identical fixture)
- `tools/release-history/__tests__/run-with-pg-env.test.mjs` (UPDATED — skip-guard on `.env` absence + assertion fix)
- `tools/release-history/classify-types.mjs` (UPDATED — hoist + tighten name-based degree detection)
- `docs/release-notes/v1.49.913/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — v913 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.912 → 1.49.913)
