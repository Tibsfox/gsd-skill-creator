# v1.49.597 — GSD Intelligence Dashboard

**Released:** 2026-05-03
**Type:** feature milestone (operational; NOT a NASA degree advance)
**Predecessor:** v1.49.596 (Apollo 13 SUCCESSFUL FAILURE + LM-AS-LIFEBOAT; NASA 1.77; §6.6 register 19→21)
**Mission package:** `.planning/staging/inbox/intelligence-dashboard/` (5 docs + 15 component specs, 22 files, 232 KB)
**Engine state:** UNCHANGED — no NASA / MUS / ELC / SPS forward-cadence content this milestone

## Summary

v1.49.597 ships the **GSD Intelligence Dashboard** — a thin coordination shell that turns the existing rough `dashboard/` directory into a Tuesday-morning planning partner. Each component does one specialized thing — tree-sitter parses code, SQLite WAL holds the KB, the existing planning-bridge handles staging, the existing console inbox/outbox handles AI-triggered control messages — and the dashboard composes them into a single calm conversational planning surface. The Amiga Principle at full strength: the developer's attention turns into the codebase's progress without thinking about which chip is doing what.

**14 components originally + 5 follow-on; 7 phases + 2 intra-milestone fold-ins.** Phase 821 (foundation: shared types + SQLite migration + JSON schemas) → Phase 822 (analyzer pipeline, Wave 1 Track A: file walker + 8 tree-sitter language analyzers + 7 finding detectors) → Phase 823 (intelligence KB, Track B: WAL store + snapshot manager + meeting state machine) → Phase 824 (server + UI, Track C: Tauri local server + planning meeting view + live work view) → Phase 825 (Wave 2 integration: mission emitter + meeting-record generator + AI investigator skill — CAPCOM gate G1) → Phase 826 (Wave 3 verification + dashboard migration: 14 safety-critical + 60 integration + 26 edge + 8 performance tests; non-breaking Intelligence tab on existing dashboard — Safety Warden BLOCK G2) → Phase 826.5 (intra-826 follow-on: IPC-to-HTTP bridge for browser-tab mode at `POST /api/intelligence/invoke`) → Phase 827 (browser-tab parity completion, folded in 2026-05-03: shared event types + 3 KBStore extensions + IntelligenceEventBus singleton + bridge wiring + integration tests) → Phase 828 (operational-debt fold-in during ship pipeline: 826.5 build-asset carryover + auto-mount ID fallback + dashboard parser drift across milestones/roadmap/requirements).

**Three transports against one KB.** The same KBStore data is now reachable via three transports: Tauri shell (`__TAURI__.core.invoke` — existing), browser tab (HTTP via `POST /api/intelligence/invoke` — Phase 826.5 + 827), vitest/Node (strict reject in non-fetch envs — test isolation). All three resolve to the same SQLite WAL DB (`~/.gsd/intelligence/registry.db` + per-project `intelligence.db`). The 18-command surface is identical across transports. Five SSE event types (`status_update`, `briefing_ready`, `findings_updated`, `meeting_record_updated`, `bundle_completed`) are wired both server-side broadcast (via `IntelligenceEventBus` singleton) and client-side listeners.

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone** — engine remains at NASA degree 1.77 / MUS 1.77 / ELC 1.77 / SPS #74 / §6.6 register at 21 exemplars, all from v1.49.596 close. This is a feature/operational milestone in the v1.49.585-style counter-cadence position.
- **No new external citations** — the eight CS25-26 Sweep + JULIA-PARAMETER anchors at v1.49.575 + v1.49.577 remain as documented. The intelligence dashboard is gsd-skill-creator's first **load-bearing user-facing surface**, but its design is anchored on the Amiga Principle (already documented at CLAUDE.md "External Citations") rather than introducing new arXiv anchors.
- **TRS M0 substrate: CLOSED** at v1.49.596. M1 Foundation does **not** advance this milestone (this is the counter-cadence intelligence-dashboard build slot; M1 W0-1 deferred to v1.49.598+).
- **Lesson #10221 (dev/main sync) ESTABLISHED** — third instance held cleanly at v1.49.596 ship; `npm run ship-sync` is now canonical post-merge step.
- **First operational milestone with intra-ship Phase fold-in** — Phase 828 was added during the ship pipeline (operator manual smoke caught two carryover gaps from 826.5 plus a pre-existing parser drift). This is registered as Lesson #10222 (real-browser smoke pass needed before tag) and #10223 (periodic doc-format-vs-parser-format audit).

## What shipped

| Surface | Phase | Files | Tests added |
|---|---|---|---|
| Foundation (W0) | 821 | 4 (types + SQLite migration + 3 JSON schemas + KB stub) | +36 |
| Analyzer pipeline (W1A) | 822 | 55 src files (analyzer core + 8 tree-sitter languages + 7 detectors) | +132 |
| Intelligence KB (W1B) | 823 | 12 (KBStore + snapshot manager + meeting store) | +111 |
| Server + UI (W1C) | 824 | 24 (Tauri server + planning UI + live-work UI) | +178 (+24 Rust) |
| Integration (W2) | 825 | 9 (mission emitter + meeting record + investigator skill) | +147 |
| Verification (W3) | 826 | 7 (integration tests + non-breaking Intelligence tab) | +132 |
| IPC-to-HTTP bridge | 826.5 | 5 (bridge dispatcher + serve-dashboard wiring + npm scripts + nav-shim + banner copy) | (existing tests refactored) |
| Browser-tab parity | 827 | 11 (shared event types + KBStore.editDecision/withdraw/preview + IntelligenceEventBus + bridge wiring + integration suite) | +36 |
| Operational debt | 828 | 3 (build asset copy + mount ID fallback + parser drift across 3 parsers) | (parser tests still 53/53 pass) |
| **Total** | **9 phases** | **130 src files** | **~+770 vitest + 24 Rust** |

## Test totals

- **Pre-milestone baseline:** 28,767 vitest (from v1.49.596 close)
- **Post-milestone:** ≥29,500 vitest pass + 681+ cargo Rust pass (full intelligence sweep alone: 559 → 595, +36 from Phase 827; cumulative across all 9 phases ~+770)
- **Vitest count delta target ≥+50:** crushed (~15× over)
- **Zero-regression rule:** held throughout; the only flake observed is a pre-existing C12 timing test that passes 8/8 in isolation and is not v1.49.597-introduced

## Architectural firsts

1. **Three transports against one KB** — Tauri shell + browser tab + vitest/Node. Same 18-command surface; same SQLite data. Serves the v1.49.597 promise "same UI bundle in Tauri shell AND browser tab" cleanly.
2. **Server-side `IntelligenceEventBus` singleton** — KBStore writes publish to the bus; the dashboard server subscribes once at startup and re-broadcasts to all SSE clients via the existing `/api/events` channel. Browser-tab listeners now fire within the 250ms target.
3. **Web tool with zero execution authority** — formalized as a hard constraint with integration-test verification. The dashboard writes only to `.planning/staging/` and `.planning/console/`; never spawns subprocesses; never makes direct AI API calls; never touches the codebase directly. Integration tests (S1, S2, S13, S14) enforce it.
4. **Mission package as MILESTONE-CONTEXT pattern** — when a complete vision-to-mission–shaped package is staged in `.planning/staging/inbox/<slug>/` before `/gsd-new-milestone` runs, it serves as the milestone-context source. PROJECT.md + STATE.md populate from the package; REQUIREMENTS.md derives from success criteria + component deliverables. First applied at v1.49.597; promotion to ESTABLISHED pending second instance.
5. **Intra-milestone Phase fold-in pattern** — when a phase surfaces additional gaps mid-execution (Phase 826.5 closing the IPC-to-HTTP bridge gap; Phase 827 closing the 3 throw-stub commands; Phase 828 closing operational-debt carryover during ship), folding the new phase into the same milestone is preferred over opening a separate vN+1 milestone with the predecessor unshipped on dev. Keeps the milestone story coherent.

## Threads closed / opened / extended

- **OPENED:** GSD Intelligence Dashboard surface — first user-facing browser-tab feature with end-to-end live-data parity. The 18-command surface and 5 SSE event types form the contract for future v1.49.598+ dashboard work.
- **OPENED:** Three-transport-against-one-KB pattern — applies more broadly to any future dual-mode (Tauri ↔ browser-tab) feature in gsd-skill-creator.
- **OPENED:** Mission-package-as-milestone-context pattern (first instance; promotion at v1.49.598+ second instance).
- **OPENED:** Intra-milestone Phase fold-in pattern (registered with three sub-instances this milestone: 826.5, 827, 828).
- **CLOSED:** Phase 826.5 carryover gaps (3 throw-stub commands + missing server-side SSE broadcast) — fully closed by Phase 827 + 828.
- **CLOSED:** Pre-existing dashboard parser drift across MILESTONES.md / ROADMAP.md / REQUIREMENTS.md — three parsers updated to handle current `.planning/` doc format alongside legacy fixtures (53/53 parser tests still pass).
- **CARRY-FORWARD:** all v1.49.596 engine-state threads (NASA degree 1.77, MUS 1.77 Domain 14, ELC 1.77, SPS #74, §6.6 register 21, three-track ESTABLISHED cadence).

## Forward lessons emitted

3 new lessons #10222–#10224 (see `chapter/04-lessons.md`):

- **#10222** — integration tests need a real-browser smoke pass, not just bus-contract / HTTP-bridge unit tests. Phase 827 C04 verified the bridge works and events flow, but the bundle that talks to the bridge was never loaded by an actual browser. Two carryover bugs (build asset copy gap + mount-ID mismatch) only surfaced during operator manual smoke at ship time.
- **#10223** — periodic doc-format-vs-parser-format audit needed. The dashboard parsers in `src/dashboard/parser.ts` had drifted multiple milestones behind the actual `.planning/` doc format, hidden because the dashboard pages render via empty-state fallback rather than failing loudly. Add a CI test that asserts the dashboard generator emits at least 1 milestone, 1 phase, and 1 requirement when run against the live `.planning/` directory.
- **#10224** — intra-milestone Phase fold-in is preferred over stranded-predecessor v-bump when integration testing surfaces new gaps. v1.49.597 fold-in 3 times (826.5, 827, 828) and shipped as one coherent unit; alternative would have been three stranded `v1.49.59N` milestones each with its predecessor unshipped on dev.

---
**Prev:** [v1.49.596](../v1.49.596/README.md) · **Next:** v1.49.598+
