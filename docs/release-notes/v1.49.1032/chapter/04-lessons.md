# v1.49.1032 — Lessons

No new manifest lesson is promoted this ship. Several established lessons
are applied, one with a newly documented Rust variant.

## Applied (existing lessons)

- **#10427 (security denials are load-bearing; never swallow
  `*ContextDenied`)** — applied with a documented **Rust variant**:
  Result-channel sites propagate denial through their existing error path
  with gates hoisted above swallowing handlers, while detector-shaped sites
  (`Option`/`bool` returns) fail closed to unavailability with the audit
  record carrying the denial signal — Rust cannot propagate a typed error
  through an infallible signature without caller-rippling changes, and
  fail-closed + audited preserves the lesson's intent (the denial is never
  silent; the sink sees every attempt). Documented in the module header and
  `docs/security-chokepoints.md`.
- **#10414 (optional-ctx is the cheapest retrofit)** — translated:
  the Rust analogue of "callers pass `undefined` = legacy permissive" is
  "no `OnceLock` policy installed = legacy permissive". Zero behavior change
  until opt-in, exactly like the TS rollout.
- **#10417 (audit harness as vitest test, not CLI)** — the drift-guard is a
  vitest test over committed Rust source text (the
  `acl-reconciliation-audit.test.ts` house pattern), reaching pre-tag-gate
  and every CI leg; the cargo lane is CI-only and cannot gate.
- **#10449 (audit target accuracy)** — gates record the actual executable
  (`tmux`, `git`, `kill`, `node`, `bash`, the dynamic MCP stdio command, the
  pty shell) and the argv built once where needed so the audit sees exactly
  what spawns — three wires were tightened pre-review when the gated argv
  was a subset of the spawned argv.
- **Verify judge-suggested fixes before applying (v1029 ship-review v2
  discipline)** — the step P finding was real; its suggested regex fix was
  not (char-literal pattern vs Rust lifetimes). Fix applied was a
  string-aware scanner with a 4-case self-test.

## Process notes

- **Exit-code masking via `tail` reached its second surface**: v1031 found
  it on the gate run; this ship hit the same shape on a background
  `npx vitest run ... ; echo; tail` compound where the task reported exit 0
  from `tail` while 1 test had failed. Standing form: capture `$?`
  immediately after the command of interest, never after a pipeline/compound
  tail. Two surfaces in two consecutive ships — promotion candidate if a
  third surface appears.
- A line-comment stripper over a language with string literals must be
  string-aware or it fails toward silent undercount — the dangerous
  direction for a guard. Fail-open (over-count → loud test failure) is the
  correct error direction for guard tooling.
