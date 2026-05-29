# v1.49.887 — First LoaderContext Chip: src/console/reader.ts

**Released:** 2026-05-28

First chip against the v885 LoaderContext KNOWN_UNWIRED ledger. `src/console/reader.ts` (109 LOC, smallest entry) wired via hoist-at-top pattern (#10448): `ctx?: LoaderContext` threaded through the `MessageReader` constructor, one `ensureAllowed` gate at the top of `readPending()` covers all fs ops confined under `basePath` via `path.join`. KNOWN_UNWIRED Loader 15 → 14. Mirrors the v884-v886 alternatives sub-campaign forward path option 2.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
