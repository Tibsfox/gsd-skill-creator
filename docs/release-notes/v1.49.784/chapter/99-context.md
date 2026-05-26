# v1.49.784 — Context

## What this ship is

v1.49.784 is a focused discipline-codification ship closing the 8-lesson candidate backlog accumulated across the v780-v783 series. Last codification was at v1.49.654 — 7+ ships ago. The wedge took ~40 minutes — one codification commit + ship + post-ship RH.

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.177; substrate engine state unchanged.
- Not a counter-cadence ship. Counter-cadence count stays at 5 (v585, v776, v777, v778, v779). v784 is forward-cadence discipline-codification.
- Not a code refactor. Tools and source code unchanged beyond manifest update; docs added.
- Not a gate introduction. No new pre-tag-gate steps, no new hooks. The discipline-coverage audit gate (already present) gains 8 new manifest IDs to track.

## Predecessors

- v1.49.783 — STATE.md normalizer fix (deferred-maintenance wedge). Validated lesson #10415 (deferred-maintenance escalation) by being the wedge that surfaced it.
- v1.49.782 — Tier E HIGH #3 (LoaderContext security chokepoint). Validated lesson #10414 (optional ctx? retrofit).
- v1.49.781 — Tier E HIGH #2 (Store/Registry naming hygiene + MemoryStore audit). Validated lessons #10409–#10411 (recon flips, filename-vs-class collisions, 3-way audit verdict).
- v1.49.780 — Tier E HIGH #1 (cli.ts dispatcher extraction). Originated the recon-first pattern.

## Forward path

The unshipped queue after v784:

- **Path A — NASA 1.178 forward-cadence (default-recommended).** Engine state has been at NASA 1.177 across v777-v784 (8 consecutive ships without engine-state advance). INTERSTELLAR-BOUNDARY axis obs#2 candidates (IBEX 2008, Wind 1994, Voyager 1/2 interstellar, Pioneer 10/11 interstellar, Cassini INCA 2009, FAST 1996, DE-1 1981).
- **Path C — risk-tier re-sweep at ~v789.** Deferred per cadence (currently +7 milestones from sweep). Will require its own ledger-driven wedge once the next sweep surfaces.

The 8-lesson candidate backlog is now drained. Future ships should emit lessons inline at the milestone they're observed, and codification at next batch (~5-10 lessons accumulated) per the discipline established at v654 and reinforced here.

Operator picks per-ship. The default-recommendation after a 4-ship architecture + maintenance + codification series is to return to engine-state forward-cadence.
