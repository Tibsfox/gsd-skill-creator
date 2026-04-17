# Retrospective — v1.49.3

## What Worked

- **Each fix maps to a single root cause.** Blank terminal = missing CSS import, window drag = missing Tauri capability, close button = missing capability, Claude monitor = wrong async runtime. Clean 1:1 mapping from symptom to fix.
- **Tauri v2 capability model caught permission gaps early.** The frameless window requiring explicit `allow-start-dragging` and `allow-close` capabilities is exactly the kind of thing that silently fails without the security model forcing explicit declarations.

## What Could Be Better

- **Five separate bugs from a single desktop launch.** These are all first-run issues that would have been caught by a single manual launch test before shipping v1.49.2. The indicator wiring in v1.49.2 was verified logically but not visually.

## Lessons Learned

1. **Tauri v2 capabilities are permissions, not features.** Every window operation (drag, close, maximize) needs explicit capability grants -- the default-deny model means untested UI paths silently break.
2. **`tokio::spawn` vs `tauri::async_runtime::spawn` matters in `.setup()`.** Tauri's setup closure runs outside the tokio runtime, so spawning with the wrong API causes a panic. This is a Tauri v2 migration footgun worth documenting.
