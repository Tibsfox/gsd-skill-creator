# v1.49.588 — Forward Lessons

Four forward lessons emitted (#10183–#10186).

## #10183 — UNMANNED-PRECURSOR-VALIDATION as a structural primitive distinct from SMFOS / ALL-UP COMMITMENT / SAF / GA / CWO

**Definition:** A mission/release that tests a high-stakes subsystem for the first time in the operational environment, with the explicit certification goal of qualifying that subsystem for first full operational exposure (typically first crewed exposure for spaceflight UPV).

**3-criterion rubric:**
1. Sole-purpose subsystem certification (the platform exists for nothing else)
2. Cleanly distinct from prior §6.6 threads (different primitive class — UPV is forward certification, SMFOS is terminal exploitation, ALL-UP is full-stack first-flight, SAF is recovery-from-prior-failure, CWO is documentation-window-opening)
3. Generalizable via multiple plausible 2nd-exemplar candidates (Apollo 6, Skylab 1, Buran 1K1, SpaceX Crew Dragon DM-1)

**Founding exemplar:** Apollo 5 LM-1 (NSSDC 1968-007A; 1968-01-22).

**Forward action:** Future v1.70+ degrees touching this thread should evaluate against the 3-criterion rubric. Apollo 6 (v1.70) is the strongest near-term candidate to advance UPV from 1-ex to 2-ex.

## #10184 — Mission-complete-marker as the structurally distinguishing condition for UPV

UPV exemplars exhibit a "mission-complete marker": the event/decision that signals the validation is complete and the validated subsystem is handed to the crewed mission. Examples:

- **Apollo 5:** the post-mission engineering review concluding DPS+APS were certified for crewed flight; threshold-widening for subsequent missions.
- **BS&T *Child Is Father to the Man*:** Al Kooper's ouster from the band in April 1968 — founding designer reassigned after proof-of-concept.
- **Steller's Jay first-year floater:** successful breeding territory establishment in second-year spring (or deferral with revised strategy).

**Distinguishing condition:** SMFOS has no parallel marker because SMFOS IS the terminal output. UPV is forward-looking with a clear handoff event.

**Forward action:** Future UPV exemplar evaluations should explicitly identify the mission-complete marker as part of the 3-criterion rubric application.

## #10185 — Concurrent W2 build agent quota interaction discipline

Three parallel W2 build agents (W2-NASA 80K + W2-MUS 50K + W2-ELC 40K = ~170K total tokens dispatched concurrently) hit Anthropic per-account rate-limit at ~60-65% completion. Recovery in main context added ~25 minutes wall-clock but produced all 24 missing files cleanly without ship delay.

**Forward action:** For v1.49.589+, either:
- (a) Dispatch W2 build agents serially: W2-NASA first (largest), then W2-MUS+W2-ELC in parallel after W2-NASA returns
- (b) Check rate-limit headroom before parallel dispatch (e.g., wait for predecessor RH refresh quota window to clear)
- (c) Pre-cache Sonnet credits before W2 dispatch
- (d) Build smaller W2 agents (split NASA into NASA-pages + NASA-artifacts; reduce per-agent token estimate)

Recommended default: option (a) serial-then-parallel; total wall-clock impact ~10-15 min vs all-parallel.

## #10186 — Multi-track-trs scorer rubric extension as a sustained discipline

The F/25 → A/90 transition for v1.49.587 README via the new `multi-track-trs` rubric branch (commit `ac488bb35`) demonstrates that the scorer rubric extension methodology — established for cleanup-mission at v1.49.585 (Lesson #10175) — generalizes to other non-NASA-degree-shaped milestones. Pattern:

1. Identify the new milestone shape (e.g., counter-cadence cleanup, three-track-plus-TRS)
2. Add detection heuristic (`isMultiTrackTrs`, `isCleanupMission`)
3. Add rubric calibrated to 100 directly (8-dimension typically)
4. Wire into auto-detect dispatch
5. Add unit tests mirroring prior pattern

**Forward action:** When the engine produces another novel milestone shape (e.g., a research-only milestone with no NASA forward, or a multi-program coordination milestone), apply this same 5-step pattern. Resist the temptation to re-shape the new milestone to fit the existing rubric — the rubric should grow with the engine's structural vocabulary.
