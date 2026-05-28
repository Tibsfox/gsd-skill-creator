# v1.49.874 — Lessons

## Promoted to ESTABLISHED in this ship (0)

Chip ship. Applies existing #10433 (safeExecFile wrapper variant of module-internal-helper) + #10427 (3 re-throws) + #10444 (size-ascending). No new lesson promotions.

## Sustained observations

### #10433 — Internal-helper / safeExecFile wrapper variant

**Status:** SUSTAINED. v874 introduces a new sub-variant: a wrapper helper that pairs ensureProcessAllowed with the spawn function. Distinct from v870's class-private-method, v871's closure-capture, v873's module-internal-helper-with-exec(command). The safeExecFile shape handles execFileSync rather than execSync, giving the audit target accuracy.

### #10427 — Failure-mode contracts (re-throw security denials)

**Status:** SUSTAINED. v874 applies the discipline at 3 catches — lower than v870-v873 because most spawn sites in acquirer use the errors-array collection pattern instead of swallow-everything catches.

### #10444 — Size-ascending chip-pick reveals wire-shape diversity

**Status:** SUSTAINED. v874 at 509 LOC is in the upper-mid LOC band (400-800); chose internal-helper-with-wrapper because N=9 spawn sites need DRY but the binaries are heterogeneous.

## Forward observations (promotion candidates)

### #10427 multi-catch helper (PROMOTION-ELIGIBLE — 4 instances now)

**Surface ships:** v1.49.870 (5) + v1.49.871 (4) + v1.49.873 (11) + v1.49.874 (3). Total: 23 mechanical re-throws across 4 chips.

Pattern is decisively codification-ready. The `if (err instanceof ProcessContextDenied) throw err` re-throw should be a helper or higher-order pattern at the next codify ship.

### Audit target accuracy: execFile vs shell-exec (PROMOTION-ELIGIBLE — 2 instances)

**Surface ships:** v1.49.874 (explicit recognition during wire authoring) + retrospective observation that prior chips using execFile-based patterns (e.g., v853 git-collector) silently benefit from the same target accuracy.

When choosing between shell-exec (`execSync(command)`) and direct-exec (`execFileSync(binary, args)`), prefer direct-exec. Shell-exec records `target='sh'`; direct-exec records `target=<actual binary>`. Direct-exec is strictly better for security audit + allow-list construction unless shell features (pipes, redirects) are required.

Promotion-eligible at next codify. Refines #10427 (audit fidelity) or extends #10444 wire-shape catalog with the shell-vs-direct distinction.

### safeExecFile-wrapper pattern as sub-variant of module-internal-helper

**Surface ship:** v1.49.874.

The safeExecFile helper is a distinct shape from v873's exec(command) helper. Both protect N spawn sites with one hoist; differ on shell-exec vs direct-exec. Below threshold (1 instance). Carry forward.

## Carry-forward candidates from prior ships

- Module-internal-helper as third "shared-helper hoist" variant (from v873) — still applicable.
- Closure-capture vs internal-helper-method are same pattern (from v871) — still applicable.
- Audit-fidelity inline-literal extraction (from v872) — not exercised this ship.
- Fake-fixture pattern for wire tests (from v872) — strengthened to fake.zip / fake.docx this ship; still 1 named pattern.
