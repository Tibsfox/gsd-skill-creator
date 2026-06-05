# v1.49.979 — Lessons

No new manifest lesson is promoted — this is a forward audit-plan ship (manifest stays at 152, NASA degree 1.178, counter-cadence 29). The ship applies existing disciplines.

## Applied (existing lessons)

- **Lightest-wire CLI-subcommand pattern (v789–793, Ship 3.2 git/skill).** `learn` and `scan-arxiv` were made reachable by registering their already-authored command surfaces in `src/cli/dispatch.ts` rather than building new substrate — the same move that wired `git`/`skill` in Ship 3.2.
- **Recon-first → verify-the-output.** Adversarial verification disagreed with the classifier on the closure shape (cycle vs directional chain) and on whether `learn` would flip; adjudicating by graph-tracing and hand-confirmation — not by trusting either agent — produced the correct one-wire-flips-three result.
- **Security chokepoints are structural, not advisory (install-remote standard).** scan-arxiv's cost default and egress bypass were closed by code (safe-default router + `ensureEgressAllowed` before fetch), matching the install-remote chokepoint standard rather than relying on caller discipline.
- **The Three Laws / HITL trust gate.** `--yes` auto-approves WITH warnings but the interactive gate is preserved and never auto-approves STRANGER-trust content; the generated `bridge.ts` line carries `--yes` only to avoid double-prompting over its own bash `read -rp` gate.
- **Gate-enforce + drift-guard pairing (#10461).** The wire is durable because the `SHIP33_WIRED` block in `learning-substrate-parked.test.ts` pins the three modules reachable + de-allowlisted, landed in an existing suite (no gate-step inflation).

## Process notes

- Wiring one entrypoint can flip a whole directional import chain — confirm the *direction* of the closure before estimating blast radius; a wire at the chain head over-determines its tail.
- The static-import reachability BFS works at module granularity; a separate-`process.argv` entrypoint (here `scan-arxiv/dedup-cli.ts`) stays structurally unreachable to it regardless of wiring.
- `import type`-only edges don't establish runtime reachability; confirming the chain imports *values* (not just types) is what makes a cascade real.
