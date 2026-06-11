# Retrospective — v1.49.560

## What Worked

- **The 5-parallel-subagent cadence held at production scale.** Over the full mission, approximately 50 waves dispatched. Zero runaway agents. Zero content conflicts between parallel commits. The per-release commit pattern means each agent's output is atomic and independently verifiable — the orchestrator never had to merge agent results, only collect and commit.
- **Fact reconciliation caught more bugs than the rubric did.** The scorer was already calibrated from earlier phases. What the final 44 degrees surfaced was content quality issues in the source material: prior READMEs with wrong band lineups, wrong labels, wrong dates. The fact-reconciliation prompt instruction produced a cleaner factual baseline than the original content.
- **Rate-limit salvage with re-dispatch worked exactly as documented.** The handoff noted "when a subagent hits the wall mid-commit, the README is usually already written." This held in most prior cases. For Wave 51, it didn't — and the backup protocol (re-dispatch after reset) handled it cleanly with no lost work.
- **The `tools/release-history/` conventions paid dividends.** The new tools (shorten-degree-h1.mjs, backfill-degree-commits.mjs) slot in with existing tool conventions: `--dry-run` default, `--execute` to write, console.error for progress, console.log JSON for results. Building new tools on these patterns took minutes, not hours.
- **Postgres as the source of truth isolated quality changes from README drift.** When the scorer flagged a release as failing, fixing the README was the remedy. When `extractCommits` was wrong, fixing the extractor and re-ingesting cleaned up the data. The separation between "source of truth on disk" (README) and "queryable derived state" (Postgres) made the pipeline compositional.
- **Short H1 enforcement caught a second-order content quality issue.** Beyond the RELEASE-HISTORY.md readability improvement, the short H1s are now the correct format for programmatic consumers that expect "Degree N: Artist + Species" patterns. Any future tool that parses release names (dashboard generators, index builders, search tools) gets a clean input.

## What Could Be Better

- **Rate limit dispatching near a soft-limit window is avoidable with better scheduling.** Wave 51 hit the 5-hour limit mid-run. The earlier handoff's lesson was "don't dispatch right before a weekly rollover"; the generalization is "check remaining quota before dispatching a new wave and pause if we're less than one-wave-worth of tokens away from the limit." Future missions should instrument this check into the dispatch loop.
- **The DB refresh step should run in-line after every 5 commits, not out-of-band.** Refresh-between-waves works but couples the orchestrator's rhythm to the refresh's 90-second window. If the refresh were triggered automatically by the commit hook (or by a debounced post-commit script), the scorer state would always be live and the orchestrator wouldn't need to manage refresh cadence.
- **Two-pattern-fallback regex extractors are the wrong architecture for complex input.** The extractCommits three-pattern fallback works, but the underlying issue is that README content is free-form and the extractor is a pattern match. A small AST-based parser for release headers would be more robust and more maintainable than `extractCommits`, `extractShipped`, `extractName`, `extractBranchTag`, each with its own regex.
- **Running-ledgers scoring is too strict for the typical prompt template.** Most releases produce one running ledger (combined S36 + SPS), and the scorer wants two (one per side). Either the rubric should accept the combined form as full credit, or the prompt template should enforce the two-ledger form. The current state (every release caps at 3/5 on this dimension) is a calibration issue.
- **Manual SQL patches for wave-commit degrees feel brittle.** The 106-108 wave commit case worked because I noticed it during verification. A more general-purpose fix would be to have `backfill-degree-commits.mjs` fall back to searching for "degrees X-Y" patterns, or to inspect the commit message for degree ranges. Two degrees isn't enough to justify the engineering cost, but if this pattern recurs, the fallback is worth building.
- **The mission retrospective lives in .planning/ and .planning/ is gitignored.** The mission's decision record, session notes, and final retrospective are all in `.planning/missions/release-uplift/` — intentionally local per the standing rule. But that means the learning lives only on my disk and doesn't travel with the repo. Future missions should consider whether the retrospective itself (or a summary) should ship as part of the release notes, so the history is shared.

## Lessons Learned

# Lessons — v1.49.560

16 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Parallel subagents are cheaper than context.**
   **Parallel subagents are cheaper than context.**
   _⚙ Status: `investigate` · lesson #9828_

2. **Fact-reconciliation beats prompt-rubric for quality.**
   **Fact-reconciliation beats prompt-rubric for quality.**
   _⚙ Status: `investigate` · lesson #9829_

3. **Tag position is not content position for bulk-re-tagged repos.**
   **Tag position is not content position for bulk-re-tagged repos.**
   _⚙ Status: `investigate` · lesson #9830_

4. **Idempotency in cleanup tools means you can run them again.**
   **Idempotency in cleanup tools means you can run them again.**
   _⚙ Status: `investigate` · lesson #9831_

5. **Magnitude sanity checks catch SHA-prefix regex bugs.**
   **Magnitude sanity checks catch SHA-prefix regex bugs.**
   _⚙ Status: `investigate` · lesson #9832_

6. **.planning/ gitignore is correct and the retrospective should still be surfaced.**
   **.planning/ gitignore is correct and the retrospective should still be surfaced.**
   _⚙ Status: `investigate` · lesson #9833_

7. **Chapter publishing should have been a commit-time hook, not an end-of-mission batch.**
   **Chapter publishing should have been a commit-time hook, not an end-of-mission batch.**
   _⚙ Status: `investigate` · lesson #9834_

8. **Short titles are a structural property of release naming, not a documentation style choice.**
   **Short titles are a structural property of release naming, not a documentation style choice.**
   _⚙ Status: `investigate` · lesson #9835_

9. **Re-dispatching from scratch is usually safer than salvaging partial work.**
   **Re-dispatching from scratch is usually safer than salvaging partial work.**
   _⚙ Status: `investigate` · lesson #9836_

10. **The scorer is authoritative; the README is source-of-truth; Postgres is the mirror.**
   **The scorer is authoritative; the README is source-of-truth; Postgres is the mirror.**
   _⚙ Status: `investigate` · lesson #9837_

11. **Rate limit dispatching near a soft-limit window is avoidable with better scheduling.**
   Wave 51 hit the 5-hour limit mid-run. The earlier handoff's lesson was "don't dispatch right before a weekly rollover"; the generalization is "check remaining quota before dispatching a new wave and pause if we're less than one-wave-worth of tokens away from the limit." Future missions should instrument this check into the dispatch loop.
   _⚙ Status: `investigate` · lesson #9838_

12. **The DB refresh step should run in-line after every 5 commits, not out-of-band.**
   Refresh-between-waves works but couples the orchestrator's rhythm to the refresh's 90-second window. If the refresh were triggered automatically by the commit hook (or by a debounced post-commit script), the scorer state would always be live and the orchestrator wouldn't need to manage refresh cadence.
   _⚙ Status: `investigate` · lesson #9839_

13. **Two-pattern-fallback regex extractors are the wrong architecture for complex input.**
   The extractCommits three-pattern fallback works, but the underlying issue is that README content is free-form and the extractor is a pattern match. A small AST-based parser for release headers would be more robust and more maintainable than `extractCommits`, `extractShipped`, `extractName`, `extractBranchTag`, each with its own regex.
   _⚙ Status: `investigate` · lesson #9840_

14. **Running-ledgers scoring is too strict for the typical prompt template.**
   Most releases produce one running ledger (combined S36 + SPS), and the scorer wants two (one per side). Either the rubric should accept the combined form as full credit, or the prompt template should enforce the two-ledger form. The current state (every release caps at 3/5 on this dimension) is a calibration issue.
   _⚙ Status: `investigate` · lesson #9841_

15. **Manual SQL patches for wave-commit degrees feel brittle.**
   The 106-108 wave commit case worked because I noticed it during verification. A more general-purpose fix would be to have `backfill-degree-commits.mjs` fall back to searching for "degrees X-Y" patterns, or to inspect the commit message for degree ranges. Two degrees isn't enough to justify the engineering cost, but if this pattern recurs, the fallback is worth building.
   _⚙ Status: `investigate` · lesson #9842_

16. **The mission retrospective lives in .planning/ and .planning/ is gitignored.**
   The mission's decision record, session notes, and final retrospective are all in `.planning/missions/release-uplift/` — intentionally local per the standing rule. But that means the learning lives only on my disk and doesn't travel with the repo. Future missions should consider whether the retrospective itself (or a summary) should ship as part of the release notes, so the history is shared.
   _⚙ Status: `investigate` · lesson #9843_
