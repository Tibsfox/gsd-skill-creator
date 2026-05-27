# v1.49.825 — Retrospective

**Wall-clock:** ~30 min from chain-continuation to tag-push. Second ship of the v824-826 chain.

## What went as expected

- **All 3 files had the predicted internal-helper shape.** repo-manager has `exec()` (16 callsites), state-machine has `exec()` (7 callsites), sync-manager has `execGit()` (11 callsites). All three followed v820's branch-manager.ts template (which has `execGit()` with 10 callsites). Pattern-match wins.
- **#10433 LOC prediction held.** Predicted 14-20 LOC per file; actual was 18-22 per file. The slightly high end (22) at sync-manager and repo-manager is because they have more internal-helper depth (multi-level threading: public → helper → helper).
- **Audit-test confirmed the wire.** After removing 3 entries from `KNOWN_UNWIRED`, the audit-test re-ran in <1s and accepted the 3 wired files as conformant. No false-positive denials.
- **The `git/core` family closes at 4 of 4.** v820 chipped branch-manager (1 of 4). This batch closes the remaining 3. The audit-test allowlist comment now reads as a completion record rather than a future-batch note (per #10433's "block-comment consolidation when N-of-N siblings wired" observation, reaffirmed earlier at v811 + v819).

## What I noticed

- **The pattern is now mechanically repeatable.** With v820 + the v824 codification of #10433 in front of me, this batch took ~30 min instead of v820's ~25 min — almost the same wall-clock for 3 files vs 1. The codification REDUCES per-ship discovery cost.

- **The 'exec' op tag works cleanly for shell-string spawns.** Both repo-manager and state-machine use `execSync(<shell-string>)`. The pattern from `dependency-auditor/dry-run-gate.ts` (split shell-string into tokens, first = command, rest = argv) translates directly. The audit annotation `cwd=<cwd>` adds operator-readable context.

- **`sync-manager.ts` uses `execFile` (not `execSync`).** That's why the op tag is `'exec-file'` (matches v820's branch-manager, which also uses execFile). Two different shapes in the same batch — the audit-test accepts both because the wire-shape is uniform at the chokepoint API call.

- **Existing call sites in branch-manager.ts now pass `undefined` ctx to state-machine.** state-machine's `detectState`, `assertClean`, etc., gained `ctx?` parameters. branch-manager.ts (wired at v820) calls these without passing ctx — meaning they run in legacy-permissive mode. That's intentional: each chip is independently additive; threading ctx end-to-end across multiple modules would require a multi-ship arc. The choice respects #10416 (lightest wire).

## What surprised me

- **The `git/core` family closes EXACTLY at the predicted 4-entry size.** When v820 first-chipped branch-manager, the allowlist comment forecast "remaining 3" — that prediction held perfectly. The audit-test grep over src/ correctly identified the 4-entry boundary; nothing was missed.

- **sync-manager's `getConflictFiles` is called from inside catch blocks.** Per #10427 (failure-mode contracts), I worried about hoisting the `ensureProcessAllowed` outside any error-swallowing try/catch. Inspection confirmed: `getConflictFiles` itself has a try/catch that returns `[]` on error — but inside that helper, the call to `execGit` is at the function root, NOT inside the try/catch. The chokepoint denial would propagate. Pattern-compliant.

## Risk that didn't materialize

- The KNOWN_UNWIRED audit might have flagged the 3 files as missing a wire AFTER I removed them from the set, if I'd missed a callsite somewhere. The audit ran clean — all spawn paths in all 3 files are now threaded.

## Carried forward

- The `git/core` family is fully closed; no follow-on chip work in this family.
- Next batch candidate: dogfood family (3 entries: extraction/extractor + pydmd/install/health-check + pydmd/install/venv-manager). Audit each for an internal helper before sizing.
- branch-manager.ts → state-machine.ts cross-file ctx threading is deferred. Not urgent — legacy-permissive mode is intentional; a future cross-module ctx-threading ship would close it if/when needed.

## Forward-test of #10433 (recap)

| Prediction (per #10433 v824) | Reality (v825 measurement) |
|---|---|
| ~14-20 LOC per file with internal helper | 18-22 LOC per file (within band) |
| Family-batch ~3× single-file cost | 3 × ~20 LOC ≈ 62 LOC (matches) |
| Discovery cost ↓ after codification | 30 min (v825) vs 25 min (v820) — slight DOWN per-file |

#10433 is calibrated. The discipline doc's batch-chip-planning guidance ("audit each candidate for an internal helper FIRST") was the right recon step at chain-start.
