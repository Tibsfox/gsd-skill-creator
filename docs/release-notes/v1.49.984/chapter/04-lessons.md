# v1.49.984 — Lessons

No manifest lesson is promoted this ship (manifest count holds at 152). This is a small, forward Phase-5 follow-on that applies existing disciplines.

## Applied (existing lessons)

- **Ship 5.2 apply-guard discipline** — the migrator mirrors the "mutate only the one allowlisted key, prove it, back up before writing" pattern from the retention apply-guard: a structural deep-equal allowlist guard ensures the only change is removing `observation.mine_active_skills`, protecting siblings like `observation.retention_days`.
- **Dry-run-default safety** — like the bounded-learning calibration apply, the migrator reports by default and requires `--apply` to write (with a timestamped `.bak`).
- **Config-default inheritance (5.1c)** — delete-key relies on the verified behavior that an absent `mine_active_skills` re-inherits the Zod `default(true)`; this is why deleting (not flipping) is the self-healing choice.
- **Installer contract** — `install.cjs` preserves an existing user config; the migrator stays out of auto-run so the contract holds (operator-invoked only).

## Process notes

- **Re-validate scope matters.** A targeted single-key migration should not gate on the validity of fields it does not touch. The first cut re-validated the whole config and refused to clean a drifted config — exactly the situation the operator runs the tool for. When a mutation is provably minimal (allowlist guard) and the touched field is optional+defaulted, a whole-object schema gate is over-coupling; scope the safety to the actual change.
- **Scale the adversarial review to blast radius** — a small, deterministic, fully-tested surface that nonetheless performs a file write warrants a focused (3-lens) review rather than the full panel.
