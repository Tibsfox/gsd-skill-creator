---
phase: 178-hardware-discovery-framework
plan: 01
subsystem: platform
tags: [bash, audio, network, usb, alsa, pipewire, pulseaudio, midi, yaml, discovery]

requires:
  - "infra/scripts/lib/discovery-common.sh (shared YAML emission library)"
provides:
  - "Audio subsystem discovery (ALSA devices, PulseAudio/PipeWire, MIDI ports)"
  - "Network subsystem discovery (interfaces, speed, bridge/bond/VLAN capabilities)"
  - "USB subsystem discovery (controllers, device classes, version detection)"
  - "Shared discovery library for YAML emission and graceful degradation"
affects:
  - "178-02 (unified orchestrator merges these modules into single YAML)"
  - "Phase 179 (distro abstraction uses network capabilities)"
  - "Phase 181 (hardware adaptation engine uses audio, network, USB data)"
  - "Phase 182 (UAE installation needs audio subsystem info)"

tech-stack:
  added: [alsa-utils, pipewire, lsusb, ethtool]
  patterns: [modular-discovery, shared-library, graceful-degradation, yaml-emission]

key-files:
  created:
    - infra/scripts/lib/discovery-common.sh
    - infra/scripts/discover-audio.sh
    - infra/scripts/discover-network.sh
    - infra/scripts/discover-usb.sh
  modified: []

key-decisions:
  - decision: "Shared library uses printf-based YAML emission (no external YAML dependency)"
    rationale: "Bash-only approach avoids requiring python3/PyYAML for basic discovery"
  - decision: "Each module exits 0 even when hardware is absent"
    rationale: "Missing hardware is a valid state -- capability flags (present: false) communicate this"
  - decision: "USB device classes reported instead of vendor:product IDs"
    rationale: "Device classes (hid, storage, audio) are useful without fingerprinting the machine"

requirements-completed: []
duration: 3 min
completed: 2026-02-18
---

# Phase 178 Plan 01: Audio, Network, USB Discovery Modules + Shared Library Summary

Three modular hardware discovery scripts (audio, network, USB) plus a shared YAML emission library, all querying Linux standard interfaces and degrading gracefully when hardware is absent.

## Execution Stats

- Duration: ~3 min
- Tasks: 2 (1 shared lib + audio, 1 network + USB)
- Files created: 4
- Commits: 2 (e86e67c, 3c5bb83)

## Task Results

### Task 1: Shared Discovery Library + Audio Module
- Created `infra/scripts/lib/discovery-common.sh` (3.5KB) -- yaml_key, yaml_bool, yaml_int, yaml_section, yaml_list_item, has_command, safe_read, warn, require_linux
- Created `infra/scripts/discover-audio.sh` (9KB) -- detects ALSA cards, PulseAudio/PipeWire server, MIDI ports
- Audio module tested: correctly identifies PipeWire as audio server, enumerates ALSA cards and MIDI through ports

### Task 2: Network + USB Modules
- Created `infra/scripts/discover-network.sh` (8KB) -- enumerates interfaces with type detection (ethernet/wifi/bridge/bond/vlan/virtual), speed, state, bridge/bond/VLAN capabilities, DNS/DHCP detection
- Created `infra/scripts/discover-usb.sh` (8.7KB) -- identifies xHCI/EHCI/OHCI controllers, counts devices excluding hubs, classifies device classes from sysfs, detects USB 3.0/3.1/3.2 max version
- Both modules tested on current machine: valid YAML output, correct hardware detection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- All three extended discovery modules complete -- Plan 178-02 can build the unified orchestrator
- Combined with Phase 169's base discovery, 6 of 7 subsystems covered (CPU, memory, storage, GPU, audio, network, USB)
- Plan 178-02 adds distro detection (7th subsystem) and merges everything into hardware-capabilities.yaml

## Self-Check: PASSED

All 4 created files verified present. Both commit hashes (e86e67c, 3c5bb83) verified in git log. All scripts pass bash -n syntax check and produce valid YAML on current machine.

---
*Phase: 178-hardware-discovery-framework*
*Completed: 2026-02-18*
