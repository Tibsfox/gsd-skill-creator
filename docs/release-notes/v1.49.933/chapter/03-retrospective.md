# v1.49.933 — Retrospective

## What went right

- **Audit-first paid for itself.** The handoff predicted CF2b would close as a
  doc-only no-op ("verified already-safe"). Treating that as a hypothesis to
  *attack* rather than a conclusion to confirm is what turned the ship from a doc
  note into a real defect closure. The adversarial structure — independent lenses,
  skeptic refutation, and crucially a completeness-critic told to hunt for what the
  lenses cleared — is what found the bug.

- **The false-negative hunt is the load-bearing role.** Four lenses and five
  skeptics (nine agents) all concluded "verified already-safe", and they were
  correct *about the three named preconditions*. The defect lived in a public field
  (`importance`) they assumed bounded. Only the critic, by constructing inputs to
  the real production entry point and running them, found that a `NaN` importance
  defeats the sort. A review that only checks the stated preconditions would have
  shipped the doc note and the bug.

- **Independent re-confirmation before believing the critic.** The critic's verdict
  contradicted nine other agents, so it was not taken on faith — a direct runtime
  probe at `selectBranchVariant` reproduced the wrong winner (NaN variant chosen
  5/5 deterministically; the finite-importance control chose correctly). The fix
  was then re-verified by the same probe flipping to the correct winner.

- **Minimal, source-level fix.** The bug is reachable from many call sites, but it
  has a single absorbing site that already exists and is *documented* as "clamped
  to [0,1]" — it just failed to honour that for `NaN`. Fixing there (one line)
  corrects both the deterministic and stochastic paths without adding any guard to
  the stochastic surface, and without the redundant temperature/sampler guards the
  original CF2b plan called for.

## What to watch

- **The fix changes one behaviour: `NaN` importance now scores 0 (no boost)
  instead of `NaN`.** `±Infinity` is unchanged (still clamps to the bounds). No
  existing test asserted `NaN` behaviour, so nothing regressed; the new unit +
  integration tests pin the contract going forward.

- **`importance` is still publicly unvalidated at the type boundary** — the fix
  absorbs a bad value rather than rejecting it. That is the right call for a
  ranking hint (a garbage importance becomes "no importance", not an error), and it
  matches the codebase's absorb-not-throw posture. If a future surface needs to
  *reject* malformed candidate input, that is a separate, explicit decision.

- **macOS is load-bearing (from v928).** Confirm CI green on the pushed v933
  commits — including the macOS leg — before considering the ship complete.

## Process note

The session's harness intermittently garbled multi-line tool output. Load-bearing
facts were confirmed with single-value probes (exit codes, `git ls-remote`, the
behavioural probe's explicit winner ids) that survive the corruption.
