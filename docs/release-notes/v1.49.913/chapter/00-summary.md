# Summary — v1.49.913

- **Version:** `v1.49.913`
- **Shipped:** 2026-05-29
- **Branch:** dev → main
- **Type:** counter-cadence gate-hardening ship (counter-cadence #14)

## What shipped

This ship wires the `vitest.tools.config.mjs` test suite — the ~40 tests covering `tools/` and `scripts/` — into the pre-tag-gate, and in doing so discovers and closes a substantial body of silent test rot. The headline is a two-part structural change paired with a multi-subsystem green-up.

The suite had been running **nowhere enforced**. The main `npx vitest run` (pre-tag-gate step 2 and CI) scopes its include globs to `src/`, `.college/`, `tests/`, and `www/`; the tools tests live outside that scope and could only be run by explicitly passing `--config vitest.tools.config.mjs`, which nothing in the gate or CI did. The v1.49.912 ship had even added the first test for the gate-critical `check-discipline-coverage` tool into this very suite — a test that, it turns out, ran nowhere enforced from the moment it landed.

Because nothing enforced the suite, it had silently rotted red. A baseline run surfaced **8 red test files** — 18 failing assertions plus 2 suites that would not even load — accumulated from at least three independent upstream changes over roughly two weeks, none of which any gate caught.

## The green-up (3+ subsystems)

- **FTP** (`ftp-sync.mjs`, `ftp-delete.mjs`): both tools imported `basic-ftp` at module top-level. `basic-ftp` is an undeclared, uninstalled, optional dependency needed only for live (non-dry-run) FTP sync, so the pure-helper test suites failed at import with `Cannot find package 'basic-ftp'`. The fix lazy-imports `basic-ftp` inside the existing `if (!dryRun)` branch where the client is actually constructed — no new dependency, no skip-guard, behavior preserved on every path; the dry-run and pure-helper paths now work dependency-free.
- **Catalog** (`update-catalog-indexes.test.mjs`): the v1.49.658 W2.2 catalog-card template BLOCKER gate (a genuine, load-bearing production gate that ships green every milestone) out-evolved the test's minimal pre-W2.2 fixtures, which emit cards with no degree-meta fields. The fix makes the test's MUS/ELC fixture cards template-compliant; the production tool, extractor, and spec are untouched, and the drift-injecting tests still detect drift via the href set.
- **Scorer** (`score-completeness.test.mjs`, `score-completeness-c5.test.mjs`): the scorer was byte-identical to its rubric-calibration commit; the real cause was that the 2026-05-25 "lift quality" commits rewrote the release-notes corpus these tests scored against, shrinking summaries below the scorer's word-count tiers and enriching one release's structured dimensions. Rather than revert genuine documentation improvements to satisfy a test, this ship **freezes** the calibration-era corpus (commit `557182042`) into committed fixtures and points the calibration-target tests at them. No assertion was weakened; the scorer is untouched; the frozen blobs reproduce the documented grades (v585 = B/83, v634 = B/81, v587 = A/90) with the current scorer and regenerate byte-deterministically.
- **Reconciliation casualties**: adding the 5 drifted-out files to the include list surfaced 3 more red tests, each a different never-enforced-rot shape — `chapter-idempotent` (a <200-byte template that hit the stub rule before the byte-identical branch), `classify-types-chip` (a name-based degree check gated behind `if (readmeText)` that the test never satisfied), and `run-with-pg-env` (a broken `||`-of-`expect` assertion plus coupling to the real repo `.env`).

## The structural closure (two layers)

- **Layer 1 — enforcement**: a new pre-tag-gate step (`tools-suite`, step 2.5, exit 21) runs the suite, so the tools tests now execute at ship time.
- **Layer 2 — drift detection**: `tools/check-tools-test-coverage.mjs` asserts every `tools/`/`scripts/` vitest test file is registered in the explicit include list (and that no `node:test` file is wrongly added, and no entry is stale). It is exercised by `tools-config-coverage.test.mjs`, which lives inside the suite — so running Layer 1 enforces Layer 2 automatically. The list cannot be a glob because `tools/` also holds `node:test` files that vitest cannot execute; the drift-guard is the cost of that explicitness.

## Verification

The change was verified at three levels: the full main suite (35,562 passing, exit 0 — no production regression), the full tools suite (660 passing, gate-enforced for the first time), and a four-agent adversarial review of the gate-shell change, the drift-guard, the scorer freeze, and the catalog/FTP fixes. The review returned the gate-shell, scorer, and catalog/FTP surfaces clean, and surfaced two real drift-guard fragilities (multi-line import misclassification; a node:test file wrongly in the include list passing) plus a pre-existing degree-regex over-match newly exposed by the classify-types hoist — all three closed before ship.

## Engine state

NASA degree unchanged at **1.178** (131 consecutive ships). Counter-cadence count 13 → 14. No manifest codification (candidate #10461 recorded). UNCODIFIED 0 / PARTIAL 0 and KNOWN_UNWIRED 0/0/0 all unchanged. Pre-tag-gate grows by one step (18 → 19).
