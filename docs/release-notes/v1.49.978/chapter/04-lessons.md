# v1.49.978 — Lessons

No new manifest lesson is promoted — this is a forward audit-plan ship (manifest stays at 152, NASA degree 1.178, counter-cadence 29). The ship is an application of existing disciplines.

## Applied (existing lessons)

- **#10461 (gate-enforce + drift-guard pairing).** The disposition is only durable because a drift-guard pins the result: the Ship 3.2 block in `tests/integration/learning-substrate-parked.test.ts` asserts the "living-but-unreachable, non-allowlisted" set is empty (with an anti-vacuous floor, #10450), git/skill are reachable, the retires are gone from disk + scan, and the config namespace survives. Landed in an existing suite → no gate-step inflation.
- **Look at the target before deleting / surface contradictions.** Two retires described as "clean dead" (`health-diagnostician`, `components`) turned out to be coupled — to a kept consumer's types and to a TS↔Rust IPC contract respectively. Inspecting the actual blast radius before cutting, and surfacing the contradiction to the operator, converted two destructive deletes into safe allowlists.
- **Recon-first → verify-the-output (Ship 3.1 carry-forward).** Adversarial verification disagreed with the classifier on 5 of 17 modules; adjudicating by live evidence — not by trusting either agent — was decisive.
- **Lightest-wire CLI-subcommand pattern (v789–793).** `git` and `skill` were wired by registering their already-authored command surfaces into `src/cli/dispatch.ts`, making the modules reachable from `src/cli.ts` without new substrate.
- **Dated retire-or-resume gates on every park.** All 14 allowlist entries carry a 2027-06-05 gate so the cohort can't become open-ended shelfware (the exact failure mode the retired `upstream` pair exhibited — pending triage for ~180 ships).

## Process notes

- The adoption scanner sees only `src/**/__tests__` for test importers, so an external top-level `tests/<module>/` suite (here, `tests/upstream/`, 19 files) was invisible to it — `upstream` read "isolated." Retire blast-radius checks must grep the whole repo, not trust the scanner's importer count.
- `import type`-only edges don't establish runtime reachability; confirming `sc-learn` imports `learn` *values* (not just types) was what made the `commands`→`learn` cascade real.
