# v1.49.979 — Summary

## The ship

Ship 3.3 wires the authored-but-unwired **sc-learn + scan-arxiv** CLI surface into the npm-bin dispatch registry — the WIRE cluster Ship 3.2 (v1.49.978) allowlisted as an explicit follow-up. Registering the surface flips the `commands`, `learn`, and `scan-arxiv` modules from `living`-but-`reachableFromProduction:false` to reachable. scan-arxiv ships with a cost-safe default (local embedding-only rank) and an arxiv-scoped egress guard.

## What shipped

- **WIRE `learn`** — new `main(argv)` + `isCliEntrypoint` guard on `src/commands/sc-learn.ts`, registered as `skill-creator learn`; `scLearn()` stays a pure library. `--yes` auto-approves WITH warnings; the interactive HITL gate never auto-approves STRANGER-trust content. Also repairs the dead `bridge.ts` ingestion line.
- **WIRE `scan-arxiv`** — new `src/cli/commands/arxiv.ts` safe-default router → `skill-creator arxiv`/`scan-arxiv`; no-flag forces local `embedding-only` (no LLM billing / subprocess), `--rank` opts into cost-bearing `auto`, explicit `--judge-backend` wins.
- **EGRESS-GUARD** — arxiv-host-scoped `EgressContext` threaded through `src/scan-arxiv/fetcher.ts` (`ensureEgressAllowed` before the fetch).
- **Bookkeeping** — allowlist 32 → 29; 3 `SHELFWARE-VERDICTS.md` rows ALLOWLISTED → WIRED; `SHIP33_WIRED` drift-guard block added to the existing `learning-substrate-parked.test.ts` (SHIP32_ALLOWLISTED 14 → 11).
- Tests: `arxiv.test.ts` + `sc-learn-cli.test.ts`.

## Verification

- `tsc` build clean; 9 affected suites **2,124 pass**; integration **217 pass**.
- Pre-tag-gate **all 20 PASS** (no new gate step — denominator stays 20).
- Live scan: `commands`/`learn`/`scan-arxiv` reachable + de-allowlisted; non-allowlisted unreachable set = `[]`.
- origin/dev CI green (`fd213bd36`); Step-P adversarial review: **0 confirmed**.

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged (forward audit-plan ship).
