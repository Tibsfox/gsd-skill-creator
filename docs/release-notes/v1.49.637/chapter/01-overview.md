# 01 — Overview: v1.49.637 Housekeeping Cluster #4

## Why this milestone

v1.49.636 closed the v1.49.585 → v1.49.634 → v1.49.635 → v1.49.636
housekeeping chain by absorbing the v1.49.635 handoff into a single
forward-merged cluster. It shipped 8 components, emitted Meta-Lesson
#10180 (gitignored-runtime-artifact skip-guard), and forward-noted
six named carry-forwards plus three post-ship findings.

v1.49.637 picks up exactly where v1.49.636 set the cursor: close the
named carry-forwards, the post-ship findings, and the audit-tool
catalog extensions. The result is a clean inventory hand-off into
**Cluster #5** (sole remaining item: atlas LRU-promote architectural
fix, 2-4h).

The milestone is a deliberate **counter-cadence** beat — no NASA
mission, no MUS pack, no ELC degree, no SPS pack-30 entry. Engine
state at tip equals engine state at predecessor v1.49.636. The
discipline of these counter-cadence clusters has now produced four
consecutive housekeeping milestones with zero degree-advance drift
— a pattern the engine state log explicitly tracks via
`counter_cadence: true` + `no_engine_state_advance: true`
frontmatter flags.

## What changed at the architectural level

Two architectural surfaces evolved during this milestone, both at the
**enforcement boundary** between operator discipline and pipeline
gate.

### Surface 1: Keystore substrate finalization

The v1.49.636 hybrid Node-wrapper + Rust-bin keystore architecture
shipped with two backward-compat affordances: the
`legacy-plaintext-keystore` cargo feature (gated v1 plaintext path)
and a placeholder for R14 passphrase quality (any non-empty
passphrase accepted at the boundary). Both were operator-discipline
seams — "don't enable the legacy feature in production" + "operators
should pick strong passphrases".

v1.49.637 converts both seams to **substrate properties**. C1 removes
the legacy feature entirely (negative-build assertion: `cargo build
--features legacy-plaintext-keystore` now FAILS at the compiler
layer). C3 integrates `@zxcvbn-ts/core` so weak passphrases are
rejected at the keystore boundary itself (not at an upstream
discipline check). C2 adds the M3-deferred user-visible surface for
the upcoming Path-2 → Path-1 migration so operators have a concrete
remediation message instead of a documentation cross-reference.

### Surface 2: Ship-pipeline gate extension

The v1.49.636 pre-tag-gate composite had 9 steps (with step 1.5
version-sequence sanity + step 9.5 apply-to-self enforcement added
mid-cluster). It enforced version-sequence, completeness, CI-on-dev,
www-bundles, depth-audit, CLAUDE.md drift, catalog-index drift,
Tauri-boundary, and apply-to-self — but did NOT enforce
**sustained-update of public-facing artifacts** that the discipline
doc set requires.

v1.49.637 adds **step 10 of 10**: per-ship STORY.md sustained-update
gate. Ground truth lives at `.planning/roadmap/STORY.md` (gitignored);
public copy lives at `docs/release-notes/STORY.md` (in-tree). The
gate compares the public copy against the ground truth at ship time
and refuses to tag if the public copy hasn't been updated. Re-runs
are idempotent (byte-equivalence assertion).

C6 extends this surface from STATE.md: the existing normalizer
checked frontmatter sequence but didn't catch prose-body milestone
drift. C6 adds the prose validator, warn-only by default (per
W1C verdict: the live `### Decisions` historical cross-references
are legitimate audit-trail signals, not drift). Opt-in hard-fail
via `SC_REQUIRE_PROSE_SYNC=1`.

C7 Sub-1 extends the perf-assertion audit's relative-ratio regex to
catch the two new shape classes that surfaced at v1.49.636 ship-time
stabilization (post-multiplier additive `* N + K` and pre-multiplier
`N * ident + K`). C7 Sub-1b extends `scripts/apply-to-self.mjs`
KNOWN_PATTERNS catalog with the three new detectors so the
discipline doc is mechanically enforced against the milestone diff.

## Which substrates touched

| Substrate | Touch shape |
|---|---|
| `src-tauri/Cargo.toml` | Remove `legacy-plaintext-keystore` cargo feature |
| `src-tauri/src/keystore/legacy_*` | Delete (gated modules + tests) |
| `src-tauri/bin/skill-creator-keystore.rs` | Polish M3-deferred stub messaging |
| `src/cli/commands/keystore.ts` | Document `--to-keyring` flag with M3 note |
| `.planning/path-2-to-path-1-migration.md` | NEW (M3 design doc) |
| `src/keystore/passphrase-quality.ts` | NEW (zxcvbn-ts integration) |
| `desktop/__tests__/passphrase-flow.test.ts` | 8 sites: `hunter2` → `correct horse battery staple stadium` |
| `package.json` | Add `@zxcvbn-ts/core` + `@zxcvbn-ts/language-en` deps |
| `src-tauri/src/intelligence/atlas.rs` | Fix per-project-clear test contract; keep #[ignore] on lru-promote |
| `.planning/atlas-test-disposition.md` | Update with v1.49.637 dispositions |
| `tools/perf-assertion-audit.mjs` | Extend relative-ratio regex |
| `scripts/apply-to-self.mjs` | Extend KNOWN_PATTERNS |
| `scripts/append-story-entry.mjs` | NEW (per-ship STORY-gate script) |
| `tools/pre-tag-gate.sh` | Add step 10/10 STORY-gate wiring |
| `tools/state-md-normalizer-prose.mjs` | NEW (prose drift validator) |
| `tools/state-md-normalizer.mjs` | Wire prose validator into `--check` flow |
| `.planning/state-md-normalizer-conventions.md` | NEW (convention doc) |
| `tests/integration/v1-49-637-meta-test.test.ts` | NEW (integration meta-test) |
| `.planning/UPSTREAM-ALIGNMENT.md` | Tracking-only retirement note for C7 Sub-2 |
| `docs/release-notes/v1.49.637/chapter/*.md` | NEW (this set of 6 files) |

## Risk profile

LOW-MED. The substrate changes (C1 + C3) are bounded by clear
boundary assertions (cargo negative-build for C1; zxcvbn singleton +
default-score-3 for C3). The pipeline-gate extensions (C5 + C6 +
C7 Sub-1) are additive — they don't change existing gate semantics,
they add new failure modes the operator can opt-in to or out of via
env-var. The atlas C4 dual disposition is the highest-risk surface
in terms of "did we read the impl correctly" — but the fixed-inline
test now PASSES against the live impl, and the Cluster-5 deferred
test continues to carry `#[ignore]` with explicit diagnostic.

The W3 meta-test (C8) is the milestone's self-check: each new gate
must fire on synthetic inputs, and apply-to-self against this very
milestone's diff must return 0 findings.

## Hand-off shape

At W3 close (pre-T14):
- 7 atomic commits + 1 W3 meta-test commit = 8 total on `dev`
- Vitest baseline + 69 = current count post-W1 + post-W3-meta
- Tools-config suite: 30 files / 416 tests PASS
- Pre-tag-gate.sh dry-run: clean
- STATE.md frontmatter: ready for T14 advance
- Ground-truth STORY.md: pending v1.49.637 entry (T14 operator hand-off step)
- Cluster #5 inventory: 1 item

The T14 operator authorization triggers the atomic ship sequence
(bump-version → commit → tag → push → main fast-forward → GH release
→ RH refresh → STATE.md normalize → handoff). Per Lesson #10191,
the ship sequence executes against the directive state at G3
authorization time; any mid-T14 revision goes forward to Cluster #5.
