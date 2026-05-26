# Lessons — v1.49.779

5 lesson candidates from the Wave 3 review-remediation ship. Concrete lesson IDs assigned by the in-cycle retrospective tracker.

1. **Wave-N counter-cadence pattern fully validated at 3 instances.** Lesson #10168 framed counter-cadence as productive every ~30 forward milestones. The v777-v778-v779 trio validates a Wave-N sub-pattern within a single counter-cadence arc: one deep risk sweep (v777 itself) produces an itemized queue; subsequent Wave-N ships drain the queue in tight cadence (1 milestone each). Three ships at 1-milestone intervals is healthy when the trigger is a pre-itemized queue. The shape is reusable: any future risk sweep that produces a multi-tier finding queue can be drained the same way.

2. **Fire-and-forget event-handler test pattern.** When a synchronous `bus.emit` triggers an async handler (the handler stores its work in fire-and-forget Promise form), the test cannot deterministically `setTimeout` for the right wait — slow CI runners drift, fast ones waste time. The deterministic shape: expose a `pending` chained-promise field on the consumer + a `flush()` method that awaits drainage. Captured in `FeedbackBridge.flushPending()` at `src/observation/feedback-bridge.ts`. Reusable for any SignalBus / EventEmitter / pub-sub integration where the handler's async work matters to test outcomes.

3. **Skip-the-wait-with-pre-expired-state.** When a test needs "X time has elapsed" semantics against an externally-stored timestamp (state file, database row, in-memory mtime), the correct shape is to write the state directly with a sufficiently-old timestamp rather than sleeping. Avoids real-time waits without needing fake-timer scaffolding. Validated at `operation-cooldown.test.ts`. Pattern: stamp the storage with `new Date(Date.now() - 2 * COOLDOWN_MS).toISOString()` and check.

4. **Hook source-of-truth audit pattern.** Any `.claude/hooks/*.js` or `.claude/hooks/*.cjs` MUST have a corresponding source under `project-claude/hooks/`. Without it, the hook lives only at the gitignored runtime location and vanishes on a fresh clone of the repo. Audit shape: `for f in .claude/hooks/*.{js,cjs}; do test -f project-claude/hooks/$(basename $f) || echo "ORPHAN: $f"; done`. Worth converting into a pre-tag-gate step at next sweep. Discovered at v779 for `gsd-read-guard.js` (had only ever existed as a deployed orphan, working but un-tracked).

5. **Module-level regex cache for hot-path-compiled patterns.** Any code calling `new RegExp(userPattern)` inside a `.some()` / `.filter()` / `.forEach()` body on a hot path should hoist the compile to a module-level `Map<string, RegExp>` (or `Map<string, RegExp | null>` if the pattern source is untrusted and may throw at construction). The keying-by-raw-pattern guarantees `O(1)` lookup per call rather than `O(N×M)` regex construction. Validated at `findByTrigger` in `src/storage/skill-index.ts`. Likely recurs at other "compile pattern per row" sites; worth a one-shot grep across the codebase in a future ship.

## Anti-patterns surfaced

- **`new Promise(r => setTimeout(r, 50))` to wait for fire-and-forget async I/O.** Looks like "give the async work a moment" but actually means "hope it finishes within 50ms." Slow runners flake. Fix the testability of the consumer (expose drainage), not the wait time.
- **Vec::new() then read_to_end for known-size file.** The grow-and-realloc cost on multi-MB reads is silent and easy to miss until profiling. Pre-size from metadata at every `read_to_end` site that reads a whole file.
- **Per-row regex compilation in a filter loop.** Every `.some(pattern => new RegExp(pattern).test(...))` is an O(N) compile-per-call where N is the pattern-list size. Hoist to a module-level cache.
- **Deployed-only `.claude/hooks/*` files.** Gitignored deployed copies without tracked source. Works on the developer's machine, vanishes on fresh clone.
- **387 lines of security logic with zero tests.** Even advisory-only hooks need regression coverage — a silent regression that breaks the advisory means the protection silently disappears.

## Forward gates (codified candidates)

| Gate | Mechanism | Triggered at |
|------|-----------|--------------|
| Hook source-of-truth audit | `for f in .claude/hooks/*.{js,cjs}; do test -f project-claude/hooks/$(basename $f) || echo ORPHAN: $f; done` | pre-tag-gate |
| Module-level regex cache | grep for `new RegExp(` inside `.some(`/`.filter(`/`.forEach(`/`.map(` callbacks; flag for hot-path review | Code review |
| Fire-and-forget event handler test | grep for `bus.emit(` or `emitter.emit(` followed by `await new Promise.*setTimeout` within 5 lines of a test file | New PR pre-merge |
| `Vec::new()` before `read_to_end` | clippy lint or grep for `Vec::new\(\)` within 3 lines of `read_to_end\(` in `.rs` files | New PR pre-merge |
| .test.sh per hook | new hook PR must include matching `__tests__/<hook-name>.test.sh` | New hook PR |

These gates would have caught the five HIGHs at PR time rather than waiting for the periodic full-codebase review.
