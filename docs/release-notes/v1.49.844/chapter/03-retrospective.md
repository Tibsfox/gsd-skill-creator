
# v1.49.844 — Retrospective

**Wall-clock:** ~15 min from v843 ship-close to release-notes draft. Mostly authoring the verify-axis section in meta-cadence-discipline.md + the disciplines.json extension; minimal decision overhead.

## What went as expected

- **The canonical-doc decision was operator-authorized via the v840 forward-flag.** The flag explicitly named two viable homes (extend meta-cadence OR new sub-doc); the operator's earlier "work through the list" instruction implied "make sensible decisions and execute". Extension over new doc was the smaller-surgery choice.
- **The existing meta-cadence doc structure generalizes cleanly to 4 axes.** Each axis section (definition + cadence target + examples) was added below the existing 3; the overdue-check section added a 4th trigger; the forward-shadow CLI section gained a 4th subcommand.
- **CLAUDE.md regen handled the disciplines.json change cleanly.** `npm run render:claude-md` updated the Meta-cadence entry in the operative-disciplines block without manual touch-up.
- **JSON validation passed.** Disciplines list still 23 entries; structure unchanged.

## What I noticed

- **Canonical-doc decision ships are a recognizable shape.** v844 isn't a codify ship (no numbered lesson promotion), isn't a chip (no source-code wire), isn't a forward-cadence ship (no NASA degree advance). It's a discipline-structure ship — extending an existing canonical doc to give a deferred candidate its home.
- **The numbered-lesson promotion stays deferred.** Per #10426, full codification = canonical-doc + numbered lesson + manifest entry + CLAUDE.md render. v844 covers (a) and (d) for the verify axis; (b) and (c) wait for a codify ship that explicitly promotes verify-as-discipline-with-a-number. This is a fine-grained codification rhythm: structure first, numbering second.
- **The "verify-overdue" trigger uses existing primitives.** It checks (a) consume-axis output (substrate-with-callers) + (b) test-file presence (a grep) + (c) ship-count-since (a git command). No new infrastructure required to implement the check; the prose definition is operationally sufficient.
- **"Shipped substrate without proof-of-wire" is a new lagging-axis description.** The doc's "when one axis lags" paragraph already named two failure modes (pure substrate engineering + post-hoc framing); adding the verify-lagging mode (substrate runs without proven end-to-end test coverage) sharpens the diagnostic vocabulary.

## What surprised me

- **The DI-executor wire from v843 ALSO needs verify coverage.** v843 wired mesh-worktree + proxy-committer; both have unit tests with injected mocks. Neither has an integration test that exercises the default-executor path with a real git binary. Per the new verify-overdue trigger, this would count if non-test callers exist and 10 ships pass. Quick check: do these factories have non-test callers? Yes — `src/mesh/process-manager.ts` calls launchWetty for terminal, and createMeshWorktreeManager is exposed publicly. Tracked as a forward observation for the next verify ship.
- **Sub-15-min wall-clock.** Doc-extension ships are faster than chip ships because there's no test verification step and no audit-test allowlist edit. Just doc edit + JSON edit + regen + release notes.
- **The numbered-lesson deferral has a sharper rationale now.** v840 deferred because "no canonical-doc home"; v844 closes that. v847+ codify ship can promote as soon as the operator decides — the only remaining wait is the 3rd-instance OR the explicit operator decision.

## Risk that didn't materialize

- **No JSON parse error.** Validated cleanly; 23 entries.
- **No render-claude-md failure.** Default render mode tolerated pre-existing agent drift (observer + v1.50a-*); only --diff flagged it.
- **No discipline-coverage regression.** No new lesson added; UNCODIFIED holds at 39 ≤ ceiling 41.
- **No source-code or test changes.** Build + test count both unchanged from v843.

## Carried forward (post-v844)

NEW this ship:

- **Verify-axis self-applicability forward-flag.** v843 mesh family ships have unit tests with mocks but no integration tests for the default-executor path with real git. Per the new verify-overdue trigger, this becomes overdue once 10 ships pass since non-test callers (already exist). Tracked as a future verify-ship candidate.
- **Canonical-doc-decision ship pattern.** v844 is the first ship I've shipped that's specifically a "give a deferred candidate its canonical-doc home" ship. Could recur if other deferred candidates also need home decisions. 1 instance; wait for 2nd.

Inherited from v840 + v841 + v842 + v843 (unchanged):
- DI-executor + tokenized-argv wire shape (3 instances; eligible for codification next codify ship).
- Re-throw ProcessContextDenied from CLI swallow-catch (2 instances; eligible).
- Recent-vs-baseline-recent comparison pattern (v841; 1 instance).
- Drift-check noise as scoring-system feedback loop (v841; 1 instance).
- All other single-instance observations.

DEFERRED no longer applicable (moved to "tracked under verify axis" by this ship):
- Verification/integration-only ships axis — has canonical-doc home now.

Still DEFERRED:
- Bidirectional enforcement completeness (v838 + v836; classification ambiguous; wait for 3rd).

## Process retrospective

- **4 ships in <2 hours wall-clock for the operational-debt cluster.** v841 (40 min) + v842 (20 min) + v843 (15 min) + v844 (15 min) = ~90 min. Each ship has a distinct shape (drift recalibration / batch chip / batch chip / canonical-doc decision) but they share T14 overhead.
- **Tasks 1-4 of 5 complete.** Task 5 (production caller of predict path) is qualitatively different — it's a substantive feature, not a chip/doc ship. Expected wall-clock 60-90 min.
- **The canonical-doc-decision-then-codify-later rhythm has a name now.** Some lessons need their canonical-doc structure decided BEFORE they can be codified. The v844 → future-codify-ship pattern is the explicit two-step.
- **NASA 1.179 pressure is now 62 consecutive ships.** Pressure margin keeps widening. The operator's "work through the operational list" instruction is the operative direction; NASA pressure accumulates as opportunity cost but stays at the operator's discretion.
