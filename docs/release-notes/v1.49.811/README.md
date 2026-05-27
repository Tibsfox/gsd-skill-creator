> Following v1.49.810 — _T1.3 Option A: gnn-predictor Wired Into Copper Activation_, v1.49.811 batch-chips the remaining 4 sibling registry adapters (cargo, conda, pypi, rubygems) through the EgressContext chokepoint established at v806 and first-wired at v809 npm. Egress `KNOWN_UNWIRED` drops from 15 to 11 in one ship. The interface widening + orchestrator threading from v809 made this ~3 lines per adapter + 2 tests per adapter.

# v1.49.811 — Batch Chip: cargo + conda + pypi + rubygems Registry Adapters

**Shipped:** 2026-05-27

Second chip ship from the v806 `KNOWN_UNWIRED` egress allowlist. Wires the 4 sibling registry adapters that share the `RegistryAdapter` interface (cargo, conda, pypi, rubygems) through the EgressContext chokepoint using the v809 npm pattern. Demonstrates the post-infrastructure chip cadence: ~15-20 min total for 4 adapters because the interface widening (v809) and orchestrator threading (v809) are already in place — pure mechanical per-adapter wires.

## What shipped

- **MODIFIED** 4 registry adapters — each gains optional `ctx?: EgressContext` param and hoists `ensureEgressAllowed(ctx, EGRESS_SOURCE, 'fetch', url)` BEFORE the network-failure try/catch per Lesson #10427:
  - `src/dependency-auditor/registry-adapters/cargo.ts` (source: `dependency-auditor/cargo-registry`)
  - `src/dependency-auditor/registry-adapters/conda.ts` (source: `dependency-auditor/conda-registry`; 2 channels — ensure called inside `tryChannel(channel, name, ctx?)` before its own swallow-try)
  - `src/dependency-auditor/registry-adapters/pypi.ts` (source: `dependency-auditor/pypi-registry`)
  - `src/dependency-auditor/registry-adapters/rubygems.ts` (source: `dependency-auditor/rubygems-registry`)
- **MODIFIED** 4 adapter test files — each gains a new `EgressContext integration` describe block with 2 tests (denial-before-fetch + audit-record emission). conda.test.ts asserts an audit record per channel probed (2 records when conda-forge returns 404 and bioconda succeeds).
- **MODIFIED** `src/security/egress-context-audit.test.ts` — removed 4 entries from `KNOWN_UNWIRED`. The 5 registry adapters now share a single block comment recording their wire dates (npm v809, cargo+conda+pypi+rubygems v811).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| Cargo adapter | +2 | denial + audit-record |
| Conda adapter | +2 | denial-before-first-channel + audit-record-per-channel |
| Pypi adapter | +2 | denial + audit-record |
| Rubygems adapter | +2 | denial + audit-record |
| **Total added** | **+8** | 35,184 → 35,192 in the full suite |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 29 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: **20 → 20** (UNCHANGED).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: **8 → 8** (UNCHANGED).

## Migration progress

| Surface | At v810 | At v811 | Δ |
|---|---|---|---|
| Egress `KNOWN_UNWIRED` | 15 | **11** | **−4** |
| Process `KNOWN_UNWIRED` | 38 | 38 | 0 |

All 5 registry adapters in `src/dependency-auditor/registry-adapters/` are now wired. The remaining 11 egress `KNOWN_UNWIRED` entries span 6 distinct surface families (alternative-discoverer, aminet, chips, intelligence-ipc, mcp-skill-installer, site-deploy, terminal-health), each requiring per-family recon.

## Forward path

- **First ProcessContext chip** — 38 callers untouched. Same playbook applied to a high-value process caller.
- **NASA 1.179** — 29 consecutive at 1.178; still the most visible open item.
- **Audit-orchestrator-level denial-rethrow test** — flagged at v809 close as a coverage gap. Worth a follow-on ship if a future chip touches the orchestrator again.
