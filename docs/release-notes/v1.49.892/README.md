# v1.49.892 — Fourth LoaderContext Chip: `dacp/bus/scanner.ts` (Two-Site Hoisted-Check)

**Released:** 2026-05-28

Continues the LoaderContext chip-down cadence with the next-smallest entry per #10444 size-ascending (174 LOC). First instance of the two-site hoisted-check sub-variant of #10448 — both exported entry points (`scanForBundles` + `scanPriorityDirWithBundles`) gate independently so direct callers of the inner function are also admitted through the chokepoint. KNOWN_UNWIRED Loader 12 → 11.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
