---
name: platform-discovery
description: "Discovers comprehensive hardware subsystems (audio, network, USB) and distribution details, producing unified capabilities YAML. Use when running full system discovery, detecting platform capabilities, or generating capabilities database."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "platform.*discover"
          - "full.*discover"
          - "discover.*(audio|network|usb|distro)"
          - "capabilit.*database"
          - "subsystem.*detect"
        files:
          - "infra/scripts/discover-all.sh"
          - "infra/scripts/discover-audio.sh"
          - "infra/scripts/discover-network.sh"
          - "infra/scripts/discover-usb.sh"
          - "infra/scripts/discover-distro.sh"
        contexts:
          - "platform assessment"
          - "full hardware inventory"
        threshold: 0.7
      token_budget: "2%"
      version: 1
      enabled: true
      plan_origin: "03-platform-portability"
      phase_origin: "178"
---

# Platform Discovery

## Purpose

Extends hardware discovery with comprehensive subsystem detection (audio, network, USB) and distribution identification, producing a unified capabilities YAML with all 9 subsystem sections. The orchestrator (discover-all.sh) aggregates base hardware discovery with extended subsystem modules, creating a complete platform profile for downstream adaptation decisions.

## Capabilities

- Audio subsystem detection: PipeWire, PulseAudio, ALSA, MIDI hardware presence
- Network interface inventory: ethernet, wireless, bridge, virtual, with state and speed
- USB device class reporting (not vendor:product IDs for privacy)
- Distribution identification: name, version, family, tier classification (Tier 1/2)
- Unified capabilities YAML with 13 boolean flags aggregated from all modules
- Each module exits 0 even when hardware is absent (flags as present: false)
- Orchestrator uses inline fallback when discover-hardware.sh is absent
- SELinux and AppArmor reported in separate security subsection
- Shared library (discovery-common.sh) for consistent printf-based YAML emission

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/discover-all.sh` | Orchestrator aggregating all discovery modules |
| `infra/scripts/discover-audio.sh` | Audio subsystem detection (PipeWire/PulseAudio/ALSA/MIDI) |
| `infra/scripts/discover-network.sh` | Network interface inventory and capability detection |
| `infra/scripts/discover-usb.sh` | USB device class reporting |
| `infra/scripts/discover-distro.sh` | Distribution identification and tier classification |
| `infra/scripts/lib/discovery-common.sh` | Shared YAML emission and utility functions |

## Dependencies

- Linux system with standard sysfs, /proc, and /sys interfaces
- `pactl`, `pw-cli`, `aplay` (optional, for audio detection)
- `ip`, `ethtool` (optional, for network details)
- `lsusb` (optional, for USB enumeration)
- `/etc/os-release` for distribution identification
- No external YAML libraries -- printf-based emission

## Usage Examples

**Run full platform discovery:**
```bash
infra/scripts/discover-all.sh
# Produces unified YAML with all 9 subsystems
```

**Discover audio subsystem only:**
```bash
infra/scripts/discover-audio.sh
# Reports audio server, MIDI hardware, capabilities
```

**Use for hardware adaptation:**
```bash
infra/scripts/discover-all.sh > /tmp/platform.yaml
infra/scripts/generate-local-values.sh  # Consumes platform profile
```

## Test Cases

### Test 1: Unified output completeness
- **Input:** Run `discover-all.sh` on current system
- **Expected:** Output YAML contains all 9 subsystem sections (cpu, memory, storage, gpu, audio, network, usb, distro, hypervisor)
- **Verify:** `infra/scripts/discover-all.sh | grep -c '^\(cpu\|memory\|storage\|gpu\|audio\|network\|usb\|distro\|hypervisor\):'` returns 9

### Test 2: Absent hardware flagged correctly
- **Input:** Run discover-audio.sh on system without MIDI hardware
- **Expected:** Output contains `midi: { present: false }` instead of error
- **Verify:** Exit code is 0 regardless of hardware presence

### Test 3: Capabilities aggregation
- **Input:** Run discover-all.sh and check capabilities section
- **Expected:** Contains 13 boolean capability flags
- **Verify:** `infra/scripts/discover-all.sh | grep -A 20 'capabilities:' | grep -c 'true\|false'` returns >= 13

## Token Budget Rationale

2% budget reflects the multi-module architecture: discover-all.sh orchestrator plus 4 subsystem discovery scripts plus the shared library. The aggregated output is the foundational input for hardware-adaptation, making comprehensive context important for correct downstream decisions.
