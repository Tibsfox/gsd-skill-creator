# v1.49.1037 — Lessons

No new manifest lesson is promoted this ship. The milestone applies existing
discipline and contributes two durable, reusable observations (below) tied to
the ship-gate and forward-build infrastructure.

## Applied (existing lessons)

- **Two-layer closure (detector + source-eliminator).** A clean corpus is not
  self-sustaining unless something enforces it. This ship pairs the detector
  (`nasa-consistency-audit.mjs`) with a ship-gate that blocks on its findings,
  and pairs the W6 collapse detector with a source-eliminator
  (`decompose-build.mjs` now emits the full tree) so the debt stops being
  re-created at the source.
- **Drift-guard every wiring.** Both follow-ups are pinned by string-parse
  drift-guards (`nasa-consistency-gate-wiring.test.ts`,
  `workflows-library-discipline.test.ts`) that run on every bare `vitest`, so
  the gate delegation and the artifact-tree task roster cannot be silently
  removed.

## Process notes

- When a new gate check would collide with a strict self-consistency test
  (denominator parity, exit-code uniqueness), prefer extending an existing,
  semantically-adjacent gate over adding a numbered step — same enforcement,
  far less coordinated churn.
- For clone-rewrite pipelines, preserving cloned filenames is the cheapest way
  to keep cross-file links (e.g. `index.html` → `artifacts/...`) valid: it
  trades a cosmetic filename-slug mismatch for zero coordination and zero
  dead-link risk.
