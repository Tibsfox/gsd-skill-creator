# v1.49.1029 — Lessons

No new manifest lesson promoted this ship; manifest holds at 152. But BOTH v1.49.1028 lesson
candidates earned their **2nd observation in this very session** — they are now PROMOTION-READY at
the next lessons-ledger pass.

**Lesson candidate (2nd observation — PROMOTION-READY):** *"The first real parse of an unobserved
surface is itself an audit."* v1028: populating `.skill-index.json` surfaced three latent defect
classes. v1029: the readiness reporter's FIRST live run against the real release-notes corpus
exposed its own counting bug — `/step P/i` without a trailing word boundary matched "step passes"
(present in ~39 NASA release-note dirs), inflating the step-P evidence count 55 → 59. The first
measurement found rot in the measuring instrument itself. Budget for measurement-finding-rot
whenever wiring metrics into an unmeasured surface — including rot in the new metric.

**Lesson candidate (2nd observation — PROMOTION-READY):** *"Minimal fixtures validate the code
path, not the corpus."* v1028: executor tests green while 34/37 real skills failed the same path.
v1029: executor A's test suite was fully green while the live count was inflated — the fixtures
exercised the counting logic, never the regex against real corpus text. The catch came from the
main-context live-corpus cross-check (independent recount with a stricter pattern), not from any
test. A read-only live-corpus smoke belongs in every ship that consumes a production corpus.

## Applied (existing lessons)

- **#10463 staged promotion** — executed end-to-end: this IS the promotion rung the v965/v968/v983
  ships deferred, and each flip lands with its deterministic readiness record (the CI-flip-trilogy
  pattern generalized to gate steps).
- **#10461 gate-every-runnable-surface + drift-guard pairing** — step 22 enforces the attestation
  (layer 1); the self-consistency, bypass-vocab-parity, and discipline tests pin the structure
  (layer 2).
- **#10427 stale-guidance guard** — the reporter reads the live promotion markers and flips its
  own guidance to revert instructions post-flip, instead of forever advising an already-executed
  promotion.
- **#10421 no-silent-caps** — the ship-review evidence model discloses both the in-range sub-count
  and the NASA-band under-count rather than presenting one flattering number.
- **Mislabeling guard (v983 pattern)** — both promoted steps BLOCK only on verdict exits (1); tool
  malfunctions (exit 2) stay WARN so a broken tool is never reported as a content/staleness verdict.

## Process notes

**A promotion ship should re-derive its evidence at execution time, not inherit it from the design
pass.** The design doc's "51 reviewed ships" (hand-grep, case-sensitive) and the reporter's first
"59" (loose regex) were BOTH wrong; the reconciled truth (55 all-time / 20 in-range, NASA-band
under-count disclosed) emerged because two independent counts disagreed and forced a third, careful
one. Two measurements disagreeing is a feature — the disagreement located the bug.
