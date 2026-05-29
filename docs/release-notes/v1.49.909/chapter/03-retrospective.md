# Retrospective — v1.49.909

## What Worked

**Verdict-as-closing-move was structurally correct, not a workaround.** `kb/store.ts` genuinely doesn't fit LoaderContext's threat model — its data access is SQLite-via-native-binding, not `node:fs` reads. Wiring it up would have added cosmetic gates around `mkdirSync` (a write op) with no security signal. The Role marker is the honest answer: "this file is intentionally outside the chokepoint."

**Multi-chip campaign closed the ledger cleanly in 7 ships.** Post-v902 KNOWN_UNWIRED Loader had 7 entries:

| Ship | File | Action |
|---|---|---|
| v903 | `cli/commands/keystore.ts` (179 LOC) | wire-up (sync two-site) |
| v904 | `events/skill-event-store.ts` (222 LOC) | wire-up (class-instance multi-method) |
| v905 | `atlas/spatial/pmtiles-reader.ts` (262 LOC) | wire-up (module-function mixed sync+async) |
| v906 | `aminet/emulated-scanner.ts` (287 LOC) | wire-up (module-function multi-site mixed-chokepoint) |
| v907 | `memory/file-store.ts` (516 LOC) | wire-up (class-multi-method consolidated-gate; 2nd instance) |
| v908 | `memory/conversation-store.ts` (531 LOC) | wire-up (class-multi-method consolidated-gate; 3rd instance — PROMOTES to ESTABLISHED) |
| **v909** | `intelligence/kb/store.ts` (1399 LOC) | **VERDICT — closes ledger to 0** |

7 chips in one session is the largest multi-chip campaign of 2026-05. Average wall-clock per chip: ~30 minutes.

**Promotion of v902's class-multi-method consolidated-gate to ESTABLISHED was a natural consequence of size-ascending chip-pick.** v907 + v908 both selected the consolidated-gate wire shape because they are class-multi-method memory-store files. Neither chip "needed" promotion as its primary goal — promotion fell out of the structural similarity. This reinforces #10444's value: size-ascending picks reveal wire-shape patterns through their natural sequence.

**The verdict-vs-wire decision has structural criteria.** v909 surfaced the 4-criterion checklist for when to apply the Role marker instead of wiring. The criteria are inferred from #10457's read-side-only design + the audit-test's explicit Role-marker admission. Codifying the criteria in v909's release notes captures the decision boundary so future operators don't have to re-derive it.

## What Could Have Been Better

**Pre-tag-gate ran twice on at least one ship (v903's perf flake; v905's ceiling-substrate flake).** These were timing-sensitive tests that passed on retry. The flakes have been documented in prior retrospectives (v901's `m2-short-term.test.ts`). Carry-forward: a future stability ship might consider increasing the perf-warmup or splitting these tests into a dedicated `npm run test:perf` target to keep the main suite faster + flake-free.

**No automated checker for the verdict-vs-wire criteria.** If a future operator adds a `node:fs` import to a file with the Role marker, the audit-test's "simultaneous claim" check catches the contradiction — but doesn't catch the case where a verdict is wrong (e.g., file gains a real read-side op but keeps the marker). Carry-forward: a future tool could verify that Role-marker files have NO read-side `node:fs` ops. Not blocking; not in scope for v909.

**The discipline-coverage warn count (39 uncodified lessons + 8 partial; ceiling 41) is still elevated.** No new codification this campaign; the v909 ledger-closure could trigger a counter-cadence ship to formalize v902's promotion + the verdict-pattern lesson. Operator decision point post-v909.

## Multi-chip campaign retrospective (post-v902)

This 7-ship multi-chip campaign demonstrated several patterns that may inform future campaigns:

1. **Stage decisions in carry-forward notes.** v902's lessons explicitly named v903's wire-shape candidates. v907's lessons predicted v908's 3-instance promotion. Each chip's carry-forward note reduced the next chip's analysis time by ~15 min.

2. **Size-ascending picks reveal wire-shape diversity.** Smaller files (v903 179 LOC, v904 222 LOC) had simpler wire shapes (sync two-site, class-instance multi-method). Larger files (v907 516 LOC, v908 531 LOC) had richer wire shapes (class-multi-method consolidated-gate). The size sort incidentally surfaced the catalog.

3. **Multi-chip campaigns naturally promote sub-variants.** Two files with the same structural shape (file-store + conversation-store) both selected the consolidated-gate pattern — promoting v902's 1-instance candidate through 2-instance to ESTABLISHED in just 3 ships.

4. **Verdict-as-closing-move is a clean strategy for non-fit ledger entries.** When the last entries don't fit the wire pattern, the audit-test's Role-marker admission is the structurally correct close. The lesson: the ledger doesn't HAVE to be all wired — some entries are genuinely out-of-scope.

## Lessons Learned

See [04-lessons.md](04-lessons.md). v909 documents the verdict-pattern as a closing-move option + closes the LoaderContext ratchet ledger.
