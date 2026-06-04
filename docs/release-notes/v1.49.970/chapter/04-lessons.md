# v1.49.970 — Lessons

No new manifest lesson is promoted — manifest count stays **151**. This ship applies several existing disciplines; it is a clean instance of the de-hardcode-to-single-source pattern, not a new pattern.

## Applied (existing lessons)

- **#10409 (ledger-driven per-file recon before code):** disk-derived measurement up front corrected the plan's stale figures (44 → 125 READMEs) and bounded the `--strict` work to 7 files before any edit.
- **#10448 / #10461 (single source of truth + drift-guard pairing):** the six tools' duplicated allowlist became one structural `catalog-core.mjs`; a root-project vitest drift-guard pins the de-hardcode (no tool re-hardcodes) + the re-catalog (badge == live count, every category has a README). Layer-1 enforcement (runs every ship) + Layer-2 guard.
- **#10417 (static-analysis tool discipline):** the drift-guard uses `spawnSync` (stderr survives) and an independent inline re-derivation of the category rule rather than importing the module under test, with anti-vacuous floors so a broken parser fails loudly.
- **#10201 (git-add-blocker compound-command false-positive):** a commit body containing the literal `--all` tripped the hook's tokenizer; committing via a message file sidesteps it.
- **Gate-via-test over gate-step (#10463 sibling):** `validate --strict` is gated through the existing vitest pre-tag-gate step, deliberately NOT a new shell step — avoiding the 20→21 denominator re-normalization v1.49.968 deferred.

## Process notes

- A field **presence** probe is not a field **validity** probe — the 5 `gsd-meta` skills passed presence but carried an invalid `status: active`. Read the real frontmatter before asserting "N problems."
- When a de-hardcode descends previously-skipped territory, budget for the off-convention artifacts it will surface; here they were on-mission cleanup (duplicates, mis-shaped agents), not scope creep.
- Adversarial-review findings on docs deserve a merits check: "six required fields" was correct; the fix was to disambiguate against the 7-line diff, not to change the count.
