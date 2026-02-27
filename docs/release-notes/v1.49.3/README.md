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
