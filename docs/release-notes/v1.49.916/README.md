# v1.49.916 — Counter-Cadence Codify + Tool-Robustness Ship: Codify #10461 (Gate-Enforce-Every-Runnable-Surface + Drift-Guard) + Release-History PG/Refresh Robustness (Advisory Drift-Check + Loud Credential Error) + AC7 Leak-Scan False-Positive Allowlist

**Released:** 2026-05-30

Counter-cadence **codify + tool-robustness** ship (counter-cadence #17) — operator-selected (via AskUserQuestion) two workstreams from the v1.49.915 handoff: **codify #10461** (option 1, the bar reached across v913/v914/v915) and **fix the quality-drift-check/refresh "PG-credential bug"** (option 3). Investigating option 3 corrected its root cause (a misattribution) and un-masked a third, benign finding (AC7), fixed under the same theme.

- **Codify #10461 — gate-enforce every runnable surface, paired with a drift-guard.** Promotes the candidate that the v913+v914+v915 cluster carried to its 3-instance bar. New section in `docs/known-unwired-ledger-discipline.md` (two-layer shape + three-form drift catalog: omission-drift / silent-addition-drift / reference-data-staleness), `#10461` appended to the "KNOWN_UNWIRED allowlists as migration-debt ledger" domain in `tools/render-claude-md/disciplines.json`, CLAUDE.md re-rendered. Manifest **lessons 147 → 148**; UNCODIFIED 0 / PARTIAL 0 unchanged.
- **The handoff's option-3 root cause was a misattribution.** Reproduced three ways: via `run-with-pg`, `quality-drift-check.mjs` gets `RH_POSTGRES_URL` and **does not SASL** — it exits 1 because it **legitimately detects drift** (`status: drifting`, exit 1 *by design*). The opaque `SASL: client password must be a string` (exit **2**) only occurs on **direct, un-wrapped invocation**. And `scripts/release-history-refresh.sh` already documents "exit 1 = drift warned, advisory" — but `refresh.mjs` treated drift's by-design exit-1 as a pipeline failure, **aborting before the final `audit` step on every ship**.
- **`refresh.mjs` — drift-check exit-1 is now advisory.** `isAdvisoryExit(step, status)` makes `drift-check` exit-1 (and the pre-existing `scan` exit-2) non-fatal: the pipeline continues to `audit` and reports `PASS (with advisories)`. `drift-check` exit-2 (a real crash) stays fatal. Plus an **entrypoint guard** so `main()` runs only as CLI, never on import — the same hardening v915 applied to `chapter.mjs` (3rd instance of the shape), here also making `isAdvisoryExit` unit-testable.
- **`db.mjs` — loud, actionable credential error replaces opaque SASL.** `resolvePgCredentials()` throws a message naming `run-with-pg.mjs` and the env var when no connection is resolvable, *before* `pg` emits its cryptic SASL string. The passwordless-auth edge (host set, no password → trust/peer/`.pgpass`) is preserved. An opaque error message is a misdiagnosis generator — this exact one produced the handoff's wrong root cause.
- **AC7 leak-scan false-positive allowlist (un-masked by the refresh fix).** Letting `audit` run surfaced a benign pre-existing FAIL hidden ~330 ships: publish dry-run blocked `v1.49.588/03-retrospective.md`, a **self-referential false positive** (the retrospective documents the leak-scan hardening and quotes the `\.planning/(?:fox-companies|agent-memory)/` regex, so the bare `fox-companies` pattern matches its own documentation). A narrow, exact-match (`version`+`file`+`pattern`), committed, auditable `leak_scan_allowlist` excuses only this one occurrence; everything else still BLOCKS. Publish **1 → 0 blocked**; audit **FAIL → PASS (10/10)**.

Counter-cadence count: 16 → 17. Tools suite **664 → 691** (+27 across 3 new test files). Main suite **35,562 UNCHANGED** (no `src/` change). Manifest **lessons 147 → 148** (#10461 codified); UNCODIFIED 0 / PARTIAL 0 UNCHANGED. KNOWN_UNWIRED Process/Egress/Loader UNCHANGED at 0/0/0. NASA degree UNCHANGED at 1.178 (**134 consecutive ships**).

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — #10461 codified (the codify record)
- [99-context.md](chapter/99-context.md) — provenance + root-cause correction + forward path

## What this ship is

- A counter-cadence **codify ship** (#10461 → manifest + canonical doc) bundled with a **tool-robustness** fix (release-history refresh/db) and the closure of the audit failure that fix un-masked (AC7).
- The materialization of the v915 handoff's two operator-chosen forward paths, plus the correction of one of their stated root causes.

## What this ship is not

- Not a NASA degree advance (still 1.178; 134 consecutive ships at the margin record).
- Not a chokepoint chip (all three Tier-E ledgers remain at KNOWN_UNWIRED 0).
- Not a production-behavior change to any shipped `src/` module — every change is in `tools/release-history/`, a `tools/` config, a discipline doc, the disciplines manifest, or new tests.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **134 consecutive ships**).
**Counter-cadence count: 16 → 17** (+1).
**Manifest entries: 24** (UNCHANGED); **lessons in manifest: 147 → 148** (+1: #10461 codified).
**Discipline-coverage: UNCODIFIED 0 / PARTIAL 0** (both UNCHANGED); ceilings 5/5.
KNOWN_UNWIRED Process / Egress / Loader UNCHANGED at 0 / 0 / 0.
Wired calibratable thresholds 7 of 7 (UNCHANGED); verify-axis 7 COVERED + 0 PENDING-TEST (UNCHANGED).
Pre-tag-gate executable step count: **20** (UNCHANGED — new tests ride the gate+CI tools vitest suite, not a new gate step).
Vitest main suite: **35,562** (UNCHANGED). Tools suite (`vitest.tools.config.mjs`): **664 → 691** (+27 across 3 new test files).
Lesson **#10461: candidate (bar met v915) → CODIFIED.**

## Files touched

- `tools/release-history/db.mjs` (UPDATED — `resolvePgCredentials()` loud actionable error; passwordless edge preserved)
- `tools/release-history/refresh.mjs` (UPDATED — `isAdvisoryExit` advisory drift-check exit-1 + entrypoint guard + `main()`)
- `tools/release-history/publish.mjs` (UPDATED — narrow DI-testable `leak_scan_allowlist` in `leakScan`)
- `release-history.config.json` (UPDATED — committed `leak_scan_allowlist` with the v588 self-reference entry + comment)
- `tools/release-history/__tests__/db-pg-credentials.test.mjs` (NEW — 9 tests)
- `tools/release-history/__tests__/refresh-advisory-exit.test.mjs` (NEW — 7 tests)
- `tools/release-history/__tests__/publish-leak-allowlist.test.mjs` (NEW — 11 tests)
- `vitest.tools.config.mjs` (UPDATED — 3 new test registrations)
- `docs/known-unwired-ledger-discipline.md` (UPDATED — #10461 section + three-form drift catalog)
- `tools/render-claude-md/disciplines.json` (UPDATED — #10461 in the KNOWN_UNWIRED domain)
- `docs/release-notes/v1.49.916/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — v916 entry, via append-story-entry at T14 step 2.5)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.915 → 1.49.916)
