---
title: "Context"
chapter: 99-context
version: v1.49.978
date: 2026-06-05
summary: "Where v1.49.978 sits in the larger arc."
tags: [context]
---

# v1.49.978 — Context

## Milestone metadata

- **Version:** v1.49.978
- **Type:** `feat` — reachability shelfware disposition
- **Predecessor:** v1.49.977 (reachability-aware adoption scanner, Ship 3.1)
- **NASA degree:** 1.178 (frozen)
- **Counter-cadence count:** 29

## Where this sits

Ship 3.2 of the 2026-06-03 core-functions audit plan, and the second Phase-3 ship. Ship 3.1 (v1.49.977) added the reachability dimension to `tools/adoption-scan.mjs` and surfaced 16 non-allowlisted living-but-unreachable modules as its explicit output. Ship 3.2 consumes that output: it disposes all 16 plus the `upstream`/`upstream-intelligence` pair, closing the 🚩D3 substrate-disposition decision gate and the v786 "pending operator triage" that had carried for ~180 ships. Named follow-ups remain (the deferred WIRE cluster of `commands`/`scan-arxiv`; a dedicated `amiga` retire decision; D4/Phase-5 loop capability incl. the degenerate v944 retention signal).

## Files changed

- `tools/adoption-scan.allowlist.json` — +14 entries (dated 2027-06-05 gates), −2 (upstream pair).
- `src/cli/commands/git.ts` (new), `src/cli/dispatch.ts`, `src/cli/help.ts` — the git + skill-inventory wires.
- Deleted: `src/upstream/`, `src/upstream-intelligence/`, `tests/upstream/` (52 files).
- `INVENTORY-MANIFEST.json` — `src_subsystems` 153→151.
- `docs/SHELFWARE-VERDICTS.md` — 18 verdict rows + Ship-3.2-CLOSED note.
- `tests/integration/learning-substrate-parked.test.ts` — Ship 3.2 drift-guard block.

## Engine state at close

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — unchanged (no new lesson promoted).
