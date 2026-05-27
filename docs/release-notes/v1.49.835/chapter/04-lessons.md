# v1.49.835 — Lessons

## New lesson candidates (3, all deferred)

### Scaffold ship pattern (1 instance)

**Status:** 1 instance (this ship). NOT codified. Wait for 2nd.

**Provisional scope:** A scaffold ship registers a new framework-recognized class (here: a `CalibratableThreshold` member + observation source) WITHOUT wiring its production data path. Returns the honest baseline (`direction: 'hold'`, empty observations) until a future ship lands the production wire. Different from:
- Wire-adding chip (adds production wire to existing class).
- Stale-entry cleanup chip (removes stale allowlist entry; no source change).
- Codify ship (adds discipline doc + manifest entry).
- Calibrate ship (updates threshold value after observation-source-wired class collects data).

**Provisional pattern:** Register the class in the type union → add `observationSourceFor` case with `wired: false` + explicit "awaiting production wire" description → add `loadObservationsForThreshold` fallthrough returning empty → add 2 mirror tests in observation-sources.test.ts → update inline JSDoc comments to enumerate the unwired classes.

**Evidence anchor:** v1.49.835 (this ship) — `predictive.low_confidence_threshold` registered with `wired: false`.

**Precedent (similar shape, different threshold):** v1.49.798 `token_budget.max_percent` — registered at v798 but wired only `token_budget.warn_at_percent` at v803. The `max_percent` class still has `wired: false` today. The v835 pattern is mirror-image of the v798 case study.

### Paired "framework-predicted, recon-caught" ship arc (1 arc)

**Status:** 1 arc (v834 + v835). NOT codified. Wait for 2nd arc.

**Provisional scope:** Two ships in the same session, each closing a silent framework gap that was explicitly predicted in prior docs/handoffs, each caught by per-ship recon discipline. The ARC is the unit of pattern, not individual ships. Different from:
- Counter-cadence cluster (3+ ships of operational debt cleanup).
- Chain (3-4 ships sharing a feature theme).
- Codify ship (codification at chain close).

**Provisional pattern:** Recognize that 2+ docs/handoffs predict the same shape of gap (the audit-test asymmetry; the type-registration deferral). Plan paired ships in one session that close both gaps. Reference the prediction in each ship's recon + release notes. The arc demonstrates that **forward-observation doc paragraphs are load-bearing**: writing down "we expect to catch this manually" creates a checklist item for future operators.

**Evidence anchor:** v1.49.834 + v1.49.835 — sibling ships closing v812-flagged allowlist gap + v830-implicit type-registration gap.

**Candidate-for-2nd-instance triggers:** any future session that ships 2 paired gap-closing ships based on prior framework-adjacent predictions.

### Type-registered vs observation-source-wired vs runtime-wired (1 forward-flag)

**Status:** 1 forward-flag from this ship. NOT yet a multi-instance pattern.

**Provisional scope:** Calibratable thresholds have 3 distinct wire surfaces:
1. **Type-registered** — present in `CalibratableThreshold` type union.
2. **Observation-source-wired** — `observationSourceFor` returns `wired: true`; `loadObservationsForThreshold` returns non-empty observations from a real data path.
3. **Runtime-wired** — production code consumes the threshold value (e.g. copper + selector consume `lowConfidenceThreshold` via `PredictiveSkillLoaderConfig`).

A threshold can be at any combination of these states. The v833 README's "6 of 6 wired" claim conflated surfaces 1 and 3 (both true for the 6 then-existing thresholds). v835 separates the surfaces: now 7 type-registered, 6 runtime-wired, 5 observation-source-wired (`suggestions.*` × 3 + `token_budget.warn_at_percent` × 1 + new = wait — actually 4 wired).

Wait, recounting: observation-source-wired classes at v835 = 4 (`suggestions.min_occurrences`, `suggestions.cooldown_days`, `suggestions.auto_dismiss_after_days`, `token_budget.warn_at_percent`). Unwired observation sources: `token_budget.max_percent`, `observation.retention_days`, `predictive.low_confidence_threshold` = 3. Type-registered: 4 + 3 = 7. So at v835 close: 7 type-registered, 4 observation-source-wired, 6 runtime-wired (the new `predictive.low_confidence_threshold` has runtime wire via copper + selector but no observation source).

Future ships should use precise framing per surface. Worth surfacing in a future documentation pass if the conflation recurs.

## Forward-test of existing lessons

### #10416 — Lightest wire

**Status:** RESPECTED. ~24 LOC change (1 type field + observation source case + 2 test cases + JSDoc updates) closes the registration gap. No threshold-writer change needed (generic dotted-path splitting). No CLI surface change needed (avoid surfacing what you can't act on).

### #10425 — Bounded-learning calibration discipline

**Status:** RESPECTED. The `wired: false` baseline returns `direction: 'hold'`, the honest outcome per the v798 precedent. The v835 scaffold doesn't ship a calibration recommendation; it ships the explicit "no data yet" position.

### #10426 — Second-instance threshold

**Status:** RESPECTED. The scaffold ship pattern is at 1 instance; deferred. Carry-forward observations logged.

### #10428 — Meta-cadence

**Status:** RESPECTED. calibrate-axis tick: 5 ships past last calibrate (v830). Within ~10-ship floor. v835 takes the registered-but-not-wired sub-axis to 0 ships ago; the wired-source sub-axis stays at 5 ships ago.

### #10432 — KNOWN_UNWIRED ledger

**Status:** NOT EXERCISED. No chokepoint chip this ship.

### #10433 — Internal-helper

**Status:** NOT EXERCISED.

### #10434 — Discipline coverage ratchet

**Status:** UNCODIFIED unchanged at 39 (≤ ceiling 41). No new manifest entries; deferred carry-forward observations only.

### #10427 — Failure-mode contracts

**Status:** RESPECTED. The `loadObservationsForThreshold` empty-return-for-unwired classes is the honest baseline per #10427's "fail loudly OR document silent failure" pattern. Here the failure mode is: calibration returns `hold` (not an error; the explicit "no data" position) — load-bearing observability via `observationSourceFor().wired: false` rather than a swallowed silent failure.

## Tentative observations carried forward

Inherited from v834:
- Stale-entry cleanup chip pattern (1 instance) — DEFERRED.
- Per-ship release-notes count claims inherit predecessor without source-of-truth re-derivation (1 instance) — DEFERRED.
- Audit-inverse-check enhancement as defensive measure (1 forward-flag) — DEFERRED.

Inherited from v833:
- Substrate-consumer hook PAIR pattern (2 instances) — DEFERRED.
- `onPredictions` substrate-consumer wire pattern (2 instances) — DEFERRED.
- #10433 LOC-band-by-callsite-count refinement (3 instances) — DEFERRED.
- Verification/integration-only ships axis (2 instances) — DEFERRED.

NEW this ship (all 1 instance, deferred):
- Scaffold ship pattern.
- Paired "framework-predicted, recon-caught" ship arc.
- Type-registered vs observation-source-wired vs runtime-wired as 3 distinct surfaces.

## Cadence observation

v835 closes the v834-v835 paired arc cleanly. Three new tentative observations join the existing carry-forward set; total tentative observations at v835 close: ~10 (most at 1 instance).

The codify-axis tick is now 2 ships past last (v833). Calibrate-axis tick is 0 ships ago for type-registration sub-axis; 5 ships ago for observation-source-wired sub-axis. Consume-axis tick is 1 ship past last (v834).

All three axes within their floors. The forward-cadence axis (NASA degree) is at 53 consecutive ships at 1.178 — the dominant open pressure. v836+ strong-default is NASA 1.179.
