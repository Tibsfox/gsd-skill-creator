# v1.49.816 — Retrospective

**Wall-clock:** ~25 min from session-retro start to tag-push. First ship of the operator-selected 7-item chain (v816-822). Chain-mode dispatch (each ship continues the same session-retro mission).

## What worked

**Lightest-item-first ordering was operator-correct.** Putting the `state-md-set-shipped` 1-line tool-fix at position #1 of the chain removes the v815-flagged footgun before any subsequent ship in the chain re-invokes the tool. Without this ordering, every subsequent ship in the chain (v817-v823) would have hit the colon-name workaround again whenever a milestone subtitle contained a colon — small risk per ship, but the chain inherits the risk. Front-loading the fix amortizes across the chain.

**Recon found a second pre-existing bug for free.** Reading the test file to design the new colon-quote tests surfaced that the existing `writes a fresh STATE.md and the normalizer-check passes immediately` E2E test was structurally flaky on second-boundary crossings. The flake had been hiding behind "happened to pass when the two CLI invocations land in the same wall-clock second." The fix is in the same file as the colon-quote fix and ships in the same commit.

**`js-yaml.dump` emits minimal form, so safe inputs stay byte-identical.** The existing test fixture `Post-T14-reset STATE.md drift closure` is a safe name. After the fix, `yamlScalar('Post-T14-reset STATE.md drift closure')` returns the same unquoted string. The existing canonical-schema test assertion `expect(content).toContain('milestone_name: Post-T14-reset STATE.md drift closure')` still passes. Only colon/`#`/leading-`-`/quote-containing names get auto-quoted. Zero churn for the existing test fixtures.

**`--check` time-determinism via on-disk lastUpdated is semantically the right fix.** The alternative would be: (a) pin the timestamp via env var (forces production callers to thread state), or (b) ignore the lastUpdated field in comparison (requires field-aware byte comparison). Option (c) — read the on-disk lastUpdated and use it as the comparison anchor — preserves the byte-comparison shape and aligns with the semantics: `--check` asks "does the file match the canonical shape for this milestone?", not "does it match what I'd regenerate at THIS exact moment?". The on-disk lastUpdated IS the canonical shape for that specific milestone, recorded at write-time.

**Pre-tag-gate caught the discipline-coverage WARN as expected.** Step 13 reports 39 uncodified lessons + 8 partial matches — the same WARN that v810-815 all reported. The discipline-coverage gate is intentionally informational until T2.2 (the v821-822 ships in this chain) flips it to BLOCK. No action needed for v816.

## What surprised

**The `--check` flag has no production callers.** Grep'd for `state-md-set-shipped` across the codebase: only the T14 writer path uses the tool (no `--check` flag). The `--check` flag exists only for the E2E test. So the pre-existing flake was test-only, not a production correctness issue. The fix is still worth doing because the test must be reliable for CI, but the production blast radius was zero.

**The pre-existing 15 tools-suite failures are all unrelated to my change.** Grep'd the failures: `score-completeness` (3), `atlas-deps-audit` (3), `ftp-delete` (3), `nasa-canonical-layout-gate` (3), and `state-md-set-shipped` (1, now fixed). The score-completeness ones are scoring-rubric tests from the v784 audit follow-up; atlas-deps-audit looks like a metric-baseline drift; ftp-delete and nasa-canonical-layout-gate look like test-harness issues. All exist on dev tip without my changes. Out of scope for v816.

**The pre-bump PROJECT.md refresh would have been caught at step 17.** v815 didn't refresh its own latest-shipped line; v816's pre-bump check would have hit drift=1/3 (not yet 3/3 BLOCK). Refreshing pre-bump preempts the drift accumulation per the v807 patch-drift discipline.

## What to watch

- **The `yamlScalar` helper is a 2nd-instance candidate.** If another tool in `tools/` needs to hand-build YAML with a sometimes-quoted field, the same 3-line helper would apply. Watch for the second instance; per #10426, second-instance is the cross-class-registry extraction threshold. For now, the helper sits inline as a single-use utility.

- **The `--check` on-disk lastUpdated parse uses a regex.** If the STATE.md schema ever moves `last_updated` to a non-flat field (e.g., nested under `metadata:`), the regex breaks silently — `lastUpdatedMatch` would be null and the comparison would use a fresh wall-clock time, re-introducing the flake. The fix is robust against current schema (which keeps `last_updated` as a top-level quoted-string field), but worth flagging for the next STATE.md schema migration.

- **The 14-LOC delta in the tool grew the file from 222 → 240 lines.** Still well under any size threshold. Just noting.

## Verdict on scope

Closed at the smallest viable shape: 14 LOC in the tool + 33 LOC in the test (2 new tests) + a single inline comment block per fix. Resisted: rewriting the whole frontmatter via `jsYaml.dump` (would change the byte output for all callers and force the existing canonical-schema test to be rewritten), adding a `--last-updated` CLI flag, extracting `yamlScalar` to a shared module (1 instance — premature per #10416), adding a separate failing-flake-detection test (the existing E2E test is the natural flake-detection surface). Tightest credible closure.

After v816, the v815-flagged tool-footgun observation moves from "tentative" to "closed." Tentative observations carried forward: ~10-12 → ~10-12 (one closed; no new flagged).

The chain continues with v817 (c12-load-kb-context flake) next. Wall-clock budget for the remaining 7 items: ~3-4 hours.
