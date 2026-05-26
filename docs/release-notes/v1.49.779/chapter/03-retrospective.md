# Retrospective — v1.49.779

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Fifth instance. Three back-to-back counter-cadence ships (v777, v778, v779) at 1-milestone intervals validate the Wave-N pattern: one deep sweep produces the queue, then operator-driven Wave-N ships drain it. The cadence-interval shrinks to 1 when the trigger is a pre-itemized queue.
- **Atomic-commit-per-logical-fix.** Five separate commits for the five HIGH fixes, plus one release commit + post-ship RH refresh. Per-fix commit messages cite the specific tier finding for traceability.
- **Pre-itemized queue tracked in working-tree-only file.** The `.planning/REVIEW-2026-05-26-FULL-CODEBASE.md` ledger gets a per-finding status update each Wave ship. Future Waves diff against it to pick scope; the same ledger survives across counter-cadence ships without growing git history.

## What Worked

- **Three different test-quality fix patterns landed in one ship.** Test HIGH 1 needed an architectural change (FeedbackBridge.flushPending API) because the root cause was sync-emit + fire-and-forget async. Test HIGH 2 needed only a test-fixture change (write the state file directly). Test HIGH 3 needed source-of-truth promotion (read-guard) + new sterile-env test files for all 3 hooks. Each got its own commit; each fix matched the actual root cause rather than just sleeping less.
- **Pre-fix test-quality runtime measured.** feedback-bridge.test.ts dropped from ~700ms to 154ms — concrete win that closes both the flake hazard AND the slow-test slowdown on every dev iteration.
- **Hook source-of-truth audit surfaced read-guard's deploy-only existence.** A latent "this hook vanishes on fresh clone" bug, discovered while gathering material to fix the zero-tests issue. Both got fixed in one ship.
- **Response-scan hook fired on its own test fixtures during authoring.** Meta-trigger: the test cases pin patterns like `"ignore previous instructions"`, the test file gets written to disk by the Write tool, the response-scan hook scans the response, finds the patterns, emits an advisory. Expected and benign (advisory-only, no block). Validates that the hook works on real-world inputs.

## What Could Be Better

- **The .claude/hooks/ vs project-claude/hooks/ relationship is still partially manual.** install.cjs doesn't cover gsd-{read,prompt,response}-* — the only sync path is manual `SC_SELF_MOD=1 cp` between source and deployed. A future ship should either extend install.cjs to cover these hooks or formalize the manual-sync as the canonical pattern (with a documented `npm run sync-hooks` wrapper).
- **`flushPending()` is now public API but undocumented in the bridge's interface.** A future small follow-up should add a `Promise<void>` JSDoc + maybe a section in the FeedbackBridge module-level doc. Low priority.
- **The Wave 3 fix didn't touch the 4 advisory MEDIUMs / 3 LOWs.** The v777 sweep's full output included these; this Wave only scoped HIGHs. Next risk-tier sweep should re-itemize the MEDIUMs/LOWs with current line numbers — some may have decayed.
- **Tier E architecture HIGHs (cli.ts dispatcher / Store-Registry-Manager dedup / LoaderContext) remain unaddressed.** Those need a forward-cadence architecture pass, not a counter-cadence wave. Worth a discussion before next sweep about whether to schedule one.

## Decisions

- **`flushPending()` exposed on FeedbackBridge as public API, not test-only helper.** Alternative considered: keep the chained promise internal + add a test-only `__pending` field. Rejected: the public API is also useful to production callers wanting at-least-once delivery before a process-exit or a shutdown sequence. No reason to keep it test-only.
- **Pre-expired state-file write for operation-cooldown, not fake timers.** vitest's `vi.useFakeTimers` + `vi.setSystemTime` works for `Date.now()` calls but the cooldown test ALSO uses real fs operations (mkdtemp, writeFile) that don't go through fake timers — risk of subtle interaction. Writing the state file directly is the smaller, more obviously-correct fix.
- **Promote gsd-read-guard.js to project-claude/hooks/, not extend install.cjs.** Extending install.cjs to cover advisory hooks would be a separate refactor with its own test surface. Promoting the file is the minimum change that fixes the "vanishes on fresh clone" bug. install.cjs extension queued for a future cleanup ship.
- **28 test cases distributed 8/10/10 across the 3 hooks.** Each hook has its own `.test.sh` mirroring the sibling pattern (one file per hook). Single-file-with-all-three was considered but rejected — the existing pattern (one .test.sh per hook) is established by self-mod-guard.test.sh and git-add-blocker.test.sh; consistency wins.
- **No source-code changes to gsd-prompt-guard.js or gsd-response-scan.cjs.** Found pre-existing drift between project-claude/ source and .claude/ deployed copy of gsd-prompt-guard.js — left it for a future cleanup. The tests cover the current source-of-truth behavior; the deployed-copy drift is a separate concern.

## Surprises

- **`FeedbackBridge` had no internal state tracking in-flight writes at all.** Looked like an oversight rather than a deliberate design — the `start()/stop()` lifecycle was symmetric, but the per-emit fire-and-forget had no observability. Adding `pending` + `flushPending()` is purely additive (no behavioral change for existing callers).
- **The response-scan hook fired multiple times during this session as a side-effect of writing the test files.** Each Write triggered a PostToolUse scan of the response (which echoes the file contents), the scan found the injection-pattern fixtures, and emitted an advisory. None blocked. A reminder that DLP hooks scan everything indiscriminately by design — including legitimate documentation OF injection patterns.
- **`gsd-read-guard.js` was deployed-but-never-tracked.** No git history for it ever. The hook itself had been working in this developer's environment for months, but a fresh clone would not have it. This kind of latent "works only on the original machine" drift is exactly what a periodic risk-tier sweep should catch — and did, retroactively, at v1.49.777.
- **Three back-to-back counter-cadence ships at 1-milestone intervals is fine.** The engine doesn't care; no NASA-cadence claims are made; no SCAFFOLD-PENDING obs increment. Trigger-driven cadence is qualitatively different from passive-accumulation cadence and the lessons file captures the distinction.

## Lessons Learned

See `04-lessons.md`.
