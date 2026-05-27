# v1.49.811 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + 8 tentative observations (UNCHANGED from v810).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read all 4 adapter implementations + v809 npm pattern + v809 npm test pattern + the audit-test KNOWN_UNWIRED list BEFORE editing. Recon surfaced conda's 2-channel form (requiring ctx-threading through `tryChannel`) and confirmed all 5 adapters share enough structural similarity for one batch ship to be correct sizing. |
| #10414 | Chokepoint retrofit, optional ctx? pattern | All 4 adapters use optional `ctx?: EgressContext` — zero call-site churn. |
| #10416 | Tolerant-generator / lightest wire | Resisted: extracting a shared `wireRegistryAdapter` helper (premature at 4 instances of identical shape with 1 variance — conda's 2-channel); adding orchestrator-level denial-rethrow test (separate forward observation from v809); refactoring conda's 2-channel form to a uniform pattern. Chose: mechanical per-adapter wires + shared shape via copy. |
| #10422 | Verdict-pattern surface separation | Audit-test enforcement (`egress-context-audit.test.ts`) and per-adapter wires ship in the same commit (#10416 keeps them coupled at this scale; #10422 would split them at larger scale). |
| #10426 | Cross-class registry extraction at 2nd instance | The 5-adapter shape was already extracted via `RegistryAdapter` interface at v809. This ship validates the extraction (4 siblings chip against the same interface without any interface drift). |
| #10427 | Failure-mode contracts | All 4 adapters hoist `ensureEgressAllowed` OUTSIDE network-failure try/catch. conda's `tryChannel` hoist is the most interesting case: the helper has `catch { return null }` (parameter-less swallow), and the ensure runs as the FIRST statement after URL computation — denial fires before any try. |
| #10430 | 5-1-1 alternation | Second chip ship (v809 was first). Chip + chip is acceptable per #10430 when the second ship is mechanical extension of substrate the first ship built. |

## Tentative observations carried forward (8 — UNCHANGED from v810)

No changes this ship.

## New observations flagged this ship (not promoted; not in count)

**Post-infrastructure chip cadence is ~2× faster than substrate-introducing chip cadence.** v809 (substrate-introducing chip: 1 adapter + interface + orchestrator) = ~30-35 min. v811 (post-infrastructure batch chip: 4 adapters) = ~20-25 min total for 4× the count. Per-adapter wall-clock dropped from ~30 min (v809) to ~5 min (v811). Tentative observation; not a candidate (~2 data points). Worth flagging if a 3rd batch ship (e.g. aminet-family or alternative-discoverer-family) confirms the ~5-min-per-adapter rate.

**Block-comment consolidation in audit-test allowlists when N siblings are all wired.** When all 5 registry adapters became wired, listing each individually (`// npm.ts wired at v1.49.809`, `// cargo.ts wired at v1.49.811`, ...) would have 5 comment lines. Consolidated into a single line referencing the family + 2 wire dates. Cleaner ledger; per-adapter wire history lives in the per-adapter docstrings and release notes. Not a candidate; just a hygiene pattern for future family-batch ships.

## Cross-references

- #10412 + #10416 → recon-first sized this as a single batch ship (4 adapters in one) rather than 4 single-adapter ships
- #10414 + v809 infrastructure → optional `ctx?:` patterns compose across siblings without per-adapter call-site churn
- #10422 + #10416 → audit-test and wire-implementation can ship together when the diff is small enough to keep the ship reviewable

## What this ship illustrates about migration ROI

| Ship | Type | Adapters touched | Wall-clock | Adapters/min |
|---|---|---|---|---|
| v809 | substrate-introducing chip | 1 (npm) + interface + orchestrator | ~30-35 min | 0.03 |
| v811 | post-infrastructure batch chip | 4 (cargo + conda + pypi + rubygems) | ~20-25 min | 0.17-0.20 |

Post-infrastructure batch chip throughput is roughly 6× substrate-introducing chip throughput at the per-adapter level. The substrate cost is paid once (v809); the consumption ratio is the right metric for forward planning ("4 more registry-family adapters" reads to ~5-min-each).

For the 11 remaining egress KNOWN_UNWIRED entries:
- Aminet family (3 files): expected ~30-40 min as substrate-introducing for one family + ~10-15 min mechanical for the other two = ~45-55 min total
- Alternative-discoverer family (2 files): similar — ~30 min for one + ~10 min for the other = ~40 min total
- Chips family (2 files): unclear if they share shape; per-family recon needed before sizing
- intelligence-ipc, mcp-skill-installer, site-deploy, terminal-health (4 singletons): ~20-30 min each = ~80-120 min total

Approximate total to drain egress KNOWN_UNWIRED to 0: ~3-5 hours across 5-7 ships. Reasonable to interleave with forward-cadence per #10430.
