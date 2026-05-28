# v1.49.867 — EgressContext singleton chip: `src/alternative-discoverer/fork-finder.ts` (Track 3 close)

**Released:** 2026-05-28

## Why this ship

Fifth and final chip of Track 3. Closes the v857-v867 operator-directed follow-on campaign (11/11 ships). GitHub fork analyzer — 2 fetch sites (forks list + per-fork releases). Picked last in Track 3 because the two-site pattern is structurally distinct from the prior single-fetch chips.

## The wire

```ts
findForks(dep, registryMeta, ctx?: EgressContext)
  → ensureEgressAllowed(ctx, source, 'fetch', forksUrl)  // site 1
  → fetch(forksUrl)
  → Promise.all(forks.map(async (fork) => {
      ensureEgressAllowed(ctx, source, 'fetch', releasesUrl)  // site 2
      → fetch(releasesUrl)
    }))
```

Two-site hoisted-check variant. Each fetch gets its own hoisted check.

## v857 cross-audit tool bug + fix

The v867 wire-shape comment contained "all errors return []" — colliding with the tool's non-greedy regex terminator. Tool reported 0 entries instead of 6. Fixed by hardening the regex with `^\s*\]\s*\)` (multi-line flag + line-start anchor). First real-world bug in the v857 tool; surfaced at v867 authoring.

## Track 3 closure (5 chips, 5 wire shapes)

| Ship | File | Wire shape |
|---|---|---|
| v863 | terminal/health.ts | Hoist-at-top fetch |
| v864 | alternative-discoverer/equivalent-searcher.ts | Hoist-at-top + non-npm bypass |
| v865 | aminet/index-freshness.ts | Hoist-before-fetch strict-fail |
| v866 | site/deploy.ts | DI-fetch-wrapper (Egress analog of #10441) |
| v867 | alternative-discoverer/fork-finder.ts | Two-site hoisted-check |

KNOWN_UNWIRED Egress 11 → 6 (-5, -45%).

## Campaign closure (v857-v867, 11/11)

| Track | Ships | Outcome |
|---|---|---|
| 1 — Codify | v857 (1 ship) | #10443 promoted + tool shipped |
| 2 — Process chips | v858-v862 (5 ships) | KNOWN_UNWIRED Process 11→6 |
| 3 — Egress chips | v863-v867 (5 ships) | KNOWN_UNWIRED Egress 11→6 |

10 distinct wire shapes across Tracks 2 + 3. Cross-audit tool 10 consecutive applications; 1 bug fixed.

## Surface delta

- 4 files modified (3 source + 1 tool fix)
- +18 source LOC + 50 test LOC + 4 tool LOC
- KNOWN_UNWIRED Egress: 7 → 6
- **Campaign close: 11/11 ships SHIPPED**

## Engine state

NASA degree at **1.178** (UNCHANGED — 85 consecutive ships at 1.178).

## Stale-audit (v857 tool, 10th application; 1st bug fix)

clean post-fix (Process 6, Egress 6, 0 stale).
