# HB-04 Worker / Evaluator / Evolution (W/E/E) Roles — User Guide

**Path:** `src/skill-creator/roles/`
**Source paper:** arXiv:2604.21003 ("The Last Harness You'll Ever Build")
**Default:** OFF
**Flag:** `gsd-skill-creator.cs25-26-sweep.weler-roles.enabled`
**CAPCOM HARD GATE.**

## What it does

The Last Harness paper is an external description of skill-creator. It
names what the existing six-step loop already does (Observe → Detect →
Suggest → Manage → Auto-Load → Learn/Compose) using three roles:

- **Worker** — generates candidate skills against the target task
  (existing Suggest/Auto-Load step).
- **Evaluator** — adversarially diagnoses Worker output against
  failure-history. **Holds BLOCK authority.** Replaces the legacy ad-hoc
  "3 corrections minimum" rule.
- **Evolution** — proposes loop-protocol modifications based on
  cross-skill patterns (slow timescale).

Cross-role state writes are runtime-enforced via `assertRoleWrite()`.
Cross-role reads use `makeRoleView()` which strips fields the reading
role is not allowed to see.

## How to enable + the CAPCOM workflow

HB-04 is a CAPCOM HARD GATE — the role split touches skill-creator
orchestration. Two distinct activation paths exist:

1. **Role-split activation.** Transitioning from single-role (existing
   six-step loop) to W/E/E. Authorized via
   `.planning/skill-creator/weler-roles.capcom`.
2. **Protocol-update.** When Evolution proposes a change to a loop
   protocol (auto-load, evaluator-threshold, six-step-cadence).
   Authorized via the same marker (v1.49.575 ships local-marker only;
   v1.49.576+ may add multi-operator signed-attestation).

```bash
# Trigger (user request)
touch .planning/skill-creator/weler-roles.trigger
# CAPCOM auth (human review)
echo "human-foxy@2026-04-25" > .planning/skill-creator/weler-roles.capcom
```

Trigger does NOT authorize; CAPCOM does. Both are checked.

## Conservative-default policy

When the flag is on but no role split is authorized, behavior degrades
to single-role: only the Worker is exercised. The existing six-step
loop runs unchanged. The only change vs flag-off is that
`emitCapcomGate` emits records with `authorized=false` so an operator
can see the system is waiting for authorization.

## Extension-point setup for HB-07

HB-04 exposes `EvolutionExtensionPoint`. HB-07 (AEL fast/slow bandit)
implements that interface. Register HB-07 by passing
`{ extensions: [bandit] }` to `evolutionPropose()`. HB-04 short-circuits
extension invocation when role-split-activation is unauthorized; HB-07
emits its own engagement-CAPCOM gate before mutating its own posterior
(double-gate semantic).

## Default-off invariant

When the flag is off, `workerGenerate()`, `evaluatorRun()`, and
`evolutionPropose()` return the three frozen disabled-state sentinels
(`WORKER_DISABLED_STATE`, `EVALUATOR_DISABLED_STATE`,
`EVOLUTION_DISABLED_STATE`). No CAPCOM record is emitted; no extension
is invoked.
