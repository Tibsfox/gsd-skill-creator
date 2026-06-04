# v1.49.976 — Lessons

No new manifest lesson promoted. This is a forward audit-plan ship that applies
existing disciplines; the manifest stays at **152** and the counter-cadence at
**29**.

## Applied (existing lessons)

- **Verify the plan premise against ground truth (D1/D3/Ship-2.3 class).** Recon
  refuted "teams mostly closed" (2/4 FAIL) and "taxonomy lists 11" (lists the
  wrong 9), and relocated the validate bug from `loadAnyCartridge` to
  `handleValidate`'s `loadCartridge` call. The fixes followed ground
  truth, not the plan's wording.
- **#10450 anti-vacuous drift-guard.** The new SCHEMA PARITY assertion was
  proven to fail on the old dialect (rejected on `leadAgentId`/`createdAt`/
  `agentId`) before being trusted.
- **#10461 gate-without-denominator-churn.** Both new tests went into existing
  vitest suites, keeping the pre-tag-gate at 20 (no new shell step).
- **Adversarial pre-push step-P** (codified v968) ran clean (0 confirmed).

## Process notes

- A wall-clock latency-*ratio* assertion (`src/cache` preload CF-M5-04) is
  load-flaky under the full 36k-test suite; confirm-in-isolation then re-run is
  the right response, not an override. Logged as a watch item for tolerance
  hardening.
- When a catalog has two schema dialects, migrating the minority to the majority
  dialect (here 2 → the 2 already-new) plus a parity drift-guard is the
  lightest durable fix — cheaper than teaching the validator to accept both.
