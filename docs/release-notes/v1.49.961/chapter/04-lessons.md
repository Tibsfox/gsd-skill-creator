# v1.49.961 — Lessons

No new manifest lesson number is promoted (count stays 151). This ship promotes
the EXISTING two-layer-closure discipline (#10431/#10436) to a 4th case study and
applies several established disciplines.

## Applied (existing lessons)

- **#10431 / #10436 (two-layer closure for procedure-rooted drift).** A drift
  class rooted in a forgettable manual step needs BOTH a source eliminator
  (deterministic tool + post-condition) AND a detector gate. 4th application —
  the `.planning/` backup case; the enumerated candidate list is now empty.
- **#10427 (failure-mode contracts — silent vs loud).** The MAJOR was precisely a
  silent-failure violation: a BLOCKER that fired silently with the wrong exit
  code. The fix restores the loud FAIL diagnostic. The self-clean wire is
  best-effort (accessory surface, swallows non-fatally) with the detector as the
  loud backstop.
- **#10461 (gate-enforce-every-runnable-surface + drift-guard).** The new cleaner
  test is wired into the gated tools-suite include list (Layer 1) and the
  tools-config-coverage drift guard pins disk-vs-list (Layer 2).
- **#10463 (bash idiom under set -e).** Capturing a command's exit code under
  `set -euo pipefail` requires `OUTPUT="$(...)" && X=0 || X=$?` — a bare capture
  aborts the script and a plain `|| true` masks the code to 0.

## Process notes

- **A file-text meta-test is BLIND to runtime bash semantics.** The v961 meta-test
  asserted `exit 21` as file text and passed 8/8 while the step could never reach
  exit 21 at runtime — a false green. The closing move was a reproduction at the
  shell + a regression-pinning assertion on the exact exit-code-preserving idiom.
- **Verify a review's proposed FIX, not just its finding.** The review correctly
  found the MAJOR but proposed a fix (`|| true`) that would have made the detector
  vacuous. Reproducing both forms surfaced the correct idiom.
- **A copied step inherits the original's latent bugs.** Step 19 was modeled on
  step 18, which carried the same `set -e` capture bug since v869 — fixing the new
  step surfaced and fixed the old one (reviewing a lift reviews what it sits on).
