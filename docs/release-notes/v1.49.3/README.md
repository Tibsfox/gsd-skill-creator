# v1.49.3 — GSD-OS Desktop Polish (Patch)

**Shipped:** 2026-02-27

Desktop UX fixes for the GSD-OS Tauri application — terminal rendering, window management, and close button.

### Fixes

- **Blank terminal:** Added missing `@xterm/xterm/css/xterm.css` import — xterm.js was rendering without styles, producing a blank white terminal window
- **Window drag:** Added `core:window:allow-start-dragging` Tauri v2 capability — frameless windows require explicit permission for `data-tauri-drag-region`
- **Close button:** Added `core:window:allow-close` and `core:window:allow-toggle-maximize` Tauri v2 capabilities — window control buttons were non-functional without permissions
- **Terminal error handling:** Added try/catch around `createTmuxTerminal` with user-visible error message and status indicator fallback
- **Claude monitor runtime:** Changed `tokio::spawn` to `tauri::async_runtime::spawn` in `monitor.rs` — Tauri's `.setup()` closure doesn't run inside a tokio runtime, causing a panic

### Tauri v2 Capabilities Added

```json
"core:window:allow-start-dragging",
"core:window:allow-close",
"core:window:allow-toggle-maximize"
```

### Verification

- GSD-OS launches cleanly, no panics
- Terminal opens with xterm.js rendering, accepts input
- Window draggable via titlebar, close/maximize buttons functional
- All 3 process indicators respond to state changes

## Retrospective

### What Worked
- **Each fix maps to a single root cause.** Blank terminal = missing CSS import, window drag = missing Tauri capability, close button = missing capability, Claude monitor = wrong async runtime. Clean 1:1 mapping from symptom to fix.
- **Tauri v2 capability model caught permission gaps early.** The frameless window requiring explicit `allow-start-dragging` and `allow-close` capabilities is exactly the kind of thing that silently fails without the security model forcing explicit declarations.

### What Could Be Better
- **Five separate bugs from a single desktop launch.** These are all first-run issues that would have been caught by a single manual launch test before shipping v1.49.2. The indicator wiring in v1.49.2 was verified logically but not visually.

## Lessons Learned

1. **Tauri v2 capabilities are permissions, not features.** Every window operation (drag, close, maximize) needs explicit capability grants -- the default-deny model means untested UI paths silently break.
2. **`tokio::spawn` vs `tauri::async_runtime::spawn` matters in `.setup()`.** Tauri's setup closure runs outside the tokio runtime, so spawning with the wrong API causes a panic. This is a Tauri v2 migration footgun worth documenting.
