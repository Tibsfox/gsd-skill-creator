# v1.49.929 — Lessons

No new manifest lesson. This ship is a verify-axis instance (#10438) of two
already-codified disciplines:

- **#10435 (cross-rootdir wire pattern)** — extended with a corollary in
  `docs/cross-rootdir-wire-discipline.md`: composition-root closure is architecturally
  N/A; the `tests/integration/` test (step 4) IS the consume-axis closure, because no
  production location may import both `src/` and `.college/`. Absence of an
  (impossible) `src/` composition root is not an open gap. The `ConceptFallbackProvider`
  family is now closed for BOTH callers (copper v832 + selector v929).

- **#10438 (verify axis, `docs/meta-cadence-discipline.md`)** — third instance
  (v829 + v832 + v929). A verify ship proves an existing substrate-and-caller wire
  end-to-end without adding new substrate, caller, or threshold.

## Reinforced (carried-forward, not yet promoted)

- **Run the path, don't read it (sibling of v1.49.919).** The real-engine test
  exercised the empty-panel natural-fallback render path that the spy-based copper test
  and the panels-present `.college` roundtrip test both missed. A real-collaborator
  integration test surfaces behavior that mock-based unit tests and partial-coverage
  integration tests cannot.

- **Recon the ledger framing against the live boundary before executing.** The
  carry-forward's literal target was impossible; running the understand pass first
  converted a mis-framed task into a correctly-scoped one (sibling of the v1.49.919
  GAP-table reconciliation, where two of three "open gaps" were already closed or
  mislabeled).

- **Observation tap over mock for fire-and-forget assertions.** When a production path
  discards a collaborator's return value, wrap the real collaborator in a delegating
  recorder rather than substituting a mock — keeps the assertion against real behavior.

## Carried-forward observation candidate

- **"Composition-root N/A" as a general cross-boundary closure rule.** The finding that
  step-4 integration-test closure IS the closure (no organic composition root exists or
  is needed) generalizes to any strict no-cross-import boundary pair. Currently 2
  families' worth of evidence (SkillActivationObserver, ConceptFallbackProvider) live
  under #10435; a future boundary pair would be the third instance and the trigger to
  promote this corollary to its own lesson.
