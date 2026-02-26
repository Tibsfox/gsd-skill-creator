# v1.21 — GSD-OS Desktop Foundation

**Shipped:** 2026-02-14
**Phases:** 158-168 (11 phases) | **Plans:** 34 | **Requirements:** 50

Build the Tauri desktop application shell with WebGL 8-bit graphics engine, first-boot calibration, Amiga-inspired desktop environment, and native system bridges (PTY, file watcher, IPC).

### Key Features

**Tauri Desktop Shell (Phases 158-160):**
- Tauri v2 application with Rust backend and Vite webview frontend
- Bidirectional IPC: commands (webview→Rust), events (Rust→webview), channels (streaming)
- Capability ACL security restricting webview access to specific Rust commands
- Frameless window with custom chrome for Amiga Workbench aesthetic

**WebGL CRT Engine (Phase 161):**
- WebGL2 multi-pass post-processing pipeline
- Scanline effect with configurable intensity and gap ratio
- Barrel distortion simulating CRT curvature
- Phosphor glow with bloom radius control
- Chromatic aberration (RGB channel separation)
- Vignette darkening at screen edges
- Per-effect intensity controls with CSS fallback for non-WebGL browsers

**Indexed Palette System (Phase 162):**
- 32-color indexed palette with configurable slots
- 5 retro-computing presets: Amiga Kickstart 1.3, Workbench 2.0, Workbench 3.1, Commodore 64, custom
- OKLCH-based palette generation for perceptually uniform color interpolation
- Copper list raster effects for per-scanline color manipulation (gradient fills, sky effects)

**Native PTY Terminal (Phase 163):**
- Rust-backed pseudo-terminal via portable-pty crate
- xterm.js terminal emulator in webview with full ANSI support
- Watermark-based flow control (pause at high-water, resume at low-water)
- tmux session binding with automatic detach-on-close

**Desktop Environment (Phases 164-165):**
- Amiga Workbench-inspired window manager with depth cycling (click to front/back)
- Window drag/resize with configurable snap-to-edge
- Taskbar with process indicators and minimized window chips
- Pixel-art icon set for file types, applications, and system functions
- System menu with application launcher and preferences
- Keyboard shortcuts: Alt+Tab (window cycling), F10 (system menu), Ctrl+Q (quit)

**Boot & Calibration (Phases 166-168):**
- Three-screen calibration wizard: color picker, CRT effect tuning, theme/palette selection
- Amiga chipset boot sequence animation (Agnus, Denise, Paula, Gary initialization)
- Boot sequence skippable with click or keypress
- Accessibility auto-detection: disables CRT effects on `prefers-reduced-motion`, applies high-contrast palette on `prefers-contrast`

### Test Coverage

- 636 tests across 34 plans

---
