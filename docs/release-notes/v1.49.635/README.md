# v1.49.635 — Housekeeping Cluster / Operational Debt Reduction

**Released:** 2026-05-11
**Type:** counter-cadence operational-debt milestone (NOT a NASA degree)
**Predecessor:** v1.49.634 (Concerns Cleanup #2)
**Mission package:** `.planning/missions/v1-49-635-housekeeping-cluster/`
**Source vision:** `.planning/codebase/CONCERNS.md` (2026-05-10 audit) + v1.49.634 deferred batch
**Engine state:** UNCHANGED (no NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone)

## Summary

v1.49.635 is the **third counter-cadence cleanup milestone** in the engine, registered to Lesson #10168
(every ~30 forward-cadence milestones, run a concerns-cleanup ship). The milestone closes a housekeeping
cluster of eight components: **C1** keystore encryption (Rust `age` X25519 + ChaCha20-Poly1305 with
Argon2id passphrase identity OR direct OS-keyring storage, hybrid Node-wrapper + standalone-Rust-bin CLI,
backup-first migration, leak sanitizer, stub desktop UI per operator-pinned Option 2); **C2** Tauri CLI
gap analysis (halted at Stage 1 per spec decision tree; pre-mission spec authored for v1.49.636);
**C3** performance assertion warmup audit (31 sites grep-audited; top-8 `no-warmup` sites fixed with
per-site-tuned warmup samples ranging N=1 to N=20); **C4** fragile test discipline sweep (top-5
`stabilize-inline` Template-2 timeout bumps for sqlite-class beforeEach hooks; 6-symptom discipline
doc); **C5** cleanup rubric recalibration (plain-bullet and Lesson-suffix formats recognized; freeform
retro headings accepted); **C6** STATE.md schema normalization (normalizer tool authored and run);
**C7** upstream rename absorb (deferred per spec decision tree — upstream still at v1.41.2);
**C8** integration meta-test plus release notes.

The C5 recalibration closes the drift-check informational alert from v1.49.634 ship. The alert reported
a recent-20 average of 85.2 against a historical baseline of 97.4 (-12.2 delta). Stage 1 diagnosis
confirmed a rubric gap: v1.49.634 scored D/64 because plain-prose bullet lessons and Lesson-suffix chapter
headings were not recognized. Three targeted fixes were applied. The conservative tuning rule was respected:
since the diagnosis confirmed a rubric gap (not real quality regression), recalibration was warranted.

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone** — engine state UNCHANGED.
- **No new external citations** — citation-debt ledger unchanged at 9 entries from v1.49.634 close.
- **No new V-flags emitted** — ledger unchanged.
- **Third counter-cadence cleanup milestone** — second execution of Lesson #10168 cadence pattern.
- **First keystore encryption layer** — C1 ships age (X25519 + ChaCha20-Poly1305) with Argon2id passphrase identity OR direct OS-keyring storage (Path 1 vs Path 2 model). The plaintext path was renamed at v1.49.635 from `insecure-plaintext-keystore` to `legacy-plaintext-keystore` (operator-pinned 2026-05-11) and remains gated behind that Cargo feature. C1 adds the encrypted alternative; the desktop UI surface is stubbed (Tauri commands deferred to a follow-on milestone).

## Threads closed / opened / extended

- **OPENED:** encrypted keystore layer (C1: Rust age + Argon2id + OS-keyring + hybrid Node-wrapper + standalone-Rust-bin CLI + docs; desktop UI stubbed).
- **OPENED:** test-discipline doc surface at `.planning/test-discipline/` (C3 perf-assertion-warmup + audit; C4 fragile-test-pattern + audit).
- **OPENED:** STATE.md normalizer tooling (C6: `tools/state-md-normalizer.mjs` with `--check` / `--write` / `--prune-stale` flags; `npm run state-md:check` + `state-md:normalize` scripts).
- **EXTENDED:** cleanup rubric (C5: plain-bullet acceptance + freeform retro headings + Lesson-suffix detection; conservative tuning rule respected).
- **EXTENDED:** schema documentation (C6: `docs/STATE-MD-SCHEMA.md` lands as a shipped reference for the STATE.md target shape).
- **CLOSED:** v1.49.634 deferred C3 perf-warmup pattern (8 sites fixed; 9 documented-for-followon).
- **CLOSED:** v1.49.634 deferred C4 fragile-test class (5 sqlite-class timeout bumps; 6 documented-for-followon).
- **DEFERRED-AGAIN:** C7 upstream `gsd-review` → `gsd-quality` rename absorb (upstream still v1.41.2; re-check at next cleanup cluster).
- **CARRY-FORWARD:** all v1.49.634 thread states UNCHANGED — NASA STS-cadence, MUS LANDING-ANCHOR-ONLY-INSIDE candidate, ELC FIRST-AFRICAN-AMERICAN-BIG-CITY-MAYOR locked, SPS Picidae order-pivot, TRS pack-30 information-theory binding.

## Forward lessons emitted

New lessons authored in chapter/04-lessons.md:
- Plain-bullet lesson format now recognized by scoreCleanupLessons (v1.49.635 C5 rubric fix)
- Lesson-suffix headings (## Lesson #NNNNN-followup) recognized by extended hashIds regex
- Freeform retrospective headings accepted by scoreCleanupRetrospective
- scoreForwardLessonsBlock plain-bullet fallback avoids floor-of-2 score collapse

## Thread state

CHAIN-CONVENTIONS unchanged. Engine forward-state UNCHANGED. Discipline-doc surface OPENED at `.planning/test-discipline/` (C3 + C4); STATE.md normalizer toolchain LANDED (C6); cleanup rubric RECALIBRATED (C5).

---
**Prev:** [v1.49.634](../v1.49.634/README.md) · **Next:** v1.49.636+
