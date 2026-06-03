# v1.49.960 — Lessons

No new manifest lesson is promoted (count stays 151). v960 applies existing
failure-mode and crash-recovery disciplines to the M4 commit subsystem.

## Applied (existing lessons)

- **#10427 (failure-mode contracts — silent vs loud).** `recover()` is a
  liveness/observability surface: a per-marker failure is recorded in
  `report.skipped` and never thrown — a wedge left in place is the safe
  pre-existing residual, not a load-bearing decision the caller depends on. The
  coordinator wraps the call in a swallow so recovery never blocks an experiment.
- **#10437 (best-effort silent-swallow shape).** The coordinator wire is the
  subscriber-gated best-effort pattern: optional pre-step, fire, swallow, never
  affect the verdict.
- **#10454 / #10453 (deterministic crash-state tests).** The crash is simulated by
  hand-constructing the exact on-disk state a SIGKILL leaves (marker + staged tmp
  + un-advanced trunk) rather than a real signal — every crash window is a
  constructed fixture, and the load-bearing guards are each mutation-proven.

## Process notes

- **A preservation/recovery tool must be reviewed against the INCONSISTENT state,
  not just the happy path.** The review's MAJOR was an aborted-winner marker — a
  state the normal lifecycle never produces but external manipulation can. The
  recovery must refuse to act on it (and the refusal must gate the side-effecting
  rename, not merely the bookkeeping write). Sibling of the v958 lesson "review a
  preservation tool against the PARTIAL state."
- **Convert emergent safety into a local guard when the cost is one line.** The
  cross-round stale-clobber was unreachable only because of the parentHash-keyed
  permanent marker; making it a local `parentHash` check means a future
  marker-lifecycle change can never silently turn the redo into a clobber.
