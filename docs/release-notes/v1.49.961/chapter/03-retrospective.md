# v1.49.961 — Retrospective

## What went right

- **The two-layer pattern dropped in cleanly.** Source eliminator + detector,
  mirroring the three prior closures (STATE.md v813, PROJECT.md v954,
  release-notes v958). The candidate list in the discipline doc is now empty —
  the discipline reached its enumerated end.
- **Narrow-by-default, aggressive-on-opt-in.** The detector + self-clean use a
  narrow tool-written-prefix scope, so a deliberately-parked manual backup
  (`CLAUDE.md.backup-<date>`) is never touched; `--all` is the explicit operator
  escape hatch. The narrow/broad split is mutation-proven.
- **Dogfooded before shipping** — the detector `--check` passed on the real
  `.planning/` and `--all --check` flagged the parked manual backup, exactly as
  designed.

## What went well in process

- **The review caught a MAJOR the file-text meta-test could not.** Step 19's
  `OUTPUT="$(...)"` + `EXIT=$?` aborted under `set -euo pipefail` before its FAIL
  block — it still blocked, but silently, with the wrong exit code (a #10427
  fail-loudly violation). The same latent bug had been sitting in step 18 since
  v869 (a copied sibling). Both fixed.
- **The review's suggested fix was itself wrong, and that mattered.** The reviewer
  proposed a plain `|| true`, which would have masked `$?` to 0 and made the
  detector vacuous — a worse bug. The correct idiom (`OUTPUT="$(...)" && EXIT=0 ||
  EXIT=$?`) was found by reproducing both forms at the shell and matching how the
  other gate steps capture their codes. Lesson: verify a review's proposed fix,
  not just its finding.
- **Runtime-verified + regression-pinned.** The fix was confirmed to reach
  `exit 21` against a planted backup, and a mutation-proven meta-test (C6) now
  fails if either step reverts to the brittle bare-capture form.

## What to watch

- **`--all` is aggressive by design.** It now requires the backup marker to be the
  final dot-delimited segment (so `my.backup-notes.md` is spared), but a file like
  `data.bak.json` still matches — `--all` is the operator opt-in; run `--check`
  first.
- **Off-cycle residual (documented).** A backup created by a manual normalizer /
  apply-diff run BETWEEN ships is caught-and-BLOCKED at the next ship's step 19
  (the detector is the backstop); no in-loop hook is needed.
- **Forward candidate (named, not done).** The bypass vocabulary in
  `env-vars.json` vs the gate's real `gate_bypassed` tokens has pre-existing
  two-way drift with no drift-guard — a small follow-up ship could add a
  `gate_bypassed`-token <-> vocab parity test (#10461 Layer-2 for the vocab surface).
