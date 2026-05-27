# v1.49.811 — Batch Chip: cargo + conda + pypi + rubygems Registry Adapters

**Released:** 2026-05-27
**Type:** batch chip ship (security-chokepoint migration; no new substrate)
**Predecessor:** v1.49.810 — T1.3 Option A: gnn-predictor Wired Into Copper Activation
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** chip the remaining 4 sibling registry adapters from the v806 `EgressContext.KNOWN_UNWIRED` allowlist using the v809 npm pattern. Demonstrates the post-infrastructure chip cadence.

## Summary

Second chip ship in the EgressContext migration. v809 wired the first registry adapter (npm), did the load-bearing interface widening on `RegistryAdapter`, threaded `ctx?: EgressContext` through `AuditOrchestrator`, and fixed the orchestrator's `instanceof EgressContextDenied` re-throw bug. With that infrastructure in place, v811 is pure mechanical per-adapter wires: ~3 lines per adapter (import + signature + hoist) + 2 tests each (denial + audit-record).

The 4 adapters use a uniform shape inherited from v809:
- `EGRESS_SOURCE` constant per ecosystem (e.g. `dependency-auditor/cargo-registry`)
- `fetchHealth(dep, ctx?: EgressContext)` signature
- `ensureEgressAllowed(ctx, EGRESS_SOURCE, 'fetch', url)` hoisted BEFORE the network try/catch
- `EgressContext integration` describe block in each test file with 2 tests

Conda is the only adapter with a 2-channel form (conda-forge + bioconda). The ensure call lives inside the shared `tryChannel` helper, hoisted before its own swallow-try — so policy denial fires for the first channel probed before any fetch can execute. When ctx allows, audit records are emitted per channel probed (2 records when conda-forge 404s and bioconda succeeds).

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/dependency-auditor/registry-adapters/cargo.ts` | MODIFIED | wire pattern |
| `src/dependency-auditor/registry-adapters/conda.ts` | MODIFIED | wire pattern; `tryChannel` accepts `ctx?` and hoists ensure before its swallow-try |
| `src/dependency-auditor/registry-adapters/pypi.ts` | MODIFIED | wire pattern |
| `src/dependency-auditor/registry-adapters/rubygems.ts` | MODIFIED | wire pattern |
| `src/dependency-auditor/registry-adapters/cargo.test.ts` | MODIFIED | +2 tests (denial + audit-record) |
| `src/dependency-auditor/registry-adapters/conda.test.ts` | MODIFIED | +2 tests (denial-before-first-channel + audit-record-per-channel) |
| `src/dependency-auditor/registry-adapters/pypi.test.ts` | MODIFIED | +2 tests |
| `src/dependency-auditor/registry-adapters/rubygems.test.ts` | MODIFIED | +2 tests |
| `src/security/egress-context-audit.test.ts` | MODIFIED | 4 entries removed from `KNOWN_UNWIRED`; comment records the 5-adapter wire dates (npm v809, batch v811) |

## Lessons applied (no new lesson IDs promoted this ship)

| Lesson | Application |
|---|---|
| #10412 (recon-first) | Read all 4 adapter implementations + the v809 npm pattern + the v809 test pattern + the audit-test KNOWN_UNWIRED list BEFORE editing. Recon surfaced: (a) conda has a 2-channel form requiring ctx-threading into the `tryChannel` helper; (b) cargo includes a User-Agent header that doesn't affect the wire shape; (c) all 5 adapters share enough structural similarity that one batch ship is correct sizing per #10416. |
| #10414 (chokepoint retrofit, optional ctx? pattern) | All 4 adapters use optional `ctx?: EgressContext` — zero call-site churn for existing callers. |
| #10416 (lightest wire) | Resisted: extracting a shared `wireRegistryAdapter` helper (premature abstraction at 4 instances of identical shape); adding the orchestrator-level denial-rethrow test (separate forward observation flagged at v809); refactoring conda's 2-channel form to a uniform pattern. Chose: mechanical per-adapter wires with shared shape inherited via copy. |
| #10422 (verdict-pattern surface separation) | The audit-test (`egress-context-audit.test.ts`) is the load-bearing enforcement; the per-adapter wire is the decision implementation. KNOWN_UNWIRED removal is the audit's BehaviorViewpoint update; the entry-removal commit lines and the wire commit lines are the same ship per #10416. |
| #10426 (cross-class registry extraction at 2nd instance) | The 5-adapter shape was already extracted via the `RegistryAdapter` interface; this ship validates the extraction by chipping 4 siblings against it without any interface drift. |
| #10427 (failure-mode contracts) | All 4 adapters hoist `ensureEgressAllowed` OUTSIDE network-failure try/catch. conda's `tryChannel` hoist is the most subtle case: the helper swallows network errors to fall through channels, but `EgressContextDenied` must propagate. The ensure is the FIRST statement in `tryChannel` after the URL is computed — denial fires before any try. |
| #10430 (5-1-1 alternation) | Second chip ship in the alternation cycle (v809 was the first). Chip + chip is acceptable per #10430 when ships are mechanical extensions of an established pattern. |

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a wire of any ProcessContext callers. The 38 process-callers list is unchanged.
- Not a new test harness, an interface change, or new infrastructure. Pure mechanical per-adapter wires.
- Not an audit-orchestrator-level denial-rethrow test. That coverage gap was flagged at v809 close and remains for a future ship.

## Verification

- `npm run build` → PASS.
- `npx vitest run src/dependency-auditor/registry-adapters/ src/security/egress-context-audit.test.ts` → 2,073/2,073 PASS (was 2,065 at v810; +8 from the 4 new EgressContext integration test pairs).
- `bash tools/pre-tag-gate.sh` → all 17 steps PASS.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 29 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: **20 → 20** (UNCHANGED).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: **8 → 8** (UNCHANGED).

## Migration progress

| Surface | At v810 | At v811 |
|---|---|---|
| Egress `KNOWN_UNWIRED` | 15 | **11** (−4) |
| Process `KNOWN_UNWIRED` | 38 | 38 (UNCHANGED) |

All 5 registry adapters now wired. 11 egress callers remain across 6 distinct surface families (alternative-discoverer, aminet, chips, intelligence-ipc, mcp-skill-installer, site-deploy, terminal-health).

## Forward path

- **First ProcessContext chip** — 38 callers untouched. Same playbook as v809 EgressContext chip.
- **Post-T14-reset STATE.md drift closure** — counter-cadence ship to close the partial wedge from v807.
- **Codification audit** — overdue per #10428.
- **NASA 1.179** — 29 consecutive at 1.178.
