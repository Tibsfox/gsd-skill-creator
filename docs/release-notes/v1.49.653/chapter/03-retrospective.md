# v1.49.653 Chapter 03 — Retrospective

## What worked

**The long-term roadmap closed in one session, not six.** `.planning/long-term-roadmap-2026-05-15.md` (authored at session start) sized L-01 through L-05 as 5 separate counter-cadence milestones over ~10-12 calendar days. The actual closure took ~6 hours of focused work in a single session. Three factors enabled the compression:

1. **L-* items had clear scope.** The plan-first approach (sizing each item, identifying dependencies, listing acceptance criteria) meant execution didn't burn time on requirements discovery.
2. **Dependencies between items were thin.** L-04's gate (step 13) extended L-02's consolidation pattern. L-03 reused L-02's bypass-vocabulary. But no item blocked another — they ran in any order.
3. **Existing infrastructure absorbed the new tools cleanly.** vitest bench (L-05) sits alongside existing vitest test infra; auto-render disciplines section (L-04) plugs into existing render-claude-md.mjs section-renderer registry; apply-diff (L-03) follows the same operator-confirm pattern as scripts/append-story-entry.mjs.

**Stale CONCERNS findings caught early.** Three items from the May-15 codebase mapping (§8 run-with-pg.mjs hardcoded path, §13 ELC vs MUS regex drift, §16 bounded-tape framing tests) turned out to be already-shipped at v1.49.585 but flagged as open. Catching them at investigation time (5-10 min each) instead of executing 3 unnecessary fix tasks saved an hour. The pattern: **before fixing, verify the current source state matches the audit claim**.

**Discipline-coverage audit surfaced real gaps.** First run reported 31 UNCODIFIED lessons + 10 PARTIAL — proving the audit dimension was real, not theoretical. Each future counter-cadence milestone can pick a subset to codify, trending the gap toward zero without re-architecting.

**Bench infrastructure produced meaningful numbers on first run.** detectDois small load = 423K hz / 2.4 µs; large = 32K hz / 31 µs. extractCitations small = 21K hz / 46 µs; large = 381 hz / 2.6 ms. The 56x scaling factor between small and large for the end-to-end pipeline is a useful signal — bibliographies with 200+ refs cost real time even with these patterns. Future regressions on the pipeline have a measurable baseline.

## What didn't (or almost didn't)

**The append-story-entry script appended v1.49.652 mid-investigation.** Running `--help` (which isn't a supported flag) triggered the default `append` behavior because the script doesn't gate on unrecognized args. The result: public STORY.md had a v1.49.652 entry inserted out-of-order between v1.49.644 and where v1.49.645-651 should have gone. Fixed with a single Edit. **Lesson:** scripts that default to a side-effect on bad arg parsing should at least require `--apply` or `--run` to do the side-effect; bare `--help` should be a no-op even if the flag isn't recognized.

**The formal-block parser broke on blank lines between header and bullets.** Initial parser assumed `### V-flag emit:\n- bullet1\n- bullet2\n` (no blank between). Markdown convention is `### header\n\n- bullet1\n` (blank between). Three validation errors on the first synthetic-fixture test caught it. Fixed with a `sawBullet` flag that tolerates leading blank lines until the first bullet is seen. **Lesson:** parsers for markdown-shaped data should tolerate the markdown-canonical layout, not just the densest possible form.

**diffMode() initial cut missed `match_prefix` paused categories.** The `agents.json` schema supports both `members` (explicit list) and `match_prefix` (prefix match against on-disk names). My first cut counted only `members` paused — which made the audit report 3 false-drift agents (the v1.50a-* paused experiment). Caught immediately by running the diff against the real disk state. **Lesson:** test counter-driven counts against real-world inputs before declaring the audit working.

**Three stale CONCERNS findings reflect a process gap.** The codebase mapping ran 2026-05-15 morning but appears to have ingested v1.49.585 mission specs rather than post-ship state. The mapper produced a CONCERNS doc that listed `§8`, `§13`, `§16` as open when the underlying fixes had shipped 7 milestones ago. **Possible cause:** mapper read mission-package descriptions (which describe "to-be-shipped" state) rather than verifying against current `tools/` and `src/` content. **Mitigation suggestion for the next mapping pass:** add a verification step where each "still-open" CONCERNS finding is re-checked against the post-ship source code before being included.

## What the system noticed about itself

The new `tools/check-discipline-coverage.mjs` audit surfaced a kind of debt invisible to operator memory: lessons that were emitted, carried forward in 2+ retrospectives, but never codified anywhere. The discipline manifest pattern (`disciplines.json`) gives each lesson a place to live; the coverage audit makes the absence visible. This is the same pattern as the v1.49.585 self-mod-guard hook (operational rule → deterministic check) but applied at a slower cadence (per-milestone audit, not per-tool-use).

The 31 UNCODIFIED lessons are not a v1.49.653 regression — they are the **first measurement** of a pre-existing gap. The trend over future counter-cadence milestones should be downward as each session codifies a subset.

## Outstanding follow-ups (none blocking)

- **31 UNCODIFIED lessons** — operator-driven codification at future counter-cadence ships. Each session might add 3-5 to `disciplines.json` or codify into a discipline doc.
- **10 PARTIAL lessons** — some `disciplines.json` entries claim coverage that isn't reflected in the cited canonical docs. Either the manifest is wrong (drop the claim) or the docs need to be updated to explicitly cite the lesson ID. Operator review.
- **Bench history snapshots (L-05 Phase 4)** — DEFERRED per original plan. Adding `tools/bench/history/v<X>.json` per-ship snapshot is a future enhancement.
- **L-06 deferred** — Research-CSV schema-stability remains scheduled-when-incident. No known schema-evolution event in flight.

## What this milestone does NOT include

- No NASA degree advance (catalog remains at 1.116 STS-51-A).
- No MUS / ELC / SPS / TRS forward-cadence content.
- No new external citations or V-flags.
- No engine-state changes to substrate-axes.
- No mission package at `.planning/missions/v1-49-653-*/` (work was driven by the long-term roadmap planning doc + audit memos, all gitignored).
