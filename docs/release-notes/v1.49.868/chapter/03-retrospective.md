# v1.49.868 — Retrospective

**Wall-clock:** ~25-30 min from session pickup (v867 handoff read + operator confirmation of 15-ship campaign scope/order/cadence) to release-notes draft complete. Half the v857 codify wall-clock (~50-60 min) because v868 is doc-only — no tool authoring, no new test surface, just two existing-entry extensions.

## What went as expected

- **The v867 handoff identified both candidates explicitly.** v867 close listed exactly two promotion-eligible candidates (continuous-verification refinement + chip-pick-by-size new lesson). Per-ship operational discipline during the v858-v867 campaign had already pre-validated both patterns. No discovery time wasted.
- **The codify-ship template was directly applicable.** Same shape as v857: extend existing discipline doc(s) + extend disciplines.json key_lessons + render CLAUDE.md. The added scope for #10444 was a single new subsection in the architecture-retrofit doc + four small extensions (codified-at line, when-this-kicks-in bullet, anti-pattern bullets, lesson-references entry). The added scope for #10443 refinement was a single new subsection in the known-unwired doc.
- **Discipline-coverage scorer stayed green.** 39 UNCODIFIED ≤ 41 ceiling sustained across the ship. The new #10444 added one row to the COVERED bucket; the #10443 refinement didn't change the lesson count (it's an extension, not a new lesson number).
- **Doc + JSON consistency held under the codify discipline.** Both manifest entries' summary + key_lessons + codified_at_milestone fields updated in lockstep with the discipline-doc content. The render-claude-md output mirrored both changes cleanly.

## What surprised me (mildly)

- **The handoff's "refinement of #10416" attribution for #10444.** The v867 handoff classified chip-pick-by-size as "refinement of #10416" but #10416 is tolerant-generators in architecture-retrofit-patterns.md. Reading the existing cross-references in known-unwired-ledger-discipline.md showed it uses "(Lightest wire)" as the parenthetical for #10416 — a doc-local lesson-number drift that's unrelated to the v868 work. Resolved by treating #10444 as a NEW lesson (not a refinement), which is more honest about its scope: it's about chip-pick ORDERING within a ratchet-ledger cluster, not about generator placeholder behavior. The v867 handoff's "refinement of" was a soft attribution, not a strict one.
- **The continuous-verification mode codifies without a new lesson number.** It's the operational productionization of #10443 (refinement, not extension). This kept the lesson-count delta clean (+1 for #10444 only); the #10443 refinement extends the existing manifest entry without adding to key_lessons. Discipline-coverage stayed at 85 unique lessons (+1) instead of 86 (which would have implied two new lessons).

## What went wrong

- Nothing this ship. The doc-only scope kept the surface small; both candidates were operator-confirmed before any edit; both target docs already had stable sectional structure that accommodated the additions.

## Future-improvement candidates surfaced this ship

### Codify-ship duration as a function of new-lesson-count

v847 codify (5 lessons) took ~60-75 min. v857 codify (1 lesson + 1 new tool + 6 tests) took ~50-60 min. v868 codify (1 new lesson + 1 refinement, doc-only) took ~25-30 min. Suggests the per-codify wall-clock scales roughly as `~15 min/lesson + ~20 min/new-tool-surface + ~10 min/test-file` — useful for forward planning when multiple candidates accumulate.

Below-threshold observation (single data point). Wait for v878+ codify (or similar) for a 2nd estimate before promoting to discipline.

### The #10416 doc-local lesson-number drift in known-unwired-ledger-discipline.md

`docs/known-unwired-ledger-discipline.md` line 269 references "#10416 (Lightest wire)" but #10416 is actually #10416 (Tolerant generators) per the manifest. The lightest-wire pattern is #10422 (verdict-pattern surface separation) and #10423 (lightest wire that satisfies the verdict) in `docs/shelfware-verdict-patterns.md`. Likely a typo or early-draft attribution. Below-threshold observation (1 instance); flag for future codify scrub if a 2nd doc-local drift surfaces.

## Verdict on scope

This ship invests in the **codify axis**. It is the 11th forward-cadence tick of codification since the codify-axis cadence reset at v847 (one over the 7-10 ship upper bound of #10428, but still within the natural "codify-when-the-candidates-pile-up" cadence). Per the meta-cadence discipline, codifying both v858-v867-validated patterns BEFORE the v869 pre-tag-gate integration is correct — the v869 integration is the deterministic gate that codifies the discipline this ship establishes. Doc-only ship is the lightest viable form for this codify; no tool surface needs to ship because the v857 tool already exists.

Two existing-entry extensions, zero new manifest domains, zero new test surface. The discipline-as-data manifest holds at 23 entries with one lesson-count tick (+1).
