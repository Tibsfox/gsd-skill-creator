# v1.49.809 — KNOWN_UNWIRED Chip 1: NpmRegistryAdapter

**Released:** 2026-05-27
**Type:** chip ship (security-chokepoint migration; no new substrate)
**Predecessor:** v1.49.808 — S2 Adoption Telemetry Trend Report
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** chip the first of 16 grandfathered egress callers from the v806 `KNOWN_UNWIRED` allowlist, demonstrating the migration pattern + fixing a load-bearing failure-mode contract bug in the orchestrator's adapter catch block (per Lesson #10427).

## Summary

First migration ship from the v806 chokepoint extension's `KNOWN_UNWIRED` grandfathered allowlists. Wires `NpmRegistryAdapter.fetchHealth` through `EgressContext`, widens the `RegistryAdapter` interface to admit the optional context parameter, and fixes a load-bearing bug in `audit-orchestrator.ts`: the adapter catch block was swallowing `EgressContextDenied` along with network errors, which would have made security denials invisible. Per Lesson #10427, security denials are load-bearing and must propagate; the orchestrator now uses `instanceof EgressContextDenied` to re-throw denials while continuing to swallow accessory failures.

The chip-down rate begins at 1 file per ship — the audit said "16 egress + 38 process callers tracked since v806; natural 5-1-1 alternation partner per #10430." A future ship can batch-chip the 4 remaining sibling registry adapters (cargo, conda, pypi, rubygems) since the interface widening + orchestrator wire are already in place.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/dependency-auditor/registry-adapters/npm.ts` | MODIFIED | `fetchHealth(dep, ctx?)` calls `ensureEgressAllowed(...)` BEFORE the network try/catch. Source label: `dependency-auditor/npm-registry`. |
| `src/dependency-auditor/registry-adapter.ts` | MODIFIED | Interface widened: `fetchHealth(dep, ctx?: EgressContext)`. Docstring annotates the wiring discipline + adds `Role: NOT an egress caller` header (interface file's docstring contains literal `fetch(` substrings used in the audit-test regex; the role header satisfies the audit). |
| `src/dependency-auditor/audit-orchestrator.ts` | MODIFIED | `this.config.egressContext` threaded to `adapter.fetchHealth(...)` and `osvClient.queryBatch(...)`. Adapter catch block uses `instanceof EgressContextDenied` to re-throw security denials while swallowing accessory failures (load-bearing per #10427). |
| `src/dependency-auditor/types.ts` | MODIFIED | `AuditorConfig.egressContext?: EgressContext` field added. |
| `src/dependency-auditor/registry-adapters/npm.test.ts` | MODIFIED | +2 tests in new `EgressContext integration` describe block: denial-before-fetch + audit-record emission. |
| `src/security/egress-context-audit.test.ts` | MODIFIED | `npm.ts` removed from `KNOWN_UNWIRED`. 16 egress callers → 15. |

## Lessons applied (no new lesson IDs promoted this ship)

| Lesson | Application |
|---|---|
| #10412 (recon-first) | Read `osv-client.ts` (the v806 reference wire) + `npm.ts` + `audit-orchestrator.ts` + `registry-adapter.ts` + a representative sibling adapter (`pypi.ts`) BEFORE writing the chip. Recon surfaced: (a) the orchestrator's catch site at line 116 swallows ALL fetchHealth errors — a known security-failure-mode bug per #10427 latent since the orchestrator was first written; (b) all 5 registry adapters share the same shape; (c) interface widening is needed because the orchestrator types its adapter as `RegistryAdapter` and would fail to typecheck a 2-arg call without the interface update. |
| #10414 (chokepoint retrofit pattern) | Mirrored the v806 LoaderContext/ProcessContext shape verbatim: optional `ctx?` param, ensure*Allowed() outside try, default = call-site-provided permissive context. |
| #10416 (lightest wire) | Resisted: wiring all 5 sibling registry adapters in one ship; wiring osv-client's other call paths beyond what v806 already wired; rebuilding the orchestrator catch/retry logic. Chose: 1 adapter wire + 1 orchestrator catch fix + interface widening for future chips. |
| #10422 (verdict-pattern surface separation) | The chokepoint enforcement (audit-test) lives in `src/security/`. The wire decision (which adapters to chip) lives in operator judgment + the per-ship release notes. KNOWN_UNWIRED entry removal is the audit's BehaviorViewpoint update. |
| #10427 (failure-mode contracts) | THE central application this ship. The orchestrator's catch block was swallowing `EgressContextDenied` along with network errors. Hoisted `ensureEgressAllowed(...)` outside the adapter's local try/catch (in the adapter) AND added `instanceof EgressContextDenied` re-throw in the orchestrator's catch (so denial bubbles up to the AuditOrchestrator caller). |

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a wire of all 5 sibling registry adapters. The 4 remaining (cargo, conda, pypi, rubygems) stay in `KNOWN_UNWIRED` for a future batch-chip ship.
- Not a wire of any `ProcessContext` callers. The 38 process-callers list is unchanged.
- Not a new test harness or infrastructure. Pure migration shape.

## Verification

- `npm run build` → PASS.
- `npx vitest run src/dependency-auditor/ src/security/egress-context-audit.test.ts` → 2,058/2,058 PASS.
- `node tools/state-md-normalizer.mjs --check` → exits 0 (clean STATE.md).
- `node tools/project-md-normalizer.mjs --check` → drift WARN within bounded gate threshold (v807-introduced ceiling, 3 patches).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 27 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: **20 → 20** (UNCHANGED).
Open lesson candidate backlog: 0 (UNCHANGED).
Tentative observations carried forward: 8 (UNCHANGED).

## Migration progress

| Surface | At v806 (initial) | At v809 (this ship) |
|---|---|---|
| Egress `KNOWN_UNWIRED` | 16 | 15 |
| Process `KNOWN_UNWIRED` | 38 | 38 |

## Forward path

- **NASA 1.179** — 27 consecutive at 1.178.
- **Batch-chip the 4 sibling registry adapters** (cargo, conda, pypi, rubygems) — interface is widened, orchestrator threads ctx, denial-rethrow is in place; each follow-on chip is ~3 lines per adapter + ~2 tests each.
- **T1.3 recon** — next slot in the chain.
