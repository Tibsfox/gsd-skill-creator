# v1.49.966 — Retrospective

## What went right

- **Recon caught a bug the plan missed.** The audit plan named Ship 0.2 as a
  cosmetic cleanup (denominators + one legend comment). Mapping every exit code to
  its emitting block before writing the fix revealed that exit 21 was used by two
  different steps — a real collision, the same class the v965 review had caught on
  exit 22. Per-finding recon (#10409) paid for itself.
- **The fix shipped with its drift-guard, not just the patch.** Each of the three
  findings is now pinned by an assertion in a single self-consistency test:
  denominators must agree with the summary count, the two ceiling-BLOCK legend
  entries may not claim "default WARN-only", and the legend must document exactly
  the emitted non-zero exit codes with no duplicate. The exit-code-uniqueness
  assertion turns the post-v965 process-learning ("verify by full enumeration")
  into a permanent gate.
- **Single-count-owner convention held.** Normalizing denominators broke per-step
  assertions in four older meta-tests. Rather than bump each to `/20` (which would
  re-break at the next normalization), they were made denominator-agnostic
  (`step N/\d+`), leaving the new guard the sole owner of denominator correctness —
  the same separation-of-concerns the v965 ship used for the absolute count.

## What went well in process

- **Adversarial Workflow review earned its cost again.** Seven read-only agents
  across five dimensions found one real MAJOR — the new guard's
  `extractEmittedExitCodes` regex used a literal single space, so `exit  24` or a
  tab would slip an undocumented code past the completeness check. Fixed in code
  (`exit\s+`), not documented away. One finding was correctly rejected (the parser
  doesn't validate denominators, but a downstream assertion already does).
- **Full enumeration found what targeted edits missed.** Auditing every `exit N`
  occurrence — not just the line-start ones — surfaced a stale `exit 21` *comment*
  inside the state-backups block that the reassignment edits had left behind. The
  same discipline that fixed the bug found the comment.

## What to watch

- **Denominator normalization now has teeth.** Future step-additions must bump
  *every* label's denominator (and the summary) together, or the parity test
  fails. That is the intended cost — the running-total drift happened precisely
  because past additions bumped lazily.
- **Legend completeness is now bidirectional.** Adding an `exit N` without a legend
  entry — or a legend entry with no emitter — fails the completeness assertion.
  Code 0 (success) is the one legend-only entry, by design.
- **Scope discipline.** This ship widened beyond its named scope to fix a real
  bug, but stayed within the "gate self-consistency" theme and was
  operator-authorized at the scope fork rather than expanded silently.
