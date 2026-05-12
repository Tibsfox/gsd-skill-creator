# 04 — Lessons: v1.49.639 Housekeeping Cluster #6

## Summary

**4 forward lessons emitted** (#10199 through #10202) + **1 lesson update** (#10197 disconfirmation).

## Lesson #10199 — Multi-cluster carry-forward chains can encode framing errors

### Statement

When a carry-forward routes from cluster N to cluster N+1 to cluster N+2 to ... cluster N+k without closure, the framing of the underlying problem may have an error that no single cluster's investigation catches. The error compounds: each cluster inherits the predecessor's framing assumptions and routes forward with the same error embedded.

### Source incident

v1.49.634 → v1.49.638 carried "self-mod-guard CI install gap" through 5 clusters. Each cluster's W0 inherited the framing "the hook fails in CI"; investigations focused on hook behavior, install pipeline, and runtime-environment substrate dimensions.

v1.49.639 C1 investigation produced a definitive null result: zero TRACE output in CI despite full instrumentation. Investigation revealed the actual mechanism: tests at `tests/integration/v1-49-634-meta-test.test.ts:116/135` use `it.runIf(HOOK_AVAILABLE)` skip-guard pattern; in CI where hook is gitignored (`.gitignore:9`), tests gracefully skip. The "failing tests" were not actually failing in current CI runs; they had been skip-guarded since some prior commit.

The framing error: "CI install gap" framed the problem as installation/environment. Actual mechanism: "test precondition gap with skip-guard resolution". Different categories of issue with different fix shapes.

### Mitigation

For any carry-forward routing through 3+ clusters without closure:

1. **W0 mechanical re-verification** — before authoring the next cluster's component spec, mechanically verify the CF is still open. Specifically: do the failing-test markers referenced by the CF still exist? Do they still fail locally? Do they still fail in CI? If any are green, the CF may already be closed.

2. **Re-framing review at the 4th cluster** — formal W0 step: "could the framing be wrong?" Surface alternative framings (precondition vs behavior, install vs runtime, environmental vs code-substrate). One of the alternatives may be the actual mechanism.

3. **Closure-verification gate** — at v1.49.640 mission-package authoring time, propose adding a "closure verification" mechanical step at every CF routing decision: not just "is this still relevant?" but "does the failing state still exist?".

### Apply-to-self check

This lesson itself should be applied at v1.49.640 W0 to verify CF-7 (Security Audit npm audit failure) is still failing before authoring the cluster's component spec. If `@mistralai/mistralai` is no longer flagged (removed from deps) or the advisory is downgraded, the CF may close trivially.

### Forward applicability

- Any future N-cluster CF chain
- Bayesian discipline: when evidence keeps NOT supporting a hypothesis after multiple cycles, the hypothesis itself may be wrong

## Lesson #10200 — Hook PreToolUse instrumentation doesn't fire on vitest-internal subprocesses

### Statement

Claude Code's PreToolUse hooks intercept tool calls Claude makes (Write, Edit, MultiEdit, Bash). They do NOT fire on subprocess invocations from vitest tests. Vitest spawns Node directly via `spawn`/`spawnSync`/`exec`; those invocations bypass the Claude Code tool layer entirely.

### Source incident

v1.49.639 C1 instrumented `self-mod-guard.js` with CI-gated TRACE blocks. Local sanity check confirmed traces fired correctly when hook was invoked via `node project-claude/hooks/self-mod-guard.js`. CI run produced ZERO TRACE markers despite `GITHUB_ACTIONS=true` being set.

Investigation: vitest tests at `tests/integration/v1-49-634-meta-test.test.ts:116/135` invoke the hook via `spawnSync('node', [HOOK_PATH], ...)` — but those tests were skip-guarded in CI (`HOOK_AVAILABLE` is false). No other CI test path exercises the hook subprocess. So no TRACE output.

### Mitigation

When designing tests that assert hook behavior:

1. **Subprocess-invoke explicitly** — `spawnSync('node', ['.claude/hooks/<name>.js'], { input: JSON.stringify(...) })` — the hook must be invoked as a subprocess, not relied on to fire automatically
2. **Skip-guard the test for environment portability** — if the hook is gitignored, use `it.runIf(existsSync(HOOK_PATH))` so CI gracefully skips
3. **Don't expect the hook to fire on test setup** — the test must explicitly invoke; vitest's lifecycle hooks (beforeEach / afterAll / etc.) won't trigger PreToolUse

### Forward applicability

- Any future hook test design
- Forward note for Cluster #7+ if CF-7 (Security Audit) work involves hook-related diagnostics

## Lesson #10201 — git-add-blocker false-positives on compound commit commands

### Statement

The project's `git-add-blocker.js` hook (introduced at v1.49.585 C02) parses the bash command string to identify path arguments. Compound commands with multi-line bodies (heredocs, parens, embedded strings) can produce false-positives where the hook misclassifies content from the body as a path argument.

### Source incident

During v1.49.639 C3 and C6 commits, two attempted `git add ... && git commit -m "..."` compound commands were blocked by git-add-blocker. The hook's error message showed it had captured part of the commit body as the "Path" argument — once a heredoc body, once a commit body containing `(ii)` paren reference.

Workaround: split the compound command. `git add <file>` alone, then `git commit -m "..."` separately. Both succeed.

### Mitigation

For commit operations with multi-line or paren-containing commit bodies:

1. **Split git-add and git-commit into separate commands** — don't compound them with `&&`
2. **Avoid heredoc-style bash in commit messages when using compound commands** — use simple double-quoted strings if compounding
3. **Forward improvement candidate:** add adjacency-check to git-add-blocker.js parsing per CF-4 / C2 audit-method-corrections discipline. The hook's parsing assumes a single-line "git add <args>" shape; multi-line and paren-containing args need explicit handling.

### Apply-to-self check

This lesson can be added to `docs/test-discipline/audit-method-corrections.md` as §2.5 (compound-command path arguments) at a future cluster. The pattern is "hook-parsing assumes single-form input but reality has multiple forms" — exactly the class §2.4 discipline addresses.

### Forward applicability

- All commit operations with non-trivial bodies
- git-add-blocker improvement at v1.49.640+ if Cluster #7 has bandwidth

## Lesson #10202 — gh CLI background-task git-discovery quirk

### Statement

The `gh` CLI tool, when invoked from a background-task context (Bash with `run_in_background=true`), can fail with "fatal: not a git repository" even when invoked from inside a git repo. Symptom: git-discovery permission errors on `/etc/gitconfig`; fall through to "filesystem boundary not crossed" error.

### Source incident

v1.49.639 C1 Stage 2 used `Bash(sleep 240 && gh run list ...)` with `run_in_background=true` to wait for CI completion + check status. The background task completed but the output file was empty — `gh run list` had failed with the git-discovery error.

When the same command was run in foreground (without `run_in_background=true`), it worked correctly. The difference: foreground inherits cwd + env from the agent context; background may have stripped or redirected something gh needs.

### Mitigation

When using `gh` CLI in background tasks:

1. **Use explicit `--repo <owner>/<name>` arg** — `gh run list --repo Tibsfox/gsd-skill-creator --branch dev` works in any context
2. **Test the command in foreground first** — verify it produces expected output
3. **Use foreground + Monitor for waits** — instead of `Bash(sleep + gh, run_in_background=true)`, use foreground polling or skip the wait entirely (just check status manually)

### Forward applicability

- Any future background-task gh CLI invocation
- Forward improvement candidate: document the `--repo` requirement in any project tooling that uses gh CLI

## Lesson #10197 update — runtime-environment-substrate hypothesis disconfirmed

### Statement

The CF-3 promotion candidate framing at v1.49.638 hypothesized that the v1.49.634 self-mod-guard CI gap surfaced a distinct "runtime-environment substrate" dimension (env vars / $PATH / cwd / perms) worth promoting Lesson #10197 to Meta-Lesson alongside #10180 fixture-scope substrate.

v1.49.639 C1 investigation (Path A in-hook tracing at commit `9aeed0a7c`) revealed the actual mechanism:

1. Hook is NOT invoked in CI test runs (zero TRACE markers despite full instrumentation under `GITHUB_ACTIONS=true`)
2. The "failing tests" at `tests/integration/v1-49-634-meta-test.test.ts:116/135` use `it.runIf(HOOK_AVAILABLE)` skip-guard pattern
3. In CI, `HOOK_AVAILABLE` is false (hook gitignored at `.gitignore:9`; CI doesn't run install); tests gracefully skip
4. The "divergence" is in FILE PRESENCE (code-substrate) not in env vars / $PATH / cwd / perms (runtime-environment)

Per operator decision via AskUserQuestion at v1.49.639 C5: classify divergence dimension as `code-substrate`. The runtime-environment-substrate hypothesis is NOT validated.

**Lesson #10197 stays as a regular lesson** framing pipeline-position constraints in mission-package specs. The runtime-environment-substrate generalization is unwarranted; the actual mechanism is well-explained by Lesson #10180 (skip-guard discipline for environment-conditional preconditions).

CF-3 status: **CLOSED with disconfirmation**.

Future investigation: if a future incident DOES surface a clear env-var/$PATH/cwd root cause, revisit promotion at that incident's retro. The CF-3 routing decision tree from v1.49.639 C5 design check (`.planning/c5-meta-lesson-decision-tree-design.md`) remains a useful template (promote / disconfirm / defer per dimension).

## Cumulative lesson count

| Range | Description | Count |
|---|---|---|
| #10180 | Meta-Lesson — fragile-test discipline (audit underestimates fixture scope) | 1 |
| #10181-10186 | v1.49.636 cluster | 6 |
| #10187-10192 | v1.49.637 cluster | 6 |
| #10193-10198 | v1.49.638 cluster | 6 |
| #10199-10202 | **v1.49.639 cluster (this milestone)** | 4 |
| Total | | 23 |

(Counts approximate; actual lesson IDs may have gaps.)

## Apply-to-self meta-check

The newly-codified Lesson #10199 (multi-cluster framing-error) should be applied prospectively at v1.49.640 W0 against CF-7 (Security Audit npm audit failure) to verify the failing state still exists before authoring the cluster's component spec.

The newly-codified Lesson #10201 (git-add-blocker compound-command false-positive) should be considered as input for git-add-blocker improvement work at Cluster #8 or later.

## See also

- `05-carry-forward.md` — Cluster #7 inventory + closure-verification gate proposal
- `99-context.md` — cross-references
- `docs/SUBSTRATE-PROBE-DISCIPLINE.md` §2.4 (audit-method-corrections discipline introduced this milestone)
- `docs/test-discipline/audit-method-corrections.md` (companion inventory)
