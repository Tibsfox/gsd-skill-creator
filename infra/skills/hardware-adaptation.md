---
name: hardware-adaptation
description: "Generates optimal configuration for any hardware profile by assessing GPU, audio, and computing resources, then producing adaptive local-values YAML. Use when generating configuration from hardware profiles or adapting settings to specific hardware."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "hardware.*adapt"
          - "generate.*local.values"
          - "adaptive.*config"
          - "assess.*(gpu|audio)"
          - "tier.*classif"
        files:
          - "infra/scripts/generate-local-values.sh"
          - "infra/scripts/assess-gpu.sh"
          - "infra/scripts/assess-audio.sh"
          - "infra/inventory/local-values.example.yaml"
        contexts:
          - "hardware adaptation"
          - "configuration generation"
        threshold: 0.7
      token_budget: "2%"
      version: 1
      enabled: true
      plan_origin: "03-platform-portability"
      phase_origin: "181"
---

# Hardware Adaptation

## Purpose

Generates optimal configuration for any hardware profile by assessing GPU capabilities, audio subsystem, and computing resources. Produces a local-values.yaml that adapts JVM flags, display backend, audio routing, and resource allocation to the detected hardware. Bridges the gap between discovery (what hardware exists) and configuration (how to use it optimally).

## Capabilities

- GPU assessment: Vulkan for NVIDIA/AMD modern drivers, OpenGL for older, software for no GPU
- VRAM-tier integer scaling: 3x for high (8GB+), 2x for medium/low, 1x for none
- Audio assessment: SDL backend for PipeWire/PulseAudio, ALSA for direct-only systems
- ALSA MIDI backend universal on Linux when MIDI hardware detected
- JVM GC selection: ZGC only when heap >= 8192MB (8GB), otherwise G1GC
- Management interface selection: first ethernet with state=up, fallback chain
- Hypervisor preference: KVM > VMware > VirtualBox > container (open standard priority)
- Assessment failures produce safe defaults rather than errors (generator resilience)
- Subsection-aware awk parsing for nested YAML without external dependencies
- UAE audio/display backend mapping from hardware capabilities

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/generate-local-values.sh` | Main configuration generator from hardware profile |
| `infra/scripts/assess-gpu.sh` | GPU capability assessment and display backend selection |
| `infra/scripts/assess-audio.sh` | Audio subsystem assessment and backend selection |

## Dependencies

- Platform profile from discover-all.sh (platform-discovery skill)
- Resource budget from calculate-budget.sh (resource-budgeting skill)
- `infra/inventory/local-values.example.yaml` as reference template
- No external YAML libraries -- awk-based subsection-aware parsing

## Usage Examples

**Generate local-values from current hardware:**
```bash
infra/scripts/discover-all.sh       # Generate platform profile
infra/scripts/calculate-budget.sh   # Generate resource budget
infra/scripts/generate-local-values.sh  # Produce adaptive config
# Produces: infra/local/local-values.yaml
```

**Assess GPU capabilities only:**
```bash
infra/scripts/assess-gpu.sh
# Reports: display backend, VRAM tier, rendering capable flag
```

**Generate config for specific fixture:**
```bash
INFRA_DIR=/tmp/fixture infra/scripts/generate-local-values.sh
# Uses fixture hardware profile for testing
```

## Test Cases

### Test 1: GPU-aware display selection
- **Input:** Run `generate-local-values.sh` with 64GB NVIDIA fixture
- **Expected:** Vulkan display backend selected, high VRAM tier
- **Verify:** `grep 'uae_display:' infra/local/local-values.yaml` shows "vulkan" (or "opengl" mapped)

### Test 2: ZGC threshold
- **Input:** Run with generous tier (heap >= 8GB)
- **Expected:** ZGC selected as garbage collector
- **Verify:** `grep 'gc:' infra/local/local-values.yaml` shows "zgc"

### Test 3: Audio backend selection
- **Input:** Run with PipeWire audio detected
- **Expected:** SDL audio backend selected for PipeWire compatibility
- **Verify:** `grep 'audio_backend:' infra/local/local-values.yaml` shows "sdl"

## Token Budget Rationale

2% budget reflects the three assessment scripts with complex hardware-to-configuration mapping logic. The GPU, audio, and computing assessments each contain multi-branch decision trees that produce cascading configuration values. Understanding the assessment logic is essential for correct configuration generation.
