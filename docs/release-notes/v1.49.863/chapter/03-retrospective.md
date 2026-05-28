# v1.49.863 — Retrospective

**Wall-clock:** ~12 min from v862 close to v863 close. Below the chip-cluster floor — the Egress wire pattern is structurally identical to Process hoist-at-top, just with `ensureEgressAllowed` instead of `ensureProcessAllowed`.

## What went as expected

- **Egress wire pattern is a 1-to-1 analog of Process hoist-at-top.** Same shape: import + ctx? param + hoisted check + try/catch unchanged. Drop-in.
- **Cross-audit tool's 6th consecutive clean application.** v858-v863. Now 1 instance past the 5-instance promotion threshold flagged at v862.
- **Track 3 opens cleanly.** No discipline-as-code work needed; the Egress audit-test already had shape A inverse-check at v838.

## What I noticed

- **fetch is signature-driven, not import-driven.** Egress's chokepoint triggers on `fetch(` global call, not on a module import. This means Shape B (import-without-use) doesn't apply — the existing audit-test's "KNOWN_UNWIRED contains fetch(" check IS the shape-B equivalent.
- **Mocked fetch in tests is the established pattern.** existing terminal/health.test.ts already mocks globalThis.fetch via `vi.fn()`. Wire tests slot in without infrastructure changes.

## What surprised me

- **The chip transferred without any new lessons.** Track 2 surfaced 5 distinct wire shapes; Track 3's first chip exercises the established hoist-at-top variant. The variant catalog stays at 5; doesn't grow this ship.

## Risk that didn't materialize

- **No audit-test regression.** 2052 PASS (Egress audit has one extra "rejects KNOWN_NOT_EGRESS contradictions" test vs Process).
- **No fetch-mock leak.** The afterEach restores originalFetch; the 2 new tests don't perturb the existing 12 cases.
- **No backward-compat break.** checkHealth(url) and checkHealth(url, timeoutMs) and checkHealth(url, timeoutMs, ctx) all work.

## Carried forward (post-v863)

NEW this ship: 0 below-threshold observations. The Egress wire is a clean transfer of established Process patterns.

REINFORCED:
- Cross-audit tool continuous-verification (v858-v863, 6 instances). Past promotion threshold (5). Worth codifying at next codify ship.
- Chip-pick by size correlates with wire-shape diversity (Track 2 evidence; Track 3 opening is consistent — picked smallest first).

UNCHANGED:
- v857-v847 1-instance observations carry forward.

## Campaign progress

**7 of ~11 ships shipped.** Track 1 closed; Track 2 closed (5/5); Track 3 at 1 of ~5.

Remaining Track 3 candidates (10 entries; size-ascending):
- `src/alternative-discoverer/equivalent-searcher.ts` (108 LOC, 1 fetch)
- `src/alternative-discoverer/fork-finder.ts` (151 LOC, 2 fetch)
- `src/aminet/index-fetcher.ts` (213 LOC, 1 fetch)
- `src/aminet/index-freshness.ts` (161 LOC, 1 fetch)
- `src/aminet/package-fetcher.ts` (177 LOC, 2 fetch)
- `src/chips/anthropic-chip.ts` (247 LOC, 2 fetch)
- `src/chips/http-client.ts` (350 LOC, 2 fetch)
- `src/intelligence/ipc.ts` (516 LOC, 1 fetch)
- `src/mcp/skill-installer.ts` (401 LOC, 1 fetch)
- `src/site/deploy.ts` (193 LOC, 1 fetch)
