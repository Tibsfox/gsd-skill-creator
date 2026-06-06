---
title: "Context"
chapter: 99-context
version: v1.49.987
date: 2026-06-06
summary: "Where v1.49.987 sits in the larger arc."
tags: [context]
---

# v1.49.987 — Context

## Milestone metadata

- **Version:** v1.49.987
- **Type:** `feat(amiga)` — AMIGA revive: wired amiga CLI command + corpus mode
- **Predecessor:** v1.49.986 (Phase 4 rungs 2-3 — windows CI cross-platform green + load-bearing flip)
- **NASA degree:** 1.178
- **Counter-cadence count:** 29

## Where this sits

The predecessor v1.49.986 completed Phase 4 by flipping the windows CI leg to load-bearing. This milestone is a feature ship on the dev line: it resolves the long-standing "amiga retire?" backlog item as **revive** by giving the dormant `src/amiga` substrate its first production runtime consumer. It builds directly on the prior session's revive spike (commits `17fe4b175` EXDEV fix + `61a320678` spike wiring), promoting that spike from a `tools/` runner into a wired CLI command and closing three of the spike handoff's open increments (corpus-wide run, CLI promotion, allowlist refresh).

## Files changed

- New: `src/amiga/spike/transcript-reader.ts`, `src/amiga/spike/revive-pipeline.ts`, `src/cli/commands/amiga.ts`, `src/cli/commands/amiga.test.ts`
- Modified: `src/cli/dispatch.ts` (register), `src/cli/help.ts` (help line), `tools/spike-amiga-revive.mjs` (→ shim), `docs/CLI.md` (docs), `tools/adoption-scan.allowlist.json` (remove amiga entry), `tests/integration/learning-substrate-parked.test.ts` (move amiga to wired set)
- Bundled prior commits: `src/detection/suggestion-store.ts` + test (EXDEV fix); `src/amiga/spike/{session-event-bridge,candidate-mapper}.ts` + tests (the spike)

## Engine state at close

NASA degree **1.178**, counter-cadence **29**, manifest lessons **152** — all UNCHANGED (code ship; no NASA content generated, no cadence advance).
