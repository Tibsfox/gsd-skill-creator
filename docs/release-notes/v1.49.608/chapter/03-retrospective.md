# v1.49.608 — Retrospective

## Carryover lessons applied

**From v1.49.606 (Apollo 17 / engine-cadence):**

- **#10241 paired-mission lookback admit** — operator-recommended decision at v606 W3.5 was "ADMIT at 2-ex when v608 Pioneer 11 ships." Honored at v608 W3.3.
- **#10242 ESTABLISHED-reaffirm at obs#7** — 4-track NASA+MUS+ELC+SPS substrate convergence reproduced at v608 (paired-architecture-triplet substrate at PAIRED-CONFIRMATION + GRAVITATIONAL-ASSIST-AS-REDIRECTION + RTG-DEEP-SPACE-SURVIVAL + PLANETARY-PERSPECTIVE).
- **#10246 quota-watch carried forward** — v606 close noted obs#3 POSITIVE-RECURRENCE; v608 W2 dispatch was the next quota-watch. The watch landed: Sonnet stalled at long Write step (different mechanism but same root pattern); Opus chunked Write+Edit recovery succeeded.

**From v1.49.607 (Code Atlas counter-cadence):**

- **No engine-cadence soak items advanced** — counter-cadence does not advance #10231/#10233/#10236/#10237/#10242/#10244 soak counters. These reaffirm at v608 as if v607 had not occurred. Confirms #10245 NEGATIVE-CONFIRMING soak observation #2 from v607 (counter-cadence doesn't disrupt engine-cadence soaking).
- **#10254 post-W4 work-review pass** (emitted v607) — N/A for v608 (pure engine-cadence build; no new IPC surface or Tauri delegate trait).

**From v1.49.591/603 (track-card BLOCKER gate):**

- **Fourth operational application of track-card-coverage + nav-card-presence BLOCKER gate.** NASA 1.85 ships with 8/8 Track cards + ≥1 nav-card; depth-audit submetric PASS. Soak observation #4 of #10244-pattern-v603.

## New lessons emitted

**#10260 CANDIDATE — stream-watchdog timeout interacts with long-tool-call generation:** the 600s stream watchdog can kill a subagent mid-generation on a single large tool call (e.g. 25-30KB Write). Watchdog measures stream-token-emission frequency, not bytes-written-to-disk. Forward action: include explicit chunked Write+Edit pattern instruction in subagent prompt; do not rely on model heuristic.

**#10261 CANDIDATE — 3-of-3 paired-architecture-triplet pattern reproducibility:** within tight ±60d envelope at v608, three independently-emerging paired-architecture structures co-occurred (Beatles paired-LP + CITES paired-list + Pioneer paired-flight). The 3-of-3 is statistically striking and may reproduce. Forward action: enumerate explicitly as headline Resonance Axis when pattern surfaces; track for cross-milestone reproducibility.

**#10246 PROMOTED to ESTABLISHED at obs#4:** Sonnet-class subagents reliably fail on W2 builds requiring single Writes >12-15KB. Recovery: Opus + 1 small Write skeleton + 6-10 incremental Edits. Quality tradeoff 80-90% predecessor depth (WARN, ship-acceptable). Forward action: future W2 dispatches default to Opus + chunked discipline; Sonnet remains fallback only for short artifacts (≤8KB).

## W2 stall recovery retrospective

Two consecutive Sonnet subagents stalled at the Write step when authoring NASA 1.85 index.html (target ~600 lines). Stall reason: "no progress for 600s (stream watchdog did not recover)" with no files written to disk. Recovery escalation:

| Attempt | Model | Outcome |
|---|---|---|
| 1 | Sonnet | stall at Write |
| 2 | Sonnet (narrower scope) | stall at Write |
| 3 | Opus (chunked Write+Edit instructed) | **PASS** — 541 lines / 97.6KB / 80% predecessor (WARN-tier) |

Key insight: model class alone (Sonnet vs Opus) was not the discriminator — the discriminator was **explicit chunked Write+Edit pattern instruction in the prompt**. The third attempt (Opus + chunked) succeeded; a parallel MUS dispatch (Opus, no explicit chunking instruction) also stalled and required retry with explicit chunking instructions.

This refines the W2-build-agent-prompt.md MANDATORY discipline: the chunked pattern instruction must be in the agent prompt verbatim, not relied on as model heuristic. Forward action item: amend W2-build-agent-prompt.md template at v609 W0 to include the explicit chunked instruction.

## Process observation and Drift

1. **Five W2 dispatches in parallel was sustainable.** After the NASA Stage-1 success, the orchestrator dispatched 5 parallel Opus build agents (NASA Stage-2, NASA Stage-3, MUS, ELC, SPS) — all completed within the same wall-clock window without quota collision. Validates the parallelism strategy when Opus quota is available.
2. **MUS retry succeeded on second dispatch** with stricter chunking discipline (≤7KB per Edit). Suggests the chunking discipline lowers stall risk monotonically — tighter chunks = lower risk.
3. **Catalog-index update was a manual step** — the auto-update tool can rewrite NASA's `completedMissions` Set programmatically but refuses to invent narrative content for MUS+ELC degree cards. Manual authoring of degree cards (one each for MUS 1.85 + ELC 1.85) was needed; ~10 minutes wall-clock.
4. **§6.6 admission ceremony density was high at v608.** Four admit decisions in one wave (#10241 + PLANETARY-PERSPECTIVE + PAIRED-OLD-GROWTH-OBLIGATE + SUBSTRATE-COHERENCE-PREDICTS-CROSS-PACK-DENSITY). Three of these were carry-forward 2-ex/3-ex/4-ex evidence chains accumulated across prior milestones; v608 was the trigger milestone for all of them. This is unusual density and reflects v608's structural position as the second-instance-of-a-paired-program — confirming pair-completion patterns concentrate admissions at the completion ship.
