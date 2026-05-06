# v1.49.608 — Forward Lessons

## Promoted to ESTABLISHED

### #10246 ESTABLISHED at obs#4 — Sonnet stalls on long Writes; Opus + chunked = recovery path

**Statement (refined):** Sonnet-class subagents reliably fail when authoring sibling files >100 lines via a single large Write tool call. Failure modes observed: rate_limit_exceeded (v604/v606), stream watchdog 600s timeout (v608). Root pattern reproduces across observations regardless of specific failure surface — the underlying bottleneck is single-tool-call output size approaching the 32K cap.

**Recovery (the working pattern):** Opus-class subagent + chunked Write+Edit discipline:
- 1 initial Write of skeleton (~12-15KB, ~150-250 lines: head + CSS + opening structure + first 1-2 cards with `TODO` markers if needed)
- 6-10 sequential Edit operations to fill remaining content (each ≤7KB output)
- Each tool-call output stays well under the 32K cap

**Quality tradeoff:** Tier-2 inline-equivalent quality is 80-90% predecessor depth (WARN-tier, ship-acceptable). Pure Sonnet success would be 95-113% (PASS-tier). The drop is tolerable when the alternative is no ship.

**Forward action:** future W2 dispatches default to Opus-class with chunked discipline. Sonnet remains fallback only for short artifacts (≤8KB single deliverables — small JSON, short scripts, short circuit netlists).

---

## CANDIDATE lessons emitted at v608

### #10260 CANDIDATE — stream-watchdog timeout on long single-Write generation

**Statement:** The 600s stream watchdog measures "no progress" by stream-token-emission frequency, not by bytes-written-to-disk. A subagent mid-generation on a single large tool call (e.g. authoring 25-30KB index.html via single Write) can stall the watchdog without producing any disk output, causing the watchdog to kill the agent before any file lands.

**Trigger:** any W2 build agent with a deliverable >15KB.

**Action:** include explicit chunked Write+Edit pattern instruction verbatim in the agent prompt. The instruction MUST specify chunk sizes (e.g. "Write skeleton ≤12KB then 6-10 Edits each ≤7KB") because model heuristic alone does not reliably produce the chunked pattern. This is observation #1 of the lesson.

**Soak target:** 2 observations before promotion to ESTABLISHED. v608 is observation #1.

**Composes with #10246:** the stream-watchdog failure mode is an alternative trigger surface for the same root pattern that #10246 captures. When #10246 fires due to stream-watchdog rather than rate_limit, the recovery path is identical (Opus + chunked).

---

### #10261 CANDIDATE — 3-of-3 paired-architecture-triplet pattern

**Statement:** Within a tight ±60d envelope, three independently-emerging paired-architecture structures co-occurred at v608: Beatles paired-LP (Red+Blue, 1973-04-02) + CITES paired-list (Appendix I+II, 1973-03-03) + Pioneer paired-flight (10+11, NASA-Ames identical-spec sequential builds). The 3-of-3 occurrence within ±60d is statistically striking and may reproduce across other engine-cadence milestones.

**Trigger:** any engine-cadence milestone with two or more "paired-X" structural primitives surfaced across different tracks within ±60d.

**Action:** explicitly enumerate as headline Resonance Axis. Track for cross-milestone reproducibility — when reproduced, the cross-track substrate-coherence between music + treaty + spacecraft tracks is the load-bearing pattern (not coincidence).

**Soak target:** 3 observations before promotion to ESTABLISHED. v608 is observation #1.

---

## Carry-forward lessons (active soak)

### #10247 SAME-DAY-CALENDAR-COINCIDENCE soak observation #3 — NEGATIVE-CONFIRMING

**Statement:** Three consecutive observations (v604/v606/v608) testing whether substrate-emergent picks across NASA + MUS + ELC + SPS exhibit same-calendar-day coincidence. Results:
- v604: ANCHORING (Pioneer 10 launch 1972-03-03 + Stockholm Conference convening 1972-06-05 + ...)
- v606: 1-ex POSITIVE (Apollo 17 splashdown 1972-12-19 + Marine Mammal Protection Act effective 1972-12-21 = 2-day offset, marginal)
- v608: NEGATIVE-CONFIRMING (CITES 1973-03-03 vs Pioneer launch 1973-04-05 = 33-day offset; Beatles 1973-04-02 = 3-day offset; Marbled Murrelet nest 1974-08-07 = no Pioneer-boundary same-day match)

Three observations and only one weakly-positive instance. The pattern, if it exists, is rare — substrate-emergent selection (#10236) operates **independently** of same-day-coincidence. v608 is observation #3 NEGATIVE-CONFIRMING; soak continues.

**Forward action:** continue passive watchlist; needs 3-ex POSITIVE (clear same-day coincidence at three independent milestones) for ESTABLISHED — current 1/3 positive ratio is below threshold.

---

### #10245 CANDIDATE counter-cadence soak — observation #2 NEGATIVE-CONFIRMING (passive at v608)

v607 Code Atlas was obs#2 (counter-cadence does not disrupt engine-cadence soak chain). v608 is engine-cadence and does not advance #10245. Next observation will be next counter-cadence ship.

---

## Carry-forward DEFERRED items

- **#10238 + #10240** STILL DEFERRED to v610 hard-fork milestone (per v605/v606 carry-forward chain; v608 takes no action; v609 may continue defer or escalate)
- 4 historical NASA track-card drifts (1.34/1.36/1.57/1.75) remain operator-decision-deferred (passive)
- TRS Wave 2.5 schema refinement (year-range floor) — passive
- TRS pack-03 algebraic geometry binding — recommended for v609 or v610 hard-fork milestone

---

## Forward action items emitted at v608

| # | Action | Owner | Target |
|---|---|---|---|
| FA-608-1 | Amend `W2-build-agent-prompt.md` with explicit chunked Write+Edit pattern instruction (per #10246 ESTABLISHED + #10260 candidate) | v609 W0 | v609 |
| FA-608-2 | Track #10260 reproducibility at v609 W2 dispatches | v609 W2 | v609 |
| FA-608-3 | Track #10261 reproducibility (paired-architecture-triplet pattern) at v609 substrate evaluation | v609 W3 | v609 |
| FA-608-4 | Continue #10247 soak — observation #4 needed for any path to ESTABLISHED | v609 W3 | v609 |
| FA-608-5 | Evaluate v610 hard-fork milestone scope (#10238 + #10240 escalation decision) | v609 close | v610 candidate |
| FA-608-6 | TRS pack-03 algebraic geometry binding selection (recommended for v609 if engine-cadence; otherwise v610 hard-fork) | v609 W1 | v609 |
