# v1.49.3 — GSD-OS Desktop Polish

**Released:** 2026-02-27
**Scope:** GSD-OS desktop UX — terminal rendering, window capabilities, Claude-monitor runtime
**Branch:** dev → main
**Tag:** v1.49.3 (2026-02-27T04:58:57-08:00)
**Predecessor:** v1.49.2 — GSD-OS Indicator Wiring & TypeScript Fixes
**Successor:** v1.49.4
**Classification:** patch — desktop-first-run bug cluster
**Verification:** clean launch · terminal renders · window controls functional · all 3 indicators responsive

## Summary

**Five first-run bugs stopped GSD-OS users in the first thirty seconds.** v1.49.2 shipped indicator wiring but didn't exercise the actual launch path end-to-end. v1.49.3 ran a single manual launch test and uncovered a cluster of five independent failures: the terminal rendered blank because xterm.js was missing its CSS import, the window wouldn't drag because frameless windows in Tauri v2 need an explicit `core:window:allow-start-dragging` capability, the close and maximize buttons did nothing because those capabilities were also undeclared, the terminal creation could throw unhandled errors with no user-visible feedback, and the Claude monitor panicked at startup because `tokio::spawn` was used inside a Tauri `.setup()` closure that doesn't run under the tokio runtime. Each bug had a distinct root cause. Each fix was one line.

**Each fix maps cleanly to a single root cause.** Blank terminal → missing `@xterm/xterm/css/xterm.css` import. Window drag broken → missing Tauri v2 capability. Close button broken → missing Tauri v2 capability. Silent terminal failures → no try/catch around `createTmuxTerminal`. Monitor panic → `tokio::spawn` should have been `tauri::async_runtime::spawn`. The 1:1 symptom-to-fix mapping is what made this a single landable patch rather than a days-long debug session.

**Tauri v2's default-deny capability model caught all three permission gaps the right way.** In Tauri v1, a frameless window would drag and close by default; the capabilities existed but didn't need declaration. Tauri v2 flipped that to explicit allow: every window operation (drag, close, maximize, etc.) needs a capability entry or it silently no-ops. That's exactly the right security posture — it means untested UI paths fail loudly instead of granting unintended powers — but it also means the developer pays the full cost of discovering which capabilities their window actually uses. v1.49.3 paid that cost for the GSD-OS main window.

**The Claude-monitor panic was the most subtle bug.** `tokio::spawn` looks right in Rust async code, but Tauri's `.setup()` closure runs outside any tokio runtime, so calling `tokio::spawn` there panics with "there is no reactor running." The fix was a one-word change — `tokio::spawn` → `tauri::async_runtime::spawn` — but finding the right one-word change required tracing the panic backtrace through the Tauri runtime boundary. This is a Tauri v2 migration footgun worth documenting as a project convention.

**Terminal error handling caught the long tail of hidden failures.** Wrapping `createTmuxTerminal` with try/catch plus a user-visible error message and status-indicator fallback means the terminal can now fail on missing tmux, permission errors, or PTY setup problems without leaving the user staring at a blank window wondering what happened. It's defensive programming at exactly the boundary where the user's trust is most fragile — the first thing they try after launching the app.

## Key Features

| Area | What Shipped |
|------|--------------|
| Terminal rendering | Added `@xterm/xterm/css/xterm.css` import — terminal now renders with proper styles |
| Terminal reliability | Try/catch around `createTmuxTerminal` with user-visible error + indicator fallback |
| Window drag | Added `core:window:allow-start-dragging` Tauri v2 capability |
| Window close button | Added `core:window:allow-close` Tauri v2 capability |
| Window maximize button | Added `core:window:allow-toggle-maximize` Tauri v2 capability |
| Claude monitor runtime | Changed `tokio::spawn` → `tauri::async_runtime::spawn` in `monitor.rs` |
| Verification | GSD-OS launches cleanly, no panics · terminal renders + accepts input · drag/close/maximize functional · all 3 indicators responsive |

## Retrospective

### What Worked

- **Each fix maps to a single root cause.** Blank terminal = missing CSS import, window drag = missing Tauri capability, close button = missing capability, Claude monitor = wrong async runtime. Clean 1:1 mapping from symptom to fix.
- **Tauri v2 capability model caught permission gaps early.** The frameless window requiring explicit `allow-start-dragging` and `allow-close` capabilities is exactly the kind of thing that silently fails without the security model forcing explicit declarations.
- **One manual launch caught everything.** A single human-in-the-loop test exposed all five bugs. No clever automation needed — just run the app once and try to use it.
- **The panic backtrace pointed to the right fix.** Tauri's runtime boundary made the `tokio::spawn` → `tauri::async_runtime::spawn` correction discoverable from the stack trace alone.

### What Could Be Better

- **Five separate bugs from a single desktop launch.** These are all first-run issues that would have been caught by a single manual launch test before shipping v1.49.2. The indicator wiring in v1.49.2 was verified logically but not visually.
- **Logical verification ≠ end-to-end verification.** v1.49.2's test suite passed with 19,107 green. None of the tests exercised a live Tauri window launch. That's a gap worth closing for desktop releases.
- **Tauri v2 migration footguns are underdocumented.** The `tokio::spawn` vs `tauri::async_runtime::spawn` distinction isn't in the Tauri upgrade guide in a prominent place. A project-local MIGRATION-NOTES document could save the next developer.
- **Frameless windows trade chrome for capability bookkeeping.** The decision to ship GSD-OS with a frameless window (cleaner look) means every future window operation needs a capability check. That cost was not priced into the original design decision.

## Lessons Learned

1. **Tauri v2 capabilities are permissions, not features.** Every window operation (drag, close, maximize) needs explicit capability grants — the default-deny model means untested UI paths silently break.
2. **`tokio::spawn` vs `tauri::async_runtime::spawn` matters in `.setup()`.** Tauri's setup closure runs outside the tokio runtime, so spawning with the wrong API causes a panic. This is a Tauri v2 migration footgun worth documenting.
3. **Manual launch tests catch what unit tests can't.** 19,107 tests passed in v1.49.2 and five first-run bugs still shipped. The unit-test suite can't see "the window doesn't drag" or "the terminal renders blank." Desktop releases need a launch-smoke-test gate.
4. **xterm.js requires its CSS import to render.** Missing the stylesheet produces a blank white terminal — no error, no warning. Import the CSS at the same layer you import the module.
5. **Wrap native resource creation with try/catch plus user-visible error paths.** `createTmuxTerminal` can fail for dozens of reasons (missing tmux, permission errors, PTY setup). A try/catch with an indicator-fallback path is the minimum defensive posture.
6. **Default-deny security models move bugs from production to development.** Tauri v2's capability model caught all three permission gaps in v1.49.3 at development time — loud and actionable. Tauri v1's default-allow would have shipped them silently. Default-deny wins.
7. **Stack traces at runtime-boundary bugs are the highest-signal diagnostics.** The Claude-monitor panic pointed directly at `tokio::spawn` and the Tauri runtime boundary. Don't grep for workarounds — read the trace and fix the runtime mismatch.
8. **First-run UX is where trust is won or lost.** Five first-run bugs is five moments where a user decides whether to file a bug or uninstall. Patches that fix first-run bugs are disproportionately valuable relative to their line count.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.2](../v1.49.2/) | Predecessor patch — shipped the indicator wiring whose launch path this patch actually exercised |
| [v1.49.1](../v1.49.1/) | First patch in the v1.49.0 retrospective-patch sequence |
| [v1.49.4](../v1.49.4/) | Successor — GSD-OS desktop continues beyond this patch |
| [v1.49.0](../v1.49.0/) | Parent mega-release; GSD-OS shipped there, polish lands over the next three patches |
| `src-tauri/capabilities/default.json` | Tauri v2 capabilities file — three new entries |
| `src-tauri/src/claude_monitor/monitor.rs` | `tokio::spawn` → `tauri::async_runtime::spawn` |
| `desktop/src/main.ts` | xterm.css import added |
| `desktop/src/tmux/createTmuxTerminal.ts` | try/catch + error message + indicator fallback |
| Tauri v2 migration docs | Upstream reference for the `allow-*` capability model |

## Engine Position

v1.49.3 closes the v1.49.0 retrospective-patch sequence (v1.49.1, v1.49.2, v1.49.3). The sequence shape is the template for every mega-release after v1.49.0: one surgical patch (v1.49.1), one broad mechanical cleanup (v1.49.2), one polish pass with manual verification (v1.49.3). After this patch the mega-release line is considered stable and new feature work resumes at v1.49.4+. The frameless-window capability declarations added here are load-bearing for every future window operation GSD-OS adds.

## Files

- `src-tauri/capabilities/default.json` — added 3 Tauri v2 capabilities (drag, close, toggle-maximize)
- `src-tauri/src/claude_monitor/monitor.rs` — async-runtime fix (`tokio::spawn` → `tauri::async_runtime::spawn`)
- `desktop/src/main.ts` (or equivalent entry) — `@xterm/xterm/css/xterm.css` import
- `desktop/src/tmux/createTmuxTerminal.ts` — try/catch + user-visible error + indicator fallback
- `package.json` — version bumped to 1.49.3
