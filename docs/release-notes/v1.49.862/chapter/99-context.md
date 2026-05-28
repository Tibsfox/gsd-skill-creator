# v1.49.862 — Context

## Provenance

Sixth ship of the operator-directed v857-v867 follow-on campaign; **fifth and final chip of Track 2** (Process singleton chips). Closes the Track 2 cluster at exactly 5 chips per the operator's session-start plan.

`src/scan-arxiv/ranker.ts` chosen because: 560 LOC with 1 spawn() call site inside a factory-built JudgeFn closure. Introduces closure-capture wire variant (5th distinct shape across the batch).

## What this ship adds

```
src/scan-arxiv/ranker.ts                       [MODIFIED: ctx? threaded through RankerOptions → buildDefaultJudge → buildCliJudge → JudgeFn closure; hoisted ensureProcessAllowed inside the closure]
src/scan-arxiv/ranker.test.ts                  [MODIFIED: +2 test cases in new ProcessContext wire describe block]
src/security/process-context-audit.test.ts     [MODIFIED: removed from KNOWN_UNWIRED + v862 wire-shape comment]
docs/release-notes/v1.49.862/                  [NEW: README + 4 chapters]
```

## Recon trail

1. **Pick next chip target** — `src/scan-arxiv/ranker.ts` (560 LOC, 1 spawn call site inside factory-built JudgeFn).
2. **Read source** — `buildCliJudge(model, maxBudgetUsd)` returns JudgeFn; the closure spawns 'claude' inside `new Promise(...)`.
3. **Trace callers** — `buildDefaultJudge` → `buildCliJudge`; `createRanker(opts)` uses RankerOptions.
4. **Apply wire** — closure-capture pattern: add ctx? to buildCliJudge + buildDefaultJudge + RankerOptions; thread through 3 layers; hoisted check inside JudgeFn closure.
5. **Update audit-test KNOWN_UNWIRED.**
6. **Add 2 test cases** — deny via restrictive ctx + argv exposure check.
7. **TS error on test fixture** — ArxivPaper schema uses publishedAt/updatedAt/pdfUrl/absUrl (not submittedAt). Fixed.
8. **Run targeted tests** — 17 PASS for ranker.test.ts + 2051 PASS for audit-test + clean cross-audit (5th).
9. **Pre-tag-gate** — pending.
10. **Author release notes.**

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

## Wire shape (per Lesson #10427)

Closure-capture variant — new 5th distinct shape in the v858-v862 batch. ctx captured at factory time; the hoisted check runs at each JudgeFn invocation.

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship). v862 applies the v847-codified #10416 lightest-wire rule + the v839-codified #10427 hoisted-check pattern.

## Track 2 closure

**Track 2 progress: 5 of ~5 chips shipped (v858-v862).** Track 2 CLOSED.

KNOWN_UNWIRED Process: 11 → 6. Remaining 6 entries deferred to future ships:
- `src/chipset/harness-integrity.ts` (1440 LOC, 1 cp-call) — large, likely internal-helper
- `src/cli/commands/pic2html.ts` (311 LOC) — possibly #10442 re-throw
- `src/git/gates/pre-flight.ts` (363 LOC, 18 cp-calls) — DI-executor candidate
- `src/git/workflows/contribute.ts` (183 LOC, 11 cp-calls) — DI-executor candidate
- `src/learn/acquirer.ts` (509 LOC, 13 cp-calls) — DI-executor candidate
- `src/learning/version-manager.ts` (177 LOC) — needs promisify+shell tokenization refactor

## Forward path post-v862

Next ship: **v1.49.863 — Track 3 opens with first Egress chip.** Likely candidates (size-ascending heuristic from Track 2's pattern):
- `src/chips/anthropic-chip.ts` (sub-100 LOC likely)
- `src/aminet/index-freshness.ts` (likely small)
- `src/intelligence/ipc.ts`
- `src/terminal/health.ts`

## References

- Predecessor: v1.49.861 (`docs/release-notes/v1.49.861/`)
- Track 2 opening: v1.49.858 (`docs/release-notes/v1.49.858/`)
- Cross-audit tool: `tools/security/check-stale-known-unwired.mjs` (5th consecutive clean application)
- Wire pattern: closure-capture (new 5th shape in Track 2)
