# v1.49.811 — Retrospective

**Wall-clock:** ~20-25 min from session-start to tag-push. Second ship of the v810-814 chain. Smallest ship in the chain by a wide margin.

## What worked

**The v809 infrastructure paid dividends exactly as predicted.** The v809 retrospective said: "The 4 remaining sibling registry adapters (cargo, conda, pypi, rubygems) can now be batch-chipped in a single ~15-20 min ship with no interface or orchestrator work — purely mechanical per-adapter wires." Actual wall-clock: ~20 min for the 4 adapters + 8 tests + KNOWN_UNWIRED edit. Estimate was correct to within ~5 min. The pattern is now fully substrate.

**Conda's 2-channel form was less work than feared.** Recon found conda has a shared `tryChannel(channel, name)` helper called twice. Threading `ctx?` through the helper signature (not duplicating the ensure across channels) kept the diff small (~5 lines for conda vs ~3 for the others). The test asserts audit-record emission per channel probed — natural validation that the helper runs the ensure once per call (not just once per fetchHealth).

**Single test pattern copied 4× without refactor temptation.** Each adapter's `EgressContext integration` describe block is structurally identical (denial + audit-record). The temptation to extract a shared test helper (`makeEgressDenialTest('npm', '/^https:\\/\\/registry\\.npmjs\\.org\\//')`) was real but resisted per #10416. With 5 instances now (npm + 4 here), refactoring is borderline-justified at #10426 (cross-class registry extraction at 2nd-3rd instance), but the test variance (conda's 2-channel form has 2 audit records, others have 1) means the shared helper would need a per-adapter shape override. Net: not worth it yet. Re-evaluate if a 6th adapter is added.

**The `KNOWN_UNWIRED` block-comment consolidation.** When all 5 registry adapters are wired, listing 5 individual `// wired at vX.Y.Z` lines pollutes the allowlist. Replaced with a single line: `// 5 registry adapters wired through EgressContext: npm.ts at v1.49.809; cargo.ts + conda.ts + pypi.ts + rubygems.ts batch at v1.49.811.` Cleaner ledger; the wire history is still in the per-adapter docstrings and the release notes.

## What surprised

**conda's `tryChannel` swallow-try is documented as `catch {}` (no parameter).** The catch block is `catch { return null }` — no `err` parameter, no logging. This makes the swallow more obvious (vs the npm-style `catch (err)` with a `throw new Error(...)` re-wrap). Per #10427, the `catch {}` form is the right shape when the surface is observability-fallback (probe channel, return null, try next). The hoist BEFORE this catch ensures `EgressContextDenied` doesn't get silently swallowed.

**The audit-test caught no false positives this ship.** Unlike v809 (where the docstring `fetch(` substring tripped the audit), the 4 adapter docstrings only contain `ensureEgressAllowed` and `EgressContext` keywords. The audit's regex (`\bfetch\(`) only matches actual `fetch(` call patterns in code. Clean ship. (Maybe related: this ship's docstring updates use the word "fetch" but never the literal `fetch(` token — could be a discipline worth naming, but tentative.)

**No orchestrator changes needed.** v809 did the load-bearing orchestrator work (interface widening, ctx threading, `instanceof EgressContextDenied` re-throw). v811's adapter wires inherit all of that — the orchestrator doesn't change at all. This is the textbook "infrastructure ship vs mechanical ship" split: v809 spent ~30 min building the substrate; v811 spent ~20 min consuming it 4×.

## What to watch

- **The audit-test's KNOWN_UNWIRED count dropped from 15 → 11 (−4).** Next "batch potential" is uneven: aminet has 3 files (index-fetcher, index-freshness, package-fetcher) that likely share shape; alternative-discoverer has 2 (equivalent-searcher, fork-finder) that likely share shape; chips has 2 (anthropic-chip, http-client) that may or may not. Each batch ship would need its own per-family recon.

- **5-adapter chokepoint pattern is now substrate.** Future registry additions (a hypothetical 6th adapter for some-new-ecosystem) inherit the wire shape automatically: just `import { ensureEgressAllowed, type EgressContext }`, add `EGRESS_SOURCE`, accept `ctx?`, hoist the ensure. The shape is the cost of adding an adapter.

- **conda's per-channel audit-record emission is a coverage win.** Previously, observability into "which channel did conda find this package in" was hidden inside the adapter. The new audit records make it visible at the EgressAudit sink. Not a new feature, but a side-effect of the ctx wire that's worth flagging for any operator who builds observability dashboards on the audit records.

- **The 6-family migration cadence implied by 11 remaining.** At 1-batch-per-family, ~6 more chip ships needed to drain egress KNOWN_UNWIRED to 0. The 5-1-1 alternation per #10430 spaces these out naturally with forward-cadence ships in between.

## Verdict on scope

Batch chip closure landed at the minimum-mechanical shape: 4 adapter wires + 8 tests + 1 KNOWN_UNWIRED removal + 5 release-notes files. No new substrate, no interface changes, no orchestrator work, no shared test helper. The pure-consumption ship validated v809's infrastructure investment and dropped egress KNOWN_UNWIRED by ~27% in one ship.

After v811, the v810-814 chain stands at 2 of 5. Next: v812 = first ProcessContext chip. ProcessContext is the v806 sibling of EgressContext (same surface shape, different domain). Should follow the same playbook with a few process-specific details to recon (`ensureProcessAllowed` instead of `ensureEgressAllowed`, ProcessContextDenied error class, etc.).

The chain wall-clock pattern so far: v810 ~35 min (T1.3 substrate-consumer wire) + v811 ~20 min (4-adapter batch chip). Mechanical chip ships are roughly half the cost of substrate-introducing or substrate-consuming ships. The pattern matches the v809 retrospective's prediction.
