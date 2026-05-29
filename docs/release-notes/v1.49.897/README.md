# v1.49.897 — Sixth LoaderContext Chip: `discovery/scan-state-store.ts` (Class-Stored Hoist-at-Top — 3rd Instance PROMOTES Sub-Variant)

**Released:** 2026-05-29

Continues the LoaderContext chip-down. Live `wc -l` at chip-pick time confirmed `scan-state-store.ts` (176 LOC, tied with `artifact-scanner.ts`) as the smallest class-based KNOWN_UNWIRED entry — picked over the tie-mate because its structural shape (class + single `readFile` site in `load()` + ENOENT-tolerant try/catch + `save()` method) is byte-shape-identical to v890 (`calibration-adjustment-store.ts`) and v896 (`workflow-run-store.ts`). This is the **3rd instance** of class-stored hoist-at-top → **PROMOTES the sub-variant from 2-instance to ESTABLISHED** (#10448 carry-forward closed). `addExclude`/`removeExclude` derived methods each transitively emit one audit record via `load()`. KNOWN_UNWIRED Loader 10 → 9.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
