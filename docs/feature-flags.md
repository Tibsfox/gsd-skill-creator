# Feature Flags

Risky autonomous behaviors and experimental code paths in gsd-skill-creator are
gated behind a `feature_flags` object nested under the `gsd-skill-creator`
namespace — the same config contract that carries the other opt-in flags
(`sensoria`, `orchestration`, `model_affinity`, …). This document describes the
opt-in pattern and lists the 44 scaffolded slots.

The harness-owned `.claude/settings.json` is validated against a strict schema
that rejects unknown top-level keys, which is why gsd-skill-creator flags live
under a dedicated `gsd-skill-creator` scope rather than at the top level.

- **Tracked source:** `project-claude/settings.json`, key
  `gsd-skill-creator.feature_flags` (all 44 slots, default `false`).
- **Runtime read location:** `src/settings/read-settings.ts` reads the scope
  from `.claude/gsd-skill-creator.json` (checked first) with a fallback to
  `.claude/settings.json`. To actually flip a flag on a deployment, set it under
  `gsd-skill-creator.feature_flags` in `.claude/gsd-skill-creator.json`.
- **Note:** the installer (`project-claude/install.cjs`) currently propagates
  only `hooks` and `statusLine`; it does not yet sync the `gsd-skill-creator`
  scope into the dedicated file. Auto-propagating the namespace (with a
  non-clobbering deep merge, so it never overwrites hand-set flags) is a
  follow-up that applies to the whole namespace, not just `feature_flags`.

Closes: OGA-002.

## Opt-in pattern

All flags default to `false`. Behavior gated by a flag is **off** when:

- the `feature_flags` object is absent, OR
- the specific key is missing, OR
- the key is present and set to `false`.

Behavior is **on** only when the user explicitly sets the key to `true`. This
is the inverse of an opt-out pattern: missing flags never grant new powers.

Code that consumes a flag reads it through the shared settings reader, which
already enforces the safe-default-off policy (returns `false` on any missing
key, IO error, or non-`true` value):

```ts
import { readBooleanFlag } from '../settings/read-settings.js';

if (readBooleanFlag(['feature_flags', 'autonomous_phase_execution'])) {
  // gated behavior
}
```

`readBooleanFlag` uses boolean equality (`=== true`) internally, so truthy
non-boolean values (e.g. an accidental string `"false"`) do not unlock behavior.
No flag has a runtime consumer yet — the scaffold defines the vocabulary; wire a
flag with `readBooleanFlag` at the point it gates.

## Flag categories

The 44 slots are grouped into 9 logical categories.

### Autonomous execution (5)

Gates fully unattended phase / milestone / commit / PR work. Default-off
because each carries irreversibility risk (commits land on `dev`, PRs go to
`main`).

- `autonomous_phase_execution`
- `autonomous_milestone_execution`
- `autonomous_commit_push`
- `autonomous_pr_create`
- `autonomous_pr_merge`

### Memory scorer (3)

Tunes the C3 memory scorer aggression and dedup behavior.

- `memory_scorer_aggressive_threshold`
- `memory_scorer_eager_eviction`
- `memory_scorer_disable_dedupe`

### Experimental runtimes (4)

Enables runtime-HAL adapters that have not yet completed verification.

- `experimental_runtime_pi`
- `experimental_runtime_codex`
- `experimental_runtime_gemini`
- `experimental_runtime_cursor`

### Bounded learning relaxations (3)

The 20% / 3-correction / 7-day cooldown caps from the CS25-26 sweep are
load-bearing safety properties. These flags exist to allow audited override
windows; never set to `true` without an ADR.

- `bounded_learning_disabled`
- `bounded_learning_relax_caps`
- `bounded_learning_skip_cooldown`

### Lyapunov / tractability gates (4)

Disable the MB-1 Lyapunov certificate or the ME-1 tractability classifier.
Both are gating signals for the MA-2 actor-critic wire.

- `lyapunov_gate_disabled`
- `lyapunov_relax_certificate`
- `tractability_classifier_disabled`
- `tractability_skip_escalation`

### Stochastic exploration (3)

Disable MA-3+MD-2 softmax sampling, MD-3 Langevin noise, or MD-4 annealing.

- `stochastic_selection_disabled`
- `langevin_noise_disabled`
- `temperature_annealing_disabled`

### Skills + agents (4)

Auto-install / auto-update / publish-gate behaviors plus an effort-param
escape hatch for the OGA-016 wiring.

- `feature_flags_admin_writeable`
- `skill_auto_install`
- `skill_auto_update`
- `skill_publish_skip_gate`
- `agent_subagent_skip_effort_param`

### Tool tracker / telemetry (6)

Privacy controls for the OGA-034 tool-tracker. The `pii_capture_allowed` and
`capture_filechanged_contents` flags violate the tier-B contract when set —
they exist as audited overrides only.

- `tool_tracker_capture_full_payload`
- `tool_tracker_capture_filechanged_contents`
- `tool_tracker_disabled`
- `telemetry_export_remote`
- `telemetry_pii_capture_allowed`

### Session / ledger / harness (8)

Session-observation aggressiveness, A/B significance gating, branch-context
lifecycle, decision-trace ledger, M1 graph, M5 orchestration loop, ME-2
model affinity, and experimental reports.

- `session_observe_aggressive_capture`
- `session_retro_auto_publish`
- `ab_harness_skip_significance_gate`
- `branch_context_skip_lifecycle`
- `decision_trace_disabled`
- `graph_query_disabled`
- `orchestration_loop_unbounded`
- `model_affinity_disabled`
- `model_affinity_force_haiku`
- `model_affinity_force_opus`
- `experimental_quintessence_report`
- `experimental_dual_impl_promotion`

## Adding a new flag

1. Add the key under `gsd-skill-creator.feature_flags` in
   `project-claude/settings.json` with value `false`.
2. Document it in this file under the appropriate category.
3. Update the test in `src/__tests__/telemetry-flags/feature-flag-scaffold.test.ts`
   if the count changes.
4. Consume it with `readBooleanFlag(['feature_flags', '<key>'])` from
   `src/settings/read-settings.ts` at the point it gates behavior.

## Verification

Coverage is asserted by `src/__tests__/telemetry-flags/feature-flag-scaffold.test.ts`
which checks: `feature_flags` present under the `gsd-skill-creator` namespace
(and absent at the top level), >=44 slots, all defaults false.
