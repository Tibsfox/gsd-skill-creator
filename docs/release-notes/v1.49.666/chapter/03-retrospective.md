# v1.49.666 — Retrospective

## What went well

### Sub-agent dispatch (sequential)

Phase 5 chose **sequential** dispatch over parallel for the 4 TRS batches because all 4 sub-agents needed to edit `tools/scaffold-trs-packs.manifest.json`. The cc-2 retrospective described its 4 sub-agents as "parallel" but the actual commit timestamps showed 3-6 minute spacing — i.e. semi-sequential in practice. cc-3 made the sequencing explicit and got zero manifest races for the cost of ~80 min linear wall-clock instead of an idealized ~25 min parallel. Each sub-agent stayed at 22-38 tool uses (well under Lesson #10193 ~50 ceiling).

### Mission-brief precedent error caught + corrected (Lind ∈ Group 5)

The Phase 2 sub-agent brief asserted that Don Lind belonged to NASA Group 6 (1967), inheriting the assumption from v663's cohort-anticipation framing. Sub-agent grep-verified against NASA bio PDFs and surfaced the error: Lind was NASA Group 5 (1966-04-04), the "Original Nineteen." His 19y 0m 25d LONGEST-WAIT-TO-FIRST-FLIGHT record sits cross-cohort adjacent to Group 6, not internal to it. Sub-agent corrected the framing in the deliverable + flagged it in the report. Cost of catch: 0 (caught pre-author). Cost-if-missed: would have shipped a substrate-corruption into the canonical cohort doc + cross-referenced incorrectly from v660/v661/v663 substrate notes.

### Lesson #10365 immediately applied to its own Phase 5

Phase 4 codified the manifest-hint validation rule at `docs/scaffold-manifest-discipline.md`. Phase 5 — running 4 sub-agents minutes later — explicitly invoked it: each sub-agent's brief required grep-against-release-notes validation BEFORE committing. Result: 19 packs landed with release-notes-validated themes; **zero speculation in committed manifest fields**. The +15-edge anomaly at pack-31 was caught and surfaced by exactly this discipline: B4 saw the v645 release-notes say "15 new edges e393-e407" five separate times and recorded K_31=407 (not the +14 prediction K_31=406). Recursive application of a lesson within its own emit-milestone closes Lesson #10220 (apply-to-self at obs#2) at obs#5+ cumulative.

### Convention split codified at first violation

The Phase 2 sub-agent committed the cohort doc under `www/tibsfox/com/Research/NASA/cohorts/` using `ALLOW_WWW_COMMIT=1` to bypass the protected-path gate. This broke the cc-2 empty-commit pattern for www/ content (cc-2's 16 sub-agent commits had zero file diff; only manifest-deletion deltas). Recovery: relocated the file from `www/` to `docs/nasa-cohorts/` at `c49f085d6` with a commit-message-embedded convention note codifying the split going forward — `www/` for published-site content (empty-commit pattern), `docs/` for tracked reference documentation (ordinary commits). The mission-brief had been ambiguous on destination; the convention is now explicit for future sub-agent dispatch.

### Cluster-as-code lifecycle held

cc-1 + cc-2 + cc-3 cluster was scoped at v663 and ran in 3 same-calendar-day milestones (2026-05-17, all three). The 3-cluster lifecycle pattern at `docs/counter-cadence-discipline.md` predicts this exact shape: scaffold → fill → close-with-lessons-codified. cc-3 closes 2 deferred FA-N-N items + codifies 2 lessons emitted at cc-2 + clears 19 deferred TRS packs in one milestone — the classic cluster-close shape.

## What didn't go so well

### Sub-agent ALLOW_WWW_COMMIT initial misuse (Phase 2)

The mission-brief for Phase 2's research sub-agent said: "Output: retroactive cohort awareness document at appropriate path (likely under `www/.../NASA/cohorts/` or substrate-tracking sibling)." The sub-agent interpreted "likely under `www/`" as authoritative, used `ALLOW_WWW_COMMIT=1` to stage the file, and broke the cc-2 convention. Brief-author error: the destination should have been specified as `docs/` since the deliverable is **reference documentation** (substrate-tracking artifact), not **published-site content** (per-degree research pages).

**Cost:** one extra commit (`c49f085d6` relocation) + brief-author lesson noted. Not load-bearing but inelegant.

### Date-substitution typo in sub-agent output

Sub-agent's authored cohort doc contained the typo `"announced 2026-08-04…1967-08-04"` at line 7 — apparently a date-substitution artifact where 1967 was substituted but a 2026 reference snuck through. Caught at review; fixed in the same relocation commit. Suggests that even sub-agents with good source-validation discipline can have residual substitution artifacts in dense factual prose. Forward note: a `--lint-prose` pass over substrate-tracking docs (looking for date-anomalies, stray placeholders, etc.) could be a low-cost addition; deferred as FA-666-N forward.

### Brief asserted Lind ∈ Group 6 (caught by sub-agent, not by mission-brief author)

The mission-brief for Phase 2 asserted Lind was a Group 6 deferred-flyer cohort member. This was inherited from v663's framing of "Group 6 1967 deferred-flyers Henize + England + Lind cohort" — but v663 itself had the error. Cost was 0 because the sub-agent caught it pre-author; but the pattern (mission-brief authoring inheriting earlier-milestone errors without verification) is worth surfacing. The Lesson #10365 manifest-hint validation rule applies HERE TOO: mission-brief assertions about historical-record facts should be flagged as "preliminary; verify" rather than passed forward as authoritative.

**Recommendation:** future mission briefs that ASSERT historical-record bindings (cohort assignments, mission-crew rosters, ISO codes) should explicitly mark them as "preliminary — sub-agent must verify against authoritative source" and let the sub-agent's authoring pass be the validation.

## Process observations

### TRS-pack workflow productivity

The 4 sub-agents collectively authored ~4200 lines of substrate-tracked TRS content (19 packs × ~220 lines avg) in ~80 min wall-clock. Per-pack throughput averaged ~4 min from grep-research → read-exemplar → Write → manifest-edit → commit. The cc-2 retrospective predicted ~5 packs per sub-agent / 50 min wall-clock; cc-3 confirms the model at slightly higher density.

### Per-pack commit pattern matched cc-2

Each sub-agent followed the cc-2 commit pattern observed at `eb67f2230` (pack-40): manifest-entry-removal as the real diff; content authored into gitignored `www/` (no diff in commit); descriptive multi-line commit body documenting foundational anchors / edge range / substrate-coherence / K_N / FA-N-N resolution. 19 commits landed in this shape with zero git index conflicts.

### Lesson #10365 application catches +15 edge anomaly

Without the manifest-hint validation discipline applied, B4 would have extrapolated K_31 = K_30 + 14 = 392 + 14 = 406. v645 release-notes actually say K_31 = 407 (+15 edges). Sub-agent's grep-then-trust pass got the canonical value. Forward implication: future mission briefs predicting K_N values should always note "release-notes-canonical — validate." This is the structurally correct version of the rule.

## Forward considerations

- **Cluster-resume v667 STS-51-I LEASAT-3 RESCUE-RECOVERY** is the next milestone target. HIGH-PROBABILITY-VALIDATION per Lesson #10348 short-substrate-time-lag pattern (28d residual at v666 close).
- **TRS pack-01..04 + pack-39 deep-dive** (FA-664-3 → FA-665-5 → FA-666-2 inheritance) is pre-existing depth-deficit; not SCAFFOLD-PENDING. Suggest standalone forward milestone.
- **`tools/validate-manifest-hints.mjs` helper** (FA-665-3 → FA-666-N deferral) — only worth authoring if scaffold-manifest authoring becomes routine enough that automation pays for itself.
- **SPS cohort-uniqueness BLOCKER promotion** (FA-666-5) — promote `tools/check-sps-cohort-uniqueness.mjs` from soak-mode WARN to BLOCKER via `SC_PRE_TAG_GATE_REQUIRE=sps-cohort-uniqueness` at next NASA degree-advance window (v667).
- **`--lint-prose` date-anomaly check** (FA-666-N) — informal Phase 2 finding; defer as nice-to-have.
