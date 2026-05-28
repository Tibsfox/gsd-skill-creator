# Security Chokepoints

**Surface:** Tier-E security chokepoints — three sibling modules with a shared shape that gate filesystem reads, network egress, and child-process spawn behind an optional `ctx?` parameter.

**Codified at:** v1.49.782 (LoaderContext, first instance); v1.49.806 (EgressContext + ProcessContext, second and third instances; this doc); v1.49.847 (extended with Lesson #10441 DI-executor + tokenized-argv wire shape from v825 + v843 three-instance evidence).

## What this doc catalogs

Three Tier-E security chokepoints share a common shape — optional `ctx?` parameter, allow-list pattern matching, audit-sink emission, `*ContextDenied` error on rejection — but specialize their targets:

| Chokepoint        | Target type           | Audit-op tags                                    | Reference impl                              | Audit harness                                            |
|-------------------|-----------------------|--------------------------------------------------|---------------------------------------------|----------------------------------------------------------|
| `LoaderContext`   | filesystem path       | `read-file`, `read-dir`, `exists-check`, ...     | `src/security/loader-context.ts`            | `src/security/loader-context-audit.test.ts`              |
| `EgressContext`   | URL                   | `fetch`, `fetch-stream`, `websocket-open`, ...   | `src/security/egress-context.ts`            | `src/security/egress-context-audit.test.ts`              |
| `ProcessContext`  | command + argv        | `spawn`, `exec`, `exec-file`, `fork`, ...        | `src/security/process-context.ts`           | `src/security/process-context-audit.test.ts`             |

All three are exported from `src/security/index.ts` and follow the same call shape:

```ts
ensureAllowed(ctx, source, op, target [, note]);          // LoaderContext
ensureEgressAllowed(ctx, source, op, url [, note]);       // EgressContext
ensureProcessAllowed(ctx, source, op, command, argv?, note?);  // ProcessContext
```

## Why the chokepoints exist

The project hosts ~700 src/ TypeScript modules that historically had unrestricted access to the filesystem, the network, and the process table. Security review at v1.49.782 surfaced that the easiest place to introduce a chokepoint is at the SHARED helper that wraps the risky operation — not at every call site. The optional-`ctx?` pattern (see `docs/architecture-retrofit-patterns.md` Lesson #10414) makes the chokepoint additive: existing call sites continue to work unchanged; new call sites adopt the chokepoint without breaking siblings.

The three chokepoints converge on the same three operational states:

1. **`undefined` ctx → legacy permissive mode** — zero call-site churn, audit-bypass. Existing call sites stay on this state until migrated.
2. **`defaultEgressContext()` / `defaultProcessContext()` / `defaultLoaderContext()` → audit-only mode** — all operations admitted, all attempts logged. Security-conscious callers use this during rollout to gather data before tightening.
3. **Restricted ctx → enforced mode** — allow-list checked, denials throw a typed `*ContextDenied` error. Production deployments use this for hard enforcement.

## When to use which

| You want to ...                                            | Use ...                  |
|------------------------------------------------------------|--------------------------|
| Read bytes from disk (yaml/json/text/binary)               | `LoaderContext`          |
| Issue an outbound HTTP/HTTPS request                       | `EgressContext`          |
| Open a websocket or EventSource                            | `EgressContext`          |
| Spawn a child process (git, npm, tmux, native binaries)    | `ProcessContext`         |
| Read AND spawn in the same module                          | Accept both `ctx?` parameters |

Modules that touch multiple surfaces SHOULD accept multiple `ctx?` parameters with descriptive names (e.g. `loaderCtx`, `egressCtx`) rather than collapsing them into a single union — the surfaces have different allow-list semantics and different audit-op tags.

## Migration policy

Adding a new caller of any surface MUST satisfy ONE of:

1. **Wire the chokepoint** — accept `ctx?: <Context>` and call `ensure<Surface>Allowed(...)` before the side-effecting op. This is the default for new code.
2. **Declare exemption** — add a `Role: NOT a <surface> caller` header doc with a one-line justification. Use for: modules that emit code-as-strings for a different runtime (e.g. dashboard files that template browser-side `fetch(`), interface barrel files, type-only modules.
3. **Add to `KNOWN_UNWIRED`** — for grandfathered existing call sites that have not yet been migrated. The audit test will track-don't-fail, so the operator-facing list of migration debt is the allowlist itself.

Each chokepoint's audit test enforces this contract at vitest time (which is gated by pre-tag-gate).

## How to migrate a `KNOWN_UNWIRED` entry

1. Add `ctx?: <Context>` to the public function/method signature. Default to `undefined`.
2. Call `ensure<Surface>Allowed(ctx, MODULE_SOURCE, op, target, note?)` BEFORE the risky operation. Place the call OUTSIDE any try/catch that swallows errors (security denials must propagate per the failure-mode-contracts discipline — see `docs/failure-mode-contracts.md`).
3. Remove the file from the audit test's `KNOWN_UNWIRED` set.
4. Run `npx vitest run src/security/` to confirm the audit accepts the migration.
5. Existing callers of the function continue to work unchanged (they pass no `ctx`).

The migration is incremental — one file at a time, one ship at a time. There is no requirement to migrate the entire `KNOWN_UNWIRED` set in a single sweep.

## Internal-helper pattern for `ctx?` threading (Lesson #10433)

When migrating a file with MANY spawn / fetch / read call sites, look for an **internal helper** that already wraps the side-effecting operation. Threading `ctx?` through the helper costs `1 LOC + helper-update` regardless of how many public callers exist; threading it through each public function costs `N LOC + N call-site updates`.

| Ship | File | Spawn-call multiplicity | Internal helper? | Wire shape |
|---|---|---|---|---|
| v1.49.809 | `src/intelligence/analyzer/git.ts` | many | Yes (`execGit`) | thread `ctx?` through helper; public functions pass it down → ~14 LOC delta |
| v1.49.820 | `src/git/core/branch-manager.ts` | 10 calls + 1 helper | Yes (`execGit`) | thread `ctx?` through helper; 4 public functions threaded; 10 call-site updates → 14 LOC delta |

Files **without** an internal helper require N `ensure*Allowed` hoists at N call sites. If a file has 10 spawn calls and no helper, the wire cost is ~10× higher than a file with one.

**Implication for batch-chip planning:**

1. When sizing a batch chip (e.g., v819 aminet 5-file batch, v825-candidate git/core 3-file batch), audit each candidate file for an internal helper FIRST.
2. Prefer batches where most files share the helper pattern — wall-clock cost is then `~1 LOC × N files` rather than `~10 LOC × N files`.
3. Files WITHOUT a helper are still chip-eligible but typically take a full single-file ship rather than fitting into a batch.

The pattern is observed at 2 instances (v809 + v820); promotion threshold per #10426 (cross-class registry extraction at 2nd instance) met at v820. Generalization candidate confirmed in v1.49.823 handoff.

## DI-executor + tokenized-argv wire shape (Lesson #10441)

**Codified at:** v1.49.847 (from v825 + v843 three-instance evidence).

When a module exposes a factory that accepts an optional injected executor
for testability — and the default executor takes a free-form `cmd` string —
the ProcessContext wire pattern specializes #10433's internal-helper shape:

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
    return execSync(cmd, { encoding: 'utf8' }) as string;
  };
  return new SomeManager(executor || defaultExecutor);
}
```

Five structural properties define the shape:

1. **Optional `ctx?: ProcessContext`** as a positional factory parameter.
2. **The default executor closes over `ctx`** — the security check runs
   ONLY on the default-executor path.
3. **Injected executors are NOT wrapped** — caller-injected security is
   the caller's responsibility (test mocks; production custom-executor
   patterns).
4. **The cmd string is tokenized** to extract executable + argv for the
   allow-list check and audit record.
5. **The default executor IS the internal helper** from #10433 — `ctx`
   threads through it once and applies to all calls through it.

### Evidence (3 instances)

| Ship | File | Notes |
|---|---|---|
| v1.49.825 | `src/git/core/repo-manager.ts` | First instance; established the shape. |
| v1.49.843 | `src/mesh/mesh-worktree.ts` | Second instance; mesh family. |
| v1.49.843 | `src/mesh/proxy-committer.ts` | Third instance; mesh family. |

### When to use this shape vs. the spawn-call shape

- Use **DI-executor + tokenized-argv** when the file exposes a factory
  with an executor injection point. The wrap happens once at the executor,
  not at each call site.
- Use the **spawn-call wrap** (#10433 internal-helper proper) when the
  file has a single internal helper that all spawn calls flow through but
  no executor-injection seam.
- Use the **per-callsite wrap** when neither helper nor executor seam
  exists. Highest cost; only appropriate for low-spawn-count files.

### Anti-patterns

- ❌ **Wrapping the injected executor.** Defeats the test-injection
  contract; mocks built by tests get unexpectedly gated by ProcessContext.
- ❌ **Splitting cmd on `' '` without trim.** Leading or trailing
  whitespace produces empty argv entries; the allow-list match fails or
  audits a malformed exe-name.
- ❌ **Calling `ensureProcessAllowed` from the factory body, not the
  default executor.** The check runs once at factory time rather than on
  every spawn — bypassing it for every call.

### Cross-references

- #10433 — parent discipline; DI-executor is a sub-class of the
  internal-helper pattern.
- #10414 — optional `ctx?` parameter; the DI-executor shape uses this
  pattern at the factory boundary.
- #10427 — failure-mode contracts; the `ensureProcessAllowed` call sits
  at the function root of the default executor, OUTSIDE any swallow-catch.

## Anti-patterns

- ❌ **Calling `ensure*Allowed` inside a try/catch that swallows errors.** The chokepoint denial is a load-bearing signal and must propagate. The fix: hoist the `ensure*Allowed` call OUT of the try block.
- ❌ **Reusing one chokepoint's source as the source for a different surface.** Cross-class semantic dishonesty compounds per `docs/architecture-retrofit-patterns.md` Lesson #10426. The three chokepoints are siblings with the same shape but their allow-lists are NOT interchangeable.
- ❌ **Required-from-day-one chokepoint parameters.** Forces breaking changes across N call sites before any rollout signal returns. The optional-`ctx?` pattern is the cheapest retrofit for exactly this reason.
- ❌ **Pattern-matching against `path` for an egress call** (or vice-versa). URLs, paths, and commands all have different prefix-match semantics; the per-surface helper enforces the right one.

## Cross-references

- **Lesson #10433** — Internal-helper pattern for `ctx?` threading. When a file has an internal helper wrapping the side-effecting op, thread `ctx?` through the helper for `1 LOC × N callsites`; without a helper, the cost is `N LOC × N callsites`. Audit each batch-chip candidate for a helper first. Codified v1.49.824 from v809 + v820 case studies.
- **Lesson #10441** — DI-executor + tokenized-argv wire shape for ProcessContext. When a module exposes a factory with an optional injected executor for testability, the default executor closes over `ctx?`, tokenizes the cmd string to extract executable + argv, and calls `ensureProcessAllowed` before delegating. A sub-class of #10433: the default executor IS the internal helper. Codified v1.49.847 from v825 + v843 three-instance evidence.
- **Lesson #10414** — Optional `ctx?` parameter is the cheapest retrofit pattern for chokepoint introduction. `docs/architecture-retrofit-patterns.md`.
- **Lesson #10426** — Extract per-class registries at the SECOND class instance. The three chokepoints are themselves the validating instance set for the discipline — they are siblings with the same shape but specialized targets, not parameterizations of a generic abstraction (per #10423, the lightest wire that satisfies the verdict).
- **Lesson #10427** — Failure-mode contracts. Security chokepoint denials are load-bearing and must propagate; do not swallow `*ContextDenied` exceptions. `docs/failure-mode-contracts.md`.
- **Lesson #10417** (audit test as gate) — The audit harness is a vitest test, not a CLI tool. This gives free integration with the existing CI / pre-tag-gate pipeline and avoids a second observability surface (per #10422, surface separation).

## Reference: surface counts at v1.49.806

| Surface          | Total src/ ts files in scope | Wired through chokepoint | Grandfathered (`KNOWN_UNWIRED`) | Exempt (string-template / interface) |
|------------------|------------------------------|--------------------------|---------------------------------|--------------------------------------|
| LoaderContext    | ~10 (filename-matched)       | majority                 | none — wired at v782 ship       | 1 (self)                             |
| EgressContext    | ~22 (behavior-matched)       | 1 (osv-client)           | 16                              | 5 (dashboard string-emitters) + 1 self |
| ProcessContext   | ~39 (behavior-matched)       | 1 (dry-run-gate)         | 38                              | 1 (self)                             |
