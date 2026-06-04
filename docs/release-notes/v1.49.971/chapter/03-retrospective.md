# v1.49.971 — Retrospective

## What went right

- **Recon caught a stale premise before any edit.** A read-only fan-out across the D2/D3 surfaces found that v1.49.970 (shipped the day *after* D2 was settled) had de-hardcoded the `examples/` catalog tooling — invalidating the exact rationale ("`examples/teams/` drops 88%") that drove the settled "relocate to a new `examples/dormant-teams/` dir" mechanism. Executing the settled wording literally would have re-introduced the catalog-invisible tree v970 just removed. Surfacing the conflict to the operator (rather than executing a now-counterproductive instruction) produced a cleaner disposition: decommission-in-place.
- **Reconciled three conflicting agent reports against direct verification.** The recon agents disagreed on where the 4 teams live and what "retire" entailed. Direct `git`/`grep` checks settled it: the teams exist in three places (`project-claude/teams/` source → `.claude/teams/` install, plus the `examples/teams/` catalog), so "decommission the install + keep the example" was the precise, non-duplicating move.
- **The dormancy signal is machine-readable, not prose.** The catalog `status` vocab is `{stable,experimental,deprecated}` — no `dormant`, and `deprecated` carries the wrong semantics — so the README banner is the human marker and the **manifest decommission** is the load-bearing, drift-guardable signal. The guard pins the manifest/source state, not brittle banner text.
- **Scope held.** `team create` also scaffolds agent files, but via an explicit, solicited action — distinct from the spawn check's unsolicited write. Disabling only the spawn foot-gun (the settled scope) and documenting the create distinction kept the diff tight (#10409).

## What went well in process

- **Step-P review earned its keep.** The adversarial pre-push review found a real MAJOR I had missed: the file-level docstring, help text, and call-site comment were all updated, but the *function-level* `teamSpawnCommand` JSDoc still claimed it "Offers to generate missing agent files interactively." Fixed in code (not explained away), then amended into the single commit. The reviewer's other finding (dashboard drift) was correctly refuted by the verify stage — it was unstaged perpetual-drift, never in the commit.
- **Clean staging discipline avoided a scope leak.** `git add` of an explicit path list (never `git add -A`) kept the perpetual-drift files (`dashboard/index.html` et al.) out of the commit even though the test run re-touched them; a post-amend `git show --stat` confirmed exactly 13 files.

## What to watch

- **The two team schema dialects + unresolved member agentIds remain** (`gsd-debug-team` 4/4, `gsd-research-team` 4/5). They are deferred to the resume condition — when a team-execution runtime lands — not fixed here.
- **`team create`/`team-wizard` still scaffolds agent files.** Left intentionally (explicit action), but if the foot-gun reasoning is later judged to apply to create too, harden it as its own change.
- **Dated review gate (2027-06-04).** The dormancy must not silently calcify the way the `upstream`/`upstream-intelligence` allowlist entries did (allowlisted v787, still pending). `docs/AGENT-TEAMS-DORMANT.md` carries an explicit retire-or-resume date.
