# v1.49.809 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + 8 tentative observations (UNCHANGED from v808).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read `osv-client.ts` + `npm.ts` + `audit-orchestrator.ts` + `registry-adapter.ts` + `pypi.ts` BEFORE writing the chip. Recon caught the latent orchestrator swallow bug — would have shipped a "wired" adapter whose denials were invisible without the orchestrator catch fix. |
| #10414 | Chokepoint retrofit pattern | Mirrored v806 LoaderContext shape: optional `ctx?` param, ensure*Allowed() outside try, default = call-site permissive. |
| #10416 | Tolerant-generator / lightest wire | Resisted batching all 5 sibling adapters; chose 1 adapter + interface widening + orchestrator fix. |
| #10422 | Verdict-pattern surface separation | Chokepoint enforcement lives in `src/security/`; wire decision lives in operator judgment + release notes. KNOWN_UNWIRED entry removal is the audit's BehaviorViewpoint update. |
| #10426 | Cross-class registry extraction at 2nd instance | All 5 registry adapters share one extracted interface (RegistryAdapter); widening the interface in this ship sets up the pattern for the remaining 4 chips without recomputing the shape each time. |
| #10427 | Failure-mode contracts: load-bearing surfaces fail loudly | THE central application. Adapter's `ensureEgressAllowed()` is hoisted outside the network-failure try (so EgressContextDenied throws cleanly). Orchestrator's catch block uses `instanceof EgressContextDenied` to re-throw security denials while continuing to swallow accessory network/registry errors. The bug was latent from v806; v809's recon caught it. |
| #10430 | 5-1-1 alternation | First chip-ship in the alternation cycle (forward cadence has been paused since v805 for the audit-retrospective sweep). Future cadence: chip + forward + chip + forward... per the audit's recommendation. |

## Tentative observations carried forward (8 — UNCHANGED from v808)

No changes this ship. The v809 chip ship is pure mechanical application of established patterns.

## New observation flagged this ship (not promoted; not in count)

**Audit-test catches docstring-as-call-site false-positive immediately.** When I added a docstring to `registry-adapter.ts` that contained the literal substring `fetch(`, the egress audit-test correctly flagged the interface file as a fetch caller. The fix was a one-line `Role: NOT an egress caller` doc header (an existing audit escape hatch). This validates that the audit's regex is conservative-enough: false positives surface as clear test failures with migration guidance, not as silent skips. Per #10427, the audit IS load-bearing; the false-positive flag is a feature. Tentative observation; not a candidate (the audit-test pattern is already codified in #10422 / #10414).

## Cross-references

- #10412 + #10427 → recon-first found a load-bearing failure-mode bug latent since v806
- #10414 + #10416 → established chokepoint shape extends across siblings with minimal per-chip cost
- #10422 + #10427 → audit-test is observability AND enforcement (load-bearing) — the false-positive catch validates that the audit is conservative enough

## What this ship illustrates about the chip-down cadence

The 4 remaining sibling registry adapters (cargo, conda, pypi, rubygems) can now be batch-chipped in a single ~15-20 min ship with no interface or orchestrator work — purely mechanical per-adapter wires. The cumulative cost of the full registry-adapter migration: v809 (1 adapter + infra) + 1 future ship (4 adapters) = total ~50-55 min for 5 adapters. Compared to grandfathering forever: the migration pays for itself in the second time anyone inherits the codebase or audits the security surface.

The 38 process callers remain untouched. ProcessContext follows the same shape as EgressContext (v806 sibling), so the same playbook applies: pick a high-value caller, wire it, fix any orchestrator swallow bugs encountered, demonstrate the pattern, remove from KNOWN_UNWIRED. A future ship can start the process-side chipping.
