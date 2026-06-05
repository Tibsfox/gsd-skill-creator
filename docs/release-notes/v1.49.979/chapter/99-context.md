---
title: "Context"
chapter: 99-context
version: v1.49.979
date: 2026-06-05
summary: "Where v1.49.979 sits in the larger arc."
tags: [context]
---

# v1.49.979 — Context

## Milestone metadata

- **Version:** v1.49.979
- **Type:** `feat(cli)` — sc-learn + scan-arxiv CLI dispatch wire
- **Predecessor:** v1.49.978 (reachability shelfware disposition, Ship 3.2)
- **NASA degree:** 1.178 (frozen)
- **Counter-cadence count:** 29

## Where this sits

Ship 3.3 of the 2026-06-03 core-functions audit plan, and the third Phase-3 ship. Ship 3.1 (v1.49.977) added the reachability dimension to `tools/adoption-scan.mjs`; Ship 3.2 (v1.49.978) disposed the 16 modules it surfaced but allowlisted the `commands`/`scan-arxiv` cluster as an explicit WIRE follow-up. Ship 3.3 closes that follow-up: registering the authored sc-learn + scan-arxiv CLI surface flips `commands`/`learn`/`scan-arxiv` reachable and removes their allowlist entries. Named follow-ups remain — a dedicated `amiga` (10K-LOC) retire decision, D4/Phase-5 loop capability (incl. the degenerate v944 retention signal at `src/sensoria/retention-substrate.ts`), and Phase-4 cross-platform (Windows CI + anticipatory skill preload).

## Files changed

- `src/commands/sc-learn.ts` — `main(argv)` arg-parser + `isCliEntrypoint` guard (+144).
- `src/cli/commands/arxiv.ts` (new) — safe-default scan-arxiv router (+67); `src/cli/commands/arxiv.test.ts` (new, +53).
- `src/commands/scan-arxiv.ts` — build + pass the EgressContext to `createFetcher` (+17).
- `src/scan-arxiv/fetcher.ts` — `ctx?: EgressContext` on `FetcherOptions` + `ensureEgressAllowed` before fetch (+14); `src/scan-arxiv/bridge.ts` — repaired the dead ingestion line (±1).
- `src/cli/dispatch.ts` (+8), `src/cli/help.ts` (+2) — `learn` + `arxiv` registration.
- `src/commands/sc-learn-cli.test.ts` (new, +34).
- `tools/adoption-scan.allowlist.json` — −3 entries (32 → 29).
- `docs/SHELFWARE-VERDICTS.md` — 3 rows ALLOWLISTED → WIRED + Ship-3.3-CLOSED note (+27).
- `tests/integration/learning-substrate-parked.test.ts` — `SHIP33_WIRED` block (SHIP32_ALLOWLISTED 14 → 11).

The feat commit `fd213bd36` is 12 files, +397/−29. The release-notes, STORY mirror, and refreshed adoption baseline/trends land in the accompanying `chore(release)` commit.

## Engine state at close

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — unchanged (no new lesson promoted).
