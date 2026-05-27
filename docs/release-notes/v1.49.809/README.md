> Following v1.49.808 — _S2 Adoption Telemetry Trend Report_, v1.49.809 chips the first entry from the v806 `KNOWN_UNWIRED` egress allowlist: `NpmRegistryAdapter` is now wired through the `EgressContext` chokepoint. Demonstrates the chip-down pattern; remaining 15 egress + 38 process callers stay grandfathered for future chip ships.

# v1.49.809 — KNOWN_UNWIRED Chip 1: NpmRegistryAdapter

**Shipped:** 2026-05-27

First chip from the v806 chokepoint extension's grandfathered `KNOWN_UNWIRED` list. Wires `src/dependency-auditor/registry-adapters/npm.ts` through `EgressContext`; widens the `RegistryAdapter` interface to admit optional `ctx`; fixes a load-bearing failure-mode contract bug in the orchestrator's adapter catch block.

## What shipped

- **MODIFIED** `src/dependency-auditor/registry-adapters/npm.ts` — `fetchHealth` accepts optional `ctx?: EgressContext`; calls `ensureEgressAllowed(ctx, 'dependency-auditor/npm-registry', 'fetch', url)` BEFORE the network-failure try/catch per Lesson #10427.
- **MODIFIED** `src/dependency-auditor/registry-adapter.ts` — widens the interface signature to `fetchHealth(dep, ctx?: EgressContext)`. Docstring annotates the v1.49.809+ wiring discipline + carries a `Role: NOT an egress caller` header to satisfy the audit-test (the interface file's docstring contains the literal characters that the audit harness greps for).
- **MODIFIED** `src/dependency-auditor/audit-orchestrator.ts` — `AuditorConfig` adds optional `egressContext?: EgressContext`. Orchestrator threads `this.config.egressContext` to `adapter.fetchHealth(...)` and `osvClient.queryBatch(...)`. Orchestrator's adapter catch block re-throws `EgressContextDenied` instead of swallowing it (load-bearing fix per #10427 — security denials must propagate).
- **MODIFIED** `src/dependency-auditor/types.ts` — `AuditorConfig.egressContext?: EgressContext` field added.
- **MODIFIED** `src/dependency-auditor/registry-adapters/npm.test.ts` — adds 2 new tests for the EgressContext integration: denial throws `EgressContextDenied` BEFORE `fetch()` runs (proves the hoist), and audit records are emitted with `{source, target}` populated.
- **MODIFIED** `src/security/egress-context-audit.test.ts` — `npm.ts` removed from `KNOWN_UNWIRED`. 16 egress callers → 15.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| Egress integration | +2 | denial + audit-record assertions on npm adapter |
| **Total added** | **+2** | 35,180 → 35,182 in the full suite |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 27 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: **20 → 20** (UNCHANGED — chip-down work doesn't add a discipline).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: **8 → 8** (UNCHANGED).

## Migration progress

| Surface | At v806 | At v809 | Δ |
|---|---|---|---|
| Egress `KNOWN_UNWIRED` | 16 | **15** | **−1** |
| Process `KNOWN_UNWIRED` | 38 | 38 | 0 |

The 5-1-1 alternation pattern (per #10430) begins. Each chip is the same shape: thread `ctx?: EgressContext`/`ProcessContext` through one call site, hoist `ensure*Allowed()` outside any error-swallowing try/catch, fix any orchestrator-level swallowing (per #10427), update tests, remove the entry from `KNOWN_UNWIRED`.

## Forward path

- **NASA 1.179 forward-cadence** — 27 consecutive ships at 1.178; still the most visible open item.
- **More `KNOWN_UNWIRED` chips** — the 4 remaining sibling registry adapters (cargo, conda, pypi, rubygems) are the natural next batch since the interface is already widened and the orchestrator already re-throws denials. A future ship can wire 1-5 of them.
- **T1.3 College of Knowledge consumer engine** — recon next slot per the chain plan.
