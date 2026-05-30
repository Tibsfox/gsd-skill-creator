# v1.49.919 — Lessons

No new manifest lesson codified this milestone. The discipline manifest holds at
24 domains / 149 lessons. One strong lesson candidate is recorded below for the
next codify-axis ship.

## Lesson candidate (deferred to codify cadence)

- **Run the path, don't read it — and pin the wire shape.** A scout reading the
  coprocessor code concluded GAP-4 "already works E2E." Executing the path showed
  the typed client had drifted from the server's flat wire shape, so the default-on
  activation hook threw and the error was swallowed → a silent no-op that never
  reached the GPU. Two compounding failure modes: (1) a default-on hook whose
  activation error is swallowed can silently no-op (sibling of failure-mode-contracts
  #10427 — accessory surfaces swallow, but a load-bearing *capability* claim must
  fail loudly or be proven); (2) the only test exercising the real wire shape was
  skip-gated, so the drift hid for the life of the client. Mitigation, both applied
  this ship: a normalizer that is the single source of truth for the wire→type
  mapping (throws on server error), plus a **fixture-pinned drift-guard unit test**
  using verbatim-captured server responses (CI-safe, no GPU). Sibling of
  static-analysis-tool-discipline #10450 ("tools surfacing silent failures must not
  themselves fail silently").

## Reinforced (no new lesson ID)

- **Read/scope before building (ledger-driven-work-discipline #10409, #10410).**
  Per-item recon against the *live codebase* (not the audit's estimates) overturned
  the framing of all three Tier-3 items: GAP-4 was secretly broken (not "almost
  done"), GAP-5's "re-wire" was greenfield (not a wire), GAP-6 was already closed.
  The recon *is* the deliverable for a reconciliation milestone.

- **Verify-before-write (test-authoring discipline).** Probing all 19 coprocessor
  tools — not just the two needed for the proof — let the fix be correct generally
  and surfaced the `eigen` error and the breadth of the drift before a line of the
  fix was written.

- **Intentional out-of-scope is a real verdict (architecture-retrofit / interface-
  conformance 3-way verdict #10412).** GAP-5 → INTENTIONAL OUT-OF-SCOPE (ADR 0005)
  mirrors the GAP-3 precedent; the third verdict (neither "open" nor "wired" but
  "intentionally not wired") is load-bearing — it stops the gap being re-flagged
  every audit.

- **Lightest wire that fixes it (architecture-retrofit #10440).** Normalizing in
  `callTool` (one adapter) rather than rewriting every typed method kept the blast
  radius to the two real consumers, both unchanged.
