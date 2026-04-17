# Lessons — v1.49.29

8 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Architecture unification compounds.**
   Every future browser enhancement now applies to all PNW projects instead of most. The cost of extraction is paid once; the benefit accrues on every subsequent feature.
   _⚙ Status: `investigate` · lesson #408_

2. **Retrospectives are infrastructure, not ceremony.**
   The 71-file backfill created a queryable knowledge base. Mining it produced 7 actionable gaps — proof that the investment pays forward.
   _🤖 Status: `applied` (applied in `v1.49.71`) · lesson #409 · needs review_
   > LLM reasoning: Blue Infrastructure release reflects retrospective-as-infrastructure by building on mined gaps.

3. **Warning mode is the right default for new hooks.**
   One release of clean operation before upgrading to blocking prevents the hook from becoming a development blocker during its stabilization period.
   _⚙ Status: `investigate` · lesson #410_

4. **Speculative infrastructure is not technical debt.**
   The inventory makes clear that design-ahead specifications follow the project's "cartography not construction" principle — they're ready for their build phases, not abandoned.
   _🤖 Status: `applied` (applied in `v1.49.71`) · lesson #411 · needs review_
   > LLM reasoning: Blue Infrastructure release materializes previously speculative design-ahead specs into built phases.

5. **LOC visibility prevents silent growth.**
   A 15K flag threshold is generous, but having ANY threshold means large releases trigger conscious review rather than sliding past unnoticed.
   _⚙ Status: `investigate` · lesson #412_

6. **The retrospective backfill is necessarily speculative for early releases.**
   v1.0 through ~v1.20 retrospectives are written from artifact analysis, not from lived session context.
   _⚙ Status: `investigate` · lesson #413_

7. **Wave commit marker validation is limited by message extraction.**
   The hook parses -m flag content which doesn't preserve newlines from heredoc-style commits. Warning mode is appropriate until extraction improves.
   _🤖 Status: `investigate` · lesson #414 · needs review_
   > LLM reasoning: Candidate v1.49.60 'Inclusionary Wave' doesn't relate to hook message extraction improvements.

8. **Test density checker only covers TypeScript.**
   Shell script tests, Python tests, and PNW browser verification checklists are not counted. Future versions should support polyglot test counting.
   _⚙ Status: `investigate` · lesson #415_
