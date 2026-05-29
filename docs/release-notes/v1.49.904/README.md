# v1.49.904 — Tenth LoaderContext Chip: `events/skill-event-store.ts` (Class-Instance Multi-Method Read-Side)

**Released:** 2026-05-29

Tenth LoaderContext chip. `SkillEventStore` is a class with 3 distinct read-side methods (`readAll`, `consume`, `markExpired`) plus 1 transitive read-via-call (`getPending` → `readAll`) and 1 write-side method (`emit`). Wire shape: class-instance multi-method read-side — extension of #10455 (class-stored hoist-at-top, N=1) to N=3 read sites, each gating independently. Write-side `emit` is intentionally out-of-scope per #10457. KNOWN_UNWIRED Loader 6 → 5.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
