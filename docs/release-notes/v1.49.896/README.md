# v1.49.896 — Fifth LoaderContext Chip: `skill-workflows/workflow-run-store.ts` (Class-Stored Hoist-at-Top)

**Released:** 2026-05-29

Continues the LoaderContext chip-down cadence with the smallest entry per #10444 size-ascending (138 LOC — the smallest in the v885 KNOWN_UNWIRED ledger). Hoist-at-top sub-variant of #10448, applied to the class-method form: constructor takes `ctx?: LoaderContext`, stored in `this.ctx`, hoisted inside `readAll()` outside the ENOENT-tolerating try/catch per #10442. Pairs with v890 (`calibration-adjustment-store.ts`) as the second instance of the class-stored hoist-at-top ergonomic — promotion-eligible at 3rd instance. KNOWN_UNWIRED Loader 11 → 10.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
