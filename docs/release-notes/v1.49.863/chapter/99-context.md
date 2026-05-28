# v1.49.863 — Context

## Provenance

Seventh ship of the operator-directed v857-v867 follow-on campaign; **first chip of Track 3** (Egress singleton chips). Track 2 closed at v862; Track 3 opens here.

`src/terminal/health.ts` chosen because: 73 LOC (smallest Egress KNOWN_UNWIRED entry), single fetch() call site, fault-tolerant accessory pattern. Follows the size-ascending heuristic that worked in Track 2.

## What this ship adds

```
src/terminal/health.ts                          [MODIFIED: ctx? threaded through checkHealth; hoisted ensureEgressAllowed before try/catch]
src/terminal/health.test.ts                     [MODIFIED: +2 test cases in new EgressContext wire describe block]
src/security/egress-context-audit.test.ts       [MODIFIED: removed from KNOWN_UNWIRED + v863 wire-shape comment]
docs/release-notes/v1.49.863/                   [NEW: README + 4 chapters]
```

## Recon trail

1. **Survey Egress KNOWN_UNWIRED** — 11 entries; size-survey for ascending-pick.
2. **Pick `src/terminal/health.ts`** — 73 LOC, smallest entry, single fetch() site.
3. **Read source** — `checkHealth(url, timeoutMs)` with fault-tolerant try/catch.
4. **Apply wire** — import block + ctx? as third positional + hoisted ensureEgressAllowed before try.
5. **Update audit-test KNOWN_UNWIRED** — remove entry + replace with v863 wire-shape comment.
6. **Add 2 test cases** — deny (restrictive ctx throws EgressContextDenied + audit sink captures) + allow (mocked fetch returns 200, audit sink shows allowed).
7. **Run targeted tests** — 14 PASS for health.test.ts + 2052 PASS for audit-test + clean cross-audit.
8. **Pre-tag-gate** — pending.
9. **Author release notes.**

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

## Wire shape (per Lesson #10427)

Hoist-at-top fetch variant. Structurally identical to v853 git-collector but for Egress (fetch instead of execFileAsync). First Egress chip cluster since v811.

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship).

## Chip status

**Track 3 progress: 1 of ~5 chips shipped.** Remaining: ~4 chips, v864-v867.

KNOWN_UNWIRED Egress: 11 → 10.

## References

- Predecessor: v1.49.862 (`docs/release-notes/v1.49.862/`) — Track 2 close
- First Process chip of campaign: v1.49.858 (`docs/release-notes/v1.49.858/`)
- Last Egress chip before this: v1.49.811 (`docs/release-notes/v1.49.811/`) — registry adapters batch
- Cross-audit tool: `tools/security/check-stale-known-unwired.mjs` (6th consecutive clean)
