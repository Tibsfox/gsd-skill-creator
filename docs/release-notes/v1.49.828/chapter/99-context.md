# v1.49.828 — Context

## Provenance

This ship was selected as the second ship of the v827-833 chain based on operator selection from the v824-826 handoff's "Highest-ROI next ship candidates" list (item 3: "scribe/netlist-renderer 3-file batch").

The batch was sized by audit-recon. Three files (available + netlistsvg-driver + yosys-driver) are the scribe/netlist-renderer KNOWN_UNWIRED entries per the v806 allowlist. All 3 use `spawn` (first batch where the chokepoint's `'spawn'` op-tag is exercised at family scale) and all 3 have a clean internal helper.

## What this ship batches

| File | Helper | Op tag | Callsites | Catch behavior |
|---|---|---|---|---|
| `src/scribe/netlist-renderer/available.ts` | `probeCommand` | `spawn` | 2 | swallows spawn errors into `resolve(false)` (#10427 hoist required) |
| `src/scribe/netlist-renderer/netlistsvg-driver.ts` | `spawnNetlistsvg` | `spawn` | 1 | wraps spawn errors into `NetlistRenderError` (would mask `ProcessContextDenied` — #10427 hoist required) |
| `src/scribe/netlist-renderer/yosys-driver.ts` | `spawnYosys` | `spawn` | 1 | wraps spawn errors into `NetlistRenderError` (#10427 hoist required) |

## Recon trail (per #10422 ledger-driven work discipline)

1. **Inventory**: 3 entries in `KNOWN_UNWIRED` for scribe/netlist-renderer.
2. **Helper audit**: all 3 have a clean internal helper using `spawn`.
3. **Catch audit**: all 3 have a try/catch inside the Promise constructor that either swallows (resolve false) or wraps (reject with NetlistRenderError). All 3 require #10427 hoist.
4. **Op-tag check**: `'spawn'` is in `ProcessOp` (alongside `'spawn-sync'`, `'exec'`, `'exec-sync'`, `'exec-file'`, `'exec-file-sync'`, `'fork'`). Compatible.
5. **Wire pattern**: identical across all 3 files — `function spawnX(args, ctx?: ProcessContext)` with `ensureProcessAllowed(ctx, PROCESS_SOURCE, 'spawn', bin, args)` BEFORE the Promise.
6. **Audit-test edit**: remove 3 entries; replace inline forward-note with 4-line completion comment.
7. **Verification**: build PASS; scribe tests 252 PASS / 20 skipped; audit-test 2,047 PASS.

## Discipline-extension vs new-domain choice

This ship EXTENDS the migration-debt ledger (#10432) by chipping 3 more entries. It also exercises #10433 + #10427 at scale for `'spawn'` op-tag (first family batch using this op-tag).

No new discipline introduced. The `'spawn'` op-tag at family scale is a new observation worth noting (1 ship instance) but the chokepoint API already supports it — no implementation change needed.

## What was deferred

- **Continued ProcessContext chip work** — 22 entries remain. Next batches: terminal 2 entries (cli/commands/terminal + terminal/launcher + terminal/session — actually 3, re-audit), mesh 2 entries (mesh-worktree + proxy-committer), intel/analyzer 2 entries (findings/stalled + git). Each batch is ~20-30 min wall-clock.
- **#10433 LOC-band refinement** — now at 3 ships of evidence. Could codify next codify ship.

## Verification trail

| Step | Result |
|---|---|
| `npm run build` | PASS |
| `npx vitest run src/scribe` | 25 files / 252 PASS / 20 skipped / 0 fail |
| `npx vitest run src/security/process-context-audit.test.ts` | 2,047 tests PASS (audit accepts the chip) |
| Pre-tag-gate (full) | expected 17/17 PASS (step 13 within-ceiling) |

## Forward path

- **v829** — T1.3 application-boundary wire (instantiate ObservationBridge at app boundary; pass to translateSessionEvent).
- **v830-832** — T1.3 Option C (RosettaEngine.translate() confidence-bound fallback; 2-3 ships).
- **v833** — Codify ship for onPredictions pattern.

After chain closes (~v833), NASA 1.179 remains the strong-default per v826 handoff (now **46 consecutive ships at 1.178**).

## References

- Predecessor: v1.49.827 (`docs/release-notes/v1.49.827/`)
- v824-826 chain handoff: `.planning/HANDOFF-2026-05-27-v1.49.824-826-chain-3-ships-shipped.md`
- Codification of #10433: v1.49.824
- #10427 failure-mode contracts: `docs/failure-mode-contracts.md`
- KNOWN_UNWIRED discipline: `docs/known-unwired-ledger-discipline.md`
- Security chokepoints discipline: `docs/security-chokepoints.md`
