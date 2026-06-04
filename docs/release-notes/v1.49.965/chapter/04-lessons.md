# v1.49.965 — Lessons

No new manifest lesson is promoted (manifest stays at 151). This ship is an
application of several existing lessons to a freshly-surfaced instance.

## Applied (existing lessons)

- **#10431 / #10436 (two-layer closure for procedure-rooted drift).** The baseline
  freeze is a procedure-rooted drift class: an operator-discretion step
  (`adoption-refresh`) was forgettable. Closed with BOTH a source eliminator
  (T14 step 2.7, mandatory) and a detector (pre-tag-gate step 20). This is now a
  further case study alongside STATE.md (v813), PROJECT.md (v954), and the
  release-notes scaffolder (v958).
- **#10461 (gate-enforce-every-runnable-surface + drift-guard pairing).** The
  freshness check is wired into the gated suite (Layer 1) and pinned by a
  drift-guard meta-test (Layer 2). The new bypass token was added to all three
  parity surfaces (gate `gate_bypassed`, help-log, `env-vars.json`) so the
  bypass-vocab parity test stays green.
- **#10463 (staged-promotion).** The new gate lands WARN-only first; promotion to
  BLOCKER is a deliberate future act, mirroring the CI-lane staging pattern.
- **#10424 (baseline-writer ordering).** Step 2.7 runs AFTER bump-version so the
  baseline filename embeds the current tag and the overwrite-guard is honored.
- **#10427 (failure-mode contracts).** Security/observability surfaces fail
  loudly only when load-bearing; the WARN-only detector is an accessory surface,
  while the escalation path (exit 23) is the load-bearing one.

## Process notes

- **Verify exit-code uniqueness by full enumeration, not a truncated grep.** The
  exit-22 collision was hidden because the initial check used `grep ... | tail`,
  which dropped the earlier `tools-node-test` occurrence. The meta-test now pins
  exit 23 as the sole adoption-freshness code.
- **Review a count-pinning meta-test as part of any gate-step addition.** Adding a
  step legitimately changes the authoritative count; the single-count-owner
  convention (new ship owns it, prior owner goes count-agnostic) keeps the
  treadmill bounded to exactly one test per step-addition.
