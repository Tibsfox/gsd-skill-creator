# Retrospective — v1.49.789

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10412 — Recon-first as default.** Applied at session start
  (read predecessor v788 handoff + v787 cluster handoff + AUDIT
  retrospective + dacp-status.ts pattern + semantic-channel.md
  substrate doc before writing any code).
- **Lesson #10414 — Optional `ctx?` chokepoint retrofit (analogous).**
  Applied to `dacp-drift-check` flag-handling: `--bundle` is required
  but `--baseline`, `--threshold`, `--max-bits` are optional with
  clear capacity-only fallback path.
- **Lesson #10419 — Static-analysis tools commit a baseline so future
  runs can diff.** Validated this ship: the v787 baseline.json enabled
  the v789 refresh to emit the first non-trivial diff, exactly as
  predicted.
- **Lesson #10421 candidate — Observability tools have a "warm-up
  period" before their primary value works.** v789 is the warm-up
  exit. The adoption-refresh diff surfaced exactly the wire-change
  this ship made.

## What Worked

- **Wire site was unambiguous given the existing surface.** The
  `src/cli/commands/dacp-*.ts` family already had 5 sibling commands
  (status / set-level / history / analyze / export-templates) and a
  dispatcher (`dacp.ts`) that imports each on demand. Adding a 6th
  command followed the existing pattern exactly; no new abstraction
  needed. The test file mirrored `dacp-status.test.ts` mocking pattern
  (mock the imported module + node:fs/promises access; mock
  `@clack/prompts` + `picocolors`).
- **HARD-preservation invariants were preserved as written.** The
  semantic-channel substrate doc explicitly sanctioned an advisory
  drift checker (line 178-192) and a CLI-style surface; the wire
  delivered exactly that surface without modifying `src/dacp/`,
  changing the DACP wire format, or introducing any non-read-only I/O.
  G7 (Phase 747 HARD preservation gate) remains satisfied.
- **First-try test pass.** 22/22 tests passed on the first run; no
  iteration needed. Mocking at the semantic-channel module level
  rather than the file-system level avoided fixture-bundle setup.
- **Adoption-scan diff was self-validating.** Running the scanner
  after the wire produced the exact expected output: `↑ semantic-channel:
  test-only → living`. The wire's effect on the observability surface
  was verifiable in <1 second with no additional instrumentation.

## What Could Be Better

- **The v788 baseline file got generated prematurely.** Running
  `npm run adoption-report:refresh` at v788 package.json (before the
  bump) wrote `docs/ADOPTION-BASELINE-v1.49.788.{md,json}` which
  mis-labels the v789 wire as v788 state. The fix was to delete the
  files and defer the refresh until after `bump-version 1.49.789`.
  Forward improvement: the refresh tool could detect that the current
  package.json version already has a committed baseline and refuse to
  overwrite without a `--force` flag. Or: tools/adoption-refresh.mjs
  could accept a `--next-version` flag to write under that filename
  instead of package.json's. Either eliminates the foot-gun.
- **`SHELFWARE-VERDICTS.md` table should grow with each verdict.** The
  v789 entry is the first row; the doc's value compounds with each
  subsequent verdict. The doc structure invites ad-hoc entries; a
  schema validator (analogous to `tools/project-md-normalizer.mjs`)
  would prevent drift.
- **The wire is a CLI surface, not a runtime call site in the loop.**
  This is enough to flip the adoption scanner's status, but it does
  not make `semantic-channel` part of the actual handoff loop the
  way a CAPCOM-adjacent runtime check would. A future ship could wire
  the drift checker into `src/dacp/` or an interpreter-adjacent
  surface (respecting HARD-preservation) as a richer second wire.
  Recording this as an open follow-up rather than a defect.
- **`dashboard/adoption.html` and `dashboard/index.html` are gitignored
  auto-regen.** They will be modified by `npm run adoption-report:refresh`
  during T14 but won't be committed. Operators reading
  `git status` post-ship will see them as untracked / modified;
  this is expected. Documented in handoff §"Critical forward-preventives".

## Decisions

- **Chose `WIRE` over `RETIRE` for the first verdict.** The handoff
  identified `semantic-channel` (wire) and `tonnetz` (retire) as the
  two cleanest first-verdict candidates. Wire was operator-selected
  per the verdict question; this ship records the operator's pick.
- **Wire site = new CLI command, not modification of `src/dacp/` or
  existing consumers.** Two preservation rationales: (a) `src/dacp/`
  modification would violate G7 byte-identical guarantee; (b)
  modifying `src/catalog/` or `src/interpreter/` to import
  semantic-channel would touch wider blast-radius surfaces that
  weren't requested. The CLI subcommand is the lightest possible
  wire that achieves the verdict's effect.
- **Verdict doc location: `docs/SHELFWARE-VERDICTS.md`.** Adjacent to
  `docs/ADOPTION-BASELINE-*.md`, both of which are the operator-facing
  artifacts for the adoption telemetry surface.
- **GAP-6 row update (not closure).** GAP-6 was already CLOSED at
  v1.49.572 by the doc; the v789 wire is recorded as an additional
  surface, not a re-opening or re-closing of the gap. The row's
  language captures both the doc (v572) and the runtime (v789).

## Lessons learned

- **Verdict-pattern surface separation is load-bearing.** Splitting the
  observability surface (v786 + v787) from the decision surface (v789
  + future verdicts) lets each layer evolve independently. Operators
  can change verdict policy without touching the scanner; scanner
  changes don't invalidate prior verdicts.
- **Warm-up-period prediction was correct and self-verifying.** v787
  emitted Lesson #10421 candidate predicting that the refresh would
  produce its first useful diff at v788+. v789 (one ship past v787)
  produced exactly the predicted diff — `↑ semantic-channel: test-only
  → living`. The lesson is now field-validated; ripe for codification.
- **The lightest wire that satisfies the verdict is preferable to the
  most natural wire.** A more "natural" wire would have modified
  `src/dacp/` or `src/interpreter/` to call the drift checker
  internally — but those touch HARD-preservation surfaces and
  multi-consumer modules. The CLI-subcommand wire achieves the verdict
  outcome (test-only → living) with zero blast-radius outside the
  new files + the dispatcher. Default to the cheapest wire that
  matches the verdict's intent; defer richer wires to follow-on
  ships if they prove necessary.

## Surprises

- **The wire created exactly one diff line.** The adoption-scan ran
  153 modules; the diff showed exactly 1 status change. No collateral
  drift; no side-effect changes from the dispatcher edit. The
  static-analysis surface is precise enough that intentional changes
  are visible as exactly the intentional change.
- **First test run passed all 22 tests.** Test mocking at the imported-
  module level (vs file-system level) made the test path linear; no
  fixture-bundle setup, no per-test test-data directories, no
  cleanup hooks. The pattern is reusable for future wire-or-retire
  CLI commands.
