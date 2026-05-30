# Context — v1.49.913

## Provenance

- **Predecessor:** v1.49.912 (Gate-Tightening Micro-Ship: Discipline-Coverage Ceiling Ratchet 41→5 + PARTIAL Companion). Release `40ddcf2cc`, post-ship rh `fe193c3db`.
- **Origin:** opened from the v1.49.912 handoff (`.planning/HANDOFF-2026-05-29-v1.49.912-gate-tightening.md`). The handoff offered four forward paths; the operator selected **option 2 — "wire the tools-config suite into the gate"** (over the recommended NASA-1.179 default) via AskUserQuestion. Scope was re-confirmed once the suite turned out to be silently red: the operator chose **full green-up + wire + drift-guard** (one ship) and **lazy-import the FTP dependency (no new dependency)**.
- **Counter-cadence:** #14, per the #10430 finer-grained ~5-ship maintenance cadence (the steady-state complement to the ~30-ship batched cleanup).

## Why the suite was unenforced

`vitest.config.ts` (used by `npx vitest run` — pre-tag-gate step 2 and CI) defines a `projects` array whose root project includes `src/`, `.college/`, `tests/`, and `www/.../_harness/`. It deliberately does NOT include `tools/` or `scripts/`. Those tests were collected into a separate `vitest.tools.config.mjs`, intended (per its original header) as "forward-ready" until the root config widened — a widening that never happened. So the only way to run the tools tests was an explicit `--config vitest.tools.config.mjs`, which nothing automated ever did. This ship makes the gate run it.

## Why the include list is explicit (not a glob)

`tools/` contains two `node:test` files (`citation-debt/__tests__/list.test.mjs`, `release-history/__tests__/phases-plans-extraction.test.mjs`) that use Node's built-in test runner, which vitest cannot execute. A glob `tools/**/*.test.mjs` would sweep them in and crash the suite. The explicit list is the price of that exclusion — and the reason it needs the Layer-2 drift-guard, which classifies each file by its imported runner and reports the `node:test` files rather than silently dropping them.

## Verification trail

- **Main suite:** `npx vitest run` → 35,562 passing / 45 skipped / 7 todo, exit 0. No production regression (the only production-code change, `classify-types.mjs`, is a verified no-op on the README-present path).
- **Tools suite:** `npx vitest run --config vitest.tools.config.mjs` → 660 passing across 47 files. The drift-guard's live apply-to-self test confirms the include list covers all 46 vitest files; the 2 node:test files are reported + excluded.
- **Drift-guard tool:** `node tools/check-tools-test-coverage.mjs` → PASS (exit 0).
- **Adversarial review:** four-agent workflow over gate-shell / drift-guard / scorer+classify / catalog+ftp. Verdicts: gate-shell CLEAN, scorer+classify NIT, catalog+ftp CLEAN, drift-guard CONCERN → all CONCERN/NIT findings closed (multi-line-import classifier, inverse-check for misclassified include entries, degree-regex tightening; paired tests added).
- **Frozen-corpus legitimacy:** the 3 calibration blobs regenerate byte-deterministically from commit `557182042` and reproduce the documented grades (v585 B/83, v634 B/81, v587 A/90) with the current scorer.

## Forward path (operator picks next session)

1. **NASA forward-cadence at 1.179** — still the operator-recommended highest-leverage move; codify/gate debt remains zero and the tools-suite gate is now closed. 131 consecutive ships at the 1.178 pressure-margin record.
2. **CI-enforce the tools suite** — fold `vitest.tools.config.mjs` into CI (`npx vitest run`), not just the pre-tag-gate. Closes the gate-but-not-CI gap (this ship's OPENED thread); scope the network/ftp blast radius first.
3. **Add a `node --test` runner step** for the 2 `node:test` files under `tools/` (`citation-debt/list`, `phases-plans-extraction`) — the smaller sibling gap the drift-guard reports but does not yet enforce.
4. **Promote #10461** when a 2nd/3rd instance of unenforced-surface-rot or explicit-allowlist-drift appears.

## Known issues carried forward (unchanged this ship)

- Auto-regen drift on prior chapter retrospectives + dashboard/INDEX (DB-vs-filesystem, since pre-v896); hand-authored versions remain in HEAD, NOT committed.
- GH release queue paused since v886 / FTP sync NOT run (v903–v913). Git tags authoritative; batch-catchable. Pre-flight `nc -zvw3 216.222.199.72 21` before any FTP sync.
- REQUIREMENTS.md + ROADMAP.md remain recovery stubs (local-only).
