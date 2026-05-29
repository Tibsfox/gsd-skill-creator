# v1.49.883 — Retrospective

**Wall-clock:** ~40-50 min from session pickup (handoff read + v882 retro audit + scope confirmation via 3-question AskUserQuestion) to release-notes draft complete. Per the v868 estimate (`~15 min/lesson + ~20 min/new-tool-surface + ~10 min/test-file`), a 5-lesson doc-only ship would predict ~75 min; actual was ~50 min. The estimate held within ~30%, slightly favoring the lower end because three of the five lessons compose tightly with #10444 and share a common doc anchor point.

## What went as expected

- **v882 retro provided a clean candidate list.** The 6-candidate enumeration in v882's `04-lessons.md` was directly usable as the v883 promotion list. No discovery time wasted; the 5 candidates above the 2-instance bar were all clearly named with evidence ship numbers.
- **The codify-ship template was directly applicable.** Same shape as v868: extend existing discipline docs + extend disciplines.json key_lessons + render CLAUDE.md. The added scope for 5 lessons across 3 discipline docs was a single new subsection per lesson + header/footer updates per doc + summary/key_lessons/codified_at_milestone bumps per manifest entry.
- **Discipline-coverage scorer expected to drop UNCODIFIED by ~5.** The 5 candidates promoted were all observation-anchored in prior retrospectives; promoting them codifies their content from the manifest's perspective. The scorer behavior on extension vs. new-domain entries was consistent with v868's experience.
- **Doc + JSON consistency held under the codify discipline.** All three manifest entries' summary + key_lessons + codified_at_milestone fields updated in lockstep with the discipline-doc content. The render-claude-md output mirrored all changes cleanly.

## What surprised me (mildly)

- **The 6-candidate list grew from the handoff's 4.** The mid-campaign handoff (v877 close) listed 4 promotion-eligible candidates; the v882 retro listed 6. The +2 candidates (`module-singleton` and `router-with-conditional-bypass`) emerged during v878-v881 Track 5 chips — module-singleton at v881 ipc.ts (NEW shape; 1 instance, held as carry-forward) and router-with-conditional-bypass at v880 skill-installer (2 instances when paired with v864 git-collector). Confirms the v882 retro's observation that Track 5 surfaced more wire-shape diversity than predicted.
- **#10448 absorbed three sub-patterns into one lesson.** The handoff treated "shared-helper hoist sub-variants" as a single forward observation; the v882 retro upgraded it to 5+ distinct variants. Codifying as one lesson (with a 5-row sub-variant table + Track 5 wire-shape appendix + module-singleton carry-forward note) is more honest than splitting into 5 micro-lessons — the value is the catalog vocabulary, not the individual variant.
- **The codify-cadence band held.** v868 was 11 ships past v857 (1 over the 7-10 band); v883 is 15 ships past v868 (5 over the band). Both flexed upward when candidates accumulated; both still felt natural at codify time. Suggests the band is a lower-bound floor more than a strict upper-bound ceiling — codify-on-demand still beats codify-on-schedule when the active campaign is chipping.

## What went wrong

- Nothing this ship. The doc-only scope kept the surface small; all 5 candidates were operator-confirmed in the scope-confirmation AskUserQuestion flow at session start; all three target docs had stable sectional structure that accommodated the additions without restructuring.

## Future-improvement candidates surfaced this ship

### Codify-ship duration as a function of new-lesson-count (data point #4)

v847 codify (5 lessons + tool refs) took ~60-75 min. v857 codify (1 lesson + 1 new tool + 6 tests) took ~50-60 min. v868 codify (1 new lesson + 1 refinement, doc-only) took ~25-30 min. v883 codify (5 refinements, doc-only) took ~40-50 min.

Per-codify wall-clock now estimable as `~7-12 min/lesson + ~20 min/new-tool-surface + ~10 min/test-file` (revised downward from v868's `~15 min/lesson`). The downward revision tracks composition: when N lessons share a doc anchor (e.g., all extending #10444 in architecture-retrofit-patterns.md), the per-lesson marginal cost drops vs. 1-lesson-1-doc ships. Below promotion threshold (4 data points but inconsistent units — some include new tool surface, some don't). Carry as observation for v900-ish codify ship validation.

### Sub-variant catalog as discipline-level artifact

#10448's 5-row sub-variant table is a new kind of codified artifact — a vocabulary catalog within a single lesson rather than a discrete behavioral discipline. The Track 5 wire-shape table appendix is a 2nd similar artifact (campaign-bounded ledger inside a lesson).

Both shapes (vocabulary catalog + campaign-bounded ledger) compose well with the existing lesson-as-behavioral-discipline shape but expand what a "lesson" can carry. Below promotion threshold (1 lesson with both artifacts at v883). Watch for a second instance — likely whichever future campaign closes the LoaderContext chokepoint chip-down.

### Module-singleton carry-forward as anti-pattern documentation

The `module-singleton` shape from v881 ipc.ts is the first time a 1-instance candidate has been documented as an *explicit anti-pattern note* in the canonical doc rather than just an inline ship-mention. The shape is plausible enough that future operators will reach for it; pre-emptively flagging when it's appropriate vs. inappropriate (N=1 high-wrapper-count = OK; N≥2 OR low-wrapper-count = anti-pattern) is more useful than silent carry-forward.

If a second `module-singleton` instance appears in a future ship, promote to the sub-variant table proper. Until then, the explicit carry-forward note in the discipline doc + the matching `module-singleton` row in #10448's Track 5 wire-shape table together make the shape discoverable without sanctioning it as a default.

## Verdict on scope

This ship invests in the **codify axis**. It is the 15th forward-cadence tick of codification since the codify-axis cadence reset at v847, 5 ships over the #10428 7-10 ship upper bound but still within the natural "codify when the candidates pile up" cadence. Per the meta-cadence discipline, codifying the 5 v868-v882-validated patterns at the campaign's close (after Track 4 + Track 5 both ratcheted to zero and the v882 tool ship landed) is correct — the campaign produced the substrate of evidence; v883 cashes it in.

Three existing-entry extensions, zero new manifest domains, zero new test surface. The discipline-as-data manifest holds at 23 entries with a 5-lesson-count tick (+5).

The two chokepoint surfaces (Process + Egress) are now fully wired AND the wire-shape catalog from their migration is fully codified. The next chokepoint campaign (LoaderContext, when it opens) will inherit a turnkey playbook rather than re-discovering shapes ship-by-ship.
