# Context — v1.49.915

## Provenance

- **Predecessor:** v1.49.914 (Tools-Suite Cluster Closure: node:test Gate + CI-Enforcement + Layer-2 node:test Drift-Guard). Release `01a8f7179`, post-ship rh `17f6db91d`.
- **Origin:** opened from the v1.49.914 handoff (`.planning/HANDOFF-2026-05-29-v1.49.914-tools-cluster-closure.md`). The handoff offered four forward paths; the operator selected (via AskUserQuestion) **option 3 (flake-audit the atlas-deps-audit intermittent)** + **option 4 (continue carry-forward promotion of the #10448 sub-variant candidates)** over the operator-recommended NASA-1.179 default.
- **Counter-cadence:** #16, per the #10430 finer-grained ~5-ship maintenance cadence (the steady-state complement to the ~30-ship batched cleanup). Directly follows the v913 + v914 tools-gate cluster — this ship hardens a *third* unenforced surface in the same #10461 family.

## What the v914 handoff flagged (and this ship resolves)

The v914 handoff (and v914's own retrospective) recorded a "pre-existing atlas-deps-audit flake": one full tools-suite run showed `atlas-index-cli.test.mjs` failing via `atlas-deps-audit: FAIL — 1 violation(s)`, green in other runs, passing in isolation. Investigation resolved it as:

1. **False alarm (mis-attribution).** The FAIL string cannot come from `atlas-index-cli.test.mjs` (no reference to `atlas-deps-audit`). It is expected stderr from the *passing* negative-path cases (2/5) of `atlas-deps-audit.test.mjs`, echoed to the console because `runAudit`'s `execSync` didn't pipe stderr. De-noised via `stdio: ['ignore','pipe','pipe']`.
2. **A real latent defect behind it.** `node tools/atlas-deps-audit.mjs` reported 1 genuine `CROSS_TREE_VIOLATION` — the v905 `pmtiles-reader.ts` → `loader-context.js` chokepoint wire, never allowlisted because the v607 `CROSS_TREE_ALLOW_PATTERNS` predates the v782+ chokepoint campaign. Fixed per ADR-0003 cat. (b).
3. **The structural gap.** The audit was never wired into `pre-tag-gate.sh` or CI, so the allowlist rotted silently. Closed by live-tree Case 6 in the gate+CI tools suite (ADR-0003 §Verification now enforced).

## Why Case 6 rather than a new pre-tag-gate step

The tools vitest suite became gate-enforced at v913 (step 2.5) and CI-enforced at v914. Adding the ADR-0003 acceptance test as a *test* in that already-gated suite enforces it at both reaches (tag + CI) with zero new `pre-tag-gate.sh` surface — the lightest closure consistent with the #10422/#10423 "default to the lightest wire that flips the classification" discipline. A dedicated `pre-tag-gate.sh` step (non-test gate) remains a future option but is not needed: Case 6 already closes the enforcement gap and fails loudly with an ADR-pointing message on any new drift.

## #10461 reaches its 3-instance bar (codification deferred)

This ship is the third instance of #10461 (v913 + v914 + v915). The bar is met. Codification into `docs/known-unwired-ledger-discipline.md` + `tools/render-claude-md/disciplines.json` is **deferred to an operator-authorized codify ship** — the v914 handoff kept #10461 a candidate (operator-confirmed), and this is a maintenance ship, not a codify ship. See 04-lessons for the three-form drift catalog (omission / silent-addition / reference-data-staleness) the eventual manifest entry should carry.

## Verification trail

- **Real audit:** `node tools/atlas-deps-audit.mjs --json` → `{ violations: 0, scanned: 112, pass: true }`, exit 0.
- **Test file:** `atlas-deps-audit.test.mjs` → 6/6 pass; the benign `FAIL` console line dropped from 3 occurrences to 0.
- **Tools suite:** `npx vitest run --config vitest.tools.config.mjs` → 664 passing (+1 over v914's 663).
- **Main suite:** unchanged at 35,562 (no `src/` change).
- **execSync probe:** confirmed default `execSync` echoes child stderr to the parent terminal while still populating `err.stderr`; explicit `stdio:['ignore','pipe','pipe']` suppresses the echo and preserves the capture.
- **#10448 / #10461 verdicts:** both adversarially cross-checked against disciplines.json, architecture-retrofit-patterns.md, and the v910–v914 lessons.
- **Full pre-tag-gate:** run to green before tagging.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Standard counter-cadence ship; no www/ content change → FTP sync N/A, GH release queued (deferred since v886).
- No NASA/MUS/ELC content → depth-audit + canonical-layout/sidebar gates are no-ops.
- v915 release notes validated pre-gate via `check-completeness.mjs v1.49.915 --strict`.
- **CI-on-dev was red on the predecessor commit** (`17f6db91d`) — two pre-existing reds exposed by v914's tools-suite CI-wiring: (1) the mus-smoke gitignored-template ENOENT, and (2) chapter.mjs running `main()` on import (PG query → `undefined.version` → async `process.exit(2)` in CI). Both fixed (skip-guard + entrypoint guard). Because the fixes had to land on dev and CI had to go green *before* tagging/main-FF, this ship pushed the release commit to dev first, waited for CI, fixed each red the run surfaced (amend + force-push of the un-tagged dev tip; main had not moved, zero-drift intact), and only tagged → main-FF → pushed once the CI run concluded success. A deviation from the canonical "tag before push dev" ordering, correct for the "fix a dev red as part of the ship" case. Note: `gh run watch --exit-status` returned 0 while `gh run view` reported `conclusion=failure` — the authoritative `gh run view` conclusion was used.

## Forward path (operator picks next session)

1. **Codify-ship #10461 (bar now met).** Promote #10461 into `docs/known-unwired-ledger-discipline.md` with the three-form drift catalog + append to `disciplines.json` + `npm run render:claude-md`. The 3-instance bar is reached this ship; this is the natural next codify move.
2. **NASA forward-cadence at 1.179** — the standing operator-recommended highest-leverage move; codify/gate debt remains near-zero. 133 consecutive ships at the 1.178 pressure-margin record.
3. **Continue carry-forward promotion** of the #10448 sub-variant candidates as future audit-scope expansions supply instances (all 5 currently at 1 instance; ledger drained).

## Known issues carried forward (unchanged this ship)

- Auto-regen drift on prior chapter retrospectives + dashboard/INDEX (DB-vs-filesystem, since pre-v896); hand-authored versions remain in HEAD, NOT committed.
- GH release queue paused since v886 / FTP sync NOT run (v903–v915). Git tags authoritative; batch-catchable via `npm run gh-release-publish <tag>`. Pre-flight `nc -zvw3 216.222.199.72 21` before any FTP sync. v915 changed no www/ content.
- REQUIREMENTS.md + ROADMAP.md remain recovery stubs (local-only).
