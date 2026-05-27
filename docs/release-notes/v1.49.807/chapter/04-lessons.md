# v1.49.807 — Lessons

## New lesson candidates (0)

No new candidates this ship. Carrying forward the v806 backlog: 0 candidates + 8 tentative observations.

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file (~15 min) before per-file code | Read step 0.5 + step 17 of `tools/pre-tag-gate.sh` + `state-md-normalizer.mjs` + `project-md-normalizer.mjs` before writing the gate. Surfaced that the v806 handoff's S5 framing was based on incomplete information (both normalizers were already in pre-tag-gate); the actual gaps were narrower. |
| #10415 | Close escalated wedges within 1-2 milestones | The v805→v806 STATE.md drift was the alarm; v807 lands the closure within 1 milestone. |
| #10416 | Tolerant-generator / lightest-wire | Resisted adding a `--write` mode to project-md-normalizer (would create stale-desc/date "lying" lines); resisted a new vitest harness for bash gate behavior; chose two surgical bash edits. |
| #10422 | Verdict-pattern surface separation | Observability (the `--check` round; the patch-drift regex) and decision (threshold value; escalation policy) both live in `tools/pre-tag-gate.sh` but the policy is operator-overridable via env-var `SC_PROJECT_MD_MAX_PATCH_DRIFT` — keeps the gate code simple while exposing the policy knob. |
| #10427 | Failure-mode contracts: load-bearing surfaces fail loudly | Both new gates are LOUD-FAIL. Step 0.5's `--check`-after-`--write` is a regression alarm; step 17's patch-drift cap is a forcing function for hand-update. The pre-existing WARN-only behavior was demonstrably not enough (5-version drift survived 5 ships). |

## Tentative observations carried forward (8 — UNCHANGED from v806)

| Source | Observation | Promotion threshold |
|---|---|---|
| v800 implementation | watch-loop tear-down race | NOTE; carry forward (1 instance) |
| v798→v799-801 | chained-session architectural-tax break-even | NOTE; carry forward (1 chain) |
| v798→v804 | registry-abstraction cross-chain payoff | NOTE; carry forward (supporting #10426) |
| v800-v804 trajectory | 6th-mode-flag refactor trigger | NOTE; carry forward (1 trajectory) |
| v784/v790/v802/v805 | codification-ship pattern at 4 instances | NOTE; promote at 5th instance |
| v782/v806×2 | chokepoint pattern at 3 instances | NOTE; re-evaluate abstraction at instance 4 |
| v806 audit harnesses | `KNOWN_UNWIRED` allowlist as migration-debt ledger | NOTE; pattern-name at 2nd instance |
| v805 → v806 detection | STATE.md normalizer drift recurrence | NOTE; v807 closed the regression-detector part; the post-T14-reset class remains under observation |

## New observation flagged this ship (not promoted; not in count)

**Handoff-framing-vs-recon-divergence.** The v806 handoff §175 stated S5 should "add normalizer to pre-tag-gate" — but recon showed both normalizers were already in pre-tag-gate. The handoff framing was load-bearing in that it picked S5 from the menu, but the implementation scope shifted on recon-first inspection. This is the second time a handoff's S-lever framing has been partially-incorrect on recon (v802 found similar mid-implementation refinements). Not a candidate-track observation — recon-first is already the codified discipline that catches this class. But noting that handoffs read like specs; treat them like hypotheses.

## Cross-references to applied lessons

- #10412 + #10415 → close-the-alarm-within-1-milestone shape used this ship (v806 alarm; v807 closure)
- #10416 + #10422 → policy-stays-in-bash judgment for the patch-drift cap
- #10427 → load-bearing-surfaces-fail-loudly applied to both gates
