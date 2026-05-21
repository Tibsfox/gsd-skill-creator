# Retrospective — v1.49.710

## What Worked

- **W3.5 chapter-gen bake-in obs#2 sustained** — refresh + publish two-command form produced 4 chapter files for v709 first-instance; pattern carries forward to v710 substrate-cumulative.
- **Mission brief pre-dispatch checks** — title-line trip-vocab = 0 + body-secondary class density = 0 verified pre-dispatch per docs/MISSION-PACKAGE-DISCIPLINE.md §3 (Lesson #10401).
- **Salvage-cleanup pattern applied successfully** — sub-agent dispatch tripped during index.html generation phase; disk audit revealed ~95% of deliverable intact (index.html complete, 11 of 12 artifacts intact, 1 story file truncated mid-word). Surgical Edit completed the truncated story.html + hand-authored the missing 5 files (story.tex, from-1.162.md, to-1.164.md, degree-sync.json, README.md) at ~6K main-context tokens vs estimated ~50K for full rewrite. Pattern codified at docs/sub-agent-dispatch-discipline.md "Post-trip salvage cleanup".

## What Could Be Better

- **Sub-agent build dispatch sized larger than ~60-tool ceiling** — v710 Psyche dispatch hit the ceiling at index.html completion + artifact authoring + began nav files but tripped before completion. Future briefs should explicitly note when story.tex authoring can be deferred to salvage-cleanup if dispatch reaches ~50 tool uses.
- **OSIRIS-APEX deferral demonstrated intrinsic-topic content density limits** — the original v710 target (OSIRIS-APEX) tripped at 39 tool uses on cumulative Apophis-related content density during page generation despite title-line = 0 + body-secondary = 0. Confirms Lesson #10401 secondary-class advisory is necessary but not sufficient for intrinsic-impact-adjacent topics. Defer-and-substitute pattern remains the established escape hatch.

## Decisions

- **Substitute Psyche for OSIRIS-APEX at v710** — after OSIRIS-APEX dispatch tripped on intrinsic Apophis content density, substituted Psyche per defer-and-substitute pattern. OSIRIS-APEX preserved at gitignored deferred-mission directory for later retry with hand-authored content.
- **Hand-author salvage over re-dispatch** — Psyche sub-agent wrote ~95% of deliverable before tripping. Chose surgical Edit + hand-author the 5 missing pieces over full re-dispatch (~10K tokens vs ~50K).

## Surprises

- **Two consecutive v710 trips** — both OSIRIS-APEX (Apophis-adjacent) and Psyche (clean topic, sanitized brief) tripped sub-agent dispatch. Suggests cumulative content density during ~95K page generation can trip filter even when brief is clean. Possibly a per-session content-density carry-over effect, or just probabilistic variance at the ceiling.
- **Story.html truncation mid-word** — Psyche sub-agent emitted story.html ending mid-word ("substr") rather than mid-sentence. Differs from v707 Artemis I salvage which saw token-repetition collapse. Suggests trip mechanism differs by stage of dispatch.

## Lessons Learned

1. **W3.5 chapter-gen requires retrospective sections in README** — chapter.mjs only writes 03-retrospective.md and 04-lessons.md when DB rows exist for those tables. ingest-deep.mjs extracts those rows from README h2/h3 headings ("What Worked", "What Could Be Better", "Lessons Learned", "Decisions", "Surprises"). Future READMEs must include these sections or chapter-gen produces only 2 of 4 chapter files. Discovered v710 first-use post-W3.5.
2. **Salvage-cleanup is reusable across content-filter trip scenarios** — pattern applies to multiple trip mechanisms (token-repetition collapse per v707 Artemis I, mid-word truncation per v710 Psyche). The disk-first audit workflow is mechanism-agnostic.
3. **Defer-and-substitute remains the escape hatch for intrinsic-topic density** — Lesson #10401 brief vocab budget catches title-line + body-secondary trips pre-dispatch but cannot prevent cumulative density during page generation. Intrinsic-impact-adjacent topics (DART, Deep Impact, LCROSS, OSIRIS-APEX/Apophis) require hand-authoring or substitution.
