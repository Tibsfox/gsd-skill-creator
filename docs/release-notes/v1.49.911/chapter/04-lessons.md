# Lessons Codified — v1.49.911

39 UNCODIFIED lessons drained to zero via the hybrid strategy: a new "NASA mission authoring" discipline domain (27 lessons) + reusable-subset promotion into three existing entries (12 lessons). Net manifest delta: +39 lessons (108 → 147); +1 domain (23 → 24). Discipline-coverage UNCODIFIED 39 → 0; PARTIAL unchanged at 0.

## NEW DOMAIN — NASA mission authoring (27 lessons)

**Canonical doc:** `docs/nasa-mission-authoring-discipline.md`.

These are the NASA-degree-campaign authoring disciplines (v652–v716) that are specific to the campaign — distinct from the substrate-probe *content* discipline and from the generic sub-agent mechanics. De-jargonized from the in-house "substrate" vocabulary; grouped into 8 thematic sections.

| Theme | Lessons |
|---|---|
| Authoring cadence (direct/dispatch/hybrid) | #10341, #10350, #10352, #10374, #10376 |
| Same-day cluster thresholds & CC triggers | #10348, #10354, #10356, #10371 |
| Dispatch coordination (concurrent work) | #10268, #10271, #10349 |
| Substrate-axis rotation & stability | #10270, #10345, #10381, #10394, #10395 |
| Substrate-cohort / anchor observation accounting | #10389, #10397, #10398, #10399 |
| Mission-brief accuracy & forward-reference tracking | #10250, #10346 |
| Content-filter & memorial-substrate framing | #10269, #10380 |
| Operator-directed departures & pivots | #10384, #10390 |

**Rule (new-domain codification):** A coherent cluster of operational lessons from a single campaign — where each lesson is below the cross-cutting bar but the cluster shares a surface and vocabulary — warrants a dedicated discipline domain rather than scattered promotion. The counter-cadence batching guidance is explicit: "new-discipline introduction warrants its own ship — batching gives the new discipline doc enough surrounding context to mature its framing."

**Discoverability note:** 16 of the 27 NASA-domain lessons are tagged reusability:`general` (they transfer beyond the campaign — the authoring-cadence ladder, per-page targets in batch uplifts, transient-API retry-first, the content-filter meta-statement trap, operator-authorized departure). To prevent the NASA-named home from hiding them, the doc opens with a **"Generalizable beyond NASA"** callout listing them with cross-references to their sibling generic disciplines.

## PROMOTION — Sub-agent dispatch (+10 lessons)

**Canonical doc:** `docs/sub-agent-dispatch-discipline.md` (new "Content-filter & dispatch-cadence lessons" section).

| Lesson | Discipline |
|---|---|
| #10406 | Positive-framing dispatch prompts; DON'T enumerate forbidden tokens (they self-replicate); planetary-protection-as-planned-final-state framing |
| #10407 | Trip-vocab density budget applies to the dispatch prompt itself, not just the brief — describe behavioral guidance abstractly |
| #10402 | Secondary-trip-vocab density audit (primary > 0 OR secondary > 5) → select Path B (main-context hand-author) preemptively; sibling of #10401 |
| #10387 | Content-filter-safe phrasing — date-pair memorial form, no event-circumstance language, single memorial section, engineering register |
| #10383 | Sub-agent content-filter mitigation via partial-completion salvage |
| #10378 | Dual-direction substrate-form hard-block (predecessor-leak AND forward-shadow-preemption) |
| #10388 | Foreground-author full-rewrite-at-scale recovery when a dispatch trips mid-stream |
| #10369 | Sub-agent dispatch as a clean cadence alternative for non-conflicting concurrent work |
| #10385 | Shared filename manifest in concurrent dispatch prompts prevents coordination drift |
| #10408 | Per-mission single-dispatch rebuild template (~1200-word brief, 13 deliverables, 28–36 tool uses) |

## PROMOTION — Self-modification safety (+1 lesson)

**Canonical doc:** `project-claude/hooks/self-mod-guard.js` (codified-lessons header).

- **#10367** — Sub-agent destination-directory ambiguity propagates a protected-path bypass. When a brief specifies a deliverable destination ambiguously ("likely under www/ or docs/"), the sub-agent may pick the path requiring the strongest overrides (www/ with `ALLOW_WWW_COMMIT=1`), bypassing the guard's intent through the path of least resistance. Mitigation is upstream of the hook: briefs MUST state each deliverable's destination AND commit pattern unambiguously (tracked docs/ ordinary commit vs published www/ empty-commit pattern).

## PROMOTION — Mission package framing (+1 lesson)

**Canonical doc:** `docs/MISSION-PACKAGE-DISCIPLINE.md` (Lesson coverage).

- **#10366** — Mark mission-brief historical-record assertions preliminary. When a W0 brief asserts a historical fact (crew bios, mission counts, cohort assignments, date bindings) not yet sourced to an authoritative reference, mark it `(preliminary; verify)` or place it under an explicit verification section, delegating the check to the first sub-agent step and catching precedent-inheritance errors before they propagate. Sibling of #10178 (W1 brief-error catch) and #10250 (forward-reference state tracking).

## Number-reuse correction (#10402)

Lesson #10402 was reused: at v699/v700 it tagged a short-lived "multi-decade Mars rover lifetime" candidate (only ever bare `#10402` in status tables; never carried forward as "Lesson #10402"). From v1.139 it became SECONDARY-TRIP-VOCAB-DENSITY → Path B selection — the meaning referenced 6× and counted by the coverage tool. The automated extraction grabbed the abandoned candidate; a direct source check corrected it. Codified meaning: the live dispatch-safety discipline. Lesson for the codify process itself: **when a lesson ID's first-emission version disagrees with the coverage tool's first-ref, suspect number reuse and verify against the "Lesson #NNNNN" (not bare #NNNNN) occurrences directly.**

## Codify-process lessons (this ship)

1. **A workflow-extracted lesson inventory must be adversarially source-checked before codification.** The fan-out extraction produced clean summaries for 38 of 39 lessons but silently grabbed an abandoned meaning for the one reused number. The completeness critic (operating on the inventory, not the source) could not catch it; only a direct grep of the live "Lesson #10402" occurrences did. Codification is load-bearing per #10427 — verify the source, don't trust the summary.
2. **The hybrid drain is the right shape when a UNCODIFIED cluster is mostly-coherent-but-partly-cross-cutting.** Pure single-domain absorption would have NASA-locked genuinely reusable dispatch disciplines; pure scatter-promotion would have left the campaign-specific substrate-tracking lessons homeless. The 27-new-domain + 12-promote split (with a "Generalizable beyond NASA" callout for the 16 general-tagged NASA-homed lessons) preserves both coherence and discoverability.
3. **A doc-only codify ship can drain a 39-entry backlog in one ship when the source prose already exists.** The cost is canonicalization (de-jargonizing) + wiring, not original authorship. The UNCODIFIED bucket — like the PARTIAL bucket v910 drained — is a free work-list once the codify ship is opened.

## Cross-references

- #10428 (Meta-cadence — codify-axis trigger; this ship's cadence justification)
- #10434 (KNOWN_UNWIRED ledger generalization to per-discipline UNCODIFIED counts — the gate this ship took to 0)
- #10427 (Failure-mode contracts — codification is load-bearing → source-verify, the #10402 catch)
- #10401 (brief title-line trip-vocab budget — primary-class sibling of the promoted #10402 secondary-class threshold)
- v1.49.910 (predecessor codify ship — drained PARTIAL 8 → 0; flagged this UNCODIFIED drain as the next codify move)
