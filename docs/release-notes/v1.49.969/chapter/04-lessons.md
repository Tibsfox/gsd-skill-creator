# v1.49.969 — Lessons

No new manifest lesson is promoted (manifest stays **151**). This ship is a clean application of existing disciplines.

## Applied (existing lessons)

- **Architecture-retrofit patterns (#10426, lightest-wire / necessary-surface):** the actuator is the smallest honest wire that turns a dead advisory into a reachable mechanism — a pure resolver plus an optional config block on the existing dispatch boundary. No call-site churn for callers that do not opt in.
- **Failure-mode contracts (#10427) + default-off flag plumbing:** `featureEnabled` is threaded as a pure boolean; the flag-off path is byte-identical by construction and asserted with an exact-content equality test (the byte-identical guarantee is structural, not incidental).
- **Ship pipeline — pre-push adversarial ship review (#10463):** dogfooded step P on this ship's own diff; 0 confirmed findings against the code. The review also correctly distinguished pre-existing working-tree drift from the committed diff.
- **Two-layer closure / destination preservation (#10436):** STORY.md restored from HEAD before the STORY-gate append, preserving the curated predecessor entries against DB-regen normalization.
- **Test-authoring (#10458 family, mutation-proof guards):** the resolver suite includes an exhaustive base × target tier matrix and defensive-guard cases so a regression in the tier logic fails loudly rather than passing vacuously.

## Process notes

- Reconnaissance-first paid off on a question ("where is *the* dispatch boundary?") whose answer was non-obvious in a library that never calls the harness Agent tool directly. The recon's ranking (`AgentGenerator` #1) matched the only site with a real skill→agent semantic link.
- A standalone typecheck remains worth running before commit: it caught two defects that the runtime tests (esbuild transform, no type checking) could not.
