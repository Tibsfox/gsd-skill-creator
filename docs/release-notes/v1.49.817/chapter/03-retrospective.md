# v1.49.817 — Retrospective

**Wall-clock:** ~30 min from session-retro continuation to tag-push. Second ship of the v816-822 chain. Chain-mode dispatch (same session-retro mission).

## What worked

**Recon found the wedge had a 5-month paper trail.** The fragile-test-audit doc at `.planning/test-discipline/fragile-test-audit-2026-05-11.md` flagged this test at v635 with disposition `document-for-followon` AND included the diagnostic note "subprocess spawning is the primary latency source, not sqlite alone." That single paragraph predicted what the v802 re-flag eventually confirmed — saved ~20 min of independent diagnosis.

**The fork-budget math is concrete and reproducible.** Per `runScript`: 4× sqlite3 + 1× python3 + 1× bash = ~6 forks. 7 tests × 6 = 42 forks per file. The diagnostic isn't "spooky parallel timing"; it's a measurable resource ceiling. This shape (count the forks per file run) is reusable for future subprocess-heavy test triage.

**Lightest-wire fix per #10416 is operator-correct.** The architectural-clean alternatives all touch surface beyond the failing test file: bash script refactor (production surface), vitest project config (global), async refactor (5 tests × ~10 LOC). The retry-bump is a 1-char change in the test file that makes observable failures effectively zero. The trade-off (worst-case ~360s vs. ~180s for fully-failed retries) is acceptable because in practice the test passes on attempt 1.

**Pairs with the v815 PMTiles closure.** Both are #10415 deferred-maintenance escalations: original author flagged + structural cause known + deferred multiple ships + eventually closed at minimum credible threshold. v815 was 185 ships overdue; v817 is 150+ ships overdue. The pattern: when the deferral has accumulated audit-doc references AND a re-flag at the deferral-cost threshold, ship.

**Comment-block expansion captures the structural cause for future readers.** The pre-fix comment was 3 lines: "Subprocess-heavy tests can be slow under vitest parallel pool." The post-fix is 8 lines: fork-budget math, sibling-test enumeration, v635/v802/v817 history, explicit per-file-isolation deferral. Future test-discipline triage (next pre-tag-gate flake, next fragile-test sweep) can find the context inline rather than spelunking through release notes.

## What surprised

**The wedge IS structurally closable at lightest-wire.** I initially considered the architectural-clean fix (per-file pool isolation) as the right answer, then walked it back when I noticed the global config blast-radius. The lightest-wire fix is actually the right answer here because the test's correctness is already established — only failure-tolerance needs adjustment.

**Per-file pool config doesn't exist in vitest v4.** Vitest's `vi.setConfig` accepts runtime config (timeout, hookTimeout, retry, maxConcurrency, etc.) but NOT pool config (which is project-level). The only ways to isolate a single file's pool are (a) a separate vitest project in the global config, or (b) running it via a separate test command. Both are heavier than needed for this wedge.

**The bash script is unchanged.** Touching the production surface (load-kb-context.sh) to reduce sqlite3 call count was tempting — it would close the structural root. But changing the script affects the skill it serves (intelligence-investigator), which is downstream of this wedge. Out of scope per #10416.

## What to watch

- **The retry-bump masks but doesn't eliminate the underlying fork contention.** If the project ever adds a sixth subprocess-heavy intelligence test, the fork budget could saturate again. The structural fix (per-file pool isolation OR fork-count reduction in the bash script) is still the long-term answer. Document this in CLAUDE.md or a follow-on test-discipline doc if the issue recurs.

- **Worst-case wall-clock is now 360s for this file.** Under heavy CI load where the test fails on all 4 retries, pre-tag-gate would block for 6 minutes on this file alone. Practical effect: minimal because the test usually passes on attempt 1. Theoretical effect: a watch item if future ships expand the test file or add more siblings.

- **The fork-budget math (~42 forks/file) is reusable as a triage metric.** Could become a static-analysis tool per #10417 — count `execFileSync` / `spawnSync` calls per test file × test count → estimate fork pressure. Out of scope here; flagged for future tooling work.

## Verdict on scope

Closed at the smallest viable shape: 1-char retry config change + 5-line comment expansion + 5 release-notes files. Resisted: bash script refactor, vitest project config changes, async test refactor, mock-based unit-test conversion. The retry-bump is the minimum that makes observable failures effectively zero while preserving the integration property.

After v817, T2.3 backlog stands at 1 of N actionable candidates: FlagLookup discriminated union extract (~30-40 min; v818 target). The chain continues.
