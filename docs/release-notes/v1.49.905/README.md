# v1.49.905 — Eleventh LoaderContext Chip: `atlas/spatial/pmtiles-reader.ts` (Module-Function Two-Site, Mixed Sync+Async)

**Released:** 2026-05-29

Eleventh LoaderContext chip. `pmtiles-reader.ts` has two distinct exported fs-touching entry points: `validatePMTilesMagic` (sync `readFileSync`) and `fetchTileViaPMTiles` (async `open` via cached `NodeFileSource`). Each gates independently per v892 two-site hoisted-check discipline. NEW sub-variant of #10448: module-function two-site with MIXED sync+async ops — distinct from v892 (pure async) and v903 (pure sync). KNOWN_UNWIRED Loader 5 → 4.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
