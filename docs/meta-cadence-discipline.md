# Meta-Cadence Discipline

**Surface:** Planning a counter-cadence cleanup-mission; deciding which
operational debt to spend a non-degree-advancing ship on; auditing whether
the project's operational axes are in balance.

**Codified at:** v1.49.805 (Strengthening Lever S3 promotion — built on
the 2026-05-26 core-functions audit retrospective).
**Verify-axis added at:** v1.49.844 (canonical-doc home for the
verification/integration-only ships observation; v829 + v832 evidence
base. Promotion-to-numbered-lesson deferred until next codify ship per
#10426).

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
