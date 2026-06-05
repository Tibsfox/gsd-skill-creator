# v1.49.978 — Summary

## The ship

Ship 3.2 disposes the **16** non-allowlisted living-but-unreachable modules that Ship 3.1's reachability-v2 scanner surfaced, plus the `upstream`/`upstream-intelligence` legacy pair that had been allowlisted-but-pending-triage since v786 (~180 ships). Each module gets a durable WIRE / ALLOWLIST / RETIRE verdict. The result: the generated adoption baseline's "Living but unreachable from production" section now holds **zero non-allowlisted rows**.

## What shipped

- **WIRE (2):** `git` (new `src/cli/commands/git.ts` router over `registerGitCommands()` → `skill-creator git <sub>`) and `skill` (`skillInventoryCommand` → `skill-creator skill-inventory`/`inventory`/`inv`) — both authored-but-unwired CLI surfaces, now reachable from `src/cli.ts`.
- **ALLOWLIST (14):** amiga, audio-engineering, bayes-ab, cache, commands, components, dependency-auditor, engines, health-diagnostician, learn, scan-arxiv, skill-isotropy, skill-promotion, umwelt — substrate / reference / security-latent / content, each with a dated **2027-06-05** retire-or-resume gate.
- **RETIRE (2):** `upstream` (2,039-LOC orphan agent pipeline, 0 importers) + `upstream-intelligence` (91-line Gate-G14 composition barrel). Deleted both dirs + `tests/upstream/` (52 files); the `upstream-intelligence.*` config namespace (read by 10 living modules) preserved.
- 18 verdict rows in `docs/SHELFWARE-VERDICTS.md`; a Ship 3.2 drift-guard block added to the existing `tests/integration/learning-substrate-parked.test.ts`.

## Verification

- Full root suite **34,571 passed**, 0 failures; `tsc --noEmit` clean.
- Pre-tag-gate **all 20 PASS** (no new gate step — denominator stays 20).
- Live scan: 0 non-allowlisted unreachable rows; `git`/`skill` reachable; upstream pair gone; INVENTORY-MANIFEST `src_subsystems` 153→151.
- Step-P adversarial review: **0 confirmed findings**.

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged (forward audit-plan ship).
