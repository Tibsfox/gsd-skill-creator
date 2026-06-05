# v1.49.983 — Lessons

No manifest lesson is promoted this ship (manifest count holds at 152). Ship 5.3 is a forward GAP closure + Phase-5 follow-on; it applies a cluster of existing disciplines rather than codifying a new one.

## Applied (existing lessons)

- **#10401 / #10402 / #10407 (trip-vocab budget)** — the primary title-line class, the secondary body-density class, and the prompt-level budget are now encoded in `tools/trip-vocab-check.mjs` instead of a manual checklist.
- **#10461 (gate-enforce-every-runnable-surface + drift-guard)** — the manual §3.3 grep checklist (a runnable surface no gate touched) became pre-tag-gate step 21; the new v983 meta-test + the existing self-consistency/bypass-vocab guards pin its shape.
- **#10462 (describe, don't quote)** — the checker prints class totals + class counts, never the matched tokens; the doc diff is a net *reduction* of enumerated trip-vocab (the manual greps were removed).
- **#10463 (staged promotion)** — step 21 ships WARN-first, escalatable to BLOCKER via `SC_PRE_TAG_GATE_REQUIRE=trip-vocab`, mirroring step 20 (adoption-freshness) one ship earlier.
- **Single-count-owner convention** — the newest step-addition meta-test (v983) owns the absolute gate count ("all 21 checks PASS"); the prior owner (v965) was made count-agnostic in the same ship.
- **#10184 (single-step main FF) / #10197 (STORY-gate post-bump) / #10191 (atomic directive)** — applied in the T14 release leg.
- **F4 retention safety (`retention-substrate-outcome-driven-debt.md`)** — the v982 "never `--apply` on a degenerate signal" rule is now enforced more strongly: the Tier-2 balance/depth check converts "verifiably bidirectional" from mere presence to "deep and balanced enough."

## Process notes

- **Probe before you tune.** The retention dry-run produced the concrete number (90→91 off `mean −0.926`) that justified the guard hardening — far stronger than arguing from the corpus shape alone.
- **Trust drift-guards to scope your blast radius.** The 8 first-run failures were a precise map of every committed surface that pins the gate's shape; updating them in lockstep is the intended workflow, not a surprise.
- **Verify recon against disk during build.** The "NASA pages are committed" premise was false (`www/` gitignored); catching it kept the gate step honestly scoped as a local advisory.
