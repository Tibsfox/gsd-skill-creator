# v1.49.971 — Lessons

No new manifest lesson is promoted — manifest count stays **151**. This ship applies several existing disciplines. One forward-candidate (below) is recorded for a future codify ship rather than promoted inline in a forward ship.

## Applied (existing lessons)

- **#10461 (gate-enforce-every-runnable-surface + drift-guard pairing):** `tests/integration/agent-teams-dormant.test.ts` is an independent oracle that re-reads the manifest, source, and READMEs and pins the dormancy invariants (manifest installs zero teams; source removed; no `offerInteractiveFix`/`writeTeamAgentFiles`; readiness check kept; banner present), with anti-vacuous floors. Layer-1 (runs every ship via the vitest gate step) — no new shell step, so no 20→21 denominator re-normalization.
- **#10409 (scope discipline):** `team create` scaffolds agent files too, but the settled D2 scope is the `team spawn` unsolicited-write foot-gun. Left create intact and documented the distinction rather than sweeping it in.
- **#10427 (self-mod / load-bearing failure):** the disabled scaffold wrote via `fs.writeFileSync` directly into `.claude/agents/`, bypassing the PreToolUse Write/Edit self-mod guard — a write the guard could never see. Removing the call site (not gating it) is the right closure for an observability-blind write path.

## Forward candidate (not promoted)

- **Re-verify a settled decision's *mechanism* at execution time — an intervening ship can invalidate the premise it rested on.** D2's "relocate to `examples/dormant-teams/`" was settled 2026-06-03 on the premise "`examples/teams/` tooling drops 88%"; v1.49.970 (next day) de-hardcoded exactly that tooling, making the separate-dir mechanism counterproductive. The decision (mark teams dormant) held; the *mechanism* did not. Recon that explicitly checks the ship-before's diff against the plan's premises catches this. Candidate for the ledger-driven / counter-cadence discipline; recorded here, deferred to a codify ship.

## Process notes

- When a settled instruction's rationale looks stale, verify the premise directly and surface the conflict to the operator with the cleaner alternative — don't execute a now-counterproductive literal instruction, and don't silently substitute your own.
- A dormancy marker that a drift-guard can pin should be a state the machine reads (here: manifest entries), not prose a guard would have to string-match.
