# v1.49.890 — Third LoaderContext Chip: src/eval/calibration-adjustment-store.ts

**Released:** 2026-05-28

Third chip against the LoaderContext KNOWN_UNWIRED ledger. `CalibrationAdjustmentStore` (129 LOC class) wired via constructor-injection + per-method `ensureAllowed` at `load()` (read-side only — `save()` intentionally out of scope per LoaderContext read-only design intent). First chip where save/write path is left unaudited; documents the rationale. KNOWN_UNWIRED Loader 13 → 12.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
