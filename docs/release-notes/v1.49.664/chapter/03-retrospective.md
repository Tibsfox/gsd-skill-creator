# v1.49.664 — Retrospective

## What went well

**STATE.md gate-not-vigilance was the right opening move.** Phase 1's `update-state-md-on-ship.mjs` fix was a small, atomic, testable unit (~30 lines + 3 tests + one-time backfill) that addressed the v661→v663 rapid-fire drift class in <15 minutes. The fix exemplifies Lesson #10169: converting a silent-skip into a deterministic write is cheaper than re-emphasizing "operator should backfill manually" in prose. Meta-tested at T14 ship: cc-1's own STATE.md will end up at `milestone_name: "cc-1: Staged-Deck Scaffold Infrastructure (SPS + TRS)"` derived from this README's first line.

**Two scaffolders cleanly mirrored existing patterns.** `scaffold-sps-pages.mjs` + `scaffold-trs-packs.mjs` followed `scaffold-cross-track-dirs.mjs` template (CLI + dry-run + JSON + exported helpers for testing + idempotent writes + SCAFFOLD-PENDING marker). The architectural choice to keep them separate tools (rather than one mega-scaffolder with `--track <sps|trs>` flag) preserved focus and made each file <200 lines. 27 tests across both files in the same test session.

**Refactoring tests after pre-refactor leak was honest.** The initial SPS test used `cwd: tmpRoot` with CLI invocation, but the script reads from REPO_ROOT-derived SPS_ROOT not cwd — so tests leaked 5 fixture dirs (alpha, beta, gamma, partial, test-bird) into the real `www/.../SPS/`. Caught when running depth-audit's new inventory showed unfamiliar slugs. Cleaned via operator-authorized `rm -rf` and refactored both scaffolder tests to use exported functions with overridable `spsRoot`/`trsRoot` parameters. The refactor produced cleaner tests AND made the integration path importable from depth-audit.test.mjs.

**Discovered drift surfaced and got absorbed cleanly.** During cc-1 scoping the TRS pack-14..38 deficit was discovered (FA-663-6 only tracked 40-43, but disk had only pack-01..13 + pack-39). Surfaced to operator with re-framing question per Lesson #10172. Operator chose to absorb — re-framed W0 brief captured the expanded scope before any code landed. No silent scope creep.

**Phase 4 scope correction was a save.** The MISSION-BRIEF.md said "extend depth-audit to recognize SPS+TRS SCAFFOLD-PENDING" — read as marker-only recognition. But depth-audit's architecture is fundamentally version-keyed (NASA/MUS/ELC = `<track>/<version>/index.html`), and SPS+TRS aren't. Surfaced to operator that real depth-scoring requires gold-standard threshold derivation (substantial scope creep). Operator picked "Full Phase 4 as briefed" which on close reading = marker inventory. Shipped a focused soak-mode informational scan (10 tests) instead of a multi-day depth-scoring extension.

## What did not go well

**SPS test leakage was preventable.** The first version of the SPS test (CLI-spawn pattern from `update-state-md-on-ship.test.mjs`) should have raised a flag earlier — the SPS scaffolder script doesn't accept `--root` like depth-audit does, so the test's `cwd: tmpRoot` wasn't actually overriding SPS_ROOT. Refactor came after the leak. Lesson: when copy-pasting a CLI-spawn test pattern, verify the script-under-test supports `--root` override or refactor to call the exported function directly with overridable roots from the start.

**cc-1 ran longer than the v654 reference counter-cadence.** v654 shipped 2 categories of work (FA-652-11 infrastructure + lesson codification) in a similar timeframe. cc-1 shipped 4 phases + a discovered-drift absorption. The hybrid of operator-authored mission package + iterative scope expansion + 4-phase scope made for ~3 hours wall-clock of inline execution + 4 commits. cc-2 (parallel W2 content authoring) is well-suited to sub-agent dispatch per Lesson #10193 + #10215 to recover the lost time budget.

**Phase 4 over-flagged on first inventory pass.** Initial `inspectScaffoldPendingSpsTrs` definition flagged any SPS dir missing canonical files (data-sources.json + knowledge-nodes.json + artifacts/) as "partial." That caught real pre-existing SPS dirs (american-goshawk, black-backed-woodpecker, northern-spotted-owl, pacific-marten, pacific-sea-otter, sockeye-salmon, sooty-shearwater, research) which have non-canonical-but-real schemas. Tightened to **only** flag dirs carrying an explicit scaffold-pending marker (HTML comment OR JSON `scaffold_pending: true`). Removed ~10 false-positives from the inventory output.

## Process observations

- **Mission package as W0 brief worked.** Authoring `.planning/missions/v1-49-664-cc1-staged-deck-scaffold-infrastructure/MISSION-BRIEF.md` ahead of execution + including the discovered-drift re-framing inline kept scope visible. The brief was never committed (mission packages are gitignored per Lesson #10174 self-mod safety + git-add-blocker enforcement).
- **5-file release-notes structure preserved.** README + chapter/00-summary + 03-retrospective + 04-lessons + 99-context = canonical counter-cadence shape per v654 reference. No chapter/01 or 02 since engine-state and cross-track tracks are static.
- **Session-retro started early.** `node tools/session-retro/observe.mjs start 'v1-49-664-666-counter-cadence-cluster'` invoked at session open (per CLAUDE.md convention). Started_commit `edcf664d6` captured for future retro generation.
- **Carry-forward at cc-1 close.** TRS pack-14..38 themes per-pack are deferred to cc-2 (current manifest marks `theme: "pending"`). Real depth scoring for SPS+TRS is forward work. `pre-tag-gate.sh` bypass token wiring for new env vars is forward work.

## Forward-notes for cc-2 + cc-3

- **cc-2 dispatch model.** Per Lesson #10193 + #10215, parallel W2 sub-agents are appropriate for content authoring with bounded scope. Recommended split: 1 sub-agent per SPS species (3 dispatches) + 1 sub-agent per ~7-pack TRS batch (~4 dispatches). Each ~30-50min wall-clock. Marker removal per file as content lands.
- **cc-3 schema work.** FA-663-7 international-PS catalog-card metadata schema is small-but-finicky; suggest authoring inline (no sub-agent) with a small test fixture covering Baudry / Al-Saud / Acton / Bartoe. FA-663-10 NASA-Group-6 retroactive cohort needs research time per individual (Llewellyn + Allen + Lenoir); may warrant a single research-focused sub-agent.
- **TRS depth scoring promotion.** When SPS+TRS scaffold backfill stabilizes (post-cc-2), define gold-standard thresholds (lines/bytes/sections per track) and promote depth-audit inventory to FAIL-aware mode. Wire `depth-audit-sps` + `depth-audit-trs` bypass tokens to `pre-tag-gate.sh` at promotion time.
