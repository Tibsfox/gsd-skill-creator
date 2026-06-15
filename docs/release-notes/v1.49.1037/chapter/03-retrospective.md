# v1.49.1037 — Retrospective

## What went right

- **Single source of truth for the gate.** Rather than re-implementing the new
  consistency checks in the bash layout gate, the gate delegates to
  `nasa-consistency-audit.mjs --gate`. One checker, one behavior — no risk of a
  bash re-implementation drifting from the real audit.
- **Extend, don't renumber.** Adding the consistency check as a brand-new
  pre-tag-gate step would have forced a 22→23 denominator bump across ~107
  labels that `pre-tag-gate-self-consistency.test.ts` pins. Folding it into the
  existing layout gate (step 15) achieved the same blocking behavior with a far
  smaller blast radius and no test churn.
- **Filename-preserving artifact rewrite.** The decompose-build fix rewrites the
  cloned artifact tree in place keeping filenames, so `index.html` artifact
  links stay valid with zero slug coordination and no parallel-edit conflict —
  the simplest design that satisfies the audit's link-integrity and
  artifact-count invariants.
- **Negative test on the gate.** Confirming the gate BLOCKS (injected a broken
  JSON, saw exit 1 naming the mission, restored) proved the wiring actually
  enforces, not just passes on a clean tree.

## What went well in process

- The two follow-ups were scoped and verified independently, each with its own
  drift-guard, then committed atomically (gate-wiring, then decompose-build).
- Every claim was checked against the live tooling — the audit was run, the
  gate was exercised both ways, and the affected tests were run before commit.

## What to watch

- The decompose-build artifact-tree fix is verified structurally (drift-guard +
  audit contract) but will be **proven on the next real degree ship (1.221,
  GRACE)** — the first forward degree built through the updated pipeline.
- The consistency gate runs the full corpus audit at ship time. It is a no-op in
  CI (the gitignored `www/` content is absent there); enforcement is local at
  pre-tag, which is where the corpus lives.
