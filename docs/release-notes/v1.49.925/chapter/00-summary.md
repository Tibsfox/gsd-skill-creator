# v1.49.925 — Summary

**Counter-cadence ship #20.** A single-deliverable operationalization ship. No NASA degree advance (holds at 1.178, 140 consecutive ships). Drains carry-forward #1 from the v1.49.924 handoff — but does so by building the readiness instrument, **not** by flipping the leg (the flip stays deferred, correctly).

## The deliverable

### `tools/ci/macos-flip-readiness.mjs` — the flip-readiness checker

#10463 (codified at v1.49.924) ends with a prose gate: flip the staged macOS matrix leg to load-bearing "once N consecutive green pushes of the new leg accumulate across organic development churn — green pushes from the promotion ship itself do not count." Left as prose, that gate is operator-vigilance-bound and easy to misjudge: at v1.49.924 the macOS leg had 9 consecutive green runs, but all 9 were docs/release/CI ships re-running an unchanged test surface. A naive "is it green?" read would have said *flip it* — the exact premature promotion #10463 exists to prevent.

The checker makes the gate deterministic:

- **Reads the macOS JOB conclusion, never the run conclusion.** The staged `continue-on-error` keeps a red macOS leg out of the run-level conclusion (the #10463 masking fact), so `gh run list … .conclusion` is uniformly `success` and useless here. The tool queries `gh run view --json jobs` and isolates the `Test (macos-latest)` leg.
- **Organic-churn predicate (a tight allow-list — when in doubt, inert).** A commit is *organic* iff it touched a test-bearing root (`src/`, `tests/`, `.college/`, `www/`, `tools/`, `scripts/`) or an exact-listed test-config file. Everything else — docs, release notes, dashboard, `.github/`, `.planning/`, and critically **`package.json`/`package-lock.json`** — is inert and transparent to the streak.
- **Streak semantics + advisory exit codes.** Walk newest→oldest: organic green increments; an organic red (`failure`/`timed_out`/`cancelled`/`action_required`) breaks; inert or no-verdict (`skipped`/`null`/`stale`) is transparent. Exit `0`=READY / `1`=NOT READY / `2`=indeterminate. The `--limit` scan window is disclosed (`windowExhausted` flag) per #10421.

### The build's load-bearing catch (#10427)

The checker's first **live** run reported a spurious **READY 3/3**. Root cause: `package.json`/`package-lock.json` were in the organic set, and the v923/v924 `chore(release)` version-bumps touch both — so every release commit classified "organic." Only running the tool against ground truth (`git show` on the real commits) exposed it. Fixed by making `package*.json` deliberately inert (a release-bump touches them on every ship; a rare pure dep-upgrade is the accepted conservative miss, which only *defers* the flip). Pinned by a regression test mirroring the real v924 commit shapes → correct **NOT READY — streak 1/3** (only the v923 staging commit is organic).

## Result

26 checker tests green; registered in `vitest.tools.config.mjs` (the tools-suite drift-guard requires it); tools suite 724 green; `ci-matrix-parity.test.ts` 9/9 unchanged; render-claude-md no-drift; discipline-coverage UNCODIFIED 0 / PARTIAL 0 (manifest 150). The `continue-on-error` line and all 9 parity assertions are untouched — the flip remains the open carry-forward, now with a tool that reports when it's safe.
