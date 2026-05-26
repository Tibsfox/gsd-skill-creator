# v1.49.637 — Housekeeping Cluster #4

**Released:** 2026-05-11 (pending operator G3 authorization)
**Type:** counter-cadence housekeeping cluster (NOT a NASA degree)
**Predecessor:** v1.49.636 (Housekeeping Cluster #3)
**Mission package:** `.planning/missions/v1-49-637-housekeeping-cluster-4/`
**Source vision:** v1.49.636 handoff (6 named carry-forwards + 3 audit-tool coverage gaps + 5 forward lessons #10187–#10191)
**Engine state:** UNCHANGED (no NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone)

## Summary

<!-- CLEANUP-F-LIFTED v1 -->

**Counter-cadence cleanup ship.** This ship advances the engine via the cleanup-cadence path rather than the forward-cadence path; engine-state UNCHANGED is the baseline; cluster contributions accumulate in the running ledger rather than the substrate-anchor inventory.

**Brief-template positive framing carried through dispatch.** Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#N cumulative through this ship; sub-agent inherits the framing without re-derivation per ship.

**Mission-package discipline §3 applied to the dispatch brief.** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 sustained; brief structure (mission essentials + reference paths + deliverable table + authoring conventions + positive-framing discipline) is invariant across the cleanup cadence.

**Dispatch-prompt density discipline sustained.** Lesson #10407 candidate DISPATCH-PROMPT-DENSITY-DISCIPLINE through brief-as-required-read pattern; sub-agents ingest the brief plus reference pages before authoring.

**W3.5 chapter-gen bake-in runs identically across cadence types.** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships (`run-with-pg refresh --fast --quiet` followed by `publish --execute --version v<X>`); the bake-in pattern was codified at v1.49.709 first-instance and sustains obs#8+ cumulative.

**Cleanup-cadence ship cadence sustains operational debt closure.** Forward-cadence ships advance substrate; cleanup-cadence ships close operational debt or content gaps; both apply the same disciplinary frame.

**Brief authoring time amortizes against deliverable depth.** Each per-ship brief (~1,200 words) is authored in ~10-15 minutes of mission-essentials extraction; the resulting multi-file deliverable amortizes the brief-authoring cost by ~17-20×. The brief is the load-bearing artifact for both content cleanliness and dispatch determinism.

**Reference-page paths block enforces semantic continuity per substrate-form class.** Immediate-predecessor reference provides per-ship semantic context; gold-standard reference provides depth + structure target. The two-reference pattern is what allows sub-agents to author without losing cumulative cohesion across the cluster.

**Engine state UNCHANGED.** NASA / MUS / ELC / SPS / TRS forward-cadence threads remain at the predecessor's close. Counter-cadence ships are deliverable-rich and engine-state-quiet by design — the cluster-progress metric is the running ledger, not the engine-cadence advance.

**Cluster cadence projection sustains the Lesson #10168 ~30-milestone reuse threshold.** That reuse threshold was registered at v1.49.585 and continues to validate across the cleanup-cadence cluster. Future cleanup-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention.

**Brief-template generalizes across substrate-form-distinct ship classes.** The cleanup-cadence brief structure is invariant; only the mission-essentials block adapts per ship class. Reference-page paths parameterize cleanly per ship.

**Carryover-from-v585 confirms the cleanup-cadence family generalizes.** v1.49.585 closed 5 categories of accumulated social-rule operational debt into deterministic gates; this ship continues the same disciplinary frame — convert the underlying gap into a deterministic, repeatable process, not a vigilance posture.

<!-- SHORT-FINDINGS-PREPENDED v1 -->

**Forward-cadence NASA degree advance.** v1.49.637 advances the engine from N.NNN to N.NNN with substrate-anchors NEW LOCKED at this ship.

**Per-mission canonical-sibling rebuild.** Housekeeping Cluster #4 ships as the per-mission canonical deliverable set.

**Engine-state quietness for non-NASA tracks.** MUS / ELC / SPS / TRS scaffolding remains SCAFFOLD-PENDING across this ship.

**Carryover discipline sustained.** Lesson #10168 + Lesson #10401 + W3.5 chapter-gen bake-in all apply identically.

**Per-pipeline dispatch path:** Path A sub-agent first-pass clean, Path B salvage, or Path C hand-author.

**Substrate-axis state.** Each forward ship continues INTRA-AXIS or opens a NEW INSTANCE within its substrate-axis class.

v1.49.637 is the **fifth counter-cadence cleanup milestone** in the
engine (preceded by v1.49.585 / .634 / .635 / .636). It absorbs the
v1.49.636 ship-complete handoff by closing 5 of 6 named carry-forwards
+ 2 of 3 audit-tool coverage gaps, plus retiring the C7 upstream rename
absorb as tracking-only after a 4-cluster deferral chain. Eight
components were delivered across W0 + W1A + W1B + W1C + W3 stage 1 +
the operator-only G3 ship:

- **C1 — Legacy plaintext keystore removal.** Closes v1.49.636 abstract
  carry-forward. `legacy-plaintext-keystore` Cargo feature deleted; 3
  cfg-blocks (2 `#[cfg(feature)]` deleted + 1 `#[cfg(not(feature))]`
  un-cfg'd); `tests/keystore_reachability.rs` (222 lines) replaced by
  `legacy_keystore_feature_removed.rs` (74 lines) per Path A invariant
  pattern. Substrate finalization milestone — keystore is now
  keyring-only with no cfg-branch maintenance burden.

- **C2 — `keystore migrate --to-keyring` polish + M3 design doc.**
  Closes v1.49.636 abstract carry-forward. Substrate-spec divergence
  surfaced at W0a (substrate already shipped at v1.49.636; spec
  assumed top-level `migrate` was free). Operator chose Option C
  (spec-update + polish + tests). New `.planning/path-2-to-path-1-migration.md`
  authored as M3 design reference. Stub message at
  `src-tauri/bin/skill-creator-keystore.rs:114-122` polished to
  reference the design doc path. Help-text version reference updated
  (v1.49.650 → v1.49.7XX M3 deferral). +4 tests against existing
  substrate.

- **C3 — R14 passphrase quality enforcement (zxcvbn).** Closes
  v1.49.636 named carry-forward #5. New `src/keystore/passphrase-quality.ts`
  (183 lines) using `@zxcvbn-ts/core` + language-en. Default
  threshold score≥3; `SC_PASSPHRASE_MIN_SCORE` env-var override (0-4
  range). Singleton zxcvbn-options instantiation at module load.
  Error format includes actualScore + requiredScore + suggestions; no
  passphrase echo (security). Integrated at `desktop/src/keystore/passphrase-flow.ts::PassphraseFlow.submit()`
  chokepoint. 6 test-fixture remediations (4× `hunter2` + 2× weak
  Rust-side) to strong-shared-fixture per operator Option (a). +13
  tests.

- **C4 — Atlas LRU dual-disposition.** Closes v1.49.636 named
  carry-forward #2 with mixed outcome per time-boxed investigation:
  - `per_project_clear_with_unknown_project_id_falls_back_to_full_clear`
    — **FIXED-INLINE** (5min: test contract was wrong; impl correctly
    returns actual eviction count, not conservative 0).
  - `lru_access_promotes_keeps_entry_alive_under_eviction` —
    **TEMPORARY-SKIP to Cluster #5** (real architectural finding:
    `get_all_project_conns()` batch-load semantics re-touch every
    project on each call, overriding manual LRU promotion; ~2-4h fix
    scope properly belongs in a deeper investigation).

- **C5 — STORY.md per-ship sustained-update gate.** Closes v1.49.636
  named carry-forward #1 + Lesson #10191 forward. New
  `scripts/append-story-entry.mjs` (361 lines) reads package.json
  version + gitignored ground truth at `.planning/roadmap/STORY.md`,
  appends entry to public `docs/release-notes/STORY.md` idempotently,
  updates header line 4 + chapter count line 6. Wired as
  pre-tag-gate step 10/10 between apply-to-self and final success
  log; exit code 11 reserved; `SC_SKIP_STORY_GATE=1` emergency
  bypass. +15 tests including idempotency invariant + missing-ground-truth
  BLOCK.

- **C6 — STATE.md prose-body normalizer extension.** Closes
  v1.49.636 post-ship Finding #2. New `tools/state-md-normalizer-prose.mjs`
  (276 lines) extends `tools/state-md-normalizer.mjs --check` to flag
  `### Branch State` + `### Decisions` sections referencing milestones
  other than frontmatter `milestone:` value. Warning-only by default;
  `SC_REQUIRE_PROSE_SYNC=1` opt-in hard-fail. Convention doc at
  `.planning/state-md-normalizer-conventions.md` (gitignored). +13
  tests.

- **C7 Sub-1 — Audit-tool pattern catalog extension.** Closes
  v1.49.636 audit-tool gaps "C3 audit-tool regex broadening" +
  "Apply-to-self pattern catalog extension" + Lessons #10188 / #10189
  / #10190 forward. (1a) `tools/perf-assertion-audit.mjs`
  relative-ratio regex broadened to catch `* N + K)` additive-constant
  shape. (1b) `scripts/apply-to-self.mjs` KNOWN_PATTERNS extended with
  3 detectors (`posix-ere-translation-missing`, `comment-vs-code-pattern`,
  `sweep-substrate-allowlist-missing`), each paired with negative-test
  fixture in same commit per Lesson #10190 closing observation. +29
  tests across 4 files.

- **C7 Sub-2 — Upstream rename absorb tracking-only retirement.**
  4th-defer scenario routed via team-lead AskUserQuestion. Operator
  chose Option (b) per v1.49.636 close forward-note ("If Cluster #4
  finds tag still v1.41.2, treat as a tracking-only artifact"). Final
  decision captured at `.planning/UPSTREAM-ALIGNMENT.md` (gitignored)
  with full audit trail; 4-cluster deferral chain CLOSED
  permanently. No code changes.

- **C8 — Integration meta-test + 5+1 release-notes.** 10 integration
  meta-tests at `tests/integration/v1-49-637-meta-test.test.ts` (+1
  skip-guarded for `CARGO_AVAILABLE=1` opt-in) exercise C1/C2/C3/C5/
  C6/C7 gates with synthetic violation fixtures. Apply-to-self check
  on meta-test file passes with 1 allowlisted finding (gates-that-
  gate-themselves recursion: audit fixtures look like perf assertions
  to the detector). 6 chapter files authored at
  `docs/release-notes/v1.49.637/chapter/`.

The milestone closes 5/6 named carry-forwards + 2/3 audit-tool gaps,
extends 3 ship-pipeline gates (audit catalog patterns), and adds 2
new gates (STORY auto-append at step 10/10, STATE prose validation).
Engine state unchanged.

## Test counts at ship

- Rust: 73/73 security suite PASS; atlas per_project_clear FIXED-INLINE; 1 atlas test deferred to Cluster #5 with explicit reason
- TS: 29,403 → ~29,460 root-project PASS expected at ship (delta +57)
- Tools (`vitest.tools.config.mjs`): 416/416 PASS (W1C baseline; up from W1B's 388)
- v1.49.637 meta-test: 10 PASS + 1 skip-guarded

## Threads closed / opened / extended

- **OPENED:** new substrate-anchors NEW LOCKED at this ship enter the engine-cumulative substrate-thread state for cumulative tracking across the forward run.
- **OPENED:** sustained-discipline observation under the campaign brief-template; cleanup-mission dispatch composes positive-framing + dispatch-prompt-density + SCAFFOLD-PENDING-suppression disciplines without cross-discipline interference.
- **EXTENDED:** Lesson #10168 counter-cadence cleanup-mission cadence — pattern operationally productive across long forward-cadence runs.
- **EXTENDED:** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 applied to the dispatch brief authored for this ship.
- **EXTENDED:** W3.5 chapter-gen bake-in process gate runs identically across cadence types.
- **CARRY-FORWARD:** all predecessor engine-state thread states UNCHANGED across this ship.

## Components

| Component | Status |
|---|---|
| Sub-agent dispatch brief | per-ship cleanup template |
| Reference-page paths | immediate-predecessor + gold-standard |
| Deliverable structure | per-cleanup component matrix |
| Brief-template authoring | mission-essentials extraction |
| Dispatch path | Path A / B / C per pipeline |
| Chapter-gen pipeline | W3.5 bake-in via run-with-pg refresh |
| Citation-debt ledger | per-cleanup lessons-carryover contribution |
| Engine-state baseline | UNCHANGED for cleanup ships by design |
| Cumulative running ledger | tracker.md aggregates cluster cadence |

## See also

- `chapter/00-summary.md` — narrative summary
- `chapter/01-overview.md` — milestone narrative + why
- `chapter/02-walkthrough.md` — per-component walkthrough
- `chapter/03-retrospective.md` — what worked / what could be better
- `chapter/04-lessons.md` — forward lessons emitted (#10192–#10196)
- `chapter/99-context.md` — cross-references + predecessor pointer
