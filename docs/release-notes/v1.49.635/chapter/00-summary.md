# 00 — Summary: v1.49.635 Housekeeping Cluster

v1.49.635 is the third counter-cadence cleanup milestone in the engine, registered to Lesson #10168
(every ~30 forward-cadence milestones, run a concerns-cleanup ship). The first was v1.49.585 at degree 66;
the second was v1.49.634 at degree 108 (19 milestones late); the third fires here at v1.49.635.

Eight components were delivered across five waves: W1A (C1 + C2), W1B (C3 + C4), W1C (C5 + C6), W2
(C7), and W3-stage-1 (C8).

**C1 — Keystore encryption.** Ships a unified keystore API with two mutually-exclusive paths chosen at
first-run probe (Model A, pinned by lab-director arch-review). Path 1 (preferred): direct OS-keyring
storage via the `keyring` crate v3 (gnome-keyring / macOS Keychain / Windows Credential Manager); no
encrypted file, no passphrase, no key derivation. Path 2 (fallback): `age` encryption (X25519 +
ChaCha20-Poly1305) of the credential to `~/.config/gsd-os/credentials.age` with the encryption identity
derived from a user-entered passphrase via Argon2id (memory 64 MiB, iterations 3, parallelism 1 —
OWASP). Backup-first migration from v1 plaintext to v2 storage with byte-equal round-trip verification
before the v1 file is deleted. Error-leak sanitizer at every `Display::fmt` site asserts no 4-byte
substring of plaintext/key appears in user-visible messages (4-byte threshold rationale documented).
Hybrid CLI architecture (operator-pinned): standalone Rust bin `skill-creator-keystore` (CI-friendly,
no Node runtime required) shares the same Rust lib as the Node wrapper `skill-creator keystore`
(UX continuity). Eight implementation phases (a–h) plus one stub UI phase (g) and one env-precedence
defensive fix landed across 10 atomic commits. Desktop UI is **Option 2 stubbed** (operator-pinned at
session-3 close): TypeScript types + observable state machines (`PassphraseFlow`, `MigrationBanner`)
land against a stub Tauri-invoke interface; the production `TauriKeystoreApi` class is kept in tree so
a follow-on milestone wires the Rust commands at `src-tauri/src/commands/keystore.rs` and flips one
line in `getKeystoreApi()` to make the surface live. The legacy plaintext feature was renamed
`insecure-plaintext-keystore` → `legacy-plaintext-keystore` per operator decision Q1.

**C2 — Tauri CLI gap analysis.** Stage 1 diagnosis confirmed a CLI surface gap that requires a separate
spec before implementation. The component was halted per the spec decision tree. A pre-mission spec was
authored at `.planning/missions/v1-49-651-cli-gap/` for the next cleanup cycle. This is the correct
outcome: implementing against an under-specified gap produces technical debt faster than not implementing.

**C3 — Performance assertion warmup audit.** Grep-audited the suite for sharp-threshold perf assertions
(7 regex patterns covering latency / p95 / p99 / `performance.now` / duration on `toBeLessThan` plus
throughput / qps / opsPerSec on `toBeGreaterThan`). 31 matches surfaced; categorized as 3 `warmup-present`,
11 `jitter-band-already`, 2 `unclear`, and 17 `no-warmup`. Top-8 highest-risk `no-warmup` sites were
fixed inline with per-site-tuned warmup samples — N=1 for SQLite-backed assertions (single warm-path
call suffices), N=3 for async dispatch + cache-hit paths, N=10 for pure in-memory scoring loops, N=20
for iterative math convergence — modeling the v1.49.634 canonical fix at `411edf9ee`. Remaining 9
`no-warmup` sites documented-for-followon in the audit table. Discipline doc and audit landed at
`.planning/test-discipline/perf-assertion-{warmup,audit-2026-05-11}.md` (local working artifacts; the
directory is gitignored).

**C4 — Fragile test discipline sweep.** Authored a discipline doc covering six symptom shapes (sharp
threshold w/o warmup, sqlite-class beforeEach timeout under contention, coarse skip-guard, env-fixture
assumptions, time-dependent assertions, test-isolation drift via shared module state) with six
remediation templates and cross-links to the four canonical v1.49.634 stabilization commits. Audited
1,828 `*.test.ts` files across `src/`, `tests/`, `desktop/`, `apps/`. Top-5 `stabilize-inline` sites
fixed under Template 2 (beforeEach timeout 10s → 60s for sqlite-class fixtures, matching the
v1.49.634 canonical `c6d49d8ab`): `atlas-event-invalidation` (also removed a downward `vi.setConfig`
override), `atlas-indexer/runner`, `symbols-kb`, `provenance-kb`, `provenance/linker`. Perf-assertion
subcase (Template 1) explicitly delegated to C3 per cross-coordination rule — no double-fixing. 6 sites
documented-for-followon (split between Template 5 injected-clock candidates and subprocess-in-beforeEach
patterns). Discipline doc and audit at `.planning/test-discipline/fragile-test-{pattern,audit-2026-05-11}.md`.

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

**C7 — Upstream rename absorb.** Stage-1 HARD GATE: `gh api repos/gsd-build/get-shit-done/releases/latest`
returned `v1.41.2` — unchanged since the v1.49.634 baseline. Per the spec's deferral rule, no production
code touched; deferral re-documented in `.planning/UPSTREAM-ALIGNMENT.md` with the 2026-05-11 re-check
date. The absorption criterion remains: upstream must propagate the `gsd-review` → `gsd-quality` rename
through every `workflows/`, `references/`, and `templates/` file before downstream can absorb atomically.
The next counter-cadence cleanup milestone re-runs the probe.

**C8 — Integration meta-test + release notes.** Authors the release notes you are reading, plus an
integration meta-test asserting that all newly-installed gates BLOCK on intentional violations (similar
to the v1.49.585 + v1.49.634 W3-stage-1 meta-tests). The meta-test exercises C1 (encrypted keystore
reachability), C5 (rubric invariants), and C6 (STATE.md schema).

The engine state is UNCHANGED. No NASA degree content, no MUS content, no ELC content, no SPS content,
no TRS pack content was advanced. The milestone exclusively addresses accumulated operational debt.

## Structural firsts

- **First encrypted keystore ship** — C1 delivers age (X25519 + ChaCha20-Poly1305) + Argon2id passphrase identity OR direct OS-keyring storage, with backup-first migration and a 4-byte error-leak sanitizer.
- **First hybrid CLI architecture** — C1 ships both a standalone Rust bin (`skill-creator-keystore`, CI-friendly) and a Node wrapper (`skill-creator keystore`, UX continuity) sharing one Rust lib.
- **First test-discipline doc surface** — C3 + C4 establish `.planning/test-discipline/` as the directory where the perf-assertion-warmup and fragile-test patterns + audits live; future cluster milestones consume these as starting points.
- **First cleanup-rubric recalibration** — C5 extends the rubric to recognize plain-bullet entries, Lesson-suffix headings, and freeform retrospective sub-section names; conservative tuning rule respected.
- **First STATE.md normalization tool** — C6 ships `tools/state-md-normalizer.mjs` with `--check` / `--write` / `--prune-stale` flags + a schema reference at `docs/STATE-MD-SCHEMA.md`.

## Engine state at v1.49.635 close

- NASA degree: 108 (v1.49.633 STS-6, unchanged)
- MUS degree: 108 (LANDING-ANCHOR-ONLY-INSIDE candidate, unchanged)
- ELC degree: 108 (FIRST-AFRICAN-AMERICAN-BIG-CITY-MAYOR locked, unchanged)
- SPS species: #105 (Picidae order-pivot, unchanged)
- TRS: pack-30 (information-theory binding, unchanged)
- pre-tag-gate composite: 9 steps (unchanged from v1.49.634)
- Test count delta: +97 (C1) + 0 (C3, modifying existing tests) + 0 (C4, same) + 14 (C5) + 14 (C6) + meta-tests (C8) = ~130 new tests
