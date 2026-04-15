# phase-verification

Run goal-backward verification on a completed phase via `/gsd verify-work`, `/gsd validate-phase`, and `/gsd audit-uat`. Checks that the codebase delivers what the phase promised — not just that tasks were ticked — and writes a VERIFICATION.md into grove with a pass/fail verdict and the evidence chain.

**Triggers:** `verify work`, `validate phase`, `audit uat`, `goal-backward verification`, `verification.md`, `phase verdict`

**Affinity:** `gsd-capcom`, `gsd-verifier`, `gsd-integration-checker`, `gsd-nyquist-auditor`
