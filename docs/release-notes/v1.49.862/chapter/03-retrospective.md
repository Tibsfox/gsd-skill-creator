# v1.49.862 — Retrospective

**Wall-clock:** ~20 min from v861 close to v862 close. Slightly above floor because of the 3-layer threading + TS error on ArxivPaper schema.

## What went as expected

- **Closure-capture variant transferred cleanly.** Factory accepts ctx; returned function captures it. Same shape as setTimeout/setInterval closures common in JS — well-understood pattern.
- **5-chip Track 2 batch ships exactly to target.** Operator target was ~5 Process chips; delivered exactly 5 (v858-v862). KNOWN_UNWIRED Process 11 → 6 = -45%.
- **5 distinct wire shapes across 5 chips.** Each chip exercised a different variant. Coverage: hoist-at-top + hoist-outside-Promise (cleanup) + hoist-outside-Promise (no cleanup) + internal-helper + closure-capture. The remaining 6 KNOWN_UNWIRED Process entries trend toward larger files + DI-executor variants.

## What I noticed

- **TS error on ArxivPaper test fixture.** First fixture used `submittedAt` (wrong field name); tsc caught it after the runtime test passed. Reminder: build BEFORE shipping; runtime tests pass before type-checks because vitest transpiles independently.
- **Cross-audit tool 5th consecutive clean application.** At the standard 5-instance promotion threshold for "operational discipline-in-use." Worth codifying at the next codify ship (~v868-872).
- **ctx threading through 3 layers cost ~6 LOC.** Each layer (RankerOptions + buildDefaultJudge + buildCliJudge) needed a param add + a pass-through. Pattern: each architectural seam adds ~2 LOC for ctx threading.

## What surprised me

- **The 5-chip batch's variant diversity was a happy accident.** Operator's order (size-ascending) naturally exercised different shapes. Not a planned variant-coverage strategy. Worth tracking as a below-threshold observation: chip-pick by size correlates with wire-shape diversity because smaller files tend to have simpler wire shapes (hoist-at-top), and larger files trend toward helpers (internal-helper) or factories (closure-capture).

## Risk that didn't materialize

- **No audit-test regression.** 2051 PASS; file removed from KNOWN_UNWIRED.
- **No backward-compat break.** RankerOptions.ctx is optional; all existing callers continue to work without ctx.
- **No spawn-side-effect in tests.** The 2 wire tests deny the spawn via restrictive ctx; the real `spawn('claude', ...)` never runs (would otherwise fail because claude CLI isn't installed in CI).

## Carried forward (post-v862)

NEW this ship: 1 below-threshold observation.

- **Chip-pick by size correlates with wire-shape diversity** — 1 instance from this Track 2 batch. When chip ships are picked size-ascending (smallest first), the wire shapes tend toward simpler variants early + more complex variants late. The natural progression covers the variant catalog without explicit planning. Wait for 2nd instance from a future chip cluster (e.g., the Track 3 Egress batch). Likely classification: sub-pattern of #10416 (lightest wire).

REINFORCED:
- Cross-audit tool continuous-verification (v858-v862, 5 instances). Promotion-eligible at next codify ship. Refinement of #10443.

UNCHANGED:
- Pre-test FK-pragma pattern (v860, 1 instance).
- Pre-allocated-resource cleanup on security denial (v859, 1 instance).
- Codify + tool same-ship pattern (v857, 1 instance).
- v847 1-instance observations carry forward.

## Campaign progress

**6 of ~11 ships shipped.** Track 1 closed; **Track 2 closed (5/5)**; Track 3 (Egress chips) opens at v863.

Track 3 candidates: 11 KNOWN_UNWIRED Egress entries:
- alternative-discoverer × 2 (equivalent-searcher + fork-finder)
- aminet × 3 (index-fetcher + index-freshness + package-fetcher)
- chips × 2 (anthropic-chip + http-client)
- intelligence/ipc.ts
- mcp/skill-installer.ts
- site/deploy.ts
- terminal/health.ts

Plan: ~5 chips at v863-v867 following the size-ascending heuristic that paid off in Track 2.
