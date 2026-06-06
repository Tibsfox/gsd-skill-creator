# v1.49.987 — Summary

## The ship

This milestone promotes the dormant `src/amiga` meta-mission detector + CE-1 attribution substrate from a `tools/` spike runner into a first-class, wired `skill-creator amiga` CLI command. With the wire, the substrate is reachable from production for the first time and feeds real session data into the `sc:suggest` sink. A `--corpus` mode aggregates candidates across every transcript.

## What shipped

- `skill-creator amiga` (alias `am`): single-transcript + `--corpus` modes; `--emit` to the SuggestionStore (dry-run by default); `--patterns-dir` / `--projects-dir` / `--limit` / `--json`. Wired into the dispatch registry.
- Reusable libs extracted from the runner: `transcript-reader.ts` + `revive-pipeline.ts`; existing `src/amiga` code imported unchanged.
- Corpus aggregation: candidates deduped by id with summed occurrences + mean CE-1 attribution weight per tool.
- `tools/spike-amiga-revive.mjs` reduced to a thin shim over the command.
- Adoption hygiene: `amiga` allowlist entry removed (now wired/reachable); `learning-substrate-parked` guard moves it to the wired set.
- Bundled prior fix: `SuggestionStore.save()` EXDEV-safe temp staging + regression tests.
- Docs: help.ts + docs/CLI.md (cheat-sheet, body, exit-code, JSON-output).

## Verification

`tsc --noEmit` clean; full Vitest suite green including the new CI-safe `amiga` command tests; the live reachability guard confirms `amiga` is reachable + un-allowlisted; adversarial pre-push review surfaced one MAJOR (CLI.md `--json` schema) which was fixed.

## Engine state

NASA degree **1.178**, counter-cadence **29**, manifest lessons **152** — UNCHANGED (code ship).
