# Lessons — v1.49.576

10 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Milestone:**
   OOPS-GSD Alignment + Implementation
   _⚙ Status: `investigate` · lesson #10036_

2. **Closed:**
   2026-04-25
   _⚙ Status: `investigate` · lesson #10037_

3. **Shape:**
   Two-part single-milestone (Part A research + Part B implementation)
   _⚙ Status: `investigate` · lesson #10038_

4. **Test delta:**
   +179 from baseline 27,887 → 28,066 passing
   _⚙ Status: `investigate` · lesson #10039_

5. **Operational install gap between SOT and live.**
   The C1 SessionStart consolidation (5 -> 1, <200ms) is correct in `project-claude/` source-of-truth but the live `.claude/settings.json` retains the prior five SessionStart subscribers because `install.cjs` additive-merges from SOT. Documented as feed-forward item 1; the operational realization is a one-liner: `rm .claude/settings.json && node project-claude/install.cjs`.
   _⚙ Status: `investigate` · lesson #10040_

6. **Schema bug fixes deferred to W4 housekeeping.**
   Part A's `comparison-matrix.json` schema shipped with two known bugs (`oops_doc.minimum: 1` and `evidence_file` keyed on status not severity). Both fixed in W4 -- validation re-run dropped violations 28 -> 0 -- but ideally the schema would have been correct on first cut.
   _⚙ Status: `investigate` · lesson #10041_

7. **Vendored-command integration testing not yet landed.**
   Four upstream commands vendored in C6; existence + origin-marker tests landed but real-workflow integration testing is queued. Feed-forward item 2.
   _⚙ Status: `investigate` · lesson #10042_

8. **Gastown skill word-count gate miscalibrated against new frontmatter shape.**
   C4 split brought the 3 Gastown SKILL.md files <800w (passing the 820w gate), but later OGA-032/033 frontmatter expansion (status / triggers / references_subdir / word_budget) re-inflated word counts to 826/854/881. Three failing test cases in `tests/skills/gastown-splits.test.ts`. Feed-forward item 6 -- 1-commit fix in the next milestone.
   _⚙ Status: `investigate` · lesson #10043_

9. **Pre-existing repo merge debris remains.**
   Five files (`.mcp.json` UU; `.claude/commands/gsd/complete-milestone.md` DU; `.claude/get-shit-done/workflows/complete-milestone.md` DU; `www/tibsfox/com/Research/GPE/strategies.html` DU; `www/tibsfox/com/Research/index.html` DU). Owns its own short cleanup milestone (feed-forward item 3).
   _⚙ Status: `investigate` · lesson #10044_

10. **NEEDS-UPSTREAM-PR row OGA-005 still in matrix.**
   Future PR candidate against `gsd-build/get-shit-done`; not promoted to backlog inside this milestone (feed-forward item 4).
   _⚙ Status: `investigate` · lesson #10045_
