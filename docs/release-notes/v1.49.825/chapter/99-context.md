# v1.49.825 — Context

## Provenance

This ship was selected as the second ship of the v824-826 chain (Codify → git/core batch → T1.3 Ship 3) based on operator selection from the v816-823 chain handoff's "Highest-ROI next ship candidates" list (item 3 in the original numbering: "git/core 3-file batch ProcessContext").

The batch was sized by audit-recon during chain planning. Three files (repo-manager + state-machine + sync-manager) were the remaining KNOWN_UNWIRED entries in the `git/core` family per v820's allowlist comment "remaining 3: repo-manager, state-machine, sync-manager — future batch." That comment was the load-bearing forward-pointer for this ship.

## What this ship batches

| File | Callsites | Internal helper | Pre-wire op type |
|---|---|---|---|
| `src/git/core/repo-manager.ts` | 16 | `exec(command, cwd?)` | `execSync` shell-string |
| `src/git/core/state-machine.ts` | 7 | `exec(command, cwd)` | `execSync` shell-string |
| `src/git/core/sync-manager.ts` | 11 | `execGit(cmd, args, cwd)` | `execFile` arg-list |

Two of the 3 files use shell-string `execSync` (op tag `'exec'`); the third uses arg-list `execFile` (op tag `'exec-file'`). The chokepoint API accepts both shapes; the wire pattern is uniform.

## Recon trail (per #10422 ledger-driven work discipline)

1. **Inventory**: grep for spawn callsites in each of the 3 files. Match expected count from v820's audit-test allowlist (3 entries).
2. **Pattern audit**: each file shown to have an internal helper (`exec` or `execGit`). All 3 fit #10433's batch-chip-friendly category.
3. **Op-tag classification**: 2 files use shell-string execSync → op `'exec'`. 1 file uses execFile → op `'exec-file'`. Pattern: split-by-spaces shell-string for the former; pass argv directly for the latter.
4. **Audit-test edit**: remove 3 entries from `KNOWN_UNWIRED`; replace v820's 2-line forward-note with a 4-line completion comment.
5. **Verification**: build PASS; `npx vitest run src/git/ src/security/` 4,275 tests PASS; audit accepts the wire.

## Discipline-extension vs new-domain choice

This ship EXTENDS the migration-debt ledger (#10432) by chipping 3 entries. It does NOT introduce any new discipline.

The forward-test of #10433 (codified v824) is documented in the chapter 04-lessons. The pattern's prediction band (14-20 LOC per file) was calibrated to within ~10% by actual measurement (18-22 LOC). No refinement-ship needed; #10433 stays as codified.

## What was deferred

- **LOC-band-by-callsite-count refinement** (1 instance) — defer until 2nd instance per #10426.
- **branch-manager.ts → state-machine.ts cross-file ctx threading** — branch-manager (wired v820) calls state-machine functions (newly threaded v825) without passing ctx. Functions operate in legacy-permissive mode. Threading ctx end-to-end would require a multi-ship arc; not blocking. Forward-note for future ship if needed.

## Verification trail

| Step | Result |
|---|---|
| `npm run build` | PASS |
| `npx vitest run src/git/ src/security/` | 14 files / 4,275 tests PASS |
| `npx vitest run src/security/process-context-audit` | 2,047 tests PASS (audit accepts the chip) |
| Pre-tag-gate (full) | expected 17/17 PASS (step 13 within-ceiling 39 ≤ 41 PASS) |

## Forward path

- **v826 (chain end)** — T1.3 Ship 3 = Option A (gnn-predictor wire into a skill-activation call site). Closes a different branch of T1.3 GAP-2 substrate-to-consumer wiring.

After the chain closes (~v826), the most visible open item per the v823 handoff remains NASA 1.179 forward-cadence (now **43 consecutive ships at 1.178** after v824 + v825). Other open items: continued ProcessContext chip work (28 entries remain after this ship), T1.3 application-boundary wire (Option C), T2.1 v1.50 unblock-or-archive decision.

## References

- Predecessor: v1.49.824 (`docs/release-notes/v1.49.824/`)
- v816-823 chain handoff: `.planning/HANDOFF-2026-05-27-v1.49.816-823-chain-8-ships-shipped.md`
- First chip in `git/core` family: v1.49.820 (`docs/release-notes/v1.49.820/`)
- Codification of #10433 (internal-helper pattern): v1.49.824
- KNOWN_UNWIRED discipline: `docs/known-unwired-ledger-discipline.md`
- Security chokepoints discipline: `docs/security-chokepoints.md`
