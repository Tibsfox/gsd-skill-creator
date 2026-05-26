# v1.49.634 — Concerns Cleanup #2

**Released:** 2026-05-11
**Type:** counter-cadence operational-debt milestone (NOT a NASA degree)
**Predecessor:** v1.49.633 (STS-6 Challenger first flight + first Shuttle EVA + TDRS-1 deployment — NASA 1.108)
**Mission package:** `.planning/missions/v1-49-634-concerns-cleanup-2/`
**Source vision:** `.planning/codebase/CONCERNS.md` (2026-05-10 codebase audit) §11/§14/§15/§18 + v1.49.585 §4 deferred batch
**Engine state:** UNCHANGED (no NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone)

## Summary

<!-- SHORT-FINDINGS-PREPENDED v1 -->

**Forward-cadence NASA degree advance.** v1.49.634 advances the engine from N.NNN to N.NNN with substrate-anchors NEW LOCKED at this ship.

**Per-mission canonical-sibling rebuild.** Concerns Cleanup #2 ships as the per-mission canonical deliverable set.

**Engine-state quietness for non-NASA tracks.** MUS / ELC / SPS / TRS scaffolding remains SCAFFOLD-PENDING across this ship.

**Carryover discipline sustained.** Lesson #10168 + Lesson #10401 + W3.5 chapter-gen bake-in all apply identically.

**Per-pipeline dispatch path:** Path A sub-agent first-pass clean, Path B salvage, or Path C hand-author.

**Substrate-axis state.** Each forward ship continues INTRA-AXIS or opens a NEW INSTANCE within its substrate-axis class.

v1.49.634 is the **second counter-cadence cleanup milestone** in the engine, registered to Lesson #10168 (every ~30 forward-cadence milestones, run a concerns-cleanup ship). The first such milestone was v1.49.585 at the 30-degree mark; the trigger fired at v1.49.615 but the milestone shipped at v1.49.634 — 19 milestones late. The lateness is itself a forward lesson and motivates a deterministic cadence-overdue check for the next cycle.

This milestone closes 5 categories of operational debt: **C1** math coprocessor MCP server liveness watchdog (CONCERNS §14; observe-only default with opt-in `auto-restart` policy); **C2** Tauri v2 boundary audit promoted from CLAUDE.md prose-rule to deterministic pre-tag-gate step 9 (CONCERNS §15; override `SC_SKIP_TAURI_BOUNDARY_GATE=1`); **C3** keystore plaintext fallback gated out of release builds via the new `insecure-plaintext-keystore` Cargo feature (CONCERNS §18; first formal reachability audit + follow-on encryption-rotation stub pinned at v1.49.650); **C4** v1.49.585 §4 deferred-batch closure (4 small items including self-mod-guard proximity-aware Bash detection regression test + score-completeness `--cleanup` rubric variant + MEMORY.md PG-credentials path correction + `.gitignore` entries for `.logs/` and `test-results/`); **C5** stale-state sweep of REQUIREMENTS.md DASH-* entries + `tests/integration/` index documentation (CONCERNS §11); **C6** cartridge-forge migration audit landed audit-only (48 LEGACY chipsets / 0 cartridge.yaml siblings → finalization deferred to follow-on mission per spec decision tree); **C7** upstream-alignment spot-check against `gsd-build/get-shit-done@v1.41.2` (61/66 commands IDENTICAL after install-time path-strip; 1 BEHAVIORAL delta — `gsd-review` → `gsd-quality` slash-command rename — deferred for full upstream propagation).

12 components organized across W0 + W1A/W1B/W1C + W2 + W3-stage-1. **+18 tests across the milestone** (6 watchdog + 4 tauri-boundary + 2 keystore + 4 v585-batch + 2 stale-state). Plus +6 integration meta-tests authored in W3 stage 1 asserting the new gates BLOCK on intentional violations. The milestone gates itself at ship time — pre-tag-gate runs the new step 9 (tauri-boundary) against v1.49.634's own tree before the tag lands.

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone** — engine remains at NASA 1.108 / MUS 1.108 / ELC 1.108 / SPS #105 / TRS pack-30 (v1.49.633 close). Successor NASA-cadence candidate v1.49.635 = STS-7 (first American woman in space Sally Ride; engine resumes immediately on next milestone).
- **No new external citations** — the four CS25-26 Sweep + four JULIA-PARAMETER anchors at v1.49.575 + v1.49.577 remain canonical.
- **No new V-flags emitted** — citation-debt ledger unchanged at 9 entries.
- **Second counter-cadence cleanup milestone** — first execution of Lesson #10168 cadence trigger (fired late; forward lesson registered to gate the cadence itself).
- **First production cfg gate landed via release-profile feature flag** — `insecure-plaintext-keystore` defaults OFF in release builds; the plaintext-credential-file fallback path is now unreachable in shipped binaries.
- **First upstream-alignment spot-check after the v1.41.2 release-notes window** — confirmed the `record-metric` / `add-decision` / `add-blocker` fixes are SDK-binary changes (PR #3291), not slash-command markdown drift; no absorption required at the markdown layer.

## Threads closed / opened / extended

- **OPENED:** deterministic Tauri-boundary gate at pre-tag-gate step 9 (exit code 9; `SC_SKIP_TAURI_BOUNDARY_GATE=1` override).
- **OPENED:** math coprocessor watchdog observability surface (`src/coprocessor/watchdog.ts`; `getCoprocessorStatus()` + `setSupervisorPolicy()` module helpers; default observe-only policy).
- **OPENED:** `insecure-plaintext-keystore` Cargo feature gate (release builds reject plaintext-keystore branch; debug-only fallback for local development).
- **EXTENDED:** v1.49.585 operational-gate layer (was 5 gates; now 6 with tauri-boundary).
- **EXTENDED:** CLAUDE.md "Environment Variables" + "Operational Gates" tables with the new gate + override env var.
- **CARRY-FORWARD:** all v1.49.633 thread states UNCHANGED — NASA STS-cadence, MUS LANDING-ANCHOR-ONLY-INSIDE candidate, ELC FIRST-AFRICAN-AMERICAN-BIG-CITY-MAYOR locked, SPS Picidae order-pivot, TRS pack-30 information-theory binding.

## Forward lessons emitted

New lessons authored in `chapter/04-lessons.md`:
- Counter-cadence cleanup trigger fired late; consider gating the cadence itself
- Reachability audits as a first-class artifact (C3 keystore audit template reusable for future security-critical TODO resolutions)
- Two-phase gate landings (C1 watchdog landed observer-first, gate-second; template for future runtime-touching gates)
- Three pre-existing test fragilities flagged for follow-on housekeeping (browser-tab-parity, connection-caching, public-deployment-smoke)

## Thread state

CHAIN-CONVENTIONS unchanged. Engine forward-state UNCHANGED. Operational-gate layer EXTENDED (5 → 6 gates).

---
**Prev:** [v1.49.633](../v1.49.633/README.md) · **Next:** v1.49.635+
