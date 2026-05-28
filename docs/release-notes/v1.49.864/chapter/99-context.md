# v1.49.864 — Context

## Provenance

Eighth ship of the operator-directed v857-v867 follow-on campaign; **second chip of Track 3**.

`src/alternative-discoverer/equivalent-searcher.ts` chosen per size-ascending heuristic: 108 LOC (2nd smallest after v863's 73 LOC).

## What this ship adds

```
src/alternative-discoverer/equivalent-searcher.ts        [MODIFIED: ctx? threaded through searchEquivalents + class wrapper; hoisted ensureEgressAllowed]
src/alternative-discoverer/equivalent-searcher.test.ts   [MODIFIED: +2 test cases]
src/security/egress-context-audit.test.ts                [MODIFIED: removed from KNOWN_UNWIRED + comment]
docs/release-notes/v1.49.864/                            [NEW: README + 4 chapters]
```

## Recon trail

1. Pick: `src/alternative-discoverer/equivalent-searcher.ts` (108 LOC, 1 fetch).
2. Read source: single fetch to npm registry search; fault-tolerant try/catch returns [].
3. Apply wire: import + ctx? param on searchEquivalents + class wrapper method + hoisted check.
4. Update audit-test KNOWN_UNWIRED.
5. Add 2 test cases (deny on npm dep + bypass for non-npm dep).
6. Run targeted tests + cross-audit. All pass.

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

## Wire shape (per Lesson #10427)

Hoist-at-top with non-npm early-return bypass. Class wrapper threads ctx via additional positional param.

## Chip status

**Track 3 progress: 2 of ~5 chips shipped.** Remaining: ~3 chips, v865-v867.

KNOWN_UNWIRED Egress: 10 → 9.

## References

- Predecessor: v1.49.863
- Cross-audit tool: clean post-wire (7th consecutive)
