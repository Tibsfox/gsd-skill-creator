# v1.49.962 — Retrospective

## What went right

- **The ground truth was unambiguous.** The gate's `gate_bypassed "X"` calls are
  the actual runtime behavior, so the reconciliation direction was determinable
  without guessing: docs follow the gate, and the core build/test/completeness
  steps stay non-bypassable. No operator decision was needed for the direction
  because the safe answer (never make the irreducible core bypassable in a cleanup
  ship) was clear.
- **The review earned its keep again.** The adversarial Workflow review found two
  real MAJORs in a small, "obviously correct" change. The first — a parser regex
  that captured only `[a-z0-9-]+` while the runtime compares verbatim — is the kind
  of false-negative that defeats a drift-guard silently: the guard would have
  passed while a future underscore/uppercase bypass token went undocumented. The
  second — header comments that *claimed* to be parity-pinned but were not — is a
  comment that lies about its own enforcement, worse than plain prose.
- **Both MAJORs were fixed in code and mutation-proven, not banked.** Widening the
  parser plus a naming-convention pin closed the first; de-enumerating the two
  header blocks to pointers closed the second (removing the surface *and* the false
  claim). The original failure mode now turns the guard red, verified by injecting
  the exact token shapes the old parser dropped.

## What went well in process

- **Mutation-before-trust.** Every load-bearing assertion was proven by injecting
  drift and watching the test go red, then restoring from a `/tmp` snapshot (never
  `git checkout` on an uncommitted edit). The end-anchored env-vars regex and the
  widened gate parser were both re-proven after the fix.
- **De-enumeration over re-pinning.** Faced with two stale, duplicate vocab blocks
  in the gate header, removing the enumeration (pointer comments) was simpler and
  stronger than writing a fragile prose extractor to pin them — it eliminates the
  surface rather than guarding it. Two enumerated surfaces (env-vars + help log)
  remain, both pinned.

## What to watch

- **One concrete forward candidate remains for cc#30+:** the parity model here
  (extract a config list, pin it to a code-derived ground-truth set) generalizes to
  other documented-vs-reality surfaces; no new one is overdue.
- **Naming convention is now load-bearing.** The widened parser relies on the
  CONVENTION pin to flag a non-lowercase-dash token. A deliberate future token that
  breaks the convention must update that pin (the same discipline ci-matrix-parity
  applies to the macOS flip).
- **Header pointers, not lists.** Future edits that add a gate step should update
  env-vars.json + the help log (both pinned); the header comments intentionally no
  longer enumerate, so they need no per-token maintenance.
