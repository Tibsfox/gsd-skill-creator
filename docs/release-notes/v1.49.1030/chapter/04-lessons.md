# v1.49.1030 — Lessons

No new manifest lesson promoted this ship. Two lesson candidates from the
v1028/v1029 band reach further observations here; one new candidate emitted.

## Applied (existing lessons)

- **"The first real parse is an audit" (v1028 candidate, PROMOTION-READY at
  v1029) — 3rd observation.** The first wire-key parse of the to-be-permitted
  call sites found 5 latent casing defects plus 2 response-shape mismatches
  that had been invisible for ~140 milestones because the ACL never let a
  call through. Permitting a surface without parsing it would have shipped
  the defects live.
- **"Minimal fixtures validate the code path, not the corpus" (v1028
  candidate, PROMOTION-READY at v1029) — applied.** The desktop ipc tests
  were green throughout because their mocks match on command name only; the
  root-level integration suite with full fixtures was where the
  `claude`/`claude_code` divergence actually surfaced.
- **LL-BOOT-007 (v1.39) — finally executed.** The documented "stubs silently
  intercept calls meant for the real implementation" warning and its ~20-line
  unification prescription sat unpaid in the Tech Debt Register since
  2026-02-26. The triage fleet independently rediscovered the same fix.
- **#10427 stale-guidance guard — applied to comments.** Deleted-command
  sites carry pointers to their successors (keystore surface, security
  barrel, ArenaSet chokepoint) rather than bare deletions.

## New candidate

- **"Caller-count is not a liveness verdict" (1st observation).** For
  surface-level dead-code triage, zero callers is ambiguous between
  dead-aspiration and inverted-supersession (real implementation shadowed by
  a called stub). The discriminator is cheap: check whether the names the
  callers DO use resolve to stubs, and check the lessons/tech-debt registers
  for the family. Watch for a second observation before promoting.

## Process notes

- Wire-key conventions for Tauri v2 in this repo are now pinned by test
  precedent and comment (camelCase keys; `rename_all` is never used). Any
  future command addition that sends snake_case keys will fail at first
  parse, not at first permit.
- The 3-way drift-guard deliberately lives in the default vitest project
  rather than the cargo lane: the original defect was a build-time
  configuration hole invisible to `cargo test`, and the vitest placement
  puts it on gate step 1 and every CI leg.
