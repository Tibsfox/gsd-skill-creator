# v1.49.966 — Summary

## The ship

Ship 0.2 of the 2026-06-03 audit plan — a "gate self-consistency" cleanup of
`tools/pre-tag-gate.sh`. Recon of the three named drift findings surfaced a fourth
defect the plan had not caught (a real exit-code collision), so the ship was
widened with operator authorization to fix it. The result closes three
#10461-class self-inconsistencies and pins all of them with one new drift-guard.

## What shipped

- **Step denominators normalized** to the canonical `/20` (every `step X/Y` label
  agrees with the "all 20 checks PASS" summary). Numerators unchanged.
- **Exit-code legend corrected**: exit 15 (discipline-coverage) and exit 19
  (project-md) no longer falsely claim "default WARN-only" — both default-BLOCK
  above a ceiling. The two previously-undocumented codes 28 (integration) and 76
  (card-template-length) were added.
- **exit-21 collision fixed** (the real bug): tools-suite (v913) and state-backups
  (v961) both used `exit 21`. state-backups reassigned 21 → 24 across code, legend,
  the inline comment, and the v961 meta-test.
- **New drift-guard** `tests/integration/pre-tag-gate-self-consistency.test.ts`
  (12 tests): denominator parity, legend accuracy (WARN-only positive controls),
  and exit-code uniqueness + completeness by full enumeration.
- Four meta-tests (v671/v869/v961/v965) made denominator-agnostic; v965 keeps the
  absolute-count ownership.

## Verification

New guard 12/12; tools suite 832/832; integration 513; build green; `bash -n`
clean; pre-tag-gate "all 20 checks PASS". An adversarial Workflow review (7 agents)
found 1 real MAJOR (a whitespace-fragile regex in the new guard) — fixed in code —
and correctly rejected 1 false positive. A full-enumeration audit additionally
caught a stale `exit 21` comment the targeted edits had missed.

## Engine state

- NASA degree 1.178 (frozen) · counter-cadence 29 (unchanged, normal forward
  `fix`) · manifest 151 (unchanged) · no cadence_advances.
