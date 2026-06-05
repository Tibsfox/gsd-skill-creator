# v1.49.985 — Lessons

No manifest lesson is promoted this ship (manifest count holds at **152**). This is forward Phase-4 CI infrastructure that applies existing disciplines.

## Applied (existing lessons)

- **#10463 — staged CI-lane promotion.** The windows leg is introduced STAGED (non-blocking `continue-on-error`) and flips to load-bearing only on a deterministic readiness verdict across organic churn — never on greens from the promotion ship itself. `windows-flip-readiness.mjs` operationalizes that gate (gate-not-vigilance), exactly as `macos-flip-readiness.mjs`/`cargo-flip-readiness.mjs` do for their legs.
- **#10461 — drift-guard pairing / gate-enforce-every-runnable-surface.** Changing the CI matrix is a lockstep operation: the matrix edit is paired with the `ci-matrix-parity.test.ts` update in the same commit, so a silent re-stage (or a future silent flip) fails the guard and forces the conversation.
- **#10427 — no stale guidance.** The readiness tool reads `ci.yml` to switch its advice between "safe to flip: delete the line" (while staged) and "already flipped; here is how to REVERT" (post-flip), so it never tells operators to delete a line that is already gone.
- **Tools-suite include-list discipline (v1.49.913).** The new `windows-flip-readiness.test.mjs` was registered in `vitest.tools.config.mjs`'s explicit include list, satisfying the Layer-2 coverage drift-guard that exists to prevent silently-unrun tools tests.

## Process notes

- **Faithful-mirror over rewrite.** When a new artifact is a per-leg analog of an existing, battle-tested one, copy the source and apply mechanical substitutions (macos→windows, the gated-`continue-on-error` regex, the jq leg-match) rather than reconstructing from a spec — it preserves the accumulated edge-case handling (the #10464 Set-boundary pins, the realpath CLI guard, the package*.json organic-churn exclusion) for free.
- **Verify the platform claim, don't assume it.** The single load-bearing safety property — a matrix-gated job-level `continue-on-error` masks only its own leg — was confirmed against authoritative GitHub Actions documentation in the adversarial review, not taken on faith.
