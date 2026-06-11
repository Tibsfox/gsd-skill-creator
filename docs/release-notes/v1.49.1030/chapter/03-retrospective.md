# v1.49.1030 — Retrospective

## What went right

- **Evidence before edits.** Two parallel agent-fleets ran before any code
  changed: a 5-family permit-or-delete triage (every verdict with file:line +
  git provenance) and a 4-auditor wire-key casing sweep across all ~100 call
  sites. The second fleet existed because of one main-context observation —
  the working pty caller sends `onData` for Rust `on_data` — which converted
  "extend the ACL" into "extend the ACL *and* make the permits actually
  deserialize." Without it, 5 of the newly-permitted commands would have
  traded an ACL error for an invoke-args error.
- **The triage flipped a family.** The naive verdict for the uncalled svc_*
  commands was DELETE (no callers). The fleet found the inversion: the
  callers point at no-op stubs, and the uncalled fns are the real
  implementations — exactly the LL-BOOT-007 trap the v1.39 lessons file
  warned about and the Tech Debt Register priced at ~20 lines, 1,069
  milestones ago. Deleting by caller-count alone would have frozen the
  desktop service feature on do-nothing stubs permanently.
- **The full suite earned its keep again.** Targeted desktop runs were green;
  the full 35.9K run caught the root-level bootstrap-flow integration
  fixtures still using the old `claude` service id. Same lesson shape as
  v1029's 5 stale meta-test pins: the first full-suite run after a
  cross-layer rename is itself an audit.

## What went well in process

- Ship-1/2/3 pattern held for a 4th consecutive ship: design doc → evidence →
  implementation commits (6, each independently green) → full suites → step P
  v2 → attestation → gate → T14.
- The deletion commit and the permit commits were kept separate, so the
  history reads as triage verdicts, not a mixed rewrite.
- cargo check after each Rust slice + warning-set diff against base (12
  pre-existing unused-import locations, 0 new) kept the Rust edits honest
  without a clippy round-trip.

## What to watch

- **First real desktop session against the 98-command ACL.** The permits are
  build-time verified and the wire keys audited, but the desktop features
  these unlock (intelligence dashboard, atlas views, arena wrappers, chat
  threading) have never run against a permitting ACL. Expect the next
  desktop-feature ship to surface value-level defects the key audit could
  not (e.g. the bootstrap `result.ok` contract is now honored, but the boot
  sequence itself is dormant — BootstrapFlow is never constructed).
- **dashboard/assets built bundle** still bakes the old snake_case keys;
  it needs a Vite rebuild + redeploy before the deployed dashboard's
  service buttons work. Flagged so the stale bundle isn't read as a ship
  regression.
- **stop_service** remains an honest no-op stub (ServiceLauncher has no
  per-service stop; ShutdownCoordinator unwired) and **get_staging_status**
  still returns hardcoded zeros — both recorded as backlog, not silently
  permitted-and-forgotten.
- The deleted-command families leave `src-tauri/src/staging/` and the
  sandbox/proxy prototype libraries as test-only code (KNOWN-PARKED); the
  next audit will re-surface them as orphan candidates by design.
