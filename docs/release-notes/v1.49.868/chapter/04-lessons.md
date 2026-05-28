# v1.49.868 — Lessons

## Promoted to ESTABLISHED in this ship (1 new + 1 refinement)

The v857-v867 eleven-ship campaign accumulated two eligible codify-ready observations (continuous-verification mode for the v857 cross-audit tool; size-ascending chip-pick reveals wire-shape diversity). v868 promotes the size-ascending pattern as a new ESTABLISHED lesson AND refines #10443 with the continuous-verification mode operational discipline.

### #10444 — Size-ascending chip-pick reveals wire-shape diversity (NEW LESSON)

**Evidence (2 instances; two distinct chokepoint surfaces):**

| Track | Ship range | Chips | LOC ascending order | Distinct wire shapes |
|---|---|---|---|---|
| Track 2 — Process cluster | v1.49.858-862 | 5 | 81 → 167 → 220 → 408 → 560 (sorted in retrospect) | hoist-at-top → hoist-outside-Promise (no cleanup) → hoist-outside-Promise+cleanup → internal-helper (#10433) → closure-capture |
| Track 3 — Egress cluster | v1.49.863-867 | 5 | 73 → 108 → 151 → 161 → 193 (sorted in retrospect) | hoist-at-top fetch → hoist-with-early-return-bypass → two-site hoisted-check → hoist-before-fetch (strict-fail) → DI-fetch-wrapper (#10441 Egress analog) |

(Note: the ship order within each track was approximately size-ascending but not strictly monotonic; the wire-shape catalog still emerged through the cluster regardless of strict ordering.)

10 chips across 2 chokepoint surfaces → 10 distinct wire shapes, no variant-coverage planning involved.

**Status:** PROMOTED to ESTABLISHED at v1.49.868. Codified in `docs/architecture-retrofit-patterns.md` under `## Discipline patterns` (new subsection after #10440); listed in `## Lesson references`; added to `## Anti-pattern summary` with two new anti-patterns (highest-LOC-first picking; force-fitting one shape across cluster); added to `## When this discipline kicks in` with new bullet for KNOWN_UNWIRED chip-pick ordering. Manifest entry `Architecture-retrofit patterns` key_lessons extended to `#10414, #10416, #10426, #10440, #10444`.

**Codification target:** any future KNOWN_UNWIRED chip cluster (or any ratchet-ledger chip cluster per #10434 generalization). The discipline composes with #10422/#10423 lightest-wire at the per-chip level (pick the lightest shape the file structurally supports) and #10440 production-caller scope-reduction (do not accrete wrapper-class scaffolding to force a shape from another chip).

**Cross-references:** #10422/#10423 (lightest wire — at per-chip not per-campaign level), #10432 (parent — KNOWN_UNWIRED ratchet-ledger substrate that the chip cluster operates within), #10433 (internal-helper shape emerges at the mid-LOC band naturally), #10440 (do not force-fit wire shapes across chips), #10441 (DI-executor shape emerges at higher-LOC bands with factory-built executors).

### #10443 — Continuous-verification mode (REFINEMENT — NO NEW LESSON NUMBER)

**Evidence (10 consecutive applications + 1 self-bug-fix at instance 10):**

The v857 cross-audit tool was authored with a single integration mode (ad-hoc). The v858-v867 chip campaign demonstrated a second mode — invoke after every chip ship as continuous-verification — and validated the tool's operational tightness at instance scale.

- **v858-v866:** 9 consecutive clean tool runs across Process + Egress chips. Each chip ship followed: apply wire → `npm run build` → `node tools/security/check-stale-known-unwired.mjs` (clean) → T14.
- **v867:** 10th application surfaced the tool's first real-world parser bug. Substring `all errors return []` in a wire-shape comment collided with the regex extractor's non-greedy `[\s\S]*?\]\s*\)` terminator; the tool reported 0 entries instead of 6 for Egress and was "clean" by vacuous truth. Regex hardened with line-start anchor + multi-line flag (`[\s\S]*?^\s*\]\s*\)/m`); fix shipped in same ship as the triggering chip.

**Status:** REFINEMENT to existing #10443. Codified in `docs/known-unwired-ledger-discipline.md` as new `### Continuous-verification mode` subsection within the existing `## Inverse-audit: stale-entry detection (Lesson #10443)` section. Manifest entry `KNOWN_UNWIRED allowlists as migration-debt ledger` summary extended; codified_at_milestone appended with v1.49.868 record. No new lesson number — this is an operational productionization of #10443, not a new behavioral discipline.

**Codification target:** the per-ship chip-ship workflow now includes the cross-audit tool as the third step between `npm run build` and `pre-tag-gate`. The next ship (v1.49.869) promotes this from operator-invoked to a deterministic pre-tag-gate step.

**Sibling pattern (below-threshold, 1 instance):** "Tools designed to surface silent-vs-loud asymmetry must themselves fail loudly." A #10427 corollary that surfaced at v867 (the v857 tool's vacuous-true parser bug). Below threshold for promotion. Carried as forward-observation until a 2nd instance surfaces.

**Cross-references:** #10421 (static-analysis tool conventions — fixture-based test coverage + sanity-check assertions; the tool follows this discipline + the v867 fix added a sanity-check line per this lesson), #10427 (load-bearing surfaces must fail loudly — the cross-audit tool is itself load-bearing, so its parser must fail loudly), #10443 (parent — inverse-audit stale-entry detection that this refinement operationalizes).

## Sustained observations (no change this ship)

### #10428 — Counter-cadence/meta-cadence

**Status:** SUSTAINED. v868 is the 11th codify-axis ship since the v847 reset, slightly past the #10428 upper bound (7-10 ships). The natural cadence "codify when the candidates pile up" still held — both v868 candidates were promotion-eligible at v867 close, and the v868 ship cleared both. Acceptable to flex the upper bound when the candidate backlog is light and the chip cluster is active; codify-on-demand beats codify-on-schedule.

### #10432 — KNOWN_UNWIRED ratchet-ledger

**Status:** SUSTAINED. The v868 codify codifies a discipline (#10444) ABOUT how to chip down KNOWN_UNWIRED clusters. #10432 itself is unchanged; #10444 is a peer that composes with it.

### #10433 — Internal-helper for ctx? threading

**Status:** SUSTAINED. The v860 chip (third Process cluster ship) exercised this shape. #10444 codifies that the shape emerges naturally at the mid-LOC band when size-ascending picking is applied to the cluster.

### #10441 — DI-executor + tokenized-argv wire shape

**Status:** SUSTAINED. The v866 chip (fourth Egress cluster ship) exercised the Egress analog (DI-fetch-wrapper). #10444 codifies that the shape emerges naturally at higher-LOC bands when the file uses dependency injection.

## Forward observations (below promotion threshold, 1 instance each)

### Tools-detecting-silent-failures must themselves fail loudly (#10427 corollary)

**Surface ship:** v1.49.867 (cross-audit tool parser bug).

The v857 tool was built to catch silent stale entries; its own parser had a silent failure mode (vacuous-true on misparsed input). The same #10427 failure-mode contract that motivated the tool applies to the tool itself. The v867 fix codifies a sanity-check fixture pattern (compare structural-view count against actual file enumeration).

**Below threshold (1 instance).** Carry as forward-observation. A second instance — another tool designed to surface silent-vs-loud asymmetry that itself fails silently — would promote this to ESTABLISHED.

### Codify-ship duration scales with candidate count

**Surface ship:** v1.49.868 (data-point estimate).

Three data points: v847 (5 lessons, ~60-75 min); v857 (1 new lesson + 1 new tool + 6 tests, ~50-60 min); v868 (1 new lesson + 1 refinement, doc-only, ~25-30 min). Suggests per-codify wall-clock scales as `~15 min/lesson + ~20 min/new-tool-surface + ~10 min/test-file`.

**Below threshold (informal observation).** Useful for forward planning but not codification-ready until a 4th codify ship validates the rough model. Carry as observation.

### Doc-local lesson-number drift

**Surface ship:** v1.49.868 (recon).

`docs/known-unwired-ledger-discipline.md` cross-references "#10416 (Lightest wire)" but #10416 in the manifest is Tolerant generators (the lightest-wire concept is #10422/#10423 in shelfware-verdict-patterns.md). One instance of doc-local lesson-attribution drift discovered during v868 codify recon.

**Below threshold (1 instance).** Carry as forward-observation. A second instance of doc-local lesson-attribution drift would suggest a periodic codify-recon scrub of cross-references against the manifest.
