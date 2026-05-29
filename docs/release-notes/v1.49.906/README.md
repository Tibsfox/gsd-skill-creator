# v1.49.906 — Twelfth LoaderContext Chip: `aminet/emulated-scanner.ts` (Module-Function Multi-Site Mixed-Chokepoint)

**Released:** 2026-05-29

Twelfth LoaderContext chip. `emulated-scanner.ts` is a module with 2 fs-touching functions and pre-existing ProcessContext (v861). `loadKnownGoodHashes` gates 2 sync sites (existsSync + readFileSync) on the SAME path — preserves audit-count signal (1 audit = file missing, 2 audits = file read). `runEmulatedScan` gates 1 sync existsSync site on fsUaePath alongside its existing ProcessContext for execFile — sibling chokepoints stay separate per #10449. 7th #10456 audit-variant. KNOWN_UNWIRED Loader 4 → 3.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
