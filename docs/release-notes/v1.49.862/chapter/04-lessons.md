# v1.49.862 — Lessons

## Tentative observations (below promotion threshold)

### Chip-pick by size correlates with wire-shape diversity

**Instances: 1 (v862 — observation across the v858-v862 Track 2 batch)**

**Observation:** When chip ships are picked size-ascending (smallest LOC first), the wire shapes naturally progress from simple variants (hoist-at-top) to complex variants (internal-helper, closure-capture). Smaller files tend to have single call sites that fit hoist-at-top; larger files tend to have helpers (internal-helper variant) or factories (closure-capture variant). The natural progression covers the variant catalog without explicit planning.

Track 2 evidence (v858-v862):
- v858 drift/cli.ts (81 LOC) — hoist-at-top
- v859 chipset/blitter/executor.ts (220 LOC) — hoist-outside-Promise + cleanup
- v860 intelligence/provenance/linker.ts (408 LOC) — internal-helper
- v861 cli/commands/keystore.ts (167 LOC) — hoist-outside-Promise (no cleanup)
- v862 scan-arxiv/ranker.ts (560 LOC) — closure-capture

**Why below threshold:** First instance. Track 3 Egress batch will provide the 2nd instance for confirmation.

**Promotion gate:** 2nd instance from Track 3 Egress batch. Sub-pattern of #10416 (lightest wire) — the size-ascending heuristic surfaces the lightest viable wire first.

### Cross-audit tool continuous-verification (5th instance — promotion-eligible)

**Instances: 5 (v858-v862)**

**Observation:** The v857 cross-audit tool (`tools/security/check-stale-known-unwired.mjs`) has run silently clean for 5 consecutive chip ships. Sub-second runtime; reports clean every time. This is the operational manifestation of #10443: the codified discipline runs as a continuous-verification check, not as an audit-time-only check.

**Why at-threshold:** 5 instances cross the standard promotion threshold for "discipline-as-code in steady operational use." 

**Promotion gate:** MET. Worth codifying at the next codify ship as a refinement of #10443. Possible new sub-section in `docs/known-unwired-ledger-discipline.md` titled "## Inverse-audit continuous-verification mode" documenting the per-chip-post-edit invocation pattern + the silent-when-clean operational contract.

## Forward-test of existing lessons

### #10416 — Lightest wire

**Status:** APPLIED. Closure-capture is the lightest wire for factory-built functions: factory accepts ctx, closure captures it, check runs at each invocation. No extra parameter on the JudgeFn type signature; no wrapper class.

### #10427 — Failure-mode contracts

**Status:** APPLIED. Hoisted check inside JudgeFn closure BEFORE the Promise constructor; ProcessContextDenied propagates through the JudgeFn await per the async-function throw machinery.

### #10443 — Inverse-audit stale-entry detection (codified v857)

**Status:** APPLIED + REINFORCED. 5th consecutive chip-ship application. Tool runs clean post-wire.

### #10432 — KNOWN_UNWIRED as migration-debt ledger

**Status:** APPLIED. Process KNOWN_UNWIRED 7 → 6.

## No promotions this ship

Eligible backlog: 0. (Cross-audit continuous-verification becomes eligible — flagged for next codify ship.)
