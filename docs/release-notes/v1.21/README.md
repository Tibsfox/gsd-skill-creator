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

## Retrospective

### What Worked
- **Tauri v2 with capability ACL security.** Restricting webview access to specific Rust commands is the right security model for a desktop app that manages execution pipelines. The frameless window with custom chrome enables the Amiga aesthetic without sacrificing native performance.
- **WebGL CRT engine with CSS fallback.** The multi-pass post-processing pipeline (scanlines, barrel distortion, phosphor glow, chromatic aberration, vignette) is pure visual delight, but the CSS fallback for non-WebGL browsers means the app still works everywhere. Progressive enhancement done right.
- **Accessibility auto-detection.** Disabling CRT effects on `prefers-reduced-motion` and applying high-contrast palette on `prefers-contrast` means the retro aesthetic never comes at the cost of usability. This is built into the boot sequence, not an afterthought settings toggle.
- **636 tests across 34 plans for 11 phases.** The test density is appropriate for a release that spans Rust backend, WebGL shaders, IPC protocol, PTY management, and desktop window management.

### What Could Be Better
- **11 phases is the largest single release so far.** The scope spans Tauri shell, WebGL engine, palette system, PTY terminal, desktop environment, and boot calibration. Any one of these could be its own release. The coupling risk is that bugs in the PTY layer affect the boot sequence timeline.
- **OKLCH palette generation is sophisticated but hard to validate.** Perceptually uniform color interpolation is the right choice, but verifying that the 5 presets (Amiga Kickstart 1.3, Workbench 2.0/3.1, C64, custom) actually look correct requires visual inspection, not unit tests.

## Lessons Learned

1. **Bidirectional IPC needs three patterns, not one.** Commands (webview to Rust), events (Rust to webview), and channels (streaming) each serve a different communication need. Trying to unify them into a single pattern would add complexity, not reduce it.
2. **Watermark-based flow control for PTY is essential.** Pause at high-water, resume at low-water prevents the terminal from overwhelming the webview renderer. This is the same pattern used in TCP flow control -- proven at scale.
3. **Boot sequences should be skippable.** The Amiga chipset boot animation is delightful the first time and annoying the tenth. Click-or-keypress skip respects the user's time without removing the experience entirely.
4. **Copper list raster effects are the kind of detail that defines a project's personality.** Per-scanline color manipulation for gradient fills is technically unnecessary but emotionally essential for the Amiga tribute.

---
