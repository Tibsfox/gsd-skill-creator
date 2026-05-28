# v1.49.858 — Retrospective

**Wall-clock:** ~15 min from v857 ship close to v858 ship close. Slightly above the v849-v853 chip-cluster floor (~8-13 min) because of the new-test-file authoring.

## What went as expected

- **The v849 chip-cluster template transferred directly.** Pick → recon (find existing test or scaffold new) → wire → audit-test-swap → test-add → pre-tag-gate → T14. Mechanical execution.
- **No swallowing catch around the spawn → no #10442 re-throw needed.** The simplest hoist-at-top variant applies.
- **The v857 cross-audit tool ran clean post-edit.** First application against an actual chip output; the inverse-audit catches both stale shapes without false positives on a real wire.

## What I noticed

- **First Track 2 chip after a codify ship.** The v857 codify took ~50 min; v858 took ~15 min. Total ~65 min for "codify the discipline + ship the tool + apply the discipline to a chip" — comfortably under the 60-90 min single-NASA-degree wall-clock.
- **CLI-wrapper variant of the wire.** Most prior chips wrap domain-specific tools (git, cargo, python). `drift/cli.ts` wraps `process.execPath` (node) to forward to an ESM audit script. Same hoist-at-top shape; argv vector includes the script path + forwarded args.
- **PROJECT.md hand-edit before pre-tag-gate held.** Pre-edit at v857 → v858 is now within tolerance (PROJECT.md says v856 latest-shipped; package.json at 1.49.858 = 2-patch drift; within 3-patch ceiling). Will pre-edit before v859 to keep cadence.

## What surprised me

- **The stale-entry tool's first chip-cluster application is silent.** Exit 0, no findings. Boring is the goal — the tool's value is that future regressions will produce noise; current state stays silent.
- **The chip pattern's wall-clock floor for new-test-file variants is ~15 min, not 10.** v851 (`version-backfill`) was the prior new-test-file instance and also took ~15 min. Pattern: ~10 min floor for existing-test-extension variants; ~15 min floor for new-test-file variants.

## Risk that didn't materialize

- **No audit-test regression.** 2051 PASS; file no longer in KNOWN_UNWIRED.
- **No tool false-positive.** The v857 inverse-audit reports clean against the new Process 10 + Egress 11 state.
- **No backward-compat break** at the CLI dispatcher. `driftCommand([...])` continues to work without ctx; `driftCommand([...], ctx)` is the new optional shape.

## Carried forward (post-v858)

NEW this ship: 0 below-threshold observations (chip ship of established variant; pattern transfer was mechanical).

UNCHANGED from v857:
- Codify + tool same-ship pattern (v857, 1 instance) — wait for 2nd instance.
- Full-backlog-clear codify ship pattern (v847, 1 instance) — wait for 2nd instance.
- v846-v841 1-instance observations carried forward.

## Campaign progress

**2 of ~11 ships shipped.** Track 1 (codify) closed at v857. Track 2 (Process chips) opened at v858.

Remaining Track 2: ~4 more Process chips (v859-v862). Likely candidates from the 10 entries:
- `src/chipset/blitter/executor.ts` (220 lines, 1 cp-call) — second-smallest entry
- `src/intelligence/provenance/linker.ts` (408 lines, 1 cp-call)
- `src/scan-arxiv/ranker.ts` (560 lines, 1 cp-call)
- `src/learning/version-manager.ts` (177 lines, exec via promisify — needs the async-promisify wire variant first)
- `src/cli/commands/keystore.ts` (167 lines, 1 cp-call)
- `src/cli/commands/pic2html.ts` (311 lines, 1 cp-call)

Remaining Track 3 (Egress chips): ~5 ships, v863-v867. 11 entries in KNOWN_UNWIRED Egress.
