
# v1.49.843 — Lessons

## Promoted to ESTABLISHED in this ship

None. v1.49.843 is a batch chip following established patterns.

## New lesson candidates (1; threshold reached)

### DI-executor + tokenized-argv wire shape for ProcessContext

**Observation:** When a module exposes a factory that accepts an optional injected executor for testability (`gitExecutor?: GitExecutor`, etc.), AND the default executor takes a free-form cmd string, the ProcessContext wire pattern is:

```ts
export function createFooManager(
  executor?: SomeExecutor,
  ctx?: ProcessContext,
): SomeManager {
  const defaultExecutor: SomeExecutor = (cmd) => {
    const tokens = cmd.trim().split(/\s+/);
    const exe = tokens[0] ?? '';
    const argv = tokens.slice(1);
    ensureProcessAllowed(ctx, 'module/source', 'op', exe, argv);
    // delegate to actual exec
    return execSync(cmd, { encoding: 'utf8' }) as string;
  };
  return new SomeManager(executor || defaultExecutor);
}
```

Key properties:
- Optional `ctx?: ProcessContext` is added as a factory parameter (positional optional).
- The default executor closes over ctx; the security check runs ONLY on the default path.
- Injected executors are NOT wrapped — caller-injected security is the caller's responsibility (test mocks; production custom-executor patterns).
- The cmd string is tokenized to extract executable + argv for the allowList check and audit record.
- This is a sub-class of #10433's internal-helper pattern: the default executor IS the internal helper; ctx threads through it.

**Why it matters:** Distinct from the spawn-call wire shape (used by terminal family v842), which wraps the spawn callsite directly. The DI-executor shape is appropriate when a factory creates the executor and callers either accept the default or inject their own. Wraps once per factory, applies to all calls through the default executor.

**Instances:** 3 — v1.49.825 `src/git/core/repo-manager.ts` (first) + v1.49.843 `src/mesh/mesh-worktree.ts` + `src/mesh/proxy-committer.ts` (this ship; 2 applications).

**Forward-test trigger:** any future ProcessContext chip on a file that exposes a `*Executor` injection point. Examples in current KNOWN_UNWIRED: `src/learning/version-manager.ts`, `src/scan-arxiv/bridge.ts` (need to inspect).

**Promotion path:** at next codify ship, codify as a #10433 refinement (siblings: spawn-call shape v842, internal-helper shape #10433-proper, threaded-options shape v842 launcher). Could go into a new "ProcessContext wire shape catalog" section of `docs/architecture-retrofit-patterns.md`.

## Forward-test of existing lessons

### #10427 — Failure-mode contracts

**Status:** NOT EXERCISED. DI-executor wire doesn't involve a swallowing try/catch — the check runs before delegating to execSync. No catch-rethrow needed.

### #10428 — Meta-cadence

**Status:** NOT EXERCISED. 3rd ship of operational-debt cluster; no codify-cadence tick.

### #10433 — Internal-helper / threaded-options pattern

**Status:** REINFORCED 6× (5 prior instances + 2 this ship = 7 instances, but counting batch-as-one: v825 + v827 + v828 + v839 + v842 + v843 = 6 ships). The DI-executor shape is a sub-class; codification would refine the catalog rather than spawn a separate discipline.

### #10434 — Ratchet-ledger pattern (KNOWN_UNWIRED generalization)

**Status:** REINFORCED. Process KNOWN_UNWIRED: 16 (was 18). The ledger continues to asymptote toward zero across consecutive chip ships.

### #10435 — Cross-rootdir wire pattern

**Status:** NOT EXERCISED. Single-rootdir (src/mesh/).

### #10436 — Two-layer closure (file-overwrite drift sub-class)

**Status:** REINFORCED at T14 publish step. v836 preservation gate fired correctly (expected on this ship's chapter writes).

### #10437 — Subscriber-gated observability-only context-hook pattern

**Status:** NOT EXERCISED.

## Tentative observations carried forward (consolidated)

### Threshold reached this ship (1 NEW)

| Observation | Instances | Notes |
|---|---|---|
| DI-executor + tokenized-argv wire shape | 3 (v825 + v843×2) | NEW THIS SHIP. Threshold crossed at 2nd unique ship. Eligible for codification at next codify ship as #10433 refinement. |

### Eligible for next codify ship (2 deferred from v840)

| Observation | Instances | Notes |
|---|---|---|
| Verification/integration-only ships axis | 2 (v829 + v832) | DEFERRED v840 — no canonical-doc home. |
| Bidirectional enforcement completeness | 1-2 (v838 + v836) | DEFERRED v840 — classification ambiguous. |

### Below threshold (deferred)

| Observation | Source | Notes |
|---|---|---|
| Re-throw ProcessContextDenied from CLI swallow-catch | v820 + v842 | 2 instances; could codify if no further work pending. |
| Recent-vs-baseline-recent comparison pattern | v841 | 1 instance. |
| Drift-check noise as scoring-system feedback loop | v841 | 1 instance. |
| Codify-ship-as-recon-consolidator pattern | v840 | 1 instance. |
| Deferral-by-classification-ambiguity | v840 | 1 instance. |
| Auto-run-on-import as bootstrap-time tax | v836 | 1 instance. |
| Polarity convention for inverted-mechanic thresholds | v837 | 1 instance. |
| Other single-instance observations | various | various. |

## Cadence observation

v843 is the 3rd ship of the new operational-debt cluster:

| Ship | Wall-clock | Scope | KNOWN_UNWIRED Δ |
|---|---|---|---|
| v1.49.841 | ~40 min | Quality-drift recalibration (tooling) | 0 |
| v1.49.842 | ~20 min | Terminal family batch chip (3 wires) | -3 (Process: 21 → 18) |
| v1.49.843 | ~15 min | Mesh family batch chip (2 wires) | -2 (Process: 18 → 16) |

Cluster cumulative so far: ~75 min wall-clock, 5 source-file wires, 5 KNOWN_UNWIRED entries removed. Cluster has 2 more ships planned per user direction: v844 verification/integration-only canonical-doc + v845 production caller of predict path.
