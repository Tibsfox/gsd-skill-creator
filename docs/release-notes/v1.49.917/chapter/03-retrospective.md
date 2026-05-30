# v1.49.917 — Retrospective

## What went well

- **The ship practiced the rule it codified.** Authoring lesson #10462 ("describe the pattern, never quote the literal") meant the v917 notes themselves had to describe the leak-scan patterns by shape and never quote them — a built-in correctness check on the codification.

- **An adversarial review caught the real risks early.** A four-dimension review (recursion-safety, refresh behavior, codification consistency, ship-gate readiness) returned zero code defects and two operational findings: author the chapters abstractly, and stage explicitly per file to avoid sweeping in pre-existing unrelated working-tree drift.

## What was tricky

- **A working-tree artifact surfaced at session start.** The committed leak-scan config file was found empty in the working tree and was restored from HEAD before any work — a reminder to re-verify it immediately before the audit step.

## Forward

- Option 4 (narrowing an operator-private local scan pattern) remains open by operator choice — a local-only, gitignored change.
- The audit-step failure path is now both reachable (since v916) and documented as fatal (this ship).
