# Lessons — v1.49.778

5 lesson candidates from the Wave 2 review-remediation ship. Concrete lesson IDs assigned by the in-cycle retrospective tracker.

1. **Counter-cadence trigger class refines to a 4-class hierarchy.** Lesson #10168 framed counter-cadence as productive every ~30 forward milestones. v1.49.585 originated the cadence from accumulated social-rule debt (passive accumulation). v1.49.776 triggered from a script-bug cascade with public impact (reactive crisis). v1.49.777 triggered from a proactive full-codebase risk-tier sweep surfacing BLOCKERs. v1.49.778 triggered from the operator selecting a Wave scope out of the pre-itemized queue produced by the v777 sweep (planned remediation wave). The four classes form a hierarchy from purely-passive to purely-planned; counter-cadence interval shrinks as the trigger gets more deliberate (v585→v776 = 190 milestones, v776→v777 = 1, v777→v778 = 1). Tight cadence under a planned-wave trigger is healthy.

2. **Pre-itemized queue from a prior risk sweep cuts Wave-N execution time roughly in half.** v1.49.777 ran the discovery sweep (5-parallel sub-agents, ~12 min wall-clock) and produced 16+ HIGH findings with file paths. v1.49.778 opened by verifying all 10 chosen findings against the current codebase (5 parallel reads, ~2 min) — no re-discovery needed. The verification-then-fix loop scales to Wave 2 / Wave 3 / Wave N as long as the queue is recorded somewhere outside the conversation.

3. **Review-ledger-as-working-tree-artifact.** Committing review findings to git history (e.g. `docs/REVIEW-2026-05-26.md`) means they rot — every closed finding stays in history forever, every status-change adds a commit. Keeping the ledger in the gitignored `.planning/` tree as `REVIEW-2026-05-26-FULL-CODEBASE.md` solves both: future sessions Read it directly, status-changes are working-tree edits, and the file disappears from the user's git log entirely. Pattern is reusable for any longer-running multi-ship plan that needs status tracking.

4. **Shared-helper-extraction-from-copypasta — codified after obs#3.** Established this session at obs#3 cumulative (after `isCliEntrypoint` from v777 session arc + `WriteQueue` from v777 + `escapeRegExp` from v778). The pattern: identify N≥3 near-identical sites, extract a single canonical helper at a sensible co-location (not a new subsystem), sweep callers. Counter-patterns the "85 Store/Registry/Manager classes" sprawl finding by reducing the per-pattern surface area, not by adding more subsystems.

5. **Destructure-named-fields instead of unsafe-pointer-cast for split-borrow.** When the borrow checker rejects a method call that touches two non-overlapping fields of `&mut self`, the correct fix is `let Self { a, b, .. } = self` followed by `b.method(a.access())`, NOT `unsafe { &*(a as *const _) }`. The destructure proves disjointness to the compiler; the pointer cast is correct today but UB the moment someone adds a re-entrant path back into `self`. v778 swept this in mcp_host but the pattern likely recurs — worth a one-shot grep across the Rust codebase in a future ship.

## Anti-patterns surfaced

- **Per-ecosystem partial regex escape that misses underlying invariant.** When 5 sites each have their own `.replace(/[-]/g, '\\-')` or `.replace(/[@/]/g, ...)` pattern, the surface looks "handled" but the underlying invariant (every regex-meaningful character must be escaped) is silently absent. The right shape is one centralized `escapeRegExp` plus ecosystem-specific post-processing.
- **Silent-ALLOW on malformed input as a "safe" hook default.** "Default-permissive on bad JSON" sounds safe but means the hook silently disables itself under any hostile input. Fail-closed with override env vars is the right balance — operators with an explicit override pass; anyone else gets a structured block message.
- **`unsafe { &*ptr }` with an apologetic SAFETY comment as a borrow-checker workaround.** The comment is usually correct at the time of writing AND wrong six months later when someone adds a re-entrant call. Prefer language features (destructure, split_at_mut, etc.) over comments that assert non-overlap.
- **`fs.open` + work + `close` without try/finally.** Linear ordering of open / work / close means any throw between open and close leaks the FD. Same shape across walk.ts and commit.ts; likely recurs across the codebase. Worth a one-shot grep + sweep in a future Wave.
- **`format!`-built JS code with hand-rolled string escaping.** Single-quote replacement is not the same as JS string literal encoding; backslashes, double quotes, newlines, control chars all leak. Use `serde_json::to_string` for any Rust string that's about to be inlined as a JS string literal.

## Forward gates (codified candidates)

| Gate | Mechanism | Triggered at |
|------|-----------|--------------|
| Tauri webview command argument validation | Manual review of any `#[tauri::command]` that takes user-controlled `String` and uses it in a process / IPC / fs path | Code review |
| Hook fail-closed verification | `.test.sh` cases that pass malformed JSON and assert `decision: block` (unless override env set) | New hook PR |
| Centralized `escapeRegExp` for any user-input regex | grep for `new RegExp(` outside of test files; require `escapeRegExp(input)` on any interpolated user-controlled string | New PR pre-merge |
| Rust `expect()` in functions returning `Result` | Lint: `clippy::unwrap_used` + `clippy::expect_used` on `pub fn ... -> Result<...>` signatures | CI |
| `unsafe { &*ptr }` borrow-checker workarounds | Manual review of any `unsafe` block whose justification is "borrow checker won't accept" | Code review |
| FD-leak audit on `fs.open` callers | grep for `await fs.open(` without an enclosing `try` within 5 lines; flag | New PR pre-merge |

These gates would have caught the ten HIGHs at PR time rather than waiting for a periodic full-codebase review.
