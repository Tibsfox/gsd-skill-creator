# Orchestration & Control Surface Review — 2026-07-06

Dimension A (code review): the project-management heart — `src/orchestrator/`
(discovery, intent, gates, lifecycle, state, session-continuity, work-state,
verbosity), `src/teams/`, `src/roles/`, `src/workflows/`, plus the CLI wiring in
`src/cli/commands/orchestrator.ts`.

Scope note: `src/orchestration/` (selector.ts, retrieval-loop.ts, anytime-gate,
miqp-cp-scheduler, wasserstein-prior, mesh-degree-monitor) is a *different*
subsystem — the M5 skill-**activation** selector for the adaptive-learning layer.
It is live (imported by `branches/select-variant`, `bayes-ab`, `skill-applicator`),
not dead weight, and is out of scope per the research-surface exclusion. This
review does not re-cover it beyond confirming it is wired.

## Summary

The GSD orchestrator is a clean, well-factored artifact-derived control surface:
state is read from `.planning/` artifacts, the lifecycle stage is *derived*
(not a stored state machine), and gates/intent are pure functions with good test
coverage. State parsing degrades gracefully and is security-gated (LoaderContext).

The dominant problem is **command-vocabulary drift**: the hardcoded command
vocabulary baked into the intent/lifecycle/gates modules has diverged from the
commands this repo actually ships. The prior ecosystem review (C7) noted the
`/gsd:phase` unification at the *skill/agent doc* layer; the same drift is
**un-fixed in the orchestration code**, where it has runtime teeth — the natural
-language classifier can no longer route any phase-CRUD intent, and the
destructive-confirmation gate for phase removal is silently bypassed. The
module's own tests pin the stale names, so CI is green on dead vocabulary.
Secondary findings: a non-atomic / unlocked work-state writer (task-loss + file
corruption under concurrency), dead retention config on the snapshot manager, and
two low-impact gate-logic smells.

## Findings

### ORCH-1 — Lifecycle command vocabulary omits the shipped `gsd:phase`; NL classifier cannot route phase CRUD (HIGH, alignment/bug)

**Location:** `src/orchestrator/intent/lifecycle-filter.ts:52-107` (`STAGE_COMMANDS`),
consumed by `src/orchestrator/intent/intent-classifier.ts:201-211`.

**Problem.** `STAGE_COMMANDS` maps every phase-bearing stage to the *removed*
granular commands `gsd:add-phase`, `gsd:insert-phase`, `gsd:remove-phase`,
`gsd:research-phase`, `gsd:list-phase-assumptions`, `gsd:plan-milestone-gaps`.
None of these exist in the shipped command set (`.claude/commands/gsd/` — verified:
the only phase-CRUD command is `phase.md` → `gsd:phase`; there is no `add-phase`,
`insert-phase`, `remove-phase`, or `research-phase`). Grep confirms **zero**
occurrences of `gsd:phase` anywhere in `src/orchestrator/` or `src/orchestration/`.

`IntentClassifier.classifyInternal` narrows Bayes/semantic classification to the
`filterByLifecycle` output (`validNames`, intent-classifier.ts:203-211). Because
`gsd:phase` is in neither `UNIVERSAL_COMMANDS` nor any `STAGE_COMMANDS` set, it is
filtered out of `validNames` in every stage. A user utterance like "add a new
phase" / "remove this phase" therefore **can never be classified to `gsd:phase`** —
the only command that performs the action. The stale names it *would* map to are
not in the discovered command set either, so `commandByName.get()` returns
undefined and they are dropped — the intent dead-ends to `no-match`/`ambiguous`.
`UNIVERSAL_COMMANDS` additionally lists `gsd:set-profile`, `gsd:add-todo`,
`gsd:check-todos`, `gsd:join-discord`, none of which ship (harmless but dead).

**Recommendation.** Replace the granular phase commands in `STAGE_COMMANDS` with
`gsd:phase` in the roadmapped/planning/executing/verifying/between-phases stages;
drop the non-shipped universals. Then add a drift test (see New-function ORCH-N1)
asserting every command named in `STAGE_COMMANDS`/`UNIVERSAL_COMMANDS` exists in a
discovered/ canonical command set, so this cannot silently rot again.

**Effort:** S. **Verify:** `skill-creator orchestrator classify "add a new phase"`
against an initialized project surfaces `gsd:phase`; a unit test that
`filterByLifecycle(allDiscovered,'executing')` includes `gsd:phase`.

---

### ORCH-2 — Destructive-confirmation gate is bypassed for phase removal in YOLO mode (HIGH, security/bug)

**Location:** `src/orchestrator/gates/types.ts:65-68` (`DEFAULT_DESTRUCTIVE_COMMANDS`),
evaluated at `src/orchestrator/gates/gate-evaluator.ts:44-51` and wired in
`src/cli/commands/orchestrator.ts:360`.

**Problem.** The destructive set is `{ 'gsd:remove-phase', 'gsd:complete-milestone' }`.
`gsd:remove-phase` no longer exists — phase removal is now a mode of the unified
`gsd:phase`. Since `gsd:phase` is not in the destructive set, `evaluateGate('gsd:phase',
'yolo', ≥0.5)` returns `action: 'proceed'` with no confirmation. A destructive
"remove phase N" operation therefore auto-executes in YOLO mode with no HITL gate.
The guard protects a command name that can never be invoked while the live command
that performs the destructive act is ungated. (Default mode is `interactive`
— gate-evaluator.ts confirms everything there — so the regression is scoped to
YOLO users, but that is exactly the mode where the gate matters.)

**Recommendation.** Since `gsd:phase` is multiplex (add/insert/remove/edit),
name-level gating is insufficient — gate on the *sub-action*. Minimum fix: add
`gsd:phase` to the destructive set (over-confirms benign edits but is safe).
Better: have the classifier surface the phase sub-command (remove) and gate on it,
or pass the destructive determination from argument extraction.

**Effort:** S (name-level) / M (sub-action). **Verify:** unit test
`evaluateGate('gsd:phase','yolo',0.9).action === 'confirm'` for a remove intent.

---

### ORCH-3 — transition-rules suggests non-existent commands; mutation-override never fires (MEDIUM, bug/alignment)

**Location:** `src/orchestrator/lifecycle/transition-rules.ts:70-73`
(`PHASE_MUTATION_COMMANDS`), `:165` and `:178` (`gsd:research-phase` alternatives);
tests `src/orchestrator/lifecycle/transition-rules.test.ts:122-346` and
`lifecycle-coordinator.test.ts:374-399`.

**Problem.** Two coupled defects:
(a) `PHASE_MUTATION_COMMANDS` keys on `gsd:insert-phase`/`gsd:add-phase`. This is
compared against `completedCommand` (transition-rules.ts:295). The real command is
`gsd:phase`, so the "newly added phase needs planning → suggest gsd:plan-phase"
override **never triggers** in production; after a real `gsd:phase` add the user
gets the generic artifact-derived suggestion instead of the intended plan prompt.
(b) `deriveNextActions` offers `gsd:research-phase` as an alternative action
(lines 165, 178) — a command that does not ship — so `orchestrator lifecycle`
can literally tell the user to run `/gsd:research-phase`, which does nothing.
The unit tests assert these exact stale names, so they *entrench* the drift rather
than catch it.

**Recommendation.** Repoint `PHASE_MUTATION_COMMANDS` to `gsd:phase` (keyed on the
add/insert sub-actions if available); replace `gsd:research-phase` alternatives
with `gsd:discuss-phase` (or `gsd:spike`/`gsd:explore`, which do ship) or drop
them. Update the tests to the shipped vocabulary.

**Effort:** S. **Verify:** `deriveNextActions(...,'gsd:phase')` yields the
plan-phase override; grep of emitted suggestions contains no non-shipped command.

---

### ORCH-4 — WorkState writer is non-atomic and unlocked → task loss / file corruption under concurrency (MEDIUM, tech-debt/concurrency)

**Location:** `src/orchestrator/work-state/work-state-writer.ts:21-31` (`save`),
`src/orchestrator/work-state/queue-manager.ts:43-80` (`add`/`remove`).

**Problem.** `WorkStateWriter.save` does a bare `writeFile` (no temp-file +
`rename`), so a crash or SIGKILL mid-write leaves a truncated/corrupt
`.planning/hooks/current-work.yaml`. `QueueManager.add`/`remove` perform
read → mutate-in-memory → `save` with no lock or compare-and-swap. Two concurrent
`skill-creator orchestrator work-state queue-add` invocations (or a queue-add
racing a `work-state save`) both read the same base state and the second write
clobbers the first — silent task loss. This is the pause/resume durability
substrate, so loss here directly undermines session-continuity guarantees. The
codebase already has an atomic-write idiom to reuse: `src/chipset/gastown/
state-manager.ts` and `src/discovery/scan-state-store.ts` use temp-file + rename.

**Recommendation.** Route `save` through an atomic write (write `*.tmp` then
`rename`); optionally add a lockfile/lease or an mtime/version CAS in
`QueueManager` so concurrent mutations serialize instead of last-writer-wins.

**Effort:** M. **Verify:** kill the process between write-open and close (or run
two parallel queue-adds) and confirm the file stays valid YAML and both tasks
survive.

---

### ORCH-5 — SnapshotManager retention config is dead; snapshot JSONL grows unbounded until manual prune (LOW, tech-debt)

**Location:** `src/orchestrator/session-continuity/snapshot-manager.ts:34-43`
(fields set) vs `:122-133` (`store` only appends); prune path
`src/cli/commands/orchestrator.ts:883-905`.

**Problem.** `SnapshotManager` stores `maxSnapshots` and `maxAgeDays` (defaulting
to `DEFAULT_MAX_SNAPSHOTS` / `DEFAULT_SNAPSHOT_MAX_AGE_DAYS`) but **never reads
them** — grep confirms no use beyond assignment. `store()` appends to the JSONL
with no trim, so the file grows without bound during a session. Pruning happens
only when a user manually runs `orchestrator snapshot prune`, which builds a
`RetentionManager` with its own `--max` (default 20) and passes **no age**, so the
class's `maxAgeDays` / `DEFAULT_SNAPSHOT_MAX_AGE_DAYS` is never enforced anywhere.
Retention that looks configured is inert.

**Recommendation.** Either auto-trim inside `store()` (cap at `maxSnapshots`,
drop entries older than `maxAgeDays`), or delete the dead fields and document that
retention is external + entry-count-only. If age retention is intended, thread
`maxAgeDays` into the prune path.

**Effort:** S. **Verify:** write N > maxSnapshots snapshots and confirm the file
self-caps (or that the fields are gone and docs updated).

---

### ORCH-6 — `skippedByYolo` mislabeled on interactive-confirm decisions (LOW, bug)

**Location:** `src/orchestrator/gates/gate-evaluator.ts:74-79`.

**Problem.** The interactive routing branch returns `action: 'confirm'` with
`skippedByYolo: true`. Nothing was skipped by YOLO — the command is being
confirmed. The field is meant to record "whether YOLO influenced the decision"
(types.ts:33). Any consumer/telemetry keying on `skippedByYolo` mis-attributes
interactive confirmations as YOLO skips.

**Recommendation.** Set `skippedByYolo: false` on the interactive-confirm branch.

**Effort:** S. **Verify:** `evaluateGate('gsd:plan-phase','interactive',0.9)
.skippedByYolo === false`.

---

### ORCH-7 — Confirmation-gate tier is a no-op relative to the base gate (LOW, tech-debt)

**Location:** `src/orchestrator/gates/confirmation-gate.ts:78`.

**Problem.** `evaluateConfirmationGate` adds a confirm only when
`mode !== 'yolo' && confirmationCommands.has(cmd)`. But the base `evaluateGate`
already confirms **every** command when `mode !== 'yolo'` (gate-evaluator.ts:74).
In YOLO mode the confirmation condition is false, so the command proceeds. Net:
`CONFIRMATION_REQUIRED_COMMANDS` (`execute-phase`, `complete-milestone`) never
changes the outcome — the tier is dead. If the design intent was "force
confirmation for these high-impact commands *even in YOLO*", the mode condition is
inverted.

**Recommendation.** Decide intent. If high-impact commands should confirm in YOLO,
change the condition to fire in YOLO for the confirmation set (and add
`execute-phase`); otherwise remove the redundant tier.

**Effort:** S. **Verify:** a test that `evaluateConfirmationGate('gsd:execute-phase',
'yolo',0.9)` differs from the base gate under the chosen semantics.

## New-function / capability opportunities

- **ORCH-N1 — Command-vocabulary drift guard (would have caught ORCH-1/2/3).**
  Add a test/tool that loads the discovered/canonical GSD command set and asserts
  every command string hardcoded in `lifecycle-filter.STAGE_COMMANDS`,
  `UNIVERSAL_COMMANDS`, `gates/types.DEFAULT_DESTRUCTIVE_COMMANDS`,
  `confirmation-gate.CONFIRMATION_REQUIRED_COMMANDS`, and
  `transition-rules` suggestion strings exists in that set (and, inversely, that
  destructive/mutation commands that *do* ship are represented). This turns a
  silent runtime rot into a red CI leg. Small, high leverage.

- **ORCH-N2 — Sub-action-aware gating for multiplex commands.** The `gsd:phase`
  unification broke name-level gating (ORCH-2). A small helper that maps
  `(command, extractedArgs)` → risk class (e.g. `phase remove` = destructive)
  would let gates and transition-rules reason about intent rather than command
  name, and generalizes to any future multiplex command.

- **ORCH-N3 — Concurrency control for `.planning/` co-management.** There is no
  lock/lease anywhere in the work-state or state-reader path. For the stated goal
  of *co-managing* projects (multiple sessions/agents), a lightweight lockfile or
  optimistic version field on `current-work.yaml` (and on STATE.md writes) would
  make queue mutations and pause/resume safe under concurrency. ORCH-4 is the
  narrow instance; a shared primitive would cover the whole control surface.

## Notes

- **State-machine soundness is good.** `deriveLifecycleStage` (lifecycle-filter.ts:123)
  derives stage from artifact flags rather than a stored machine, and both it and
  `LifecycleCoordinator` handle the "shouldn't happen" branches gracefully
  (empty artifacts / no incomplete phase). `findNextIncompletePhase` correctly
  uses array order, not arithmetic, to tolerate non-sequential phase numbers.
  The `phaseLevelSuggestion` fallback (transition-rules.ts:248) is effectively
  unreachable given `unexecutedPlans` covers the `summaryCount < planCount` case —
  not a defect.

- **State reader** is robust and security-gated (LoaderContext chokepoint,
  state-reader.ts:85) with the gate correctly hoisted above the ENOENT-swallowing
  `directoryExists`. No issues found.

- **Discovery service** filters agents to the `gsd-*` prefix (discovery-service.ts:226)
  and caches on VERSION mtime; sound. It reads from the installed `.claude/`, so it
  *does* discover `gsd:phase` — which is exactly why ORCH-1's lifecycle filter
  dropping it is the active bug, not discovery.

- **Teams / roles.** `inter-team-bridge.ts` (Kahn's-algorithm cycle detection) and
  `role-injector.ts` are config-time validators/formatters with good tests; no
  control-surface defects found. Team dispatch here is validation, not a runtime
  broker (as documented) — actual agent dispatch lives in the chipset/mail layers,
  outside this dimension.

- The `orchestrator` CLI surfaces discover/state/classify/lifecycle/work-state/
  snapshot subcommands cleanly with consistent JSON + `--pretty` verbosity
  filtering; error handling returns structured JSON and non-zero exit codes.
