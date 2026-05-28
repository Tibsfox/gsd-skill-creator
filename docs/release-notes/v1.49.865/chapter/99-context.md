# v1.49.865 — Context

## Provenance

Ninth ship of the operator-directed v857-v867 follow-on campaign; **third chip of Track 3**.

`src/aminet/index-freshness.ts` chosen: 161 LOC, single fetch() to Aminet RECENT, strict-fail surface (HTTP errors throw directly).

## What this ship adds

```
src/aminet/index-freshness.ts                   [MODIFIED: ctx? threaded through fetchRecent; hoisted ensureEgressAllowed before fetch]
src/aminet/index-freshness.test.ts              [MODIFIED: +1 EgressContext wire test case]
src/security/egress-context-audit.test.ts       [MODIFIED: removed from KNOWN_UNWIRED + v865 comment]
docs/release-notes/v1.49.865/                   [NEW: README + 4 chapters]
```

## Wire shape

Hoist-before-fetch on a strict-fail surface. 2 source LOC.

## Chip status

**Track 3 progress: 3 of ~5 chips shipped.** Remaining: ~2 chips, v866-v867.

KNOWN_UNWIRED Egress: 9 → 8.

## References

- Predecessor: v1.49.864
- Cross-audit tool: clean (8th consecutive)
