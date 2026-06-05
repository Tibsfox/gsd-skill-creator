---
title: "Context"
chapter: 99-context
version: v1.49.984
date: 2026-06-05
summary: "Where v1.49.984 sits in the larger arc."
tags: [context, phase-5, cli]
---

# v1.49.984 — Context

## Milestone metadata

- **Version:** v1.49.984
- **Type:** `feat(integration)` — skill-mining config migrator (integration migrate)
- **Predecessor:** v1.49.983 (`b021945b7`, GAP-7 deterministic trip-vocab check / Ship 5.3)
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 29 (unchanged)

## Where this sits

This is the fourth and last of the v982-handoff Phase-5 follow-ons (items 1–3 shipped in v1.49.983 / Ship 5.3). The operator sequenced it after 5.3 and chose the delete-key resolution. It completes the 5.1c rollout: v981 flipped `mine_active_skills` default true, this ship gives explicit-`false` 5.1b installs a one-command path to the new default. The remaining open threads are time/volume-gated (the 5.1c re-audit ~2026-06-19→07-03 and the retention re-audit + first dry-run tick once both polarities accrue), plus Phase 4 (Windows CI) and the amiga retire decision.

## Files changed

- **Source:** `src/cli/commands/integration-config.ts` (new `migrate` subcommand + `handleMigrate`/`reportMigrate`/`deepEqual`/`canonical`; `writeFile` import; `showHelp` updated), `src/cli/help.ts` (top-level help lists `migrate`).
- **Tests:** `src/cli/commands/integration-config.test.ts` (+8 migrate cases; fs/promises mock gains `writeFile`).

## Engine state at close

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged (forward Phase-5 follow-on; no lesson promoted).
