# v1.49.921 — Lessons

No new manifest lesson codified this milestone. The discipline manifest holds at
24 domains / 149 lessons. One lesson candidate is recorded below for the next
codify-axis ship.

## Lesson candidate (deferred to codify cadence)

- **Tests that derive expected paths from `mkdtempSync(tmpdir())` must `realpathSync`
  the result when they compare against realpath-normalized code output.** macOS
  `tmpdir()` lives under `/var/folders/…` and `/var` is a symlink to `/private/var`;
  Linux `tmpdir()` is `/tmp` (no symlink). So a test that builds an expected path from
  the un-resolved `mkdtemp` string while the code under test returns realpath'd paths
  passes on Linux and fails on macOS — an invisible-until-run cross-platform defect. The
  fix is `const root = realpathSync(mkdtempSync(join(tmpdir(), …)))` (no-op on Linux).
  Surfaced concretely here by the v1.49.920 macOS lane catching 6 such failures across
  `entrypoint-guard` + atlas-indexer `file-walker`/`runner` on its first run. Home:
  test-discipline (sibling of the existing audit-method conventions). The broader
  meta-lesson — a cross-platform lane's value is the *latent* bugs it surfaces, not the
  green check — reinforces the v920 decision to stand the lane up at all.

## Reinforced (no new lesson ID)

- **A green Linux suite is not a portable suite (the T3.1 thesis, now evidenced).** The
  6 failures had been latent for the life of the files; no Linux run could have surfaced
  them. The macOS lane's first red run is the proof-of-value the milestone was built to
  produce.

- **Fix the test, not the source, when the source is right (test-discipline).** Both
  `isCliEntrypoint` (realpath-compares argv[1] by design, to survive symlinked
  invocations) and `walkProjectFiles` (realpath-normalizes its output) are correct. The
  defect was the tests' assumption that `/tmp` is not a symlink. The minimal correct fix
  touches only the test setup.

- **Decoupling kept a red first run frictionless (#10422 lightest-wire / v920 decision).**
  The no-`push` macOS workflow meant 6 failures on first run cost zero ship friction —
  v920 shipped clean and this fix is an unhurried follow-on. The structural decoupling,
  not vigilance, delivered that.
