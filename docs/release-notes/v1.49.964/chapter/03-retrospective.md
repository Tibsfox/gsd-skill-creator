# v1.49.964 — Retrospective

## What went right

- **The fix is source + detector symmetry, the shape this codebase favors.**
  `commit()` (the source) records `trunkTmp` at acquisition; `gc()` (the
  consumer that already owns `committing: false` orphans) unlinks it on reap.
  No new module, no new report field — the cleanup is an accessory side-effect
  of an existing reap.
- **Soundness rests on an existing invariant, not a new check.** The unlink
  rides the same `committing: false` + age gate that already makes marker
  reaping sound: an explicit `committing: false` proves the trunk rename never
  ran, so the staged tmp is provably an orphan. The unlink sits structurally
  after that early-return, so it can never fire for a won or in-flight round.
- **Hoisting `trunkTmp` before the lock race was the enabling move.** It was
  previously computed inside the winner path (after acquisition), which is why
  the acquisition marker could not record it. Generating it once up front and
  reusing it in the winner path (same value, no second UUID) made the marker
  self-describing without changing the rename or the flip.

## What went well in process

- The safety constraint was pinned with dedicated keep-the-tmp tests (a
  `committing: true` won marker and a young `committing: false` marker both
  retain their tmp), not just the happy reap-and-unlink case — so a future
  refactor that moved the unlink before the gate would be caught.
- Shipped as a focused standalone `fix(branches)`, separate from the sibling
  v1.49.963 detector lift, keeping each ship single-concern.

## What to watch

- **Torn-marker residual (2) remains, by design.** The `committing` flip is a
  plain non-atomic overwrite; a crash mid-write can leave a truncated marker
  (`recover()` and `gc()` both skip it -> kept, hand-removable) or the prior
  `committing: false` bytes intact (now reaped AND its recorded tmp unlinked).
  A torn write can only truncate, never forge a valid `committing: true` marker
  missing the journal fields. This is irreducible without an atomic marker
  rewrite; cosmetic, hand-removable, and explicitly out of scope here.
