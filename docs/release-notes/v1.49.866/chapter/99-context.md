# v1.49.866 — Context

## Provenance

Tenth ship of the operator-directed v857-v867 follow-on campaign; **fourth chip of Track 3**.

`src/site/deploy.ts` chosen: 193 LOC, single fetch inside DI-overridable wrapper. First Egress wire-shape new in Track 3 since v863 opened.

## What this ship adds

```
src/site/deploy.ts                              [MODIFIED: ctx? threaded through verifyDeployment → defaultFetch wrapper; closure-bound default-fetch]
tests/site/deploy.test.ts                       [MODIFIED: +2 EgressContext wire cases (default-path denial + injected-fetchFn bypass)]
src/security/egress-context-audit.test.ts       [MODIFIED: removed from KNOWN_UNWIRED + v866 comment]
docs/release-notes/v1.49.866/                   [NEW: README + 4 chapters]
```

## Wire shape

DI-fetch-wrapper. Closure binds ctx into default-fetch path; injected fetchFn bypasses.

## Chip status

**Track 3 progress: 4 of ~5 chips shipped.** Remaining: 1 chip, v867.

KNOWN_UNWIRED Egress: 8 → 7.

## References

- Predecessor: v1.49.865
- Cross-audit tool: clean (9th consecutive)
- Wire pattern: DI-fetch-wrapper (Egress analog of #10441)
