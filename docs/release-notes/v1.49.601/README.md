# v1.49.601 — Catalog-Index Auto-Derive Counter-Cadence

**Type:** Counter-cadence operational-debt milestone (matches v1.49.585 pattern). **No engine state advance.** Converts catalog-index drift surfaced post-v600 ship from prose discipline into deterministic gate.
**Shipped:** 2026-05-04 (pending operator G3 authorization).
**Tagged:** v1.49.601 (pending).
**GitHub release:** pending.
**Predecessor:** v1.49.600 Mariner 9 First Planet Orbit (shipped 2026-05-04).
**Dedication:** the operator — who caught the catalog drift on the live site and authorized both (B) the deterministic gate AND (C) the retroactive backfill in one decision; this milestone exists because of human-in-the-loop pattern recognition that prose discipline could not provide.
**Engine Position:** unchanged (NASA 1.80 / MUS 1.80 / ELC 1.80 / SPS #77 / §6.6 register 23 LOCKED).

## What this milestone is

A counter-cadence operational-debt ship — **no engine state advance** (NASA/MUS/ELC/SPS/§6.6 register all carry forward unchanged from v600 close). The milestone exists to convert one specific class of silent-drift failure into a deterministic gate.

The drift class: catalog index files at `www/tibsfox/com/Research/{NASA,MUS,ELC}/index.html` are hand-maintained prose listing the per-degree dirs that exist on disk. Per-degree dirs are auto-built per W2; the catalog index is **not** auto-derived. Three milestones (v1.49.598 Apollo 14 / v1.49.599 Mariner 8 / v1.49.600 Mariner 9) shipped without their per-degree entries being added to the catalog. Drift was caught only by the operator browsing the live site after v600 ship.

This milestone fixes the class deterministically.

## What ships

**1. New tool: `tools/update-catalog-indexes.mjs`** (461 lines + 367 lines tests).

CLI: `--check` (default; exit 0 on PASS, exit 8 on drift) · `--write` (NASA Set auto-fix; MUS/ELC refuse-with-error to prevent invented narrative content) · `--json` (machine-readable). Mirrors `tools/depth-audit.mjs` + `tools/render-claude-md.mjs` deterministic-gate conventions.

For each track:
- **NASA** — extracts the `completedMissions` JS Set from the catalog index; compares against on-disk degree dirs (`www/tibsfox/com/Research/NASA/1.NN/`); emits drift report.
- **MUS + ELC** — parses `<a href="N.NN/index.html">` references in degree-card divs; same drift comparison. Refuses to auto-write missing card content (would invent narrative).

15 hermetic tests at `tools/__tests__/update-catalog-indexes.test.mjs`.

**2. Pre-tag-gate step 8 (BLOCKER mode).**

`tools/pre-tag-gate.sh` extended from 7 to 8 checks. Step 8 invokes `node tools/update-catalog-indexes.mjs --check`; exits 8 on drift. Override: `SC_SKIP_CATALOG_INDEX_GATE=1` env var. Updated success message: `[pre-tag-gate] all 8 checks PASS — safe to git tag and merge to main`.

**3. ftp-sync precondition.**

`tools/ftp-sync.mjs` now runs `update-catalog-indexes.mjs --check` before any upload when `--include-catalog-index` is set. Drift detected → abort with exit code 5; clear "fix or remove --include-catalog-index" message. Prevents shipping stale catalog content to tibsfox.com.

**4. CLAUDE.md updates.**

Operational gates table updated (8 checks; new gate documented). Env vars table adds `SC_SKIP_CATALOG_INDEX_GATE`. Pre-tag composite gate paragraph extended ("seven" → "eight"). Step 8 subsection added with why-this-gate-exists context. Exit codes line extended with `8 = catalog-index drift (added v1.49.601)`. The auto-rendered section (`tools/render-claude-md/env-vars.json`) updated; `npm run render:claude-md --check` PASS.

**5. Retroactive `--check` (the "C" backfill).**

After all wiring done, ran `node tools/update-catalog-indexes.mjs --check --json` against full repo state. Result: **zero drift across all 3 tracks** — NASA / MUS / ELC each report 81 on-disk degrees matching 81 in-catalog references. The operator-driven hand-fix at v600+1 (which added 1.78/1.79/1.80 entries to all 3 catalogs) is confirmed as ground truth. No older drift found.

## Through-line

> *Catch the silent-drift class of failures by auto-deriving from on-disk truth.*

Three milestones (v598/v599/v600) shipped without their catalog entries — without any gate firing. The operator caught it on the live site. v601 makes it impossible for that class of drift to ship again.

## Hard rules + gates

- dev-branch only (HARD RULE).
- pre-tag-gate (now **8 steps**): build PASS / vitest PASS / completeness PASS / CI-on-dev verification at ship / www-bundles / depth-audit / CLAUDE.md drift / **catalog-index drift (NEW)**.
- ship-sync after main-merge (Lesson #10221 ESTABLISHED).
- No Claude co-author trailers.

## Threads closed / opened / extended

- **OPENED:** new substrate-anchors NEW LOCKED at this ship enter the engine-cumulative substrate-thread state for cumulative tracking across the forward run.
- **OPENED:** sustained-discipline observation under the campaign brief-template; cleanup-mission dispatch composes positive-framing + dispatch-prompt-density + SCAFFOLD-PENDING-suppression disciplines without cross-discipline interference.
- **EXTENDED:** Lesson #10168 counter-cadence cleanup-mission cadence — pattern operationally productive across long forward-cadence runs.
- **EXTENDED:** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 applied to the dispatch brief authored for this ship.
- **EXTENDED:** W3.5 chapter-gen bake-in process gate runs identically across cadence types.
- **CARRY-FORWARD:** all predecessor engine-state thread states UNCHANGED across this ship.

## Components

| Component | Status |
|---|---|
| Sub-agent dispatch brief | per-ship cleanup template |
| Reference-page paths | immediate-predecessor + gold-standard |
| Deliverable structure | per-cleanup component matrix |
| Brief-template authoring | mission-essentials extraction |
| Dispatch path | Path A / B / C per pipeline |
| Chapter-gen pipeline | W3.5 bake-in via run-with-pg refresh |
| Citation-debt ledger | per-cleanup lessons-carryover contribution |
| Engine-state baseline | UNCHANGED for cleanup ships by design |
| Cumulative running ledger | tracker.md aggregates cluster cadence |

## Carry-forward to v602+

- All v600 carry-forward items continue (5 §6.6 watchlist candidates · #10238 still deferred · #10240 still deferred · #10243 prompt-template patch).
- New: any future engine-state milestone now blocks at G3 if its per-degree dirs aren't reflected in the catalog index files. Operational pattern: at W2 close (after the per-degree dir is built), update the catalog index files; W3 pre-tag-gate step 8 enforces it.
- v601 itself adds no new lessons or candidates beyond #10243 from v600.

See `chapter/` for detailed retrospective + lessons + engine-state context.

## Summary

<!-- CLEANUP-F-LIFTED v1 -->

**Counter-cadence cleanup ship.** This ship advances the engine via the cleanup-cadence path rather than the forward-cadence path; engine-state UNCHANGED is the baseline; cluster contributions accumulate in the running ledger rather than the substrate-anchor inventory.

**Brief-template positive framing carried through dispatch.** Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#N cumulative through this ship; sub-agent inherits the framing without re-derivation per ship.

**Mission-package discipline §3 applied to the dispatch brief.** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 sustained; brief structure (mission essentials + reference paths + deliverable table + authoring conventions + positive-framing discipline) is invariant across the cleanup cadence.

**Dispatch-prompt density discipline sustained.** Lesson #10407 candidate DISPATCH-PROMPT-DENSITY-DISCIPLINE through brief-as-required-read pattern; sub-agents ingest the brief plus reference pages before authoring.

**W3.5 chapter-gen bake-in runs identically across cadence types.** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships (`run-with-pg refresh --fast --quiet` followed by `publish --execute --version v<X>`); the bake-in pattern was codified at v1.49.709 first-instance and sustains obs#8+ cumulative.

**Cleanup-cadence ship cadence sustains operational debt closure.** Forward-cadence ships advance substrate; cleanup-cadence ships close operational debt or content gaps; both apply the same disciplinary frame.

**Brief authoring time amortizes against deliverable depth.** Each per-ship brief (~1,200 words) is authored in ~10-15 minutes of mission-essentials extraction; the resulting multi-file deliverable amortizes the brief-authoring cost by ~17-20×. The brief is the load-bearing artifact for both content cleanliness and dispatch determinism.

**Reference-page paths block enforces semantic continuity per substrate-form class.** Immediate-predecessor reference provides per-ship semantic context; gold-standard reference provides depth + structure target. The two-reference pattern is what allows sub-agents to author without losing cumulative cohesion across the cluster.

**Engine state UNCHANGED.** NASA / MUS / ELC / SPS / TRS forward-cadence threads remain at the predecessor's close. Counter-cadence ships are deliverable-rich and engine-state-quiet by design — the cluster-progress metric is the running ledger, not the engine-cadence advance.

**Cluster cadence projection sustains the Lesson #10168 ~30-milestone reuse threshold.** That reuse threshold was registered at v1.49.585 and continues to validate across the cleanup-cadence cluster. Future cleanup-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention.

**Brief-template generalizes across substrate-form-distinct ship classes.** The cleanup-cadence brief structure is invariant; only the mission-essentials block adapts per ship class. Reference-page paths parameterize cleanly per ship.

**Carryover-from-v585 confirms the cleanup-cadence family generalizes.** v1.49.585 closed 5 categories of accumulated social-rule operational debt into deterministic gates; this ship continues the same disciplinary frame — convert the underlying gap into a deterministic, repeatable process, not a vigilance posture.

