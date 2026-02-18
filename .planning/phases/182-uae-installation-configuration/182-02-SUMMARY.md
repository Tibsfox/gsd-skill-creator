---
phase: 182-uae-installation-configuration
plan: 02
subsystem: infra
tags: [fs-uae, amiga, gpu, vulkan, opengl, audio, sdl, alsa, midi, scanline-shader, glsl, uae]

# Dependency graph
requires:
  - phase: 182-uae-installation-configuration
    plan: 01
    provides: "FS-UAE installation, AROS ROM acquisition, base.fs-uae with placeholder tokens"
  - phase: 181-hardware-adaptation-engine
    plan: 02
    provides: "generate-local-values.sh producing gpu and audio sections from hardware assessment"
provides:
  - GPU-adaptive display configuration generator reading local-values.yaml (configure-uae-display.sh)
  - Audio-adaptive configuration generator with SDL/ALSA/MIDI routing (configure-uae-audio.sh)
  - GLSL CRT scanline shader for authentic Amiga display effect (scanline.fs-uae-shader)
  - Configuration renderer merging base + display + audio into launchable config (render-uae-config.sh)
  - Test suite with 28 assertions across 7 groups (test-uae-config.sh)
affects: [183-amiga-application-profiles, 184-asset-conversion]

# Tech tracking
tech-stack:
  added: [glsl-shader]
  patterns:
    - "GPU-adaptive config: read local-values gpu section, map to FS-UAE display settings per backend tier"
    - "Audio-adaptive config: read local-values audio section, route through SDL/ALSA with sample-accurate output"
    - "Config renderer: base template + overlay generators = final merged config with placeholder substitution"

key-files:
  created:
    - infra/scripts/configure-uae-display.sh
    - infra/scripts/configure-uae-audio.sh
    - infra/config/uae/scanline.fs-uae-shader
    - infra/scripts/render-uae-config.sh
    - infra/tests/test-uae-config.sh
  modified: []

key-decisions:
  - "Vulkan/OpenGL/software mapping follows gpu.uae_display from local-values.yaml for FS-UAE display backend"
  - "VRAM-tier integer scaling: 3x for high (8GB+), 2x for medium/low, 1x for none"
  - "Scanline shader gated on rendering_capable=true, stderr warning when requested without GPU"
  - "SDL audio backend for PipeWire/PulseAudio, ALSA for direct, sample-accurate Amiga audio mode"
  - "Config renderer calls display and audio generators as subprocesses, merging output sections"

patterns-established:
  - "Overlay config pattern: base template + section generators called as subprocesses = merged final config"
  - "Scanline shader format: vertex + fragment separated by --- following FS-UAE shader conventions"
  - "VRAM-tier scaling: integer scaling factors mapped from GPU assessment vram_tier classification"

requirements-completed: [AMIGA-03, AMIGA-04]

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 182 Plan 02: UAE Display and Audio Configuration Summary

**GPU-adaptive display config (Vulkan/OpenGL/software), SDL/ALSA audio routing with MIDI, CRT scanline shader, and config renderer merging base + overlays into launchable FS-UAE configuration**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18T12:22:38Z
- **Completed:** 2026-02-18T12:26:43Z
- **Tasks:** 2
- **Files created:** 5

## Accomplishments
- GPU-adaptive display configuration maps Vulkan (NVIDIA/AMD modern), OpenGL (older GPUs), and software (no GPU) to FS-UAE settings with VRAM-tier integer scaling
- Audio configuration routes through SDL for PipeWire/PulseAudio, ALSA for direct hardware, with MIDI through ALSA when hardware is detected
- CRT scanline GLSL shader provides authentic Amiga display effect, correctly gated on GPU availability
- Configuration renderer merges base.fs-uae template with display and audio overlays into a single launchable file
- 28 test assertions pass across 7 groups covering all hardware tier combinations

## Task Commits

Each task was committed atomically:

1. **Task 1: GPU display config, audio config, and scanline shader** - `d9b7631` (feat)
2. **Task 2: Configuration renderer and test suite** - `1e9156c` (feat)

## Files Created/Modified
- `infra/scripts/configure-uae-display.sh` - GPU-adaptive display config reading gpu section from local-values.yaml, outputs Vulkan/OpenGL/software settings with VRAM-tier scaling
- `infra/scripts/configure-uae-audio.sh` - Audio-adaptive config reading audio section, outputs SDL/ALSA routing with sample-accurate Amiga audio and MIDI support
- `infra/config/uae/scanline.fs-uae-shader` - GLSL CRT scanline shader for FS-UAE with vertex passthrough and fragment darkening effect
- `infra/scripts/render-uae-config.sh` - Config renderer merging base.fs-uae + display + audio overlays with placeholder token substitution
- `infra/tests/test-uae-config.sh` - Test suite with 28 assertions across 7 groups validating all hardware tier combinations

## Decisions Made
- Vulkan display backend maps to `low_latency_vsync = 1` + `texture_filter = linear` for best modern GPU performance
- VRAM-tier integer scaling: 3x for high (8GB+), 2x for medium/low, 1x (no scaling) for no VRAM
- Scanline shader is gated on `rendering_capable=true` -- stderr warning when requested without GPU instead of silent failure
- SDL audio backend routes through PipeWire/PulseAudio sound server; ALSA for direct-only systems; `sound_output = exact` for sample-accurate Amiga audio
- Config renderer calls display and audio generators as subprocesses and captures stdout, keeping each generator independently testable

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 182 complete: FS-UAE installation (Plan 01) + display/audio/render configuration (Plan 02) form the complete UAE emulation stack
- Rendered config file is a complete, launchable FS-UAE configuration adapting to any hardware profile
- Ready for Phase 183 (Amiga Application Profiles) and Phase 184 (Asset Conversion)
- All scripts use established local-values.yaml pattern for hardware adaptation

## Self-Check: PASSED

All 5 files verified present. Both task commits (d9b7631, 1e9156c) verified in git log.

---
*Phase: 182-uae-installation-configuration*
*Completed: 2026-02-18*
