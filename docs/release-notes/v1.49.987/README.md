---
title: "v1.49.987 — AMIGA revive: wired amiga CLI command + corpus mode"
version: v1.49.987
date: 2026-06-06
summary: >
  Promotes the dormant src/amiga meta-mission detector + CE-1 attribution
  substrate from a tools/ spike runner into a first-class, wired
  `skill-creator amiga` CLI command with a corpus-aggregation mode — giving the
  substrate its production runtime consumer and feeding real session data into
  the sc:suggest sink. Bundles the prior EXDEV SuggestionStore fix.
tags: [feat, amiga, cli, adoption]
---

# v1.49.987 — AMIGA revive: wired amiga CLI command + corpus mode

**Shipped:** 2026-06-06

The dormant `src/amiga` substrate now has a real, wired production consumer: a `skill-creator amiga` CLI command that mines skill candidates from session transcripts via the meta-mission detector + CE-1 attribution ledger.

## Why this ship

The "retire src/amiga" backlog item was inverted by operator choice to **revive, not retire**. The prior session built the revive spike as a `tools/` runner; this ship promotes it to a first-class CLI command and follows the decision through to its adoption-hygiene consequence — wiring the command makes the `amiga` module reachable from production, so it is no longer shelfware. Three open increments from the spike handoff are closed here: a corpus-wide run across all transcripts (not just the largest), promoting the runner to a CLI subcommand, and refreshing the now-stale adoption-scan allowlist disposition.

## What shipped

- **New `skill-creator amiga` command** (alias `am`), wired into the dispatch registry. Single-transcript mode (default: the largest transcript; or an explicit path) and `--corpus` mode (every transcript, aggregated). `--emit` lands candidates in the SuggestionStore `sc:suggest` sink (dry-run by default); `--patterns-dir` / `--projects-dir` / `--limit` / `--json`.
- **Extracted reusable libs** from the runner: `src/amiga/spike/transcript-reader.ts` (transcript discovery + distillation) and `revive-pipeline.ts` (detector + CE-1 drive, candidate selection, corpus aggregation). Existing `src/amiga` code is imported **unchanged**.
- **Corpus aggregation**: candidates deduped by id with occurrences summed across sessions, plus a mean CE-1 attribution weight per tool. A real run over 195 sessions / 37,778 tool-uses produced 21 aggregated candidates with zero CE-1 errors.
- **`tools/spike-amiga-revive.mjs` is now a thin shim** over the command — one source of truth; the handoff's reproduction commands still work.
- **Adoption hygiene**: wiring flips `amiga` to `reachableFromProduction:true`, so its `adoption-scan.allowlist.json` entry is removed (wired, not allowlisted — mirrors the git/skill and Ship-3.3 precedent) and the `learning-substrate-parked` drift-guard moves `amiga` from the allowlisted-park set to a wired-set assertion.
- **Bundled fix** (prior commit): `SuggestionStore.save()` stages its temp file in the target dir so the `rename()` is same-filesystem (avoids `EXDEV` across mounts), with regression tests.
- **Docs**: help.ts command line + docs/CLI.md (cheat-sheet, body section, exit-code + JSON-output rows).

## Verification

- `tsc --noEmit`: clean.
- Full Vitest suite green (incl. the new `src/cli/commands/amiga.test.ts` lib + end-to-end `--corpus --emit` round-trip, all tmpdir/in-memory and CI-safe across the three OS legs).
- The live `learning-substrate-parked` reachability guard confirms `amiga` now reads `reachableFromProduction:true`, `allowlisted:false`.
- Adversarial pre-push ship review (5 lenses + adversarial verify): one MAJOR (an incomplete `--json` schema row in CLI.md) found and fixed; one finding refuted.

## Engine state

NASA degree **1.178**, counter-cadence count **29**, manifest lessons **152** — all UNCHANGED (code ship; no NASA content, no cadence advance).
