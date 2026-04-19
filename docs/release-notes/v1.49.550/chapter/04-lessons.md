# Lessons — v1.49.550

18 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Backfill-before-limit-check causes false regressions.**
   The Wave 2D frontmatter backfill added ~8 words to every SKILL.md, pushing two Wave 2B skills over an 800-word gate that didn't budget for it. When a gate targets prose word count, either exclude frontmatter or budget for it up front. Fix: gate raised to 820.
   _⚙ Status: `investigate` · lesson #1708_

2. **Schema description cap needed to grow with merges.**
   The `team-control`
merged skill carries a 375-character description (longer than either
source skill), exceeding the original `max(250)` schema cap. Raised to
`max(500)` in Wave 2D; the corresponding assertion test was updated.
Lesson: merge operations can legitimately produce outputs that exceed
per-source constraints — schemas must accommodate.
   _⚙ Status: `investigate` · lesson #1709_

3. **Wave 2B safety-critical token regression (SC-07, SC-08).**
   The Gastown
skill splits rewrote the 7-stage retirement table and the GUPP restart
limits section, losing the specific uppercase stage tokens (`VALIDATE`,
`SUBMIT`, `NOTIFY`, `CLEANUP`, `TERMINATE`) and the literal pipe-table
format (`Max restarts per bead | 3`) that safety-critical tests check
for. The Wave 2B commit message stated "safety boundaries stay in
SKILL.md" but the refactor was semantic-equivalent only — the tests
demand literal token match. Repaired in Wave 3 via two lines:
- `done-retirement/SKILL.md`: added explicit `Stages: VALIDATE → COMMIT → PUSH → SUBMIT → NOTIFY → CLEANUP → TERMINATE` line
- `gupp-propulsion/SKILL.md`: reformatted restart-limits bullets as a pipe-delimited table
Lesson: when a refactor claims to preserve safety invariants, run the
safety-critical test…
   _⚙ Status: `investigate` · lesson #1710_

4. **Hook test location.**
   Vitest excludes `.claude/**` by default, so the
`08-wave-execution-plan.md` path of `.claude/hooks/tests/*.test.ts` is
dormant. Hook tests live at `tests/hooks/` where vitest picks them up.
   _⚙ Status: `investigate` · lesson #1711_

5. **PostCompact recovery combines snapshot + live state.**
   The recovery
hook reads the PreCompact snapshot but combines it with LIVE git state
at recovery time rather than trusting the snapshot alone — branch,
uncommitted changes, and tip commit may all have moved between
compaction and recovery.
   _⚙ Status: `investigate` · lesson #1712_

6. **SC-07/SC-08 test brittleness (follow-up).**
   The safety-critical tests
check literal format strings (`'Max restarts per bead | 3'`,
uppercase stage names) rather than semantic invariants. A refactor that
preserves meaning but changes format breaks the tests. Converting these
assertions to content-semantic checks (e.g., regex `/max\s*restarts.*3/i`)
is deferred to a follow-up issue, not addressed in this milestone.
   _⚙ Status: `investigate` · lesson #1713_

7. **Schema caps must accommodate merge outputs.**
   The `team-control` merge carries a 375-character description (longer than either source) because it covers both surface areas. The original `max(250)` cap rejected it. Merge operations can legitimately produce outputs that exceed per-source constraints — schemas must size for the union, not the max per-input.
   _⚙ Status: `investigate` · lesson #2893_

8. **Claims that a refactor preserves safety invariants must be backed by running the safety-critical suite.**
   Wave 2B claimed "safety boundaries stay in SKILL.md" but the safety-critical tests are literal-token checks, not semantic checks. The refactor broke them. Lesson: before claiming a refactor is safe, run the tests that enforce the safety property. Don't defer to the next wave.
   _⚙ Status: `investigate` · lesson #2894_

9. **Verify state empirically before acting on hypotheses about inter-test interference.**
   The SC-07/SC-08 pollution hypothesis was disproven in two commands: md5sum of both files before and after `npm test`, plus `grep -rn writeFileSync` against `.claude/skills/*` paths. Both showed zero evidence of pollution. The failures were real Wave 2B regressions. Lesson reinforces the standing rule — measure, don't speculate.
- **Vitest excludes `.claude/**` by default.** Hook tests at `.claude/hooks/tests/*.test.ts` never ran. Hook tests live at `tests/hooks/` where vitest picks them up. The 08-wave-execution-plan had the wrong path; fixed in Wave 1, but the gotcha is durable: any test outside vitest's include paths is dormant whether you wrote it or not.
   _⚙ Status: `investigate` · lesson #2895_

10. **PostCompact recovery combines snapshot + live state, not snapshot alone.**
   The PreCompact snapshot captures the pre-compaction world, but by PostCompact recovery time the branch, uncommitted changes, and tip commit may have moved. The recovery hook reads the snapshot but queries live git at recovery time and merges — never trusts the snapshot alone.
   _⚙ Status: `investigate` · lesson #2896_

11. **Shell hooks unlock coverage that pure-JS hooks can't.**
   `worktree-cleanup.sh` was the first shell hook in the repository, which gave harness-integrity's `checkHookScriptsExecutable` something to validate for the first time. The hook was added for its own sake, but it closed a latent coverage gap as a side effect. Lesson: mixed-language hook support isn't decoration — it exercises paths that monoculture hides.
   _⚙ Status: `investigate` · lesson #2897_

12. **Tmpdir install refactors make CI and local deterministic.**
   Before: harness-integrity read `.claude/` from disk. After: harness-integrity installs `project-claude/` into `mkdtempSync(tmpdir())` and reads that. CI and local now see the same tree. The principle generalizes — any test that reads "whatever happens to be on disk" will eventually diverge between environments.
   _⚙ Status: `investigate` · lesson #2898_

13. **Mission package + wave execution plan is the pattern for platform-scale milestones.**
   `docs/missions/platform-alignment/` laid out 12 improvements across 4 waves with a per-wave test plan. Each wave closed cleanly because the scope was bounded before execution started. Pattern reusable for every future platform-scale milestone — write the mission package first, execute in waves, Wave 0 ships contracts.
   _⚙ Status: `investigate` · lesson #2899_

14. **Conventional-commit hooks must parse HEREDOC before double-quoted `-m` matchers.**
   The validate-commit.cjs regex used to greedy-match the entire `"$(cat <<'EOF'...EOF)"` body as the subject, rejecting the documented HEREDOC commit form. Reorder: HEREDOC matcher first (captures full body lazily), then tightened `-m` matchers with `[^"\n]` / `[^'\n]` so they cannot cross newlines. Durable fix; 8 regression tests added.
   _⚙ Status: `investigate` · lesson #2900_

15. **The Wave 2B word-count gate didn't budget for Wave 2D frontmatter.**
   Adding 8 words of frontmatter to every SKILL.md post-hoc pushed two freshly-split skills back over the 800-word limit. The gate should either have excluded frontmatter from its word count or budgeted 10 words up front for lifecycle metadata. Fixed by bumping the gate to 820, but the sequencing was avoidable.
   _⚙ Status: `investigate` · lesson #2901_

16. **SC-07/SC-08 regressions should have been caught at Wave 2B commit time, not Wave 3.**
   The Wave 2B commit message claimed "safety boundaries stay in SKILL.md," but the refactor was semantic-equivalent only — the safety-critical tests demand literal token match (uppercase stage names, pipe-table format). Running the safety-critical suite before each wave's commit, not just at Wave 3, would have surfaced the regression while the refactor was fresh.
   _⚙ Status: `investigate` · lesson #2902_

17. **The safety-critical tests check format, not semantics.**
   `'Max restarts per bead | 3'` and uppercase stage tokens (`VALIDATE`, `SUBMIT`, …) are checked as literal strings. A refactor that preserves meaning but changes format fails. Converting those assertions to content-semantic regexes (e.g., `/max\s*restarts.*3/i`) is deferred to a follow-up issue, not landed in this milestone — still tech debt.
   _⚙ Status: `investigate` · lesson #2903_

18. **The milestone crossed an API 500 crash boundary mid-Wave 2D.**
   The in-flight 19 backfilled SKILL.md files were recovered by the resumed flight-ops session via the wave-boundary handoff doc, but the crash itself was not avoidable from our end. A more conservative commit cadence (commit per skill, not per wave) would reduce the blast radius of any future mid-wave crash.
   _⚙ Status: `investigate` · lesson #2904_
