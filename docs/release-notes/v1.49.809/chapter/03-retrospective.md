# v1.49.809 — Retrospective

**Wall-clock:** ~30-35 min from session-start to tag-push. Third ship of the 4-ship chain.

## What worked

**Recon caught a latent bug the v806 ship didn't see.** When v806 wired `osv-client.ts` as the EgressContext reference consumer, it correctly hoisted `ensureEgressAllowed()` outside the osv-client's local try/catch. But v806 didn't audit the orchestrator's call to `osvClient.queryBatch(...)` — and the orchestrator's `adapter.fetchHealth(...)` is wrapped in a swallow-everything try/catch at audit-orchestrator.ts:116. So even though v806's osv-client correctly throws `EgressContextDenied`, the orchestrator's catch at line 113-130 was eating it (along with network errors). This is exactly the "load-bearing surface swallowed by accessory error-handling" pattern that #10427 was codified to prevent. v809's recon caught it; the chip ship fixed it. Two birds: the wire AND the orchestrator bug, in one ship.

**The interface widening was free with `?:` syntax.** Adding `ctx?: EgressContext` to `RegistryAdapter.fetchHealth` is a backward-compatible change (TS covariance + optional params) — none of the other 4 sibling adapters needed modification, and the orchestrator's call site just adds a 2nd arg. The interface and the wired npm adapter ship together; the unwired siblings stay in `KNOWN_UNWIRED`. Lightest-wire shape.

**The audit-test caught my documentation as a false-positive.** When I added a docstring to `registry-adapter.ts` that included the literal characters `fetch(` (in "BEFORE any `fetch()` so..."), the egress audit-test correctly flagged the interface file as "calls fetch() but does not call ensureEgressAllowed()." That's the audit doing exactly what it should — the regex `\bfetch\(` matches the literal substring regardless of comment context. The fix was to add `Role: NOT an egress caller` to the docstring (one of the audit's documented escape hatches per v806's `loader-context-audit.test.ts` pattern). This validates that the audit-test's regex is conservative-enough: false positives are surfaced as test failures (with a clear migration guide) rather than slipping through. Per #10427, the audit is a load-bearing surface; the false positive was a feature, not a bug.

**The defensive denial-rethrow uses `instanceof`, not a string check.** Initial sketch used `if (err?.message?.includes('EgressContextDenied'))`. Rejected — the error class hierarchy is the canonical typecheck, and `instanceof` survives refactoring of the error message. Per #10427's "load-bearing surfaces must distinguish error classes" stance, the type check IS the contract.

## What surprised

**Field name `target` not `url` in EgressAuditRecord.** My first test draft used `record.url` for the URL assertion; the actual field is `record.target`. Caught by the failing test, fixed by re-reading the type. Tells me the v806 audit harness wasn't where I should have grepped for shape; the type definition was. Minor lesson on which source-of-truth to read first.

**The orchestrator never had a test for the swallow bug.** None of the 5 existing `audit-orchestrator.test.ts` tests exercised the "EgressContextDenied gets swallowed by adapter catch" path. This makes sense in hindsight — the v806 osv-client wire was the FIRST time any orchestrator-downstream call could throw EgressContextDenied, and v806 didn't add an orchestrator-level test for the rethrow because nothing in the orchestrator was wiring egress yet. The orchestrator's coverage gap was latent until v809 wired npm too. Would be worth adding an `audit-orchestrator.test.ts` test specifically asserting "EgressContextDenied propagates from adapter.fetchHealth through the catch block" — but kept off this ship's scope per #10416.

**The npm.test.ts EgressContext shape was non-obvious without reading egress-context.ts.** I sketched the ctx as `{ allowedUrlPatterns, sink }` based on memory; actual shape is `{ allowList, audit }` (different names). Caught by typecheck. Tells me the v806 release-notes summary used different names than the implementation — worth checking if other future chip-ship operators will hit the same gotcha. Tentative observation: when v806's release notes were written, the field names may have been different; the implementation may have evolved post-ship without updating release notes. Not a candidate; just noted.

## What to watch

- **Orchestrator test coverage for denial-rethrow.** The new orchestrator behavior (instanceof check + re-throw) has no direct test. The npm.test.ts EgressContext tests cover the adapter-level wire; the orchestrator-level rethrow is exercised transitively only when the AuditOrchestrator is called with both `egressContext` (restricted) AND a manifest containing npm deps. Worth adding a dedicated test if a future chip ship touches the orchestrator again.
- **Other 4 registry adapters batch-chip.** With the interface widened and orchestrator threading complete, wiring pypi/cargo/conda/rubygems is mechanical: ~3 lines per adapter + 2 tests each. A future single chip ship could close all 4 — bringing egress `KNOWN_UNWIRED` from 15 → 11 in one ship. The 5-1-1 alternation per #10430 favors interleaving with forward-cadence; the 4-adapter batch is a natural alternation cell.
- **The chained-ship pattern is holding.** 3 of 4 ships shipped in ~100-120 min total wall-clock. The chain shape is working as designed: each ship is self-contained, small enough to verify in isolation, and the cumulative compression vs single-ship-context-load is real (no need to re-orient on each new ship; the chain context carries forward).

## Verdict on scope

Chip closure landed in the smallest viable shape: 1 adapter wire + 1 interface widening + 1 orchestrator catch fix + 2 new tests + 1 KNOWN_UNWIRED entry removal + 5 release-notes files. Resisted: batching all 5 sibling adapters; building a per-adapter constructor-injection alternative; adding orchestrator-level denial-rethrow tests. All resistances paid off — the diff stays tight, the migration pattern is now established for follow-on chips, and the load-bearing #10427 bug got fixed as a side effect of the recon.

After v809, the chain stands at 3 of 4 (S5 + S2 + chip). Ship 4 is T1.3 recon — read-only, no commits expected. Chain wall-clock estimate: ~30-40 min for recon + write-up.

The KNOWN_UNWIRED chip pattern is now substrate. Each subsequent chip ship can be smaller (no interface widening or orchestrator-level work needed — just adapter wire + audit-test entry removal). Estimated future chip cost: ~10-15 min per adapter or per call site.
