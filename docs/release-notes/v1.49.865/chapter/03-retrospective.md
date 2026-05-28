# v1.49.865 — Retrospective

**Wall-clock:** ~8 min from v864 close. New floor for chip wall-clock — at the hoist-before-fetch strict-fail variant, no try/catch consideration needed.

## What went as expected

- **Strict-fail surface is the simplest chip variant.** No try/catch around the fetch; the audit denial and HTTP-error throw share the same propagation path. Wire takes 2 source LOC (param + hoisted call).
- **Cross-audit tool's 8th consecutive clean application.**

## What I noticed

- **Aminet family has 3 KNOWN_UNWIRED entries** (index-fetcher, index-freshness, package-fetcher). v865 chips index-freshness; siblings remain. Could batch-chip the family in one ship per the v811 registry-adapters pattern — but operator's plan is singletons.

## Carried forward (post-v865)

NEW this ship: 0 observations.

REINFORCED:
- Cross-audit tool continuous-verification (v858-v865, 8 instances).

## Campaign progress

**9 of ~11 ships shipped.** Track 3 at 3 of ~5; v866 + v867 remaining.
