# Lessons — v1.49.710

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **W3.5 chapter-gen requires retrospective sections in README**
   chapter.mjs only writes 03-retrospective.md and 04-lessons.md when DB rows exist for those tables. ingest-deep.mjs extracts those rows from README h2/h3 headings ("What Worked", "What Could Be Better", "Lessons Learned", "Decisions", "Surprises"). Future READMEs must include these sections or chapter-gen produces only 2 of 4 chapter files. Discovered v710 first-use post-W3.5.
   _⚙ Status: `investigate` · lesson #10708_

2. **Salvage-cleanup is reusable across content-filter trip scenarios**
   pattern applies to multiple trip mechanisms (token-repetition collapse per v707 Artemis I, mid-word truncation per v710 Psyche). The disk-first audit workflow is mechanism-agnostic.
   _⚙ Status: `investigate` · lesson #10709_

3. **Defer-and-substitute remains the escape hatch for intrinsic-topic density**
   Lesson #10401 brief vocab budget catches title-line + body-secondary trips pre-dispatch but cannot prevent cumulative density during page generation. Intrinsic-impact-adjacent topics (DART, Deep Impact, LCROSS, OSIRIS-APEX/Apophis) require hand-authoring or substitution.
   _⚙ Status: `investigate` · lesson #10710_

4. **Sub-agent build dispatch sized larger than ~60-tool ceiling**
   v710 Psyche dispatch hit the ceiling at index.html completion + artifact authoring + began nav files but tripped before completion. Future briefs should explicitly note when story.tex authoring can be deferred to salvage-cleanup if dispatch reaches ~50 tool uses.
   _⚙ Status: `investigate` · lesson #10711_

5. **OSIRIS-APEX deferral demonstrated intrinsic-topic content density limits**
   the original v710 target (OSIRIS-APEX) tripped at 39 tool uses on cumulative Apophis-related content density during page generation despite title-line = 0 + body-secondary = 0. Confirms Lesson #10401 secondary-class advisory is necessary but not sufficient for intrinsic-impact-adjacent topics. Defer-and-substitute pattern remains the established escape hatch.
   _⚙ Status: `investigate` · lesson #10712_
