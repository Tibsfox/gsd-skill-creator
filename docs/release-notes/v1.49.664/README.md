# v1.49.664 — cc-1: Staged-Deck Scaffold Infrastructure (SPS + TRS)

**Released:** 2026-05-17
**Type:** counter-cadence operational-debt milestone (NOT a NASA degree). First of a 3-milestone counter-cadence cluster (cc-1 + cc-2 + cc-3) opened in response to Lesson #10356 FOUR-CONSECUTIVE-SAME-CALENDAR-DAY-DEGREE-ADVANCE-CLUSTER threshold reached at v663.
**Predecessor:** v1.49.663 — STS-51-F Challenger Spacelab-2 (NASA 1.121; shipped 2026-05-17 03:25 UTC)
**Source vision:** `.planning/missions/v1-49-664-cc1-staged-deck-scaffold-infrastructure/MISSION-BRIEF.md`
**Engine state:** UNCHANGED (no NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone). Engine remains at NASA 1.121 / MUS 1.121 / ELC 1.121 / SPS #118 / TRS pack-43.

## Summary

<!-- SHORT-FINDINGS-PREPENDED v1 -->

**Forward-cadence NASA degree advance.** v1.49.664 advances the engine from N.NNN to N.NNN with substrate-anchors NEW LOCKED at this ship.

**Per-mission canonical-sibling rebuild.** cc-1: Staged-Deck Scaffold Infrastructure ships as the per-mission canonical deliverable set.

**Engine-state quietness for non-NASA tracks.** MUS / ELC / SPS / TRS scaffolding remains SCAFFOLD-PENDING across this ship.

**Carryover discipline sustained.** Lesson #10168 + Lesson #10401 + W3.5 chapter-gen bake-in all apply identically.

**Per-pipeline dispatch path:** Path A sub-agent first-pass clean, Path B salvage, or Path C hand-author.

**Substrate-axis state.** Each forward ship continues INTRA-AXIS or opens a NEW INSTANCE within its substrate-axis class.

v1.49.664 ships **the infrastructure half of the FA-663-6 + operator-absorbed TRS-pack-14..38 drift closure**. Per Lesson #10265 cross-track scaffold-then-fill two-milestone pattern, **cc-1 = step 1 (scaffold + marker)**; the content authoring half lands in cc-2 (v1.49.665).

**The milestone shipped 4 categories of work:**

1. **STATE.md state-write fix (Phase 1)** — `tools/update-state-md-on-ship.mjs` now derives and writes `milestone_name` when advancing past a stale tag (source: latest tag's `docs/release-notes/<tag>/README.md` first-line title). Closes Lesson #10169 gate-not-vigilance on the v661→v663 rapid-fire drift class (STATE.md milestone_name kept describing v661 STS-51-B Spacelab-3 even at v663 close because the advance path only rewrote the `milestone:` field). Handles both single-line and YAML folded `>-` shapes; falls back to placeholder `"milestone"` string when no parseable title exists. 3 new tests cover v661→v663 reproduction + YAML folded path + missing-release-notes fallback. One-time backfill of `.planning/STATE.md` milestone_name to the terse form `"STS-51-F Challenger Spacelab-2 (NASA 1.120→1.121)"`.

2. **SPS scaffolding infrastructure (Phase 2)** — new `tools/scaffold-sps-pages.mjs` + `tools/scaffold-sps-pages.manifest.json`. Manifest-driven (SPS uses named species dirs, not degree-keyed indices like MUS/ELC, so the existing `scaffold-cross-track-dirs.mjs` could not extend 1:1). Idempotent per-file: completes partials without overwriting existing index.html (the marbled-murrelet case at cc-1 entry). Each entry produces minimal valid stubs for index.html + data-sources.json + knowledge-nodes.json + artifacts/ subdir. SCAFFOLD-PENDING marker in HTML (`<!-- comment -->`) and JSON (`"scaffold_pending": true`). 14 new tests.

3. **TRS scaffolding infrastructure (Phase 3)** — new `tools/scaffold-trs-packs.mjs` + `tools/scaffold-trs-packs.manifest.json`. Manifest enumerates pack-14..pack-38 (25 previously-undiscovered absorbed-scope drift packs) + pack-40..pack-43 (4 FA-663-6 tracked) = 29 missing pack-NN dirs. Idempotent per-dir: skips any pack whose index.html already exists (preserves the existing pack-01..pack-13 and pack-39). 13 new tests.

4. **depth-audit SPS+TRS scaffold-pending inventory (Phase 4)** — `tools/depth-audit.mjs` extended with `inspectScaffoldPendingSpsTrs()` soak-mode informational scan. Surfaces SCAFFOLD-PENDING marker presence in SPS/<species>/ and TRS/pack-NN/ at every depth-audit run so the operator sees the deficit. **Soak mode = never blocking** (no FAIL contribution to the gate); real per-page depth scoring for SPS+TRS needs gold-standard threshold derivation (pack-39 + stellers-jay analysis) which is forward work. New env vars `SC_SKIP_DEPTH_AUDIT_SPS=1` + `SC_SKIP_DEPTH_AUDIT_TRS=1` suppress the respective scans. Also gates the bottom-of-file `main()` invocation behind an `invokedDirectly` check so the new exported function is importable from tests. 10 new tests.

**Phase 5 (this ship):** the scaffolders were run against the real `www/.../SPS/` and `www/.../TRS/` directories to emit the 32-page deficit. Verification via depth-audit shows 3 SPS markers (marbled-murrelet partial-completion + roosevelt-elk new + mountain-goat new) + 29 TRS markers (pack-14..38 + pack-40..43). `www/` is gitignored so the stubs themselves are working-tree only; the **committed deliverable is the scaffolders + manifests + tests**, which deterministically reproduce the stub state from a clean clone.

## Out of scope (cc-2 + cc-3 follow-on)

- **cc-2 (v1.49.665)** — parallel W2 content authoring + marker removal for all 32 scaffolded pages (substrate-tracked depth per page).
- **cc-3 (v1.49.666)** — FA-663-7 international-PS catalog-card metadata schema + FA-663-10 NASA-Group-6-1967-DEFERRED-FLYER-COHORT retroactive cohort awareness (Llewellyn + Allen + Lenoir backfill).

## Discipline lessons in load-bearing application

- **#10169** gate-not-vigilance — Phase 1 converted the silent-skip into a real state-write
- **#10170** meta-test at ship time — Phase 1 fix runs against cc-1's own STATE.md at T14
- **#10172** closure-verification + scope-expansion re-framing — TRS 14-38 was operator-absorbed mid-mission with a re-framed W0
- **#10193** sub-agent dispatch ceiling — cc-1 stayed inline (no sub-agents needed); cc-2 will dispatch
- **#10265** cross-track scaffold-then-fill — cc-1 = step 1, cc-2 = step 2
- **#10266** granular bypass token — SC_SKIP_DEPTH_AUDIT_SPS + SC_SKIP_DEPTH_AUDIT_TRS are component-resolution granular (parallel to v654 SC_SKIP_DEPTH_AUDIT_MUS_ELC)
- **#10356** counter-cadence-cluster scheduling threshold — this cluster IS the threshold response at v663+1

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone.** Engine remains at NASA 1.121 / MUS 1.121 / ELC 1.121 / SPS #118 / TRS pack-43.
- **No new external citations.**
- **No new V-flags emitted.**
- **First counter-cadence cleanup milestone since v1.49.656.** Pattern: v1.49.585 (Apr 28) → v1.49.653+654+655+656 (May 15–16) → v1.49.664 (May 17 = today). 6th counter-cadence cleanup in the 2026 lifecycle; first of a 3-milestone cluster.

## Verification

```bash
# Phase 1: STATE.md fix tests
npx vitest run --config vitest.tools.config.mjs tools/__tests__/update-state-md-on-ship.test.mjs
# → 22 passed (19 original + 3 new)

# Phase 2 + 3: scaffolder tests
npx vitest run --config vitest.tools.config.mjs tools/__tests__/scaffold-sps-pages.test.mjs tools/__tests__/scaffold-trs-packs.test.mjs
# → 27 passed

# Phase 4: depth-audit Phase-4 inventory tests
npx vitest run --config vitest.tools.config.mjs tools/__tests__/depth-audit.test.mjs
# → 54 passed (44 original + 10 new)

# Phase 5: stubs on disk
node tools/scaffold-sps-pages.mjs --dry-run    # → 0 would-create after second run (idempotent)
node tools/scaffold-trs-packs.mjs --dry-run    # → 0 would-create after second run
node tools/depth-audit.mjs 1.121                # → inventory shows 3 SPS + 29 TRS markers
```
