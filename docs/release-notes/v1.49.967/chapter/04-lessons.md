# v1.49.967 — Lessons

No new manifest lesson is promoted (manifest stays at 151). This is a small
mechanical hygiene ship; it applies existing disciplines rather than surfacing a
new one.

## Applied (existing lessons)

- **#10409 (per-file recon precedes per-file code).** Recon of each validation
  error — and of what `catalog-gen` would do — is what kept the count-badge drift
  out of this diff. A "just run the generator" approach would have silently
  widened the ship into Ship 2.1's territory.
- **Scope discipline / lightest-wire.** The fix touches only the five metadata
  files that carry the errors; the regenerated catalog badge and the missing
  category READMEs are explicitly deferred to Ship 2.1, where the de-hardcode +
  gate work makes them load-bearing.
- **#10431 / #10436 awareness (two-layer closure, deferred).** The matching
  source-eliminator + detector pairing for examples/ frontmatter (a gated
  `validate.mjs --strict`) is Ship 2.1's job; this ship is the one-time content
  fix that precedes the gate.

## Process notes

- **Match review depth to blast radius.** A validator-checked metadata edit does
  not warrant a multi-agent adversarial panel; direct multi-angle verification
  (validator delta, generator-isolation test, inode check, value provenance) is
  proportionate, and it leaves the heavy review machinery for the logic-bearing
  ship that follows.
- **Distinguish storefront copies from live artifacts.** When a name appears both
  in examples/ and under `.claude/`, confirm they are independent files before
  editing — an inode check is enough — so a catalog edit cannot silently change
  runtime behavior.
- **Prove a "while I'm here" change is pre-existing before reverting it.** Stashing
  the intended edit and re-running the tool on a clean tree is the cheap way to
  attribute drift correctly and keep it out of an unrelated ship.
