# Failure-Mode Contracts Discipline

**Surface:** Designing a new surface (function, module, CLI flag, skill prompt section, hook) where the asymmetric cost of silent vs loud failure is in play; reviewing an existing surface that has been emitting either spurious user-facing errors or invisible silent degradations.

**Codified at:** v1.49.802 (lesson cluster from v1.49.799 audit log + v1.49.800 watch loop + v1.49.801 `/sc:status` Step 5.5 — three independent instances of best-effort-silent failure contracts in one chained session); v1.49.840 (extended with #10437 subscriber-gated context-hook pattern); v1.49.847 (extended with #10442 re-throw ProcessContextDenied from CLI swallow-catch).

## Why this discipline exists

Every surface has a failure-mode contract — explicit or implicit. The two choices are:

- **Fail loudly:** error propagates; user sees the failure; the operation does not complete.
- **Fail silently:** error is swallowed; user does not see the failure; the operation degrades (or the section is skipped).

The default choice is wrong roughly half the time. Surfaces that should fail loudly often default to silent (`try { ... } catch {}` blocks), letting the user act on stale or wrong data without warning. Surfaces that should fail silently often default to loud, blocking a load-bearing operation because an accessory section had a problem.

Three best-effort-silent contracts shipped independently in the v1.49.799-801 chain — audit-log writes, watch-loop callbacks, `/sc:status` Step 5.5. In each case the same asymmetry recurred: the surface is accessory (the load-bearing operation does not depend on it succeeding), so a failure should not propagate. Codifying the asymmetry as a design rule lets future surfaces make the right choice without re-deriving it each time.

## Discipline pattern

### Forensic/dashboard/observability surfaces fail silently; load-bearing surfaces fail loudly (Lesson #10427)

The asymmetry is between two surface categories:

- **Load-bearing surfaces** — operations the user is explicitly asking for; data that decisions depend on. These MUST fail loudly with clear messages. If the calibration loop's threshold writer fails, the user must know — they are about to act on a config file that did not get written.
- **Accessory surfaces** — logging, telemetry, dashboard sections, optional decorations. These SHOULD fail silently. If the audit log write fails because the disk is full, the calibration loop itself should still succeed; the user can act on the loop's result, and the missing audit-log entry is a survivable forensic gap.

The cost asymmetry:

- Surfacing an accessory failure either gates the load-bearing operation (which is the wrong outcome — the user asked for the load-bearing thing) or pollutes the operator-facing output (the user did not ask to know about the accessory's troubles).
- Hiding a load-bearing failure means the user is acting on wrong data without knowing it. This is the most expensive failure mode in the entire surface taxonomy because it shifts the cost from "the operation didn't work" (recoverable) to "the operation appeared to work but didn't" (often unrecoverable).

### How to apply

When designing a new surface, ask the single question:

> Is this load-bearing or accessory?

The test is: **does the user's next decision depend on this surface's output?**

- If yes → load-bearing → fail loudly. Errors propagate; the operation does not complete; the user gets a clear message.
- If no → accessory → fail silently. Errors are caught at the surface boundary; the surface skips itself or degrades gracefully; the load-bearing operation continues.

### Contract documentation convention

The contract MUST be explicit in the function/section docstring. Use one of two short markers:

```typescript
/**
 * ... best-effort silent: write failures do not propagate to the CLI exit
 * code, because the audit log is accessory to the calibration loop.
 */
```

```typescript
/**
 * ... fail loudly: any error reaches the CLI exit code, because callers
 * must not act on a half-written config file.
 */
```

The marker MUST be paired with at least one test assertion that exercises the failure path:

- For best-effort silent: an `it('does not throw when ...', () => { ... })` test that injects the failure condition and asserts the surface returns normally.
- For fail-loudly: an `it('throws when ...', () => { ... })` test that injects the failure condition and asserts the error propagates.

A surface whose docstring claims "best-effort silent" but has no test asserting that claim is a stochastic surface — operators cannot predict its behavior under failure, and the next refactor may quietly invert the contract.

### Reference implementations (the v799-801 chained-session instances)

1. **v1.49.799 audit-log write** — `appendAuditLogEntry(path, entry)` swallows disk-full / permission-denied; the calibration loop's exit code does not depend on whether the audit-log line was actually persisted. The accessory is *forensic*: it exists to support after-the-fact review of how the loop arrived at a recommendation. A missing line degrades forensics; it does not invalidate the recommendation.

2. **v1.49.800 watch-loop callback** — A single transient error from `runCalibrationTick` does not tear down the watch loop. The watch loop is *long-running*; a transient error (e.g. file briefly held by another writer) should not require the operator to restart the daemon. The next tick will retry.

3. **v1.49.801 `/sc:status` Step 5.5** — The `npx skill-creator bounded-learning --summary` subprocess can fail (binary missing, JSON parse error, subprocess timeout); when it does, the step skips silently. The `/sc:status` dashboard is *observability*; the dashboard is best-effort.

In each case, the alternative (propagating the failure) would either gate the load-bearing operation or pollute the operator-facing output. Silent failure is the right contract.

### Counter-example: the load-bearing surfaces in the same modules

The asymmetry only works because the matched load-bearing surfaces in the SAME modules do fail loudly:

- **`threshold-writer.ts`** (v1.49.796) — schema validation failures throw. A malformed config write would cascade into next-session config-read failures; the operator must know immediately.
- **`runCalibrationTick(ctx)`** (v1.49.800) — a `calibration-loop` math error or schema-validation error throws and tears down the loop. The recommendation surface is load-bearing.
- **`bounded-learning --apply`** mode (v1.49.795+) — a write failure on `.gsd/config.json` propagates to the CLI exit code. The operator must not believe a config update happened when it did not.

The discipline lives in the contrast: the SAME module has both contracts, scoped to the right surfaces.

## When this discipline kicks in

- Designing a new function whose output other code (or other operators) may depend on.
- Adding a `try { ... } catch { /* ignore */ }` block — this is the signal that the contract should be made explicit.
- Adding a section to an operator-facing skill prompt that consumes a subprocess or external tool.
- Adding a long-running primitive (daemon, watch loop, scheduled job) where transient errors should not tear down the loop.
- Reviewing a surface that has been emitting either spurious user-facing errors or invisible silent failures.

## Anti-pattern summary

- ❌ `try { criticalWrite() } catch {}` — silent failure on a load-bearing surface. The user acts on the appearance of success.
- ❌ `throw new Error('audit log failed')` from an accessory write — surfaces an accessory failure to the user, gating the load-bearing operation.
- ❌ Documenting "best-effort silent" in a docstring without a test asserting it. The contract is stochastic.
- ❌ Tear-down-on-first-error in a long-running primitive. Transient errors are survivable; the operator should not have to restart.
- ❌ Bundling load-bearing and accessory operations into the same try-block. The accessory's failure will either propagate (wrong) or silently swallow the load-bearing failure (catastrophically wrong).

## Subscriber-gated observability-only context-hook pattern (Lesson #10437)

**Codified at:** v1.49.840 (from a 4-instance evidence set: v810 + v826
`onPredictions` + v830 + v832 `fallbackProvider`; the latter two co-located
on the same surface as a PAIR).

A specific structural shape recurs across substrate-consumer context hooks:
the hook exists to let a future consumer subscribe to an observability event
emitted by the producer, but the hook MUST cost zero when no consumer is
attached AND MUST never tear down the producer when the consumer errors.

### Structural shape

```typescript
interface SomeContext {
  // ... required fields ...
  onSomeEvent?: (a: A, b: B) => void | Promise<void>;
}

// Inside the producer (`emitSomething` or equivalent):
if (this.ctx.onSomeEvent !== undefined && this.subscribers.length > 0) {
  // Two-layer subscriber gate: only fire when (a) the hook is wired AND
  // (b) there is at least one subscriber to consume what the hook emits.
  Promise.resolve(this.ctx.onSomeEvent(a, b)).catch(() => { /* swallow */ });
}
```

Five elements together define the shape:

1. **Optional `?` field** on the context/options type — default-unset, no
   default-attached subscriber.
2. **Subscriber gate** at the call site — the producer skips the call when
   no consumer is attached (a single `if` check or an empty-array test).
3. **Fire-and-forget Promise wrapper** — `Promise.resolve(hookResult)`
   normalizes sync and async consumers without awaiting.
4. **`.catch(() => {})`** — errors thrown by the consumer are swallowed at
   the producer boundary; the producer's load-bearing path continues.
5. **Two-argument shape** — the hook receives `(currentSubject, derivedData)`,
   never the producer's internal state. This keeps the consumer's failure
   blast radius limited to the data we passed it.

The pattern IS a refinement of #10427's accessory-surface contract. The
producer's load-bearing path (e.g. returning a `PredictionResult`) does NOT
depend on the consumer's output, so silent failure is correct. The subscriber
gate prevents the cost of the call when no consumer is wired; the
`.catch(() => {})` prevents the consumer's failure from corrupting the
producer's path.

### Reference implementations

| Ship | Hook | Location | Notes |
|---|---|---|---|
| v1.49.810 | `onPredictions` 1st instance | copper `_emitPredictions` path | Establishes the shape: hook + subscriber gate + .catch() |
| v1.49.826 | `onPredictions` 2nd instance | selector `_emitPredictions` path | 2nd instance promoted the pattern under #10426 (second-instance rule) |
| v1.49.830 | `fallbackProvider` 1st instance | copper `ActivationContext` | Cross-rootdir variant (src/ ↔ .college/); same 5-element shape |
| v1.49.832 | `fallbackProvider` 2nd instance | selector `ActivationContext` | Co-located with `onPredictions` — PAIR pattern |

### PAIR co-location refinement

At v830 + v832, BOTH `onPredictions` and `fallbackProvider` are present on
the same surface, fire from the same producer code path, and share the same
catch block. The PAIR co-location is a meaningful refinement — when a surface
has multiple subscriber-gated hooks, sharing the catch block reduces
boilerplate and prevents per-hook error-handling drift.

```typescript
// PAIR co-location: both hooks share one try/catch.
try {
  if (this.ctx.onPredictions !== undefined && predictions.length > 0) {
    Promise.resolve(this.ctx.onPredictions(currentSkill, predictions)).catch(() => {});
  }
  if (this.ctx.fallbackProvider !== undefined && predictions.length === 0) {
    Promise.resolve(this.ctx.fallbackProvider(currentSkill)).catch(() => {});
  }
} catch {
  // Both hooks are observability-only; producer continues regardless.
}
```

### How to apply

When adding a new subscriber-gated hook to a producer:

1. **Type it optional** on the context/options type. Document in the JSDoc
   that the hook is observability-only and that the producer ignores its
   return value.
2. **Apply the subscriber gate** — early-return or skip the call when no
   consumer is attached. The gate is structural, not vigilance.
3. **Wrap in `Promise.resolve(...).catch(() => {})`** even if the hook is
   synchronous — the wrapper normalizes async consumers and prevents
   future async migrations from corrupting the contract.
4. **Pass a derived two-argument shape** — not the producer's internal state.
5. **Co-locate with existing PAIR hooks** when adding to a surface that
   already has one — share the catch block.
6. **Add a test** that asserts the producer's load-bearing path returns
   normally when the hook throws.

### Anti-patterns

- **Hook called without subscriber gate** — every producer run pays the
  function-call cost even when no consumer is wired. The gate is a one-line
  check, not a performance optimization.
- **`await hookResult`** instead of fire-and-forget — turns the consumer
  into a load-bearing dependency. If the consumer hangs, the producer hangs.
- **Per-hook try/catch** when multiple hooks co-locate — boilerplate that
  drifts; one hook ends up missing the catch and a consumer's throw
  cascades into the producer.
- **Passing producer-internal references** through the hook — the consumer
  may mutate state the producer assumes is stable; the producer's
  load-bearing path becomes data-dependent on the consumer.

### Cross-reference

- **#10427** — This pattern IS a #10427 application; subscriber-gated hooks
  are a specific shape of accessory surface. #10437 documents the structural
  pattern; #10427 documents the broader silent-vs-loud contract.
- **#10426** — The second-instance rule promoted both `onPredictions`
  (v810→v826) and `fallbackProvider` (v830→v832) on their own; this
  codification unifies them into a single discipline rather than two parallel
  ones.
- **Cross-rootdir wire pattern (#10435)** — `fallbackProvider` is also a
  cross-rootdir wire instance. The hook shape is orthogonal to the rootdir
  partition; some subscriber-gated hooks cross rootdirs (fallbackProvider),
  others stay in-rootdir (onPredictions).

## Re-throw ProcessContextDenied from CLI swallow-catch (Lesson #10442)

**Codified at:** v1.49.847 (from v820 + v842 two-instance evidence).

When a CLI surface has a try/catch that absorbs ALL errors into structured
output (typically JSON for the user), the #10427 contract requires that
security denials propagate while operational errors are absorbed. The
implementation is one line at the top of the catch block:

```ts
try {
  await someSpawningOp();
} catch (err) {
  if (err instanceof ProcessContextDenied) throw err;
  // operational error: serialize to JSON and exit with code 1
  output({ error: String(err) });
  process.exit(1);
}
```

### Why this matters

A CLI catch that turns ALL errors into JSON output (including
authorization failures) defeats the #10427 load-bearing-fails-loudly rule.
The user gets `{"error": "ProcessContextDenied: ..."}` and the CLI exits
with code 1 — an operational-failure exit code, indistinguishable from a
normal CLI failure. Callers (other tools, CI pipelines, shell scripts)
cannot distinguish "authorization denied" from "command not found" from
"spawn failed."

Re-throwing the specific class restores propagation while preserving CLI
UX for non-security errors. The catch block still handles the normal
failure path; the security path bypasses it.

### Evidence (2 instances)

- **v1.49.820** — `src/git/branch-manager.ts`. First CLI surface to apply
  the pattern; the function has a swallow-everything wrapper for git
  failures, and the re-throw was added to let `ProcessContextDenied`
  propagate through the wrapper.
- **v1.49.842** — `src/cli/commands/terminal.ts`. CLI catch absorbing for
  UX; same pattern applied to a terminal-spawn surface.

### How to apply

When adding `ensureProcessAllowed` to a CLI surface that already has a
swallow-catch:

1. **Hoist** `ensureProcessAllowed` OUTSIDE the try block if possible
   (preferred per security-chokepoints anti-pattern guidance).
2. **If hoisting is structurally impossible** (the catch block wraps
   user-input → spawn-command translation), add
   `if (err instanceof ProcessContextDenied) throw err;` as the FIRST
   line of the catch block.
3. **Do not** add the re-throw lower in the catch block — it must precede
   any side-effecting error-reporting code so the load-bearing failure
   propagates before the catch block's accessory work begins.

### Forward-test trigger

Any future CLI command with a swallowing try/catch around a spawn that
needs to propagate authorization-class failures.

### Anti-patterns

- ❌ Letting `ProcessContextDenied` be JSON-serialized as an operational
  error. The CLI exit code reads as "command failed" rather than
  "authorization denied."
- ❌ Re-throwing AFTER `console.error` or `output()` calls in the catch
  block. The error-reporting code runs once for the denial and once again
  at the outer caller's catch — duplicate messages.
- ❌ Re-throwing `instanceof Error` (the parent class). That re-throws
  EVERY error, defeating the swallow-catch entirely; the catch block
  becomes a no-op.

### Cross-references

- **#10427** — parent discipline; this lesson is a specific shape of the
  load-bearing-vs-accessory contract.
- **#10437** — subscriber-gated observability-only context-hook; sibling
  shape (different surface class, same parent contract).
- **Security chokepoints** — the `ensureProcessAllowed` placement guidance
  is the structural prerequisite for the re-throw shape.

## Lesson reference

- **#10427** — Forensic/dashboard/observability surfaces fail silently; load-bearing surfaces fail loudly. v799–v801 three-instance candidate, promoted at v802.
- **#10437** — Subscriber-gated observability-only context-hook pattern. v810 + v826 (`onPredictions`) + v830 + v832 (`fallbackProvider`) four-instance evidence set, promoted at v840 as a refinement of #10427's accessory-surface contract.
- **#10442** — Re-throw `ProcessContextDenied` from CLI swallow-catch. v820 + v842 two-instance evidence, promoted at v847 as a refinement of #10427's load-bearing-fails-loudly rule.
