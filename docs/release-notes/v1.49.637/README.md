# v1.49.637 — Housekeeping Cluster #4

**Released:** 2026-05-11 (pending operator G3 authorization)
**Type:** counter-cadence housekeeping cluster (NOT a NASA degree)
**Predecessor:** v1.49.636 (Housekeeping Cluster #3)
**Mission package:** `.planning/missions/v1-49-637-housekeeping-cluster-4/`
**Source vision:** v1.49.636 handoff (6 named carry-forwards + 3 audit-tool coverage gaps + 5 forward lessons #10187–#10191)
**Engine state:** UNCHANGED (no NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone)

## Summary

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

## See also

- `chapter/00-summary.md` — narrative summary
- `chapter/01-overview.md` — milestone narrative + why
- `chapter/02-walkthrough.md` — per-component walkthrough
- `chapter/03-retrospective.md` — what worked / what could be better
- `chapter/04-lessons.md` — forward lessons emitted (#10192–#10196)
- `chapter/99-context.md` — cross-references + predecessor pointer
