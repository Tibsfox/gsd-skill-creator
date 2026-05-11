# 03 — Retrospective: v1.49.636 Housekeeping Cluster #3

## What worked

- **W0 design-doc gate caught real substrate drift before code work.** The
  C1 wiring design uncovered three deltas from the component spec
  (sanitize_error_message lives in encryption.rs not sanitizer.rs; Rust
  mirror types do not exist; Keystore::current is nominal). lab-director-2
  PASS-WITH-NITS approved the substituted `keystore_error_to_user_string`
  before Stage 2 work began. A blind implementation would have rebuilt
  against the wrong substrate assumptions.

- **Lab-director-2 PASS-WITH-NITS verdicts at W1A + W1B + W1C produced
  three iterations with zero rework.** All nits from each verdict were
  folded inline in the same commit window (W1A: 3 docblock + test-flip
  nits; W1B: 1 documentation nit; W1C: 0 nits). The pattern of "verdict
  + immediately-folded-nits + next-wave proceeds" is operationally
  efficient.

- **Atomic per-component commits stayed below the 5-file cognitive
  threshold.** C1 was 12 files (substrate-heavy with cross-language
  flips), but the OTHER 6 components averaged 3-4 files each. The atomic
  commits make per-component bisect and revert tractable.

- **`it.runIf` + skip-guard pattern (Lesson #10180) shipped cleanly.**
  C4 invariant test and C8 meta-test both follow the pattern. The
  apply-to-self check on the meta-test file itself passed with no
  findings — discipline doc proves its value in the same commit window
  (the Meta-Lesson's load-bearing assertion).

- **Hook discovery during fixture authoring caught a real bug.** The
  C7 apply-to-self test fixtures initially included the literal phrase
  "skip-guard" in a comment, which my over-eager skip-guard regex
  matched, silencing the WARN. Restricting the regex to real code
  patterns (`if (!existsSync(...)) return`, `it.runIf(...)`) fixed it.
  This is exactly the Meta-Lesson dynamic — the apply-to-self check's
  own authoring surfaced the discipline.

- **The conservative Phase-2 deferral for C2 was the right call.** 41/48
  chipsets migrated (85% coverage) is the realistic ceiling for the
  department-shape adapter; stretching to cover Family A/B/C/D in one
  component would have been wrong. The Phase-2 doc with per-family
  migration paths and estimated cost lets Cluster #4 pick up cleanly.

## What could be better

- **T1 (commit mission package) is a wrong-shape task.** The
  `git-add-blocker` hook (from v1.49.585 C02) blocks `git add .planning/*`
  by design; the standing memory rule says "HARD RULE: NEVER git
  add/commit/push .planning files"; `git log --all -- '.planning/missions/'`
  returns nothing — no prior mission package has been committed.
  Team-lead authorized Option A (skip-as-no-op) and confirmed T1 was
  a design error in the mission-pipeline scaffolding. **Forward
  capture:** remove T1 from future cluster scaffolding.

- **Cosmetic v1.49.650 sweep (spec Stage 2) was scoped too broadly.** 24
  files reference `v1.49.650` but the vast majority are LEGITIMATE
  substrate citations (e.g. `// Renamed from insecure-plaintext-keystore
  at v1.49.650`). A blanket sweep would corrupt audit trail. Only a
  handful of file-header docblocks ("CLI command group for the v1.49.650
  unified keystore" pattern) are clear-cut cosmetic targets. **Forward
  capture:** deferred the broad sweep to Cluster #4 with a more careful
  scope (file-header docblocks only; substrate citations preserved).

- **Mid-mission stale task-routing messages from teammates' subscriptions
  created friction.** lab-director-2's task-tracking subscription
  re-issued task assignments for tasks already in_progress or completed.
  Each required a one-line acknowledgement and no-op response. **Forward
  capture:** team config could de-subscribe stale agent threads after
  task-state transitions; or flight-ops could batch-respond once at
  wave boundaries.

- **POSIX ERE compatibility bug in C3 audit tool surfaced in tests.**
  Initial implementation passed JS-regex `.source` (with `\d`) directly
  to `git grep -E` which uses POSIX ERE (`[0-9]`). 0 relative-ratio
  findings reported instead of 1. Caught by the apply-to-self / smoke
  test that asserted the carry-forward atlas-indexer site was caught.
  Translation layer added. **Forward capture:** future tools that
  hand off regex strings to `git grep`, `grep -E`, `awk`, or `sed`
  should translate JS shorthand classes at the boundary.

## Surprises

- **C5 first-in-minor-line pass-by-definition.** The component spec's
  prose suggested catching all non-sequential bumps. Implementation
  exposed that "first patch in a new minor line" has no prior tag to
  compare against and should pass-by-definition. The fixture-based
  tests confirmed this is the right semantic.

- **C7 Sub-1 contents probe returned 404, not just an out-of-date
  tag.** The upstream `.claude/commands/gsd` path itself doesn't exist
  at the probed location. This means even if upstream advances to
  v1.42.x, the rename absorb may need to re-discover the upstream
  layout. **Forward capture:** Cluster #4 C7 probe should webfetch the
  repository tree first to confirm the layout before assuming the
  `.claude/commands/gsd` path is still the right target.

- **All 12 in-test `new StubKeystoreApi(...)` usages survived the
  `getKeystoreApi()` flip without modification.** The non-breakage
  prediction in the W0 design doc was confirmed by the post-flip test
  run; only `invoke.test.ts:128` needed the asserted-instance update
  (which was an EXPECTED diff documented in lab-director-2's W0
  PASS-WITH-NITS verdict, not a regression).

- **The cumulative C7 Sub-1 deferral count is now 3.** The v1.49.634 +
  v1.49.635 + v1.49.636 all defer on the same upstream tag with no
  upstream advance. **Forward capture:** Cluster #4 may want to
  surface this as a tracking-only artifact (no further deferral
  records) until upstream activity resumes; alternatively, Cluster #4
  may want to make a one-time decision to absorb the rename from
  downstream regardless of upstream state (with a documented "no
  longer waiting for upstream" rationale).

- **Cargo.lock had a 1-line `gsd-os` version drift** in the working
  tree at session start (`1.49.634` → `1.49.635`), apparently from a
  prior build. Bundled into the C1 commit as a non-functional sweep.
  Worth noting: future ship-prep sanity should grep for stale
  Cargo.lock version drift and roll it forward via bump-version.mjs
  rather than leaving it to land in a feature commit.

## Process observations forwarded

- **Mid-W0 stale-team-config caught early.** team-lead's name-correction
  message (lab-director → lab-director-2 etc.) landed before C1 design
  work began; the corrected names were used for the rest of the
  milestone. Operational win: the team config probe was the first
  action in the cluster, so any drift surfaces before code work begins.

- **G3 boundary held throughout.** lab-director-2 reiterated the
  durable instruction at W1C verdict: G3 ship is operator-only via
  team-lead relay; lab-director-2's role at T13 completion is quality-bar
  evaluation only. Flight-ops did NOT auto-authorize T14; T13 ships
  W3 stage 1 (meta-test + release-notes); the ship sequence itself
  awaits operator authorization.
