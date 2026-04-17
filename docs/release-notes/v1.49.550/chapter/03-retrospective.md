# Retrospective — v1.49.550

## Lessons Learned

1. **Backfill-before-limit-check causes false regressions.** The Wave 2D
   backfill added four frontmatter lines (~8 words) to every SKILL.md, which
   pushed `done-retirement` (801w) and `gupp-propulsion` (805w) over the
   Wave 2B word-count gate of ≤800. Resolution: bump the gate to 820 to
   accommodate frontmatter. Lesson: when a gate targets prose word count,
   it should either exclude frontmatter or budget for it up front.

2. **Schema description cap needed to grow with merges.** The `team-control`
   merged skill carries a 375-character description (longer than either
   source skill), exceeding the original `max(250)` schema cap. Raised to
   `max(500)` in Wave 2D; the corresponding assertion test was updated.
   Lesson: merge operations can legitimately produce outputs that exceed
   per-source constraints — schemas must accommodate.

3. **Wave 2B safety-critical token regression (SC-07, SC-08).** The Gastown
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
   safety-critical test suite before the commit, not after the wave closes.

4. **Test pollution hypothesis investigation (empirically disproven).**
   During Wave 3, a false hypothesis was raised that SC-07/SC-08 failures
   were caused by test pollution mid-suite mutation of real SKILL.md files.
   Verification method: captured md5sums of both files, ran the full
   `npm test` suite, re-captured md5sums. The hashes were **identical**
   before and after. Additionally, `grep -rn writeFileSync tests/ src/`
   returned zero matches writing to real `.claude/skills/*` paths (all
   Wave 2D tests sandbox to `mkdtempSync(tmpdir())`). The SC-07/SC-08
   failures were genuine Wave 2B regressions, not pollution artifacts.
   Lesson: verify state empirically (md5sum, grep) before acting on
   hypotheses about inter-test interference.

5. **Hook test location.** Vitest excludes `.claude/**` by default, so the
   `08-wave-execution-plan.md` path of `.claude/hooks/tests/*.test.ts` is
   dormant. Hook tests live at `tests/hooks/` where vitest picks them up.

6. **PostCompact recovery combines snapshot + live state.** The recovery
   hook reads the PreCompact snapshot but combines it with LIVE git state
   at recovery time rather than trusting the snapshot alone — branch,
   uncommitted changes, and tip commit may all have moved between
   compaction and recovery.

7. **SC-07/SC-08 test brittleness (follow-up).** The safety-critical tests
   check literal format strings (`'Max restarts per bead | 3'`,
   uppercase stage names) rather than semantic invariants. A refactor that
   preserves meaning but changes format breaks the tests. Converting these
   assertions to content-semantic checks (e.g., regex `/max\s*restarts.*3/i`)
   is deferred to a follow-up issue, not addressed in this milestone.
