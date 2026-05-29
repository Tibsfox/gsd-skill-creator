# Meta-Cadence Discipline

**Surface:** Planning a counter-cadence cleanup-mission; deciding which
operational debt to spend a non-degree-advancing ship on; auditing whether
the project's operational axes are in balance.

**Codified at:** v1.49.805 (Strengthening Lever S3 promotion — built on
the 2026-05-26 core-functions audit retrospective).
**Verify-axis added at:** v1.49.844 (canonical-doc home for the
verification/integration-only ships observation; v829 + v832 evidence
base).
**Numbered-lesson promotions:** v1.49.847 — #10438 (verify axis as a
first-class numbered lesson) + #10439 (CLI manual + substrate auto-emit
duality as the calibrate-axis completeness criterion).

---

## The four axes

The project's operational health depends on three cadences, each of which
can fall out of phase independently:

1. **Codify** — promote ESTABLISHED lessons into discipline docs +
   `tools/render-claude-md/disciplines.json` + CLAUDE.md regen. Cadence
   target: every ~7-10 ships under the audit-streak baseline (proven
   v784, v790, v802, v805).

2. **Consume** — write the consumer-engine ship that *uses* a substrate
   shipped in a prior milestone. Cadence target: ≤6 ships from substrate
   ship to first non-test caller (Era D's empirical baseline; see
   `.planning/AUDIT-2026-05-26-core-functions-retrospective.md` §3.4).

3. **Calibrate** — close the bounded-learning calibration loop on a
   threshold. Cadence target: one calibration ship per ~10 forward
   ships once the loop is wired (T1.1 closed at v801).

4. **Verify** *(added v1.49.844)* — small src/ delta + substantial test
   infrastructure ship. Proves an existing substrate wire works
   end-to-end without adding new substrate, new callers, or new
   thresholds. Examples: cross-rootdir integration tests, application-
   boundary tests, end-to-end-pipeline harness work. Cadence target:
   ~1 verify ship per ~10 ships when substrate-with-test-coverage-gaps
   exists. Evidence base: v1.49.829 (cross-rootdir integration test
   for ObservationBridge ↔ translateSessionEvent) + v1.49.832
   (cross-rootdir integration test for ConceptFallbackProvider
   selector wire).

When all four axes are in phase, the substrate-builder / substrate-user
/ substrate-tuner / substrate-verifier ratio matches the project's
stated identity as an adaptive learning layer. When one axis lags,
the project drifts toward either pure substrate engineering (consume
+ calibrate + verify lagging) or pure post-hoc framing (codify-only)
or "shipped substrate without proof-of-wire" (verify lagging while
consume + calibrate run ahead).

---

## When to invoke the meta-cadence check

Before opening a counter-cadence cleanup-mission, check the four axes:

- **Codify axis** — is there ≥1 ESTABLISHED lesson + ≥1 supporting
  evidence cluster sitting in the lesson-candidate backlog? If yes,
  codification is a candidate.
- **Consume axis** — is there a substrate module that has not gained a
  non-test caller within 6 ships of its ship date? If yes,
  consumer-engine ship is a candidate.
- **Calibrate axis** — has any wired calibratable threshold accumulated
  ≥N observations (where N matches the e-process α + λ) without the
  loop being run? If yes, calibration ship is a candidate.
- **Verify axis** — is there a substrate-with-callers that lacks an
  application-boundary or integration test proving the wire works
  end-to-end? If yes, verify ship is a candidate. Tells: the substrate
  has unit tests against mocks but no integration test against real
  callers; or recent integration-test failures revealed a wire gap that
  a hardened test would have caught.

The check is informational, not mechanical. The operator picks the axis
with the most pressure; the goal is alternation across axes over time,
not strict round-robin.

---

## Why this is a discipline, not a rule

Codify-only counter-cadence (the historical default through v784) gives
the project a clean retrospective surface but no closed feedback loop.
Consume-only ships (rare; usually accidental) leave substrate calibrated
to a single use case. Calibrate-only ships are blocked on having a
substrate to calibrate.

The discipline is: explicitly NAME which axis a counter-cadence ship is
investing in, so the long-run distribution of cleanup-mission ships
across the three axes is observable in retrospect. The
`docs/release-notes/<X>/chapter/03-retrospective.md` "Verdict on scope"
section is the artifact-level surface for this naming.

---

## Cadence-overdue check (lightweight, prose-only)

For each axis, the canonical "overdue" trigger:

- **Codify overdue** — ≥5 ESTABLISHED lesson candidates accumulated in
  the manifest's pending backlog AND ≥10 forward ships have shipped since
  the last codification ship.
- **Consume overdue** — any substrate module with `wired: false` in its
  observation-source registry AND ≥10 ships since the substrate ship.
- **Calibrate overdue** — any wired threshold with ≥20 observations
  accumulated AND the calibration loop has not been run on that
  threshold in ≥10 ships.
- **Verify overdue** — any substrate module with non-test callers (per
  the consume axis) but no integration test under `tests/integration/`
  or `src/**/__tests__/integration/` exercising the substrate-to-caller
  wire end-to-end AND ≥10 ships since the first non-test caller landed.

When ANY axis is overdue, the next counter-cadence's scope discussion
should NAME that axis as the proposed investment, even if a different
axis ultimately wins on operator priority. The naming is the load-bearing
discipline; the choice is operator-bounded.

---

## Forward-shadow: programmatic cadence-overdue check

The cadence-overdue check is currently prose-only. A future ship could
encode each axis's overdue trigger as a CLI subcommand:

- `skill-creator cadence --axis codify --check` → exit 0 if not overdue,
  exit 1 with a description if overdue.
- Same for `--axis consume`, `--axis calibrate`, and `--axis verify`.

The CLI would read manifest entries (codify), observation-source
registry wired flags (consume), audit-log entries (calibrate), and
integration-test presence for substrate-with-callers (verify)
respectively. The shape would mirror the existing
`bounded-learning --summary` JSON output: structured per-axis report.

This is a tentative observation, not a candidate. The prose check is
sufficient until the third codification ship under this discipline
surfaces enough evidence to justify the tool.

---

---

## Lesson #10438 — Verify axis: prove-the-wire-works as a first-class axis

**Codified at:** v1.49.847 (canonical-doc home set at v844; numbered-lesson
promotion this ship).

A verify ship adds no new substrate, no new caller, and no new calibratable
threshold. It adds the integration test that EXISTING substrate-and-caller
could have been carrying since the substrate landed. The work is
qualitatively distinct from the three earlier axes: codify produces a doc;
consume produces a caller; calibrate produces a threshold update. Verify
produces a proof — a test that exercises the existing wire against real
(not mocked) collaborators.

### Evidence (2 instances; both cross-rootdir integration tests)

- **v1.49.829** — `tests/integration/college-observation-bridge-wire.integration.test.ts`.
  Exercises the cross-rootdir ObservationBridge ↔ translateSessionEvent wire
  end-to-end. Small src/ delta; substantial test infrastructure; proves the
  v824 wire works against real ObservationContext + ConsumedSubstrate
  primitives.
- **v1.49.832** — `tests/integration/copper-rosetta-fallback-wire.integration.test.ts`.
  Exercises the ConceptFallbackProvider selector wire from src/ → .college/.
  Same shape: small src/ delta, substantial test fixture, proves the v830
  wire fires end-to-end.

### Why two instances was enough

v829 + v832 are NOT minor variations on a single pattern. v829 tests an
observation-bridge wire; v832 tests a fallback-provider wire. Both are
cross-rootdir (src/ ↔ .college/) — a property that #10435 makes
structurally testable but does not itself require the integration test.
The fact that two independent wires of different shapes both needed the
same kind of follow-up ship is the contrast that promotes the axis.

### How to apply

When a substrate ship's retrospective lists "no integration test yet" as a
known gap, the verify ship is the named follow-up. The trigger is
`≥10 ships since first non-test caller landed and no integration test
exists` — that gives the wire enough operational time for the test surface
to settle, but not so much that the substrate becomes shelfware (per
#10422).

### Anti-patterns

- ❌ Bundling verify work into a consume ship. Inflates scope past a clean
  operator-session and the verify work tends to get under-tested.
- ❌ Skipping verify because "unit tests cover it." Unit tests against mocks
  prove the wire's signature; integration tests against real collaborators
  prove the wire's behavior. Both are necessary; neither substitutes for
  the other.
- ❌ Verify ship without a named substrate target. If you can't point at
  "this is the substrate whose wire I'm proving," the ship is exploratory,
  not a verify ship.

### Cross-references

- **#10428** — verify is the fourth axis of meta-cadence; this lesson
  formalizes the axis added structurally at v844.
- **#10435** — cross-rootdir wire pattern is the test-coverage gap that
  the v829 + v832 verify ships closed.
- **#10422** — shelfware verdict patterns; verify ships are the
  production-side validation that complements the verdict-side
  observability.

---

## Lesson #10439 — CLI manual + substrate auto-emit duality (calibrate-axis completeness rule)

**Codified at:** v1.49.847 (from v803 + v845/v846 two-instance evidence).

A calibratable threshold's calibration loop is structurally incomplete
until BOTH write callers ship:

1. **Manual recorder** — a CLI surface that lets an operator emit a single
   labeled event with explicit polarity. Examples:
   `skill-creator predict-next <skill> --useful`/`--not-useful` (v845);
   token-budget CLI mode flag (v803).
2. **Substrate auto-recorder** — a production-traffic path that auto-emits
   events with a default polarity, so the loop sees real-world data without
   operator action. Examples: copper/activation + selector auto-emit on
   low-confidence (v846); `/sc:status` integration writing token-budget
   events (v803).

### Why both halves are needed

The CLI alone produces only operator-attributed events (useful for
spot-checks and synthetic test runs). The auto-recorder alone produces
only traffic-attributed events (useful for steady-state calibration but
cannot exercise edge-case polarities at will). Together, they let the
calibration loop see both the rare-event distribution (operator-driven)
and the steady-state distribution (traffic-driven).

### Evidence (2 instances; full 3-ship pattern per threshold)

| Threshold | Read-side wire | CLI manual recorder | Substrate auto-recorder |
|---|---|---|---|
| `token_budget.warn_at_percent` | v1.49.798 (registry extraction) + v801 (calibration loop) | v1.49.803 (CLI mode flag) | v1.49.803 (`/sc:status` Step 4.6) |
| `predictive.low_confidence_threshold` | v1.49.837 (observation source registered) | v1.49.845 (`predict-next <skill> --useful`/`--not-useful`) | v1.49.846 (copper/activation + selector auto-emit) |

### How to apply

When shipping a new calibratable threshold, plan for THREE ships:
observation-source registration → CLI manual recorder → substrate
auto-recorder. The order matters: observation-source first (read side),
CLI second (cheap-to-verify operator flow), substrate auto-recorder third
(traffic flow).

Default polarity for the auto-recorder MUST mirror the CLI's parseArgs
default. If the CLI defaults to `--not-useful`, the substrate auto-recorder
writes `not_useful` events. This consistency lets the calibration loop
compute meaningful statistics across both event sources.

### Forward-test trigger

Any future calibratable-threshold ship that registers a read-side
observation source. Within 6 ships (per #10428 consume-axis cadence), both
write callers SHOULD have shipped, OR a retrospective should explicitly
flag the missing halves as deferred-but-tracked.

### Anti-patterns

- ❌ Shipping the read-side wire without the write callers. The threshold
  becomes substrate-without-callers — the consume-axis shape #10428 is
  designed to surface.
- ❌ Shipping ONLY the CLI manual recorder. Traffic doesn't exercise it;
  calibration runs on synthetic-only data.
- ❌ Shipping ONLY the auto-recorder. Operator can't generate edge-case
  polarities to validate the loop's behavior.
- ❌ Diverging polarity defaults between the CLI and the auto-recorder.
  Calibration statistics become apples-to-oranges across event sources.

### Cross-references

- **#10428** — meta-cadence; this lesson refines the calibrate-axis
  completeness criterion.
- **#10437** — subscriber-gated observability hook; v846's auto-emit uses
  this shape inside the existing emitPredictions chain.
- **#10427** — failure-mode contracts; both CLI and auto-recorder writes
  are accessory surfaces (must fail silently).

---

## Lesson #10453 — Substrate→calibration end-to-end integration test pattern (verify-axis closing-move)

**Codified at:** v1.49.895 (from v856 predictive-low-confidence + v894 observation-retention two-instance evidence).

The verify-axis trigger from #10428 says: each calibratable threshold should have an integration test verifying the substrate-to-caller wire within 10 ships of the threshold first being wired by a production caller. Per #10438, unit tests against mocks prove the wire's signature; integration tests against real collaborators prove the wire's behavior. Lesson #10453 captures the canonical test shape for the closing-move integration test.

### The 7-step test shape

1. **Temp dir setup** via `mkdtempSync(join(tmpdir(), '<class>-verify-'))` in `beforeEach`; cleanup via `rmSync(tempDir, { recursive: true, force: true })` in `afterEach`. Test file lives at `tests/integration/<class>-end-to-end.integration.test.ts`.
2. **Substrate-side write** — invoke the substrate function with retention/threshold/usage arguments that will trigger the auto-emit. The substrate's return value is the first assertion (prunedCount, underBudget, etc.).
3. **Fire-and-forget wait** — `await new Promise<void>((resolve) => setTimeout(resolve, 50))` to let the auto-emit's `mkdir + appendFile` chain settle on real disk. Captured in Lesson #10454.
4. **Calibration-loop read** — `await loadObservationsForThreshold('<threshold>', { <class>EventsPath: eventsPath })`.
5. **Polarity assertion** — `expect(observations[0]?.value).toBe(<expected polarity>)`. For multi-event tests, accumulate polarities and assert the net sum (which encodes the operator-facing calibration signal).
6. **Missing-file tolerance** — call `loadObservationsForThreshold` with a path to a never-written file; assert `observations` is `[]`. Pins the writer-contract tolerance.
7. **Malformed-line tolerance** — pre-seed the JSONL with `'{not valid json\n'`, then write a valid event via the substrate; assert the reader sees exactly 1 event (silent-skip malformed). Pins the writer-contract tolerance.

### Evidence (2 instances)

| Threshold | First substrate-write | Integration test | Ships-after-wire |
|---|---|---|---|
| `predictive.low_confidence_threshold` | v1.49.846 | v1.49.856 | 10 (canonical trigger) |
| `observation.retention_days` | v1.49.891 | v1.49.894 | 3 (early within budget) |

Both instances follow the 7-step shape. v894 shipped early within budget; nothing prevents earlier ship when substrate is fresh and bug-detection signal is strongest.

### How to apply

After a calibratable threshold's substrate auto-emit ships (the third ship in #10439's three-ship duality), file the integration test ship within 10 ships. Use this test shape; mirror the v856 or v894 file as a starting skeleton (change the substrate function, the events module imports, the polarity-mapping facts).

### Forward-test trigger

Any future calibratable-threshold substrate ship. The verify-axis budget extends 10 ships from that substrate's ship version. v1.49.893 (token_budget.max_percent) is the next pending integration test; budget extends to v1.49.903.

### Anti-patterns

- ❌ Skipping the multi-event accumulation test. Single-event tests prove the wire works once; multi-event tests prove polarity flows through ordered writes (the calibration loop's actual interface).
- ❌ Asserting on the substrate's return value without also asserting on the calibration loop's read. The integration test's job is to prove the WIRE — both halves must be exercised.
- ❌ Using `setImmediate` instead of `setTimeout(50ms)`. The fire-and-forget Promise's `mkdir + appendFile` chain needs real OS time to settle (see Lesson #10454).
- ❌ Omitting missing-file or malformed-line tolerance tests. These pin the writer's contract; without them, a future refactor could break tolerance silently.

### Cross-references

- **#10428** — meta-cadence verify-axis; this lesson formalizes the canonical closing-move test shape.
- **#10438** — mocks-prove-signature, integration-proves-behavior; this lesson IS the canonical "integration-proves-behavior" recipe for calibratable thresholds.
- **#10437** — subscriber-gated observability; the fire-and-forget wait pattern in step 3 is the test-side complement of #10437's substrate-side discipline.
- **#10451** — read-side wire recipe (this lesson tests the wire that #10451's recipe builds).
- **#10452** — substrate-wrapper pattern (this lesson tests the wire that #10452's pattern builds).
- **#10454** — `setTimeout(50ms)` test-side wait (this lesson uses #10454's pattern in step 3).

---

## Cross-references

- [Counter-cadence discipline](counter-cadence-discipline.md) — the
  outer envelope that meta-cadence sits inside (when, not what).
- [Bounded-learning calibration discipline](bounded-learning-calibration-discipline.md) —
  the calibrate axis's technical substrate.
- [Architecture-retrofit patterns](architecture-retrofit-patterns.md) —
  the registry abstraction that makes the consume axis legible.
- [Shelfware verdict patterns](shelfware-verdict-patterns.md) — the
  observability + decision surface separation that supports the consume
  axis's overdue check.
- [Deferred-maintenance discipline](deferred-maintenance-discipline.md) —
  what to do when an axis falls past overdue.
