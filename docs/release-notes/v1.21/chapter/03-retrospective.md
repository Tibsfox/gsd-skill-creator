# Retrospective — v1.21

## What Worked

- **Tauri v2 with capability ACL security.** Restricting webview access to specific Rust commands is the right security model for a desktop app that manages execution pipelines. The frameless window with custom chrome enables the Amiga aesthetic without sacrificing native performance.
- **WebGL CRT engine with CSS fallback.** The multi-pass post-processing pipeline (scanlines, barrel distortion, phosphor glow, chromatic aberration, vignette) is pure visual delight, but the CSS fallback for non-WebGL browsers means the app still works everywhere. Progressive enhancement done right.
- **Accessibility auto-detection.** Disabling CRT effects on `prefers-reduced-motion` and applying high-contrast palette on `prefers-contrast` means the retro aesthetic never comes at the cost of usability. This is built into the boot sequence, not an afterthought settings toggle.
- **636 tests across 34 plans for 11 phases.** The test density is appropriate for a release that spans Rust backend, WebGL shaders, IPC protocol, PTY management, and desktop window management.

## What Could Be Better

- **11 phases is the largest single release so far.** The scope spans Tauri shell, WebGL engine, palette system, PTY terminal, desktop environment, and boot calibration. Any one of these could be its own release. The coupling risk is that bugs in the PTY layer affect the boot sequence timeline.
- **OKLCH palette generation is sophisticated but hard to validate.** Perceptually uniform color interpolation is the right choice, but verifying that the 5 presets (Amiga Kickstart 1.3, Workbench 2.0/3.1, C64, custom) actually look correct requires visual inspection, not unit tests.

## Lessons Learned

1. **Bidirectional IPC needs three patterns, not one.** Commands (webview to Rust), events (Rust to webview), and channels (streaming) each serve a different communication need. Trying to unify them into a single pattern would add complexity, not reduce it.
2. **Watermark-based flow control for PTY is essential.** Pause at high-water, resume at low-water prevents the terminal from overwhelming the webview renderer. This is the same pattern used in TCP flow control -- proven at scale.
3. **Boot sequences should be skippable.** The Amiga chipset boot animation is delightful the first time and annoying the tenth. Click-or-keypress skip respects the user's time without removing the experience entirely.
4. **Copper list raster effects are the kind of detail that defines a project's personality.** Per-scanline color manipulation for gradient fills is technically unnecessary but emotionally essential for the Amiga tribute.

---
