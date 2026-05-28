
# v1.49.847 — Lessons

## Promoted to ESTABLISHED in this ship (5)

The full eligible backlog from v846 close was cleared in one ship per operator decision. Each lesson's source ships, evidence count, and canonical-doc landing site are documented below.

### #10438 — Verify axis: prove-the-wire-works as a first-class axis

**Evidence:** 2 instances (v829 cross-rootdir ObservationBridge integration test + v832 cross-rootdir ConceptFallbackProvider integration test).

**Source ships:** v1.49.829 + v1.49.832. Canonical-doc home was set at v844 (canonical-doc-decision ship pattern). Numbered-lesson promotion deferred to this ship per #10426.

**Landing site:** `docs/meta-cadence-discipline.md` — new top-level section `## Lesson #10438 — Verify axis: prove-the-wire-works as a first-class axis` before Cross-references. Manifest update appends `#10438` to Meta-cadence entry's key_lessons and extends the summary with the four-axis structure (codify / consume / calibrate / verify).

### #10439 — CLI manual + substrate auto-emit duality (calibrate-axis completeness rule)

**Evidence:** 2 instances (v803 token-budget CLI + sc:status auto-recorder same-milestone; v845/v846 predict-low-confidence CLI + substrate auto-emit across 2 milestones).

**Source ships:** v1.49.803 + v1.49.845 / v1.49.846. Pattern was implicit in v803 (both halves shipped same milestone, making the duality invisible as a rule); v845/v846 split into 2 milestones made the 3-ship pattern (observation-source → CLI → substrate auto-emit) explicit.

**Landing site:** `docs/meta-cadence-discipline.md` — new top-level section `## Lesson #10439 — CLI manual + substrate auto-emit duality (calibrate-axis completeness rule)` as a sibling to #10438. Manifest update appends `#10439` to Meta-cadence entry's key_lessons.

### #10440 — Production-caller scope-reduction via path-narrowing

**Evidence:** 2 instances (v845 CLI bypassed ActivationSelector + PipelineActivationDispatch wrapper classes named in v837 forward-flag; v846 substrate auto-emit lived inside existing emitPredictions chain — both called the path directly).

**Source ships:** v1.49.845 + v1.49.846. Both ships demonstrate that wrapper classes named in a forward-flag are integration concerns, not path concerns; when the path is directly callable the simpler scope is to call it.

**Landing site:** `docs/architecture-retrofit-patterns.md` — new subsection `### Production-caller scope-reduction via path-narrowing (Lesson #10440)` under the existing "## Discipline patterns" block, after the existing #10426 subsection. Manifest update appends `#10440` to Architecture-retrofit patterns entry's key_lessons.

### #10441 — DI-executor + tokenized-argv wire shape for ProcessContext

**Evidence:** 3 instances (v825 `repo-manager.ts` + v843 `mesh-worktree.ts` + v843 `proxy-committer.ts`).

**Source ships:** v1.49.825 + v1.49.843. Sub-class of #10433's internal-helper pattern: when a module exposes a factory with an optional injected executor for testability, the default executor IS the internal helper.

**Landing site:** `docs/security-chokepoints.md` — new top-level section `## DI-executor + tokenized-argv wire shape (Lesson #10441)` after the existing #10433 internal-helper section. Manifest update appends `#10441` to Security chokepoints entry's key_lessons.

### #10442 — Re-throw ProcessContextDenied from CLI swallow-catch

**Evidence:** 2 instances (v820 `branch-manager.ts` + v842 `terminal.ts`).

**Source ships:** v1.49.820 + v1.49.842. Specific shape of #10427's load-bearing-fails-loudly rule; promoted at 2 instances rather than 3 per operator decision (clean classification — sub-pattern of #10427, not genuinely new).

**Landing site:** `docs/failure-mode-contracts.md` — new top-level section `## Re-throw ProcessContextDenied from CLI swallow-catch (Lesson #10442)` after the existing #10437 section. Manifest update appends `#10442` to Failure-mode contracts entry's key_lessons.

## New lesson candidates (1; below threshold)

### Full-backlog-clear codify ship pattern

**Observation:** When the eligible backlog at a codify ship has 5 candidates and the operator decides to promote ALL 5 in one ship — vs the typical 2-3-lesson scope — the resulting ship is structurally larger but the post-ship cognitive surface is smaller (one promotion event to track vs two split events). Wall-clock scales sub-linearly with lesson count because the manifest update + CLAUDE.md render + release-notes structure work is shared across all promotions.

**Why it matters:** Default cadence is 2-3 lessons per codify ship. The 5-lesson clear is an outlier that needs preconditions: (a) all candidates already have canonical-doc homes (no structural restructuring required); (b) operator explicitly chooses the larger scope; (c) zero new manifest domains keeps the discipline-as-data system stable. Without all three, the 2-3 default would have been correct. Codifying this pattern helps future operators recognize when the full-clear is defensible.

**Instances:** 1 (v847 THIS SHIP).

**Forward-test trigger:** any future codify ship with a 4+ candidate eligible backlog where all candidates have existing canonical-doc homes and no candidate would require a new manifest domain.

**Promotion path:** Wait for 2nd instance. Likely classification — sub-pattern of the codify-ship cadence (#10428) rather than a genuinely new discipline.

## Forward-test of existing lessons

### #10412 — Recon-first as default

**Status:** APPLIED. Read each candidate's source-ship retrospective (v803 + v820 + v825 + v829 + v832 + v842 + v843 + v845 + v846) before authoring promotion text. ~15 min recon for 5 lessons; pre-amortized by per-ship recon during v840-v846.

### #10422 + #10423 — Verdict-pattern surface separation + lightest wire

**Status:** APPLIED. Each lesson's canonical-doc landing site was the lightest-wire option (extend existing section vs create new doc); no new manifest domains introduced.

### #10426 — Cross-class registry extraction at the SECOND class instance

**Status:** REINFORCED + LIVE. #10438 + #10439 + #10440 + #10442 all promoted at 2-instance threshold; #10441 promoted at 3-instance threshold (the 3rd instance produced contrast that the 2nd instance alone could not).

### #10427 — Failure-mode contracts

**Status:** EXTENDED. #10442 (ProcessContextDenied re-throw) is a refinement under the parent #10427 contract. Doc text in `docs/failure-mode-contracts.md` extends to include the new sub-section.

### #10428 — Meta-cadence

**Status:** EXTENDED + LIVE. #10438 (verify axis) + #10439 (calibrate-axis completeness rule) both refine #10428. The doc gains two new top-level sections; the disciplines.json summary extends to include both refinements. This is the 7th forward-cadence codify tick since v840 (within the 7-10 ship floor).

### #10433 — Internal-helper / threaded-options pattern

**Status:** EXTENDED. #10441 (DI-executor + tokenized-argv) is a sub-class of #10433; the new section in `docs/security-chokepoints.md` is co-located with the existing #10433 section.

### #10437 — Subscriber-gated observability-only context-hook pattern

**Status:** NOT EXERCISED. v847 is a doc-only ship; no subscriber-gated hooks added or modified.

### #10436 — Two-layer closure (file-overwrite drift sub-class)

**Status:** REINFORCED at T14 publish step. The v836 preservation gate fires on this ship's chapter writes (now ~12 times since v836).

## Tentative observations carried forward (consolidated)

### Eligible for next codify ship (0)

The eligible backlog cleared at v847. Next codify ship will pick from 2nd-instance achievements of currently-1-instance observations.

### Below threshold (NEW: 1; INHERITED: 8)

| Observation | Source | Instances | Notes |
|---|---|---|---|
| **Full-backlog-clear codify ship pattern** | **v847 (THIS SHIP)** | **1** | **NEW.** Wait for 2nd instance. |
| Fire-and-forget over awaited for observability writes | v846 | 1 | Wait for 2nd. |
| Canonical-doc-decision ship pattern | v844 | 1 | Wait for 2nd. |
| Verify-axis self-applicability (v843 mesh) | v844 forward-flag | 1 forward-flag | Becomes verify-overdue at ~v853. |
| Recent-vs-baseline-recent comparison pattern | v841 | 1 | Wait for 2nd. |
| Drift-check noise as scoring-system feedback loop | v841 | 1 | Wait for 2nd. |
| Codify-ship-as-recon-consolidator pattern | v840 | 1 | Wait for 2nd. |
| Deferral-by-classification-ambiguity | v840 | 1 | Wait for 2nd. |
| Auto-run-on-import as bootstrap-time tax | v836 | 1 | Wait for 2nd. |
| Polarity convention for inverted-mechanic thresholds | v837 | 1 | Wait for 2nd. |
| Bidirectional enforcement completeness | v838 + v836 | 1-2 (ambiguous) | DEFERRED v840 per classification ambiguity; UNCHANGED v847. |

### Sustained ESTABLISHED (instance-count refinements only)

- **#10433 LOC-band-by-callsite-count refinement** — still 7+ instances (UNCHANGED; v847 is a doc-only ship).
- **#10437 subscriber-gated observability** — REINFORCED in spirit by #10442 (a sibling shape under the same #10427 parent); doc text unchanged.

## Cadence observation

v847 is the 7th forward ship since v840's codify tick — at the lower bound of #10428's 7-10 ship floor. The cadence is on schedule. Next codify ship expected at ~v854-857.

The v841-v847 sequence is now 7 ships from the operational-debt + substrate-wire + codify-clear cluster:

| Ship | Wall-clock | Scope | Notes |
|---|---|---|---|
| v1.49.841 | ~40 min | Quality-drift recalibration | Tooling file; new chip release_type |
| v1.49.842 | ~20 min | Terminal family batch chip | 3 wires; Process: -3 |
| v1.49.843 | ~15 min | Mesh family batch chip | 2 wires; Process: -2; DI-executor at 3-instance threshold |
| v1.49.844 | ~15 min | Verify axis canonical-doc home | 4th meta-cadence axis added |
| v1.49.845 | ~45 min | Predict-next CLI production caller | Substrate write caller for predictive.low_confidence_threshold |
| v1.49.846 | ~40 min | Substrate auto-emit | Closes the substrate auto-recorder gap; pair with v845 |
| v1.49.847 | ~60-75 min | Codify ship — promote all 5 | Cluster's codification phase |

Cluster cumulative: ~235-250 min wall-clock, 5 KNOWN_UNWIRED Process entries removed, 1 new release_type, 1 new operational axis, 5 new numbered lessons. The cluster's narrative arc closes here: chip ships → canonical-doc decisions → substrate wires → codification.
