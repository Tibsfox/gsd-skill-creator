# v1.49.597 — Forward Lessons Emitted

3 new lessons (#10222–#10224) carry forward from this milestone.

---

## Lesson #10222 — Integration tests need a real-browser smoke pass

**Status:** NEW at v1.49.597; promotion-candidate to ESTABLISHED at second confirming instance.

**Trigger:** Phase 827's C04 integration suite (10 tests covering HTTP round-trip + bus-publish contract + dual-writer parity + reconnection robustness) verified the bridge works and events flow correctly. But the bundle that talks to the bridge was never loaded by an actual browser during integration tests. Two carryover bugs from Phase 826.5 only surfaced during operator manual smoke at ship time:

1. `intelligence:build` script copied the `*.bundle.js` files but not their `desktop/dist/assets/` dependency chunks. Bundle imports `../../assets/ipc-PWY7TJl9.js` and `../../assets/modulepreload-polyfill-B5Qt9EMX.js` returned 404; the `<script type="module" onerror>` handler tripped `__intelligencePlanningLoadError=true`; the static-mode banner showed even though the bridge was reachable.
2. Bundle's auto-mount in `desktop/intelligence/planning/planning.ts` only looked for `#planning-root` (Tauri standalone shell ID); the dashboard tab uses `#intelligence-planning` (Phase 826 / C14 migration). Bundle ran cleanly but found no mount root; CSS `:empty::after` kept the "Loading planning data..." placeholder visible.

**Forward lesson:** Future phases that touch UI-loading paths must include a real-browser smoke test in their integration suite. Specifically:

- After the build pipeline copies bundles to `dashboard/intelligence/`, run a Playwright (or jsdom-with-real-fetch) test that opens `http://localhost:3030/intelligence.html`, waits for the bundle to load and mount, and asserts at least one expected DOM element appears.
- Smoke must run against the actual `serve-dashboard.mjs` server (or a hermetic equivalent), not against jsdom + manual bundle stubbing.
- Smoke is part of the integration-test contract, not a separate "manual smoke" line in release notes.

**Carry-forward action:** Add Playwright smoke for `intelligence.html` to v1.49.598 candidate list. Phase 828 itself does not include this fix — the bug was caught by the operator manual smoke during ship pipeline; the gate to prevent recurrence is a future task.

**Cross-references:**
- v1.49.585 Lesson #10169 (gate-not-vigilance) — same family: a gate beats human vigilance, but human vigilance still finds gaps that no gate has been written for.
- v1.49.585 Lesson #10170 (meta-test strategy at ship time) — same shape: the system-under-test should be exercised against itself before tag.

---

## Lesson #10223 — Periodic doc-format-vs-parser-format audit

**Status:** NEW at v1.49.597.

**Trigger:** During v1.49.597 ship-pipeline manual smoke, the dashboard pages `/milestones`, `/roadmap`, `/requirements` were rendering empty. Root cause: `src/dashboard/parser.ts` had three parsers (`parseMilestonesMd`, `parseRoadmapMd`, `parseRequirementsMd`) that expected a doc format `.planning/` had outgrown. Specifically:

- `parseMilestonesMd` walked level 3 headings (`### vX.Y — Name`) but `MILESTONES.md` had moved to level 2 (`## vX.Y Name (Closed: ...)`).
- `parseRoadmapMd` walked level 2 headings looking for `## Phase NN: Name` but `ROADMAP.md` had `## Milestone vX.Y — Name` at level 2 with `### Phase NN: Name` nested at level 3.
- `parseRequirementsMd` looked for `## Goal` + `## Requirements` wrapper sections but `REQUIREMENTS.md` had moved to per-milestone `## Milestone vX.Y — Name` wrappers with `### Category N — Name` groups inside.

The dashboard pages had been silently rendering empty for at least a milestone or two; nobody noticed because the empty-state fallback ("No milestones shipped yet" / etc.) looks legitimate at first glance. The parser tests at `src/dashboard/parser.test.ts` had stayed passing the entire time because their fixtures still use the legacy format.

**Forward lesson:** Two complementary controls needed:

1. **Add a "dashboard generator output non-empty" sanity test.** Run the full generator against the live `.planning/` directory; assert the output HTML contains at least 1 `timeline-item` (milestone), 1 `phase-card` (roadmap), 1 `REQ-` / `DASH-` / `MATH-` row (requirements). Fails loudly when parser drift hides data behind empty-state fallback.

2. **Periodic doc-format audit when canonical doc formats change.** When `.planning/` doc formats evolve (e.g., when a new milestone introduces a new heading convention), grep for parsers that read the affected file and verify they still extract data. This is exactly the kind of cross-cutting drift that's invisible to per-parser unit tests.

**Carry-forward action:** Phase 828 fixed the parsers but did not add the loudly-failing test. Add the "dashboard generator output non-empty" test to v1.49.598 candidate list.

**Cross-references:**
- v1.49.585 Lesson #10174 — `.claude/settings.json` is gsd-config-guard-protected so new hook registrations route through `project-claude/`. Same pattern: drift between source-of-truth and runtime mirror needs deterministic enforcement, not periodic manual reconciliation.

---

## Lesson #10224 — Intra-milestone Phase fold-in beats stranded-predecessor v-bump

**Status:** NEW at v1.49.597 with three sub-instances (Phase 826.5 + 827 + 828); promotes to ESTABLISHED at next confirming milestone instance.

**Trigger:** Three times during v1.49.597's execution, integration-testing surfaced gaps that warranted additional implementation:

1. **Phase 826.5 (intra-826).** Mission spec promised "same UI bundle in Tauri shell AND browser tab" but Phase 825's planned WS-bridge silently dropped from the build. Static-mode banner masked the gap. 826.5 added the IPC-to-HTTP bridge, closing 15 of 18 commands.
2. **Phase 827 (folded in 2026-05-03).** The remaining 3 throw-stub commands + missing server-side SSE broadcast were captured as a candidate-v1.49.598 staging package. When the operator chose "stay on dev, continue building", the staged package was folded into v1.49.597 as Phase 827 with 5 components (C00-C04) across 4 internal waves.
3. **Phase 828 (folded in during ship pipeline).** Operator manual smoke caught two carryover gaps from 826.5 (build asset copy + auto-mount ID) plus a pre-existing dashboard parser drift. All three folded into Phase 828 as ship-pipeline operational-debt commits before tag.

In all three cases, the alternative would have been opening a separate `v1.49.59N` milestone with the predecessor unshipped on dev. That alternative produces:

- Stranded-predecessor problem: PROJECT.md "Current Milestone" jumps forward while v1.49.597 sits unshipped on dev. Future ship pipelines have to choose between shipping the stranded predecessor first (out-of-order tag sequence) or shipping the new milestone with predecessor still in flight (ahistorical version order).
- Fragmented release notes: each stranded milestone has its own 5-file release-notes structure, but the substantive feature work is split across them. Reader must reconstruct the through-line from 3 separate v-numbers.
- Multiplied pre-tag-gate runs: each stranded milestone needs its own pre-tag-gate pass + version bump + release-notes set + ship-sync.

**Forward lesson:** When integration testing surfaces a gap mid-execution, prefer folding the new phase into the same milestone if:

- The new work directly closes a gap promised by the milestone's stated spec (true for all three v1.49.597 fold-ins).
- The predecessor is still unshipped on dev (true at v1.49.597; trivially false once a milestone is tagged).
- The fold-in does not balloon scope beyond the milestone's coherent through-line (judgment call; v1.49.597's three fold-ins all reinforced "GSD Intelligence Dashboard" rather than introducing new themes).

If any of those three conditions fail, open a separate vN+1 milestone instead.

**Pattern shape:** Phase numbering can use decimal sub-phases (e.g., 826.5) when the fold-in is mid-execution and ordering matters. Or sequential whole-numbered phases (827, 828) when the fold-in is a proper continuation. v1.49.597 used both shapes: 826.5 was an intra-826 carryover; 827 and 828 were sequential continuations. ROADMAP.md and the progress table accommodated both cleanly.

**Carry-forward action:** The intra-milestone Phase fold-in pattern is now documented in v1.49.597 as a 3-instance milestone. Future milestones should consult this lesson when integration testing surfaces gaps; promotion to ESTABLISHED requires a second confirming milestone instance.

**Cross-references:**
- v1.49.576 Decision: "Mission package replaces discuss/plan-phase cycle for fully-shaped mission archetypes" — same family: when the work is fully spec'd by a staging package, the GSD workflow can compress.
- v1.49.585 Lesson #10172 — "scope expansion mid-mission produces better outcome than scope-as-specified" — same family: rigid scope adherence at the cost of ship coherence is the wrong tradeoff.
