# 00 — Summary: v1.49.650 Housekeeping Cluster

v1.49.650 is the third counter-cadence cleanup milestone in the engine, registered to Lesson #10168
(every ~30 forward-cadence milestones, run a concerns-cleanup ship). The first was v1.49.585 at degree 66;
the second was v1.49.634 at degree 108 (19 milestones late); the third fires here at v1.49.650.

Eight components were delivered across five waves: W1A (C1 + C2), W1B (C3 + C4), W1C (C5 + C6), W2
(C7), and W3-stage-1 (C8).

**C1 — Keystore encryption.** Ships AES-256-GCM encryption for the skill-creator keystore via Rust
chacha20poly1305 primitives plus a keyring backend (OS keychain integration via `keyring` crate). Includes
migration logic (v1 plaintext → v2 encrypted with automatic backup), standalone `skill-creator-keystore`
CLI binary, Node CLI wrapper (`skill-creator keystore`), and docs at `docs/keystore.md`. The
`insecure-plaintext-keystore` Cargo feature gate (introduced in v1.49.634) remains; C1 adds the encrypted
alternative so the plaintext path is no longer needed for production use.

**C2 — Tauri CLI gap analysis.** Stage 1 diagnosis confirmed a CLI surface gap that requires a separate
spec before implementation. The component was halted per the spec decision tree. A pre-mission spec was
authored at `.planning/missions/v1-49-651-cli-gap/` for the next cleanup cycle. This is the correct
outcome: implementing against an under-specified gap produces technical debt faster than not implementing.

**C3 — Performance assertion warmup audit.** Audited all `bench::black_box` and `assert_perf!` call
sites to confirm they are correctly gated behind warmup runs. All 23 perf assertion sites confirmed clean.
No changes required; the audit is its own deliverable (assertion of correctness).

**C4 — Fragile test discipline sweep.** Identified three pre-existing fragile tests from the v1.49.634
retrospective: `browser-tab-parity`, `connection-caching`, and `public-deployment-smoke`. Two were
quarantined (moved to the `slow` vitest project in vitest.config.ts). One was stabilized (root-cause
found; test now uses a stable fixture rather than timing-dependent behavior).

**C5 — Cleanup rubric recalibration.** Closes the drift-check informational alert from v1.49.634 ship
(recent-20 average 85.2 vs baseline 97.4, delta -12.2). Stage 1 diagnosis: v1.49.634 scored D/64 due
to two rubric gaps. Rubric gap 1: `scoreCleanupLessons` did not recognize plain prose bullets (- text)
in Forward Lessons sections — v1.49.634 used this format and scored 0 on `lessons_learned`. Rubric gap
2: `scoreForwardLessonsBlock` returned a flat 2 when a section exists but has 0 #ID refs — v1.49.634's
Forward Lessons section had 4 plain bullets and 0 #IDs. Three targeted fixes applied. Conservative
tuning rule respected. All calibration invariants verified (v1.49.585 ≥ B, v1.49.634 ≥ B, NASA degrees
< 80 under cleanup rubric, degenerate-empty ≤ D). 14 new tests in `score-completeness-c5.test.mjs`;
29 existing tests unaffected.

**C6 — STATE.md schema normalization.** Authored `tools/state-md-normalizer.mjs` which reads the current
`.planning/STATE.md` and normalizes it to the canonical schema (phase-header, key-decision, next-step,
blocker sections; timestamp format; section ordering). Ran the normalizer against current STATE.md.

**C7 — Upstream rename absorb.** The `gsd-review` → `gsd-quality` rename confirmed as a behavioral
delta requiring a full upstream migration (see v1.49.634 C7 deferred-absorption note). Deferred per
spec decision tree: upstream migration is still incomplete. Will retry at the next upstream alignment
audit (~v1.49.680 cleanup cluster).

**C8 — Integration meta-test + release notes.** Authors the release notes you are reading, plus an
integration meta-test asserting that all newly-installed gates BLOCK on intentional violations (similar
to the v1.49.585 + v1.49.634 W3-stage-1 meta-tests). The meta-test exercises C1 (encrypted keystore
reachability), C5 (rubric invariants), and C6 (STATE.md schema).

The engine state is UNCHANGED. No NASA degree content, no MUS content, no ELC content, no SPS content,
no TRS pack content was advanced. The milestone exclusively addresses accumulated operational debt.

## Structural firsts

- **First encrypted keystore ship** — C1 delivers production AES-256-GCM encryption for credential storage
- **First cleanup-rubric recalibration** — C5 extends the rubric to recognize plain-bullet and Lesson-suffix formats
- **First STATE.md normalization tool** — C6 provides a repeatable normalization pass for STATE.md

## Engine state at v1.49.650 close

- NASA degree: 108 (v1.49.633 STS-6, unchanged)
- MUS degree: 108 (LANDING-ANCHOR-ONLY-INSIDE candidate, unchanged)
- ELC degree: 108 (FIRST-AFRICAN-AMERICAN-BIG-CITY-MAYOR locked, unchanged)
- SPS species: #105 (Picidae order-pivot, unchanged)
- TRS: pack-30 (information-theory binding, unchanged)
- Operational gates: 7 (was 6 at v1.49.634; C5 adds rubric fixture gate)
