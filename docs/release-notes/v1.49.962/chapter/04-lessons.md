# v1.49.962 — Lessons

No new manifest lesson is promoted (count stays 151). This ship is a single-instance
application of existing disciplines; the generalizable observation (parity-pin a
documented list to a code-derived ground-truth set) already lives under #10461 and
is recorded here as an application, not a new lesson.

## Applied (existing lessons)

- **#10461 (gate-enforce-every-runnable-surface + drift-guard pairing).** The
  reference-data-staleness form: a documented list (the `SC_PRE_TAG_GATE_BYPASS`
  vocabulary) must track disk reality (the gate's `gate_bypassed` calls). Layer-1 is
  the test running every ship (root vitest project -> gate step 2 + CI); Layer-2 is
  the parity assertion pinning the documented surfaces to the honored set. De-
  enumerating the two header-comment blocks removed two un-pinnable surfaces rather
  than guarding them.
- **#10450 (static-analysis parser must handle code-shape variants OR fail loudly).**
  The review's MAJOR was exactly this failure: a charset-restricted capture
  (`[a-z0-9-]+`) silently dropped a token the runtime honors verbatim. Fix: capture
  any quoted literal (`[^"]+`) and assert the naming convention separately and
  loudly, so an out-of-convention token is caught, not invisibly skipped. The
  comment-line filter (ignore `#` lines) is the same discipline applied to the
  parser's own input.
- **#10427 (failure-mode contracts: load-bearing surfaces fail loudly).** A drift-
  guard whose whole job is to shout must not itself pass silently. The anti-vacuous
  floors (extended to all three sets) and named anchors keep a parser-break-to-empty
  from making the parity assertions vacuously true; the end-anchored env-vars regex
  turns a future in-list parenthetical into a loud failure rather than a silent
  truncation.

## Process notes

- **Verify a review's proposed FIX, not just its finding.** The first MAJOR's
  suggested fix (widen the capture + add a convention pin) was applied and then re-
  mutation-proven against the exact token shapes the old parser dropped — the fix is
  load-bearing, not cosmetic.
- **A self-claim in a comment is a liability.** "Parity-pinned by <test>" baked into
  a comment the test never reads is worse than an un-annotated comment. Prefer
  removing the surface (pointer comments) over a fragile prose extractor.
- **A drift-guard ship is itself the cheapest dogfood.** The parity test, the gate
  comments, and the re-rendered CLAUDE.md all flowed through the same pre-tag-gate
  the guard documents.
