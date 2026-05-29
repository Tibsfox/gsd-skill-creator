# v1.49.900 — Seventh LoaderContext Chip: `orchestrator/lifecycle/artifact-scanner.ts` (Module-Function Hoist-at-Top)

**Released:** 2026-05-29

Continues the LoaderContext chip-down. Live `wc -l` at chip-pick time confirmed `artifact-scanner.ts` (176 LOC) as the unique-smallest KNOWN_UNWIRED entry — second-smallest is `keystore.ts` (179 LOC, already ProcessContext-wired; LoaderContext-wire deferred as a separate concern), third is `state-reader.ts` (190 LOC, multi-method class). Per #10444 size-ascending, picked the unique smallest. Wire shape: module-function hoist-at-top per #10448 base sub-variant — `ctx?: LoaderContext` as optional 3rd parameter, hoisted ABOVE the ENOENT-tolerant try/catch per #10442. Production caller `lifecycle-coordinator.ts:91` unchanged via non-breaking optional. KNOWN_UNWIRED Loader 9 → 8.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
