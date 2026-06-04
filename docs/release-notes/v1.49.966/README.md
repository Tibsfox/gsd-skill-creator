---
title: "v1.49.966 — pre-tag-gate self-consistency + exit-21 collision fix"
version: v1.49.966
date: 2026-06-03
summary: >
  Closes three self-consistency drift findings inside the pre-tag-gate: a real
  exit-code 21 collision (tools-suite vs state-backups), drifted printed step
  denominators, and two false "default WARN-only" legend entries. A new
  drift-guard pins all three — including exit-code uniqueness by full enumeration.
tags: [tools, gate, self-consistency, drift-guard, exit-codes]
---

# v1.49.966 — pre-tag-gate self-consistency + exit-21 collision fix

**Shipped:** 2026-06-03

Ship 0.2 of the 2026-06-03 audit plan: a "gate self-consistency" cleanup that
recon turned into a real bugfix. Reviewing the three named drift findings surfaced
a fourth defect the plan had not caught — an exit-code collision — and the ship
was widened (operator-authorized) to fix it too.

## Why this ship

The pre-tag-gate had accumulated three #10461-class self-inconsistencies inside
`tools/pre-tag-gate.sh`:

1. **Drifted step denominators.** Printed `step X/Y` labels were a mix — early
   steps frozen at `/15`, later additions running a `15/16…20/20` running total —
   so the same gate reported inconsistent totals.
2. **A false legend.** The exit-code legend claimed exit 15 (discipline-coverage)
   and exit 19 (project-md) were "default WARN-only", but both default-BLOCK above
   a ceiling.
3. **A real bug.** Exit code 21 was used by *two* different steps — tools-suite
   (v913) and state-backups (v961). The cc#28 author believed 21 was "unused" but
   skipped full enumeration — the same failure mode the v965 review's exit-22
   collision exposed.

## What shipped

- **Denominators normalized** — every `step X/Y` label now uses the canonical
  count `/20` (= the max integer step = the "all 20 checks PASS" summary).
  Numerators are unchanged.
- **Legend corrected** — exit 15 and exit 19 now describe their default-BLOCK
  ceiling behavior; the two previously-undocumented codes 28 (integration) and 76
  (card-template-length) were added so the legend documents every emitted code.
- **exit-21 collision resolved** — state-backups reassigned 21 → 24 (code, legend,
  the inline explanatory comment, and the v961 meta-test's belief all updated).
- **New drift-guard** `tests/integration/pre-tag-gate-self-consistency.test.ts`
  (12 tests): denominator parity, legend accuracy (with WARN-only positive
  controls for exit 10/13/14/16/23), and exit-code uniqueness + completeness by
  *full enumeration* — operationalizing the post-v965 process-learning as a
  permanent gate.
- Four pre-existing meta-tests (v671/v869/v961/v965) made denominator-agnostic;
  v965 retains absolute-count ownership ("all 20 checks PASS").

## Verification

- The new 12-test drift-guard green; tools suite 832/832; full integration suite
  513; build green; `bash -n` on the gate clean; pre-tag-gate "all 20 checks PASS".
- An adversarial Workflow review (7 read-only agents across 5 dimensions) found
  **1 real MAJOR** — a whitespace-fragile regex in the new guard (`exit (\d+)` vs
  `exit\s+`) that would miss an oddly-spaced exit code — **fixed in code**; and
  correctly **rejected 1** false positive.
- A full-enumeration audit additionally caught a stale `exit 21` *comment* in the
  state-backups block that the targeted edits had missed.

## Engine state

- **NASA degree:** 1.178 (frozen — unchanged)
- **Counter-cadence count:** 29 (unchanged — normal forward `fix`)
- **Manifest lessons:** 151 (unchanged — applies #10461/#10427/#10431/#10436; no new lesson)
- **cadence_advances:** none (not a degree advance)
