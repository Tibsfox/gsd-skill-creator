# Lessons Emitted — v1.49.898

No new manifest-promoted lessons this ship. One pattern strengthened to 3-instance (PROMOTION-READY, deferred to v899 codify ship); two new 1-instance candidates accumulated.

## PROMOTION-READY: Substrate→Calibration end-to-end test pattern (now 3 instances)

**Status:** READY-FOR-CODIFICATION at v899 (or next counter-cadence ship).

**Evidence (3 instances):**

1. **v1.49.856** — predictive low-confidence threshold integration test. First instance. Inverse polarity (raising threshold INCREASES fallback firing).
2. **v1.49.894** — observation-retention end-to-end test. Second instance. Default-fixed kind (`too_aggressive` / `too_lax`) with explicit override.
3. **v1.49.898** — token-budget-max-percent end-to-end test. Third instance. Outcome-driven kind (kind FALLS OUT OF the inequality being checked).

**Common shape:** 7-step canonical test skeleton already documented inline in #10453:
- temp dir setup (mkdtempSync + afterEach cleanup)
- substrate write call
- 50ms fire-and-forget wait (#10454)
- calibration-loop read call
- polarity assertion (single-event + multi-event with net-polarity check)
- missing-file tolerance
- malformed-line tolerance

**Substrate-specific variation axes:**

| Axis | v856 | v894 | v898 |
|------|------|------|------|
| Substrate sync vs async | async | async | sync |
| Kind selection | inverse polarity | default-fixed | outcome-driven |
| Boundary case | n/a | retention-day cutoff | strict-less-than ceiling |
| Polarity invariance | inverse (+1 = raise) | normal (+1 = lower) | normal (+1 = lower) |
| Override mechanism | n/a | `defaultKind` option | `defaultKind` option |
| Suppress auto-emit | n/a | n/a | `autoEmit: false` |
| Multi-event ordering | preserved (async await) | preserved (async await) | NOT preserved (sync spawn fire-and-forget) |

**Codification placement:** Add to `docs/meta-cadence-discipline.md` as the codified "substrate→calibration end-to-end" template, with the variation-axis table above. Cross-link from `docs/test-discipline/cf-closure-verification-templates.md`.

## NEW 1-instance candidate: Synchronous-substrate fire-and-forget order non-determinism

**Status:** 1-instance (v898).

**Discovery context:** v898 initial test asserted `expect(values).toEqual([1, 1, 1, -1, -1])` for 5 back-to-back synchronous substrate calls. Test failed with actual `[1, 1, 1, 1, -1]`. Root cause: `runTokenBudgetCeilingCheck` is synchronous but schedules `appendTokenBudgetMaxEvent(...).catch(()=>{})` per #10437. Five back-to-back synchronous calls spawn five Promise chains that complete in undefined order at the filesystem layer.

**Rule:** When testing a synchronous substrate that spawns fire-and-forget Promises, assertions on multi-call accumulated state MUST be order-independent (count-based, net-polarity, set-equality). Index-by-index assertions are a footgun.

**Why this matters:** The failure mode is silent at unit-test scale (each test has a single substrate call so order is trivially preserved). Only emerges at integration-test scale (multiple back-to-back calls in one event-loop tick). Sibling of #10454 (fire-and-forget wait via setTimeout 50ms) — both are properties of fire-and-forget semantics that don't reveal themselves until integration tests force the issue.

**Codification placement (when promoted):** Add as a sub-pattern of #10454 in `docs/failure-mode-contracts.md`.

## NEW 1-instance candidate: Within-budget closing-move opportunism

**Status:** 1-instance (v898; partial echo in v894).

**Discovery context:** v898 shipped 5 ships after the v893 substrate wire, well within the 10-ship verify-axis budget. The opening was opportunistic: the operator picked option 3 from the v896 handoff (continue chip-down + close verify-axis + codify) as a 3-ship session, and v898 fit naturally between v897 (chip-down) and v899 (codify). The 10-ship budget bounds the LATEST date the ship can happen; there's no rule about the EARLIEST. Closing-moves within budget reduce reasoning-state debt (one fewer PENDING entry in the next session's handoff).

**Rule:** Ship verify-axis closing-moves when an opening exists rather than waiting until the canonical trigger. The opening criterion: a 2-3 ship session is already planned, and a closing-move fits in the slot.

**Codification placement (when promoted):** Add to `docs/meta-cadence-discipline.md` as a heuristic for when to time within-budget axis-closing ships.

## Cross-references

- #10428 (Meta-cadence — verify-axis 10-ship budget; satisfied by v898)
- #10437 (Failure-mode contracts — fire-and-forget pattern, swallow-catch semantics)
- #10438 (Verify-axis integration test discipline — unit-vs-integration coverage)
- #10453 (Substrate→calibration end-to-end test pattern — this ship promotes to 3-instance ESTABLISHED)
- #10454 (Fire-and-forget test-side wait via setTimeout 50ms — sibling of the new sync-substrate ordering candidate)
- v1.49.856 (predictive low-confidence integration test — first instance)
- v1.49.894 (observation-retention end-to-end — second instance)
- v1.49.893 (token-budget-max-percent substrate auto-emit wire — this ship's predecessor)
