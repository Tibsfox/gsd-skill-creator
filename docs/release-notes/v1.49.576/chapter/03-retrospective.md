# Retrospective — v1.49.576

## What Worked

- **Two-part single-milestone shape.** Part A (audit) and Part B (implementation) ran on the same release tag rather than splitting across v1.49.576 -> v1.49.577. Larger commit graph (37 commits in range), but every audit row's closure was visible in the same milestone artifact set as the row itself -- no row "escaped" by being deferred to a future milestone-with-its-own-audit.
- **Both BLOCKs closed mid-milestone, not at the wire.** OGA-013 closed at C1 commit `4725bdacf`; OGA-023 closed at C3 commits `5040f18a0` + `72193ec43`. Both landed in W1 / W2 rather than W3, which gave W3 + W4 room to handle the longer tail of HIGH/MEDIUM rows without compressing the schedule against the gate.
- **OGA-023 scorer over-delivered nearly 2x.** Acceptance gate was 40% mean reduction across the 5 fixtures (toy / small / medium / large / pathological MEMORY corpora). The scorer with relevance + half-life decay shipped **76.6% mean reduction** -- well past the floor.
- **Component split into nine pieces.** C0 (foundations / ADRs), C1 (settings + hook surface), C2 (dual-impl + vendoring), C3 (memory cluster -- 3 sub-commits), C4 (skill schema migration), C5 (telemetry + effort + flags), C6 (vendoring + inventory + docs). Each component got its own test cluster; the boundary between components stayed legible through review.
- **Convergent-discovery framing held at row granularity.** The FOUR-anchor analysis from v1.49.575 carried into the alignment-matrix and found the same shape at 65-row resolution. Fourth consecutive milestone the property holds -- it is now a stable architectural property, not a per-milestone narrative.
- **Pre-existing repo merge debris sidestepped, not contested.** Five files in unmerged state pre-date v1.49.576 and remain so at close. `git -c advice.statusHints=false commit --only <path>` was the working pattern across the milestone for committing unrelated files without contesting the unmerged state.

## What Could Be Better

- **Operational install gap between SOT and live.** The C1 SessionStart consolidation (5 -> 1, <200ms) is correct in `project-claude/` source-of-truth but the live `.claude/settings.json` retains the prior five SessionStart subscribers because `install.cjs` additive-merges from SOT. Documented as feed-forward item 1; the operational realization is a one-liner: `rm .claude/settings.json && node project-claude/install.cjs`.
- **Schema bug fixes deferred to W4 housekeeping.** Part A's `comparison-matrix.json` schema shipped with two known bugs (`oops_doc.minimum: 1` and `evidence_file` keyed on status not severity). Both fixed in W4 -- validation re-run dropped violations 28 -> 0 -- but ideally the schema would have been correct on first cut.
- **Vendored-command integration testing not yet landed.** Four upstream commands vendored in C6; existence + origin-marker tests landed but real-workflow integration testing is queued. Feed-forward item 2.
- **Gastown skill word-count gate miscalibrated against new frontmatter shape.** C4 split brought the 3 Gastown SKILL.md files <800w (passing the 820w gate), but later OGA-032/033 frontmatter expansion (status / triggers / references_subdir / word_budget) re-inflated word counts to 826/854/881. Three failing test cases in `tests/skills/gastown-splits.test.ts`. Feed-forward item 6 -- 1-commit fix in the next milestone.
- **Pre-existing repo merge debris remains.** Five files (`.mcp.json` UU; `.claude/commands/gsd/complete-milestone.md` DU; `.claude/get-shit-done/workflows/complete-milestone.md` DU; `www/tibsfox/com/Research/GPE/strategies.html` DU; `www/tibsfox/com/Research/index.html` DU). Owns its own short cleanup milestone (feed-forward item 3).
- **NEEDS-UPSTREAM-PR row OGA-005 still in matrix.** Future PR candidate against `gsd-build/get-shit-done`; not promoted to backlog inside this milestone (feed-forward item 4).

## Lessons Learned

# v1.49.576 — Retrospective

**Milestone:** OOPS-GSD Alignment + Implementation
**Closed:** 2026-04-25
**Shape:** Two-part single-milestone (Part A research + Part B implementation)
**Test delta:** +179 from baseline 27,887 → 28,066 passing
