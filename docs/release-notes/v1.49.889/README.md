# v1.49.889 — Second LoaderContext Chip: src/intelligence/atlas-indexer/file-walker.ts

**Released:** 2026-05-28

Second chip against the LoaderContext KNOWN_UNWIRED ledger. `walkProjectFiles` (120 LOC entry point) wired via hoist-at-top pattern (#10448 sub-variant 1): `ctx?: LoaderContext` added to `WalkOptions`, one `ensureAllowed` gate at top covers the recursive walk (realpath, readdir, stat all confined under root). KNOWN_UNWIRED Loader 14 → 13.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
