# v1.49.921 — Retrospective

## What went well

- **The lane earned its keep on the first run.** The entire justification for T3.1 was
  "Linux-only CI can't see cross-platform bugs." Within minutes of the v920 lane's first
  dispatch, it caught 6 real ones. The investment is validated not by a green check but by
  a *red* one that pointed at genuine latent defects.

- **The decoupled design paid off exactly as intended.** A red first run on a brand-new
  lane is the worst-case scenario for ship friction — and it cost zero, because the lane
  has no `push` trigger and never enters the ci-gate. v920 shipped clean; this fix is an
  unhurried follow-on, not a fire drill.

- **One diagnosis covered all six.** Reading the atlas-indexer assertion (`expected
  [ '-BdNfIX/src/a.ts' ] to deeply equal [ 'src/a.ts' ]`) revealed the `/private`-prefix
  arithmetic immediately, and the entrypoint-guard docstring confirmed the same realpath
  asymmetry. Six failures, one root cause, one fix shape (realpath the temp root).

- **The fix is test-only — the source was right.** `isCliEntrypoint` and `walkProjectFiles`
  both realpath-normalize deliberately (the entrypoint guard's whole reason for existing is
  to survive symlinked invocations). The bug was the tests assuming `/tmp` is not a symlink.
  Fixing the tests rather than the source is the correct call.

## What was tricky

- **Invisible-on-Linux is the dangerous shape.** These tests passed for the life of the
  files because the developer machine and Linux CI both have a non-symlinked `/tmp`. There
  was no signal until a macOS runner executed them. This is precisely the class of bug a
  cross-platform lane exists to surface, and precisely why a Linux-green suite is not the
  same as a portable one.

- **realpath asymmetry hides in `.slice(root.length + 1)`.** The atlas-indexer tests strip
  the root prefix by character count, which silently breaks when the code realpaths the root
  but the test does not — the off-by-`/private` shows up as a mangled relative path, not an
  obvious "wrong directory" error.

## Forward

- **Re-dispatch the macOS lane post-ship** to confirm green. With the 6 fixes in, the lane
  should pass (the remaining macOS risk — the wall-clock perf-assertion floors and the
  `zip`/native-`better-sqlite3` rebuild — did not fire on the v920 run).
- **Promotion path unchanged:** once the nightly is green-stable for N runs, fold
  `macos-latest` into the `ci.yml` matrix and retire the separate workflow.
- **Lesson candidate (not codified):** "Tests that build expected paths from
  `mkdtempSync(tmpdir())` must `realpathSync` the result if they compare against
  realpath-normalized code output — macOS `tmpdir()` is under a `/var`→`/private/var`
  symlink, so the bug is invisible on Linux." A reusable cross-platform test-discipline
  rule; deferred to the codify-axis cadence (home: test-discipline).
