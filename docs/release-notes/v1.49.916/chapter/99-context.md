# Context — v1.49.916

## Provenance

- **Predecessor:** v1.49.915 (Counter-Cadence Tools-Suite Hygiene: atlas-deps-audit Flake-Audit + Tools-Suite CI-Hardening — #10461 3rd Instance). Release `0cd9010de`, post-ship rh `412d82963`, tag `v1.49.915`.
- **Origin:** opened from the v1.49.915 handoff (`.planning/HANDOFF-2026-05-30-v1.49.915-tools-suite-hygiene.md`). The handoff offered four forward paths; the operator selected (via AskUserQuestion) **option 1 (codify #10461 — bar met at v915)** + **option 3 (fix the quality-drift-check/refresh "PG-credential bug")**.
- **Counter-cadence:** #17, per the #10430 finer-grained ~5-ship maintenance cadence. The codify (option 1) is the natural next move the v913–v915 cluster pointed to; the PG/refresh robustness (option 3) is the "tool robustness" sibling.

## Three deliverables

1. **Codify #10461** — `docs/known-unwired-ledger-discipline.md` + `tools/render-claude-md/disciplines.json` + `npm run render:claude-md`. See 04-lessons for the three-form drift catalog.
2. **Release-history PG / refresh robustness** — `refresh.mjs` advisory `drift-check` exit-1 (+ entrypoint guard) + `db.mjs` loud credential error. The handoff's option-3 root cause was a misattribution (corrected below).
3. **AC7 leak-scan false-positive allowlist** — `publish.mjs` + `release-history.config.json`. Un-masked by deliverable 2.

## The option-3 root-cause correction

The handoff stated: *"`run-with-pg refresh` exits 1 at the drift-check step … fails with `SASL: client password must be a string` … a PG-credential bug in that tool."* Reproduced three ways, this is a **misattribution**:

- `run-with-pg quality-drift-check` → drift-check gets `RH_POSTGRES_URL`, **does not SASL**, exits 1 because `status: drifting` (drift detected — exit 1 *by design*).
- Direct, un-wrapped `node …/quality-drift-check.mjs` (no env) → `SASL` (exit **2**) — the opaque pg error when no credentials are resolvable.
- `scripts/release-history-refresh.sh` documents "exit 1 = drift warned (advisory, not a blocker)" — but `refresh.mjs` treated drift's by-design exit-1 as a **pipeline failure**, aborting BEFORE the final `audit` step on every ship.

So the *real* "exits 1 every ship" cause was `refresh.mjs` not honoring drift-check's advisory exit code (fixed by `isAdvisoryExit`), and the SASL was a *separate* opaque-error wart on the un-wrapped path that mis-led the diagnosis (fixed by `db.mjs`'s loud error — an opaque error message is a misdiagnosis generator).

## AC7 — un-masked, characterized, fixed

Making drift advisory let the `audit` step run for the first time in ~330 ships and surfaced **AC7 (publish dry-run): 1 blocked file** — `v1.49.588/03-retrospective.md`, a **self-referential false positive**: the retrospective documents the AC7/AC10 leak-scan hardening and quotes the `\.planning/(?:fox-companies|agent-memory)/` regex, so the bare `fox-companies` pattern (a gitignored local override) matches its own documentation. No real leak. Fixed with a narrow, exact-match, committed `leak_scan_allowlist` (operator-selected via AskUserQuestion over track-separately / source-edit).

## Verification trail

- **Reproduction:** drift-check via run-with-pg → exit 1 (`status: drifting`, NOT SASL); direct → SASL exit 2; both pinned by tests.
- **Tools suite:** `npx vitest run --config vitest.tools.config.mjs` → **691** (+27 over v915's 664: db-pg-credentials 9 + refresh-advisory-exit 7 + publish-leak-allowlist 11).
- **node:test gate:** `check-tools-test-coverage.mjs --run-node-test` → 21 pass, exit 0.
- **AC7:** publish dry-run **1 → 0 blocked**; standalone `audit` **FAIL → PASS (10/10)**; full `run-with-pg refresh --fast` exits 0 with `audit` running (pre-ingest, the only residual audit drift is AC1 `missingInTable:[v1.49.916]` — the expected in-flight state that clears on post-ship ingest).
- **Discipline coverage:** lessons **147 → 148**; UNCODIFIED 0 / PARTIAL 0; ceilings 5/5.
- **Adversarial review:** 4-dimension workflow, 0 confirmed blocker/major defects; 2 minors closed (db.mjs passwordless edge + accurate docstring).
- **Main suite:** unchanged at 35,562 (no `src/` change).

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Standard counter-cadence ship; no www/ content change → FTP sync N/A, GH release queued (deferred since v886).
- No NASA/MUS/ELC content → depth-audit + canonical-layout/sidebar gates are no-ops.
- The post-ship `run-with-pg refresh` now runs `audit` (previously skipped behind the drift-abort). With v916 ingested it passes; AC7 stays green via the allowlist.

## Forward path (operator picks next session)

1. **NASA forward-cadence at 1.179** — the standing highest-leverage move; codify/gate/verify debt near-zero. 134 consecutive ships at the 1.178 pressure-margin record.
2. **Audit-step semantics review** — decide whether `refresh.mjs`'s `audit` failure should be fatal (current) or advisory (the dead-branch comment's stated intent); resolve the inert `if (audit) break` smell at the same time.
3. **`fox-companies`-pattern breadth** — the bare `fox-companies` leak pattern (local override) is broad enough that future retrospectives naming it will re-trip; consider narrowing the local pattern or extending the allowlist per occurrence.

## Known issues carried forward (unchanged this ship)

- Auto-regen drift on prior chapter retrospectives + dashboard/INDEX (DB-vs-filesystem, since pre-v896); hand-authored versions remain in HEAD, NOT committed.
- GH release queue paused since v886 / FTP sync NOT run (v903–v916). Git tags authoritative; batch-catchable via `npm run gh-release-publish <tag>`. Pre-flight `nc -zvw3 216.222.199.72 21` before any FTP sync. v916 changed no www/ content.
- REQUIREMENTS.md + ROADMAP.md remain recovery stubs (local-only).
