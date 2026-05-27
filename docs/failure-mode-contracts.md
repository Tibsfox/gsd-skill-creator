# Failure-Mode Contracts Discipline

**Surface:** Designing a new surface (function, module, CLI flag, skill prompt section, hook) where the asymmetric cost of silent vs loud failure is in play; reviewing an existing surface that has been emitting either spurious user-facing errors or invisible silent degradations.

**Codified at:** v1.49.802 (lesson cluster from v1.49.799 audit log + v1.49.800 watch loop + v1.49.801 `/sc:status` Step 5.5 — three independent instances of best-effort-silent failure contracts in one chained session).

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

## Lesson reference

- **#10427** — Forensic/dashboard/observability surfaces fail silently; load-bearing surfaces fail loudly. v799–v801 three-instance candidate, promoted at v802.
