# v1.49.968 — Summary

## The ship

Ship 1.1 of the 2026-06-03 audit plan — the highest-leverage Phase 1 move. It
codifies the project's empirically-best QA mechanism (the ad-hoc adversarial
Workflow review of the ship diff, which caught real defects pre-push in v965, v966,
and 11/35 F4 ships) as a load-bearing, repeatable T14 step. It lands **advisory**
(staged per #10463); the deterministic pre-tag-gate attestation rung is deferred.

## What shipped

- **`tools/ship-review/adversarial-ship-review.mjs`** — reusable Workflow script:
  five parallel read-only (`Explore`) lens reviewers → adversarial VERIFY → confirmed
  REAL findings to fix in code before push.
- **`docs/adversarial-ship-review.md`** — canonical process doc (lenses, isolation
  discipline, disposition, scale-to-risk, staged promotion, evidence table).
- **`docs/T14-SHIP-SEQUENCE.md`** — new pre-flight **step P** (run before
  `git push origin dev`) + changelog row.
- **`tests/integration/adversarial-ship-review-discipline.test.ts`** — #10461
  Layer-2 drift-guard, **mutation-proven** (4 mutations each fail).
- **`tools/render-claude-md/disciplines.json`** — extends "Ship pipeline"; CLAUDE.md
  re-rendered (gitignored).

Reviewers are read-only and **never** worktree-isolated (a fresh worktree lacks
`node_modules` → probes fail) — encoding the v963/v964 learned best practice, not
the plan's outdated "worktree-isolated" suggestion.

## Verification

Drift-guard 6/6 + mutation-proven; build green; story-gate-ordering test green;
`render:claude-md --check` in-sync; pre-tag-gate "all 20 checks PASS".
**Dogfooded** on its own diff: 0 confirmed findings (2 correctly refuted), zero
working-tree leaks. A runtime probe then caught + fixed a real `args`-as-JSON-string
defect the static review couldn't see (the `args` parameterization was falling back
to defaults); fixed via `JSON.parse` coercion and verified by a parse probe.

## Engine state

- NASA degree 1.178 (frozen) · counter-cadence 29 (unchanged, normal forward
  `feat`) · manifest 151 (unchanged) · no cadence_advances.
