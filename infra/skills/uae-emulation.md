---
name: uae-emulation
description: "Installs and configures FS-UAE for Amiga emulation with GPU-accelerated display, audio routing, application-specific profiles, and WHDLoad integration. Use when setting up Amiga emulation, configuring UAE, or launching Amiga applications."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "uae.*(install|config|setup)"
          - "amiga.*(emulat|run|launch)"
          - "fs-uae"
          - "aros.*rom"
          - "whdload"
        files:
          - "infra/scripts/install-fs-uae.sh"
          - "infra/scripts/render-uae-config.sh"
          - "infra/scripts/launch-amiga-app.sh"
          - "infra/scripts/setup-aros-rom.sh"
          - "infra/config/uae/*.fs-uae"
          - "infra/amiga/profiles/*.uae"
        contexts:
          - "amiga emulation"
          - "retro computing"
        threshold: 0.7
      token_budget: "2%"
      version: 1
      enabled: true
      plan_origin: "04-amiga-emulation"
      phase_origin: "182-183"
---

# UAE Emulation

## Purpose

Installs and configures FS-UAE for Amiga emulation with hardware-adaptive display and audio settings. Covers the complete emulation stack: FS-UAE installation (native, Flatpak fallback), AROS ROM setup (no Kickstart ROM distribution), GPU-accelerated display configuration, audio routing, application-specific profiles with WHDLoad integration, and file exchange between host and emulated Amiga.

## Capabilities

- Three-tier FS-UAE install strategy: detect existing, native pkg manager, Flatpak fallback
- Flatpak wrapper at ~/.local/bin/fs-uae for transparent command access on dnf systems
- AROS ROM download with configurable URLs via AROS_ROM_URL and AROS_SYSTEM_URL env vars
- A1200 model with AGA chipset selected for best AROS compatibility
- GPU-accelerated display: Vulkan mapped to OpenGL for FS-UAE (uses OpenGL internally)
- VRAM-tier integer scaling: 3x/2x/1x based on available VRAM
- Scanline shader gated on rendering_capable=true flag
- SDL audio backend for PipeWire/PulseAudio, ALSA for direct, sample-accurate Amiga audio mode
- Application-specific profiles with awk last-value-wins merge (app overrides base)
- WHDLoad HDF formatting via xdftool (amitools pip package), manual fallback documented
- File exchange via shared directory between host and emulated Amiga
- Base config uses {ROM_DIR}/{DATA_DIR} placeholder tokens for render-step substitution
- Config renderer calls display and audio generators as subprocesses, merging output sections
- Default fallback values (opengl, 44100Hz, 512 buffer) when local-values.yaml missing

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/install-fs-uae.sh` | FS-UAE installation with three-tier strategy |
| `infra/scripts/setup-aros-rom.sh` | AROS ROM download and installation |
| `infra/scripts/configure-uae-display.sh` | GPU-aware display configuration |
| `infra/scripts/configure-uae-audio.sh` | Audio subsystem configuration |
| `infra/scripts/render-uae-config.sh` | Config renderer merging base + display + audio |
| `infra/scripts/launch-amiga-app.sh` | Application launcher with profile merge |
| `infra/scripts/setup-whdload.sh` | WHDLoad HDF formatting and setup |
| `infra/scripts/setup-amiga-exchange.sh` | Host-Amiga file exchange directory |

## Dependencies

- FS-UAE emulator (installed via install-fs-uae.sh)
- AROS ROM (downloaded via setup-aros-rom.sh, no Kickstart distribution)
- GPU drivers for display acceleration (optional, falls back to software)
- Audio server: PipeWire, PulseAudio, or ALSA
- `xdftool` from amitools pip package (optional, for WHDLoad HDF)
- Local-values YAML from hardware-adaptation skill for display/audio settings

## Usage Examples

**Install FS-UAE:**
```bash
infra/scripts/install-fs-uae.sh
# Detects best installation method, sets up Flatpak wrapper if needed
```

**Set up AROS ROM:**
```bash
infra/scripts/setup-aros-rom.sh
# Downloads AROS ROM, no Kickstart ROM distribution
```

**Launch an Amiga application with profile:**
```bash
infra/scripts/launch-amiga-app.sh deluxepaint
# Merges base config + app profile, launches FS-UAE
```

**Render full UAE config:**
```bash
infra/scripts/render-uae-config.sh
# Produces merged config with display + audio + base sections
```

## Test Cases

### Test 1: Config rendering
- **Input:** Run `render-uae-config.sh` with mock local-values
- **Expected:** Merged config contains base + display + audio sections
- **Verify:** Output config file contains `[display]`, audio settings, and ROM paths

### Test 2: Profile merge precedence
- **Input:** Launch with app profile that overrides base display setting
- **Expected:** App profile value wins (last-value-wins via awk merge)
- **Verify:** Merged config contains app-specific value, not base value

### Test 3: Fallback defaults
- **Input:** Run render-uae-config.sh without local-values.yaml
- **Expected:** Uses default fallback values (opengl, 44100Hz, 512 buffer)
- **Verify:** Config contains fallback values without errors

## Token Budget Rationale

2% budget reflects the 8 scripts covering the complete Amiga emulation stack. The multi-script architecture with display/audio generators, profile merging, WHDLoad integration, and three-tier installation strategy requires comprehensive context for correct configuration and troubleshooting.
