# v1.49.974 — Lessons

No new manifest lesson is promoted this ship (manifest count stays 152). Ship 2.2 applies several existing lessons and surfaces reusable observations.

## Applied (existing lessons)

- **#10462 (describe, don't quote the literal it guards)** — `adversarial-pr-review`'s guardrail "must not bypass security-hygiene checks" tripped the harness-integrity privilege-escalation scanner once in source-of-truth (the `bypass\s+security` pattern). A guardrail phrase must not contain the literal token it guards; reworded to "circumvent". Same shape as the leak-scan self-reference trap.
- **#10423 / lightest-wire + scope discipline (#10409)** — the skills-tier "adoption answer" was delivered as a committed inventory doc + drift-guard rather than building a runtime per-skill activation counter; the richer telemetry is a documented follow-on (overlaps the adoption-scanner work), not forced into this ship.
- **#10461 gate-enforce + drift-guard pairing** — the drift-guard is named `*.test.ts` so the root vitest project runs it every ship (Layer 1), and its assertions pin the promoted set + KEEP-LOCAL boundary + wires (Layer 2). No new pre-tag-gate shell step / denominator bump.
- **Verify-the-plan-premise (D1/D3 pattern)** — the plan said wire `skill-counterfactual-audit` into `done-retirement`; reading the actual file showed `done-retirement` is the Gastown work-item pipeline, so the wire went to `skill-integration` instead. Executing a ledger entry includes verifying its named targets.

## Process notes

- **Promotion is a validator-surface change.** Moving a skill from the gitignored installed tree into source-of-truth subjects it to every project-claude/skills/ validator (spec compliance, harness-integrity security, structure). Expect latent frontmatter/content debt to surface on promotion and budget a pass to bring promoted artifacts up to the source-of-truth standard.
- **A skill's self-described consumer can be wrong.** When wiring a skill, confirm the named consumer's actual domain before editing it — names collide (Gastown `done-retirement` vs skill retirement).
- **CI on dev is the right place to catch a security-scanner false-positive** from a newly-promoted doc body; the targeted local suite won't run harness-integrity unless invoked.
