> Following v1.49.779 — _Wave 3 Review HIGHs / Performance + Test-Quality Counter-Cadence_, v1.49.780 ships as Tier E Architecture: cli.ts Dispatcher Extraction.

# v1.49.780 — Tier E Architecture: cli.ts Dispatcher Extraction

**Shipped:** 2026-05-26
_Parse confidence: 0.50 — source `docs/release-notes/v1.49.780/README.md`_

## Summary

First forward-cadence architecture ship after the v777-779 risk-tier counter-cadence arc. Closes Tier E HIGH #1 (cli.ts dispatcher extraction) from the REVIEW ledger 2026-05-26. `src/cli.ts` collapses from 2132 lines to 120 (94% reduction) via 13 atomic commits using an infrastructure-first incremental migration pattern: dispatch skeleton first with fall-through to legacy switch, then per-case migration, then the slim. 73 commands now live in `src/cli/dispatch.REGISTRY`; 12 large inline cases got their own modules in `src/cli/commands/`; the 328-line `showHelp` moved to `src/cli/help.ts`. New `CliContext` interface threads stores + parse helpers through every handler.

It also produced retrospective content (decisions, lessons_learned, surprises, what_could_be_better, what_worked); see `03-retrospective.md`.

3 lesson candidates extracted; see `04-lessons.md`.

---
**Prev:** [v1.49.779](../v1.49.779/00-summary.md) · _(current tip)_
