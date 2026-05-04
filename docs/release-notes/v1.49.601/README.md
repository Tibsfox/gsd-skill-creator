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

## Carry-forward to v602+

- All v600 carry-forward items continue (5 §6.6 watchlist candidates · #10238 still deferred · #10240 still deferred · #10243 prompt-template patch).
- New: any future engine-state milestone now blocks at G3 if its per-degree dirs aren't reflected in the catalog index files. Operational pattern: at W2 close (after the per-degree dir is built), update the catalog index files; W3 pre-tag-gate step 8 enforces it.
- v601 itself adds no new lessons or candidates beyond #10243 from v600.

See `chapter/` for detailed retrospective + lessons + engine-state context.
