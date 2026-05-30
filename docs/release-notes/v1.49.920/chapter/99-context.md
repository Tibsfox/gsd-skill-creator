# v1.49.920 — Context

## Milestone metadata

- **Version:** v1.49.920
- **Type:** Feature (cross-platform CI — audit item T3.1, first step)
- **Predecessor:** v1.49.919
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 18 (unchanged — audit-driven forward work, not a cleanup-mission)
- **Source:** audit item T3.1 (`.planning/AUDIT-2026-05-26-core-functions-retrospective.md`), named as next ship in the v1.49.919 retrospective; CI surface re-scoped against the live repo 2026-05-30

## Files changed

- `.github/workflows/ci-macos.yml` — NEW: decoupled macOS vitest lane. `schedule`
  (nightly 09:00 UTC) + `workflow_dispatch` + `pull_request[main]`; **no `push`**.
  Mirrors the Linux `test` job's command sequence exactly. `permissions: contents:read`,
  `timeout-minutes: 60`, concurrency-grouped. Header comment documents the decoupling
  rationale and the promotion path.
- `tests/integration/ci-macos-parity.test.ts` — NEW: parity + decoupling drift-guard
  (#10461 pairing). Derives the required command set from `ci.yml`'s test job; asserts
  the macOS lane mirrors it and carries no `push:` trigger.
- `docs/release-notes/v1.49.920/**` — this milestone's release notes (5-file structure).

## Test posture

- New drift-guard `tests/integration/ci-macos-parity.test.ts`: **6/6 pass** (runs in the
  `root` vitest project → executes in `npm test`, the pre-tag-gate full run, and Linux CI).
- Full repo typecheck (`npm run build`): clean.
- macOS CI lane: **structurally verified only** — YAML valid (js-yaml), parity with a
  Linux job that passes today, clean cross-platform discipline scan (6 win32-aware files
  all POSIX-correct, ~21 skip-guards none needing a darwin gate, shell scripts bash-3.2/
  BSD-clean, no hardcoded `/tmp` disk-writes or `/proc`·`/sys` reads in TS). A CI workflow
  cannot be proven green pre-push (no local macOS Actions runner); the green proof is
  chased post-push via `gh workflow run "CI (macOS)" --ref dev`.
- Zero new dependencies.

## Verification provenance

- A three-scout read-only workflow mapped the CI inventory, the vitest run-topology, and
  the cross-platform discipline against the live repo. Findings shaped the design: the
  ci-gate's run-level-conclusion coupling drove the decoupled-workflow shape over a matrix.
- The decoupling and parity invariants are pinned by `ci-macos-parity.test.ts`, which
  reads `ci.yml` directly so it fails on real Linux/macOS drift.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + #10184 (single-step main FF) +
#10197 (STORY-gate post-bump-version). Canonical sequence at
`docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- **bump-version run BEFORE the full pre-tag-gate** so the completeness gate's `--current`
  resolves to v1.49.920 (validates this milestone's notes, not the predecessor's). INV-1
  (STORY-gate post-bump) is preserved.
- No `www/` change → no FTP sync, no chapter-gen needed.
- GH release publish remains batch-deferred (since v886).
- Operator retains the G3 (dev→main) gate.
- **Post-push:** dispatch `CI (macOS)` and watch the first real macOS run; fix forward
  on any cross-platform failure (the lane never blocks a ship).

## Engine state at close

- NASA degree 1.178 (136 consecutive ships)
- Counter-cadence count 18
- Manifest: 24 domains, 149 lessons (lesson candidate noted in 04-lessons, not yet codified)
- KNOWN_UNWIRED Process/Egress/Loader: 0/0/0
- Architecture gaps: GAP-1 CLOSED, GAP-2 IN PROGRESS, GAP-3 intentional, GAP-4 CLOSED,
  GAP-5 INTENTIONAL OUT-OF-SCOPE, GAP-6 CLOSED, GAP-7 open → 5/7 closed-or-intentional
  (unchanged — T3.1 is an audit Tier-3 item, not a GAP row)
- Memory Arena: M16
- Open follow-ons: prove the macOS lane green post-push; promote to the gated matrix once
  green-stable; Rust-in-CI (own milestone); a real `coprocessor:` skill consumer;
  `algebrus.eigen` Python-side error
