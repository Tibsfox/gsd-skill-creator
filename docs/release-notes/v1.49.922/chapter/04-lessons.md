# v1.49.922 — Lessons

No new manifest lesson codified this milestone. The discipline manifest holds at
24 domains / 149 lessons. Two lesson candidates are recorded below for the next
codify-axis ship.

## Lesson candidates (deferred to codify cadence)

- **JS-regex `.source` bound to a POSIX-ERE consumer must be lazy-quantifier-free and
  shorthand-class-free; centralize the translation.** POSIX ERE (BSD/macOS `git grep`,
  `grep -E`, `sed -E`, `awk`) has no lazy quantifiers — `+?`/`*?`/`??` raise
  "repetition-operator operand invalid" — and does not understand `\d`/`\s`/`\w`. A blunt
  `\d`→`[0-9]` replace also mistranslates a shorthand nested inside a `[...]` class
  (`[\d.+ \-]` → the malformed `[[0-9].+ \-]`). The fix shape is a single tested translation
  helper (`toPosixEre`) that strips lazy quantifiers and translates only top-level shorthand,
  plus a regression guard pinning the invariant for every consumer-bound pattern. Sibling of
  the existing `apply-to-self` `posix-ere-translation-missing` rule (which covered the
  shorthand class but not lazy quantifiers). Surfaced concretely by the v920 macOS lane:
  `perf-assertion-audit`'s `runAudit` smoke test runs `git grep -E` and errored on BSD.
  Home: test-discipline / static-analysis-tool-discipline.

- **Tests that derive expected paths from `mkdtempSync(tmpdir())` must `realpathSync` the
  result when comparing against realpath-normalized code output** (carried forward from
  v1.49.921 — macOS `tmpdir()` is under a `/var`→`/private/var` symlink, so the bug is
  invisible on Linux). Home: test-discipline.

## Reinforced (no new lesson ID)

- **A cross-platform lane's value is layered (#10428 meta-cadence sibling).** Each layer
  fixed reveals the next: tmpdir-symlink (v921) → git-grep-regex (v922) → then a clean
  end-to-end run. The payoff is the *sequence* of latent defects surfaced, not any single
  green check.

- **Tools surfacing silent failures must not themselves fail silently (#10450 / #10427).**
  The step-17 grep aborted the whole gate on a non-drift WARN, and the perf-audit under-count
  hid behind a count with no floor. Both are the "loud-vs-silent asymmetry" class: the
  `|| true` makes the gate continue loudly-correctly; the de-lazied ERE makes the audit
  count honest.

- **Pin the deterministic target, don't trust ordinal selection (ci-gate).** `gh run list`'s
  `.[0]` is order-dependent and silently wrong once two workflows share a dev-tip;
  `--workflow ci.yml` names the ship-blocking workflow explicitly. Selection by identity,
  not by recency.
