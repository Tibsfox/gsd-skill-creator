
# v1.49.841 — Context

## Provenance

First ship of the new operational-debt cluster following v840's codify-ship cluster close. Closes the v840 forward-flag "Quality-drift scoring calibration drift for codify+chip ships" — a 1-ship forward-flag-to-fix latency (fastest in recent operational-debt history).

The v840 retrospective forward-flagged that `tools/release-history/quality-drift-check.mjs` fired 4 alerts on every refresh (2 major + 2 warning), all structurally false positives because the all-time-historical baseline was degree-heavy (442 NASA missions, avg 96.6) while recent cadence is chip-heavy (avg ~35). The check was preserving NO signal.

## What this ship adds

```
tools/release-history/classify-types.mjs              [MODIFIED: +chip type + entrypoint guard + export classify]
tools/release-history/quality-drift-check.mjs         [MODIFIED: per-type baselines + recent-vs-recent comparison + authoredTypes filter]
tools/release-history/__tests__/classify-types-chip.test.mjs  [NEW: 16 chip-detection assertions]
.planning/release-cache/_quality-baseline.json        [REGENERATED via --update-baseline; gitignored]
docs/release-notes/v1.49.841/                         [NEW: README + 4 chapters]
.planning/PROJECT.md                                  [MODIFIED: pre-bump refresh]
```

## Recon trail

1. **Read predecessor handoff** (`.planning/HANDOFF-2026-05-27-v1.49.840-codify-ship-closed.md`). Quality-drift recalibration enumerated as one of 5 next-session candidates with explicit option matrix in the v840 forward-flags.
2. **Inspect drift-check + classify-types code** to confirm scope: 2 tooling files + need for a new test file.
3. **Inspect score-completeness rubric logic** to understand WHY chip ships score F (substantive-feature dimensions don't fit chip-ship release notes by design).
4. **Inspect actual per-type DB distributions** to confirm the all-time historical vs recent skew is structural (degree avg 96.6 vs feature avg 82.2 vs recent feature avg ~35).
5. **Decide on chip-detection regex** by enumerating recurring scope markers in v802-v840 ship titles. Picked 10 markers (Chip, Codification Ship, Codify, Scaffold, Singleton, Stale-Entry, Wedge Close, Inverse-Check, Atomic Writer) with word-boundary anchoring to prevent "Chipset" misclassification.
6. **AskUser on design direction** — operator picked option 2 (chip type + per-type baselines).
7. **Implement chip classification + reclassify all 883 releases** (3-second DB pass; 23 ships moved to chip).
8. **Implement per-type baselines + recent-vs-recent comparison** in drift-check.
9. **Re-baseline + verify drift signal** went from 4 alerts (2 major + 2 warning) to 1 informational warning.
10. **Author 16 chip-detection tests** + add entrypoint guard so test imports don't try to open DB.
11. **Author release notes** — 5 files (README + 4 chapters).
12. **Verify build + tests** — `npm run build` clean; full vitest run shows 35,261 PASS / 0 FAIL.

## Why the design is what it is

### Why a new `chip` release_type (not just baselines)

Per-type baselines alone don't help if chip ships are misclassified as `feature` — the feature baseline still gets dragged down. The chip type is the prerequisite for the per-type baselines to actually compare like-to-like.

### Why recent-vs-baseline-recent (not recent-vs-baseline-historical)

The conventional drift-check pattern compares current state to baseline state where baseline = historical-all-time. This fires alerts whenever cadence shifts even without authoring regression. The v841 change anchors recent-drift comparison to baseline's recent-N snapshot — meaning "did this type's score drop SINCE I calibrated", which IS the intent. The trade-off: the baseline needs periodic re-capture or "recent" stops being recent.

### Why a regex (not classification by score)

Score-based chip classification would be circular: chip ships score low → classified as chip → baseline shows chip-class scores low → drift-check passes. Name-based detection breaks the circle. The 10-pattern regex maps to observed operational vocabulary.

### Why the test file lives outside vitest scope

Per the existing `tools/release-history/__tests__/` pattern documented in `score-completeness.test.mjs`: vitest scope doesn't include `tools/`. The tests are "forward-ready" — a future config widening would activate them. For v841, verified via inline node-script (15/15 pass).

## Verification trail

| Step | Result |
|---|---|
| `node tools/release-history/classify-types.mjs --summary` | 883 classified: degree 442, milestone 64, feature 350, patch 4, chip 23 |
| `node tools/release-history/quality-drift-check.mjs --update-baseline` | Baseline re-captured with by_type.{historical,recent} fields |
| `node tools/release-history/quality-drift-check.mjs --warn-only` | Status: warn; 1 alert (recent_all_F genuine signal); 0 major; per_type_deltas all 0 |
| `node -e "import('./tools/release-history/classify-types.mjs').then(...)"` | 15/15 chip-detection smoke tests pass |
| `npm run build` | PASS |
| `npx vitest run` | 35,261 PASS / 45 skipped / 7 todo / 0 fail |
| `bash tools/pre-tag-gate.sh` | (pending T14 step 1) |

## What was deferred

- **`task` sub-type for T-prefix/S-prefix work.** The remaining `recent_all_F` warning fires because recent feature-type ships are substantive code work with minimal release notes (T1.x/T2.x/S6/S5/S2 ship series). If the warning fires persistently, add a `task` sub-type with the same classification pattern this ship established. v841 doesn't take action on this yet.
- **`--auto-rebaseline-after N` flag.** The recent-vs-baseline-recent comparison needs periodic re-baselining. Manual `--update-baseline` is the v841 contract; automated rebaseline could be added if drift-check is added to a recurring cron-style job.
- **Tighter per-type thresholds.** The `per_type_min_samples: 3` default is conservative. Once chip-type history grows to 50+ samples, tighter thresholds (smaller drop tolerated before alert) could be tuned.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Single tooling-file ship — code change in 2 files (classify-types.mjs + quality-drift-check.mjs) + 1 new test file.
- No new lessons promoted; no manifest changes; no CLAUDE.md regeneration needed (no discipline doc touched).
- v836 preservation gate continues to fire (5th time at v841's T14 publish step expected).

## Forward path post-v841

1. **ProcessContext terminal family batch chip** — next per the v840 next-session candidates list. 3 entries (cli/commands/terminal.ts + terminal/launcher.ts + terminal/session.ts). v842.
2. **ProcessContext mesh family batch chip** — 2 entries (mesh-worktree.ts + proxy-committer.ts). v843.
3. **Verification/integration-only canonical-doc decision** — operator-bounded; pending v840 forward-flag.
4. **Production caller of predict path** — activates v837's auto-emit wire.
5. **NASA 1.179 forward-cadence** — still STRONG-DEFAULT (59 consecutive ships at 1.178 after this ship — record-widest pressure margin again).

## References

- Predecessor: v1.49.840 (`docs/release-notes/v1.49.840/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.840-codify-ship-closed.md` (closes the drift-check forward-flag from this handoff)
- Quality-drift watcher agent doc: `.claude/agents/quality-drift-watcher.md`
- Quality-drift tool: `tools/release-history/quality-drift-check.mjs`
- Classify-types tool: `tools/release-history/classify-types.mjs`
- Score-completeness tool: `tools/release-history/score-completeness.mjs` (unchanged; chip ships still score on structured rubric, F-by-design)
- Existing release-history test pattern: `tools/release-history/__tests__/score-completeness.test.mjs` (forward-ready outside vitest scope)
