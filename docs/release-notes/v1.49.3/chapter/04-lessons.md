# Lessons — v1.49.3

3 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Tauri v2 capabilities are permissions, not features.**
   Every window operation (drag, close, maximize) needs explicit capability grants -- the default-deny model means untested UI paths silently break.
   _⚙ Status: `investigate` · lesson #274_

2. **`tokio::spawn` vs `tauri::async_runtime::spawn` matters in `.setup()`.**
   Tauri's setup closure runs outside the tokio runtime, so spawning with the wrong API causes a panic. This is a Tauri v2 migration footgun worth documenting.
   _⚙ Status: `investigate` · lesson #275_

3. **Five separate bugs from a single desktop launch.**
   These are all first-run issues that would have been caught by a single manual launch test before shipping v1.49.2. The indicator wiring in v1.49.2 was verified logically but not visually.
   _⚙ Status: `investigate` · lesson #276_
