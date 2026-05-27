# v1.49.827 — Context

## Provenance

This ship was selected as the first ship of the v827-833 chain (dogfood batch → scribe batch → T1.3 app-boundary → T1.3 Option C → codify onPredictions) based on operator selection from the v824-826 chain handoff's "Highest-ROI next ship candidates" list (item 2: "dogfood family 3-file batch ProcessContext").

The batch was sized by audit-recon during chain planning. Three files (extractor + pydmd/install/health-check + pydmd/install/venv-manager) were the dogfood KNOWN_UNWIRED entries per the v806 allowlist. The audit-recon revealed a structural surprise — only 1 of the 3 files has the pure #10433 internal-helper shape; the other 2 use a dependency-injection executor with multiple swallowing try/catches.

## What this ship batches

| File | Helper shape | Callsites | Catch behavior |
|---|---|---|---|
| `src/dogfood/extraction/extractor.ts` | `runPdftotext()` — pure internal helper | 1 | Caller re-throws (#10433 fits) |
| `src/dogfood/pydmd/install/health-check.ts` | `defaultExec` DI executor | 1 | Swallows to fail-report (#10427 hoist required) |
| `src/dogfood/pydmd/install/venv-manager.ts` | `defaultExec` DI executor | 6 | All 6 swallow to fail-result (#10427 hoist × 6) |

## Recon trail (per #10422 ledger-driven work discipline)

1. **Inventory**: located 3 dogfood entries in `src/security/process-context-audit.test.ts` allowlist.
2. **Helper audit**: extractor has clean `runPdftotext`; health-check + venv-manager have `defaultExec` DI shape.
3. **Catch audit**: extractor's caller re-throws ProcessContextDenied (safe per v820 template); health-check + venv-manager have catches that convert errors to structured fail-reports (swallowing → #10427 hoist required).
4. **Wire pattern selection**: extractor uses pure #10433 (check inside helper); health-check + venv-manager use #10433 + #10427 hoist (check inside public function, OUTSIDE try/catch).
5. **Audit-test edit**: remove 3 entries from `KNOWN_UNWIRED`; replace inline note with 3-line completion comment.
6. **Verification**: build PASS; audit-test 2,047 PASS; dogfood tests 646 PASS (47 files).

## Discipline-extension vs new-domain choice

This ship EXTENDS the migration-debt ledger (#10432) by chipping 3 entries. It also validates the joint application of #10433 + #10427 (the latter's first multi-hoist instance — 7 hoists in 1 ship).

A potential refinement to #10433 surfaces — the DI-executor cost-shape variant. Below 2-instance threshold (only 1 ship has produced it so far, even though 2 files in that ship show the shape). Defer to future codify ship per #10426.

## What was deferred

- **DI-executor cost-shape codification** (refinement to #10433) — 1-ship instance; defer until 2nd ship demonstrates the same shape.
- **Threading ctx end-to-end through dogfood callers** — `learn/acquirer.ts` imports `runHealthCheck` indirectly; ctx would need to thread through that whole chain. Not blocking — legacy-permissive mode is intentional; future cross-module ctx-threading ship could close it if needed.

## Verification trail

| Step | Result |
|---|---|
| `npm run build` | PASS |
| `npx vitest run tests/dogfood` | 47 files / 646 tests PASS |
| `npx vitest run src/security/process-context-audit.test.ts` | 2,047 tests PASS (audit accepts the chip) |
| Pre-tag-gate (full) | expected 17/17 PASS (step 13 within-ceiling 39 ≤ 41 PASS) |

## Forward path

- **v828** — scribe/netlist-renderer 3-file batch (available + netlistsvg-driver + yosys-driver). Audit each for an internal helper before sizing. Brings Process KNOWN_UNWIRED 25 → 22.
- **v829** — T1.3 application-boundary wire (instantiate ObservationBridge at app boundary; pass to translateSessionEvent).
- **v830-832** — T1.3 Option C (RosettaEngine.translate() confidence-bound fallback; 2-3 ships).
- **v833** — Codify ship promoting onPredictions wire pattern (and possibly the DI-executor refinement if it accrues a 2nd ship by then).

After the chain closes (~v833), NASA 1.179 forward-cadence remains the most visible open item per the v826 handoff (now **45 consecutive ships at 1.178** at this point — pressure continues to accumulate).

## References

- Predecessor: v1.49.826 (`docs/release-notes/v1.49.826/`)
- v824-826 chain handoff: `.planning/HANDOFF-2026-05-27-v1.49.824-826-chain-3-ships-shipped.md`
- Codification of #10433 (internal-helper pattern): v1.49.824
- First batch-chip in `git/core` family using #10433: v1.49.825
- #10427 failure-mode contracts: `docs/failure-mode-contracts.md`
- KNOWN_UNWIRED discipline: `docs/known-unwired-ledger-discipline.md`
- Security chokepoints discipline: `docs/security-chokepoints.md`
