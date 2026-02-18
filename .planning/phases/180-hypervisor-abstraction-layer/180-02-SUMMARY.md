---
phase: 180-hypervisor-abstraction-layer
plan: 02
subsystem: infra
tags: [container, podman, docker, minecraft, capability-matrix, bash, fallback]

# Dependency graph
requires:
  - phase: 180-01
    provides: "Hypervisor abstraction layer (vm-ctl.sh, hypervisor-common.sh, backend implementations)"
  - phase: 178-hardware-discovery-framework
    provides: "discovery-common.sh library (has_command, warn, YAML helpers)"
provides:
  - "Container runtime abstraction (container-fallback.sh) with Podman/Docker auto-detection"
  - "Minecraft server deployment via ct_create_minecraft() convenience function"
  - "Container CLI (container-ctl.sh) for full container lifecycle management"
  - "Hypervisor capability matrix (hypervisor-capabilities.yaml) documenting all 5 backends"
affects: [172-vm-provisioning-automation, 173-server-foundation, 181-hardware-adaptation-engine]

# Tech tracking
tech-stack:
  added: [podman, docker, itzg/minecraft-server]
  patterns: [container-runtime-abstraction, podman-first-docker-fallback, capability-matrix-pattern]

key-files:
  created:
    - infra/scripts/lib/container-fallback.sh
    - infra/scripts/container-ctl.sh
    - infra/inventory/hypervisor-capabilities.yaml
  modified: []

key-decisions:
  - "Podman preferred over Docker (rootless, daemonless) with automatic fallback"
  - "itzg/minecraft-server image with Fabric 1.21.4 as standard Minecraft deployment"
  - "Capability matrix is static hand-maintained YAML, not auto-generated"
  - "Container operations use same exit code convention as vm-ctl.sh (0/1/2/3)"

patterns-established:
  - "ct_ function prefix for all container operations (mirrors hv_ prefix for hypervisors)"
  - "_CT_RUNTIME module-level variable for detected runtime (mirrors HV_BACKEND pattern)"
  - "Idempotent container operations: check state before acting, return 0 if already in target state"
  - "CLI entry points (vm-ctl.sh, container-ctl.sh) share consistent argument parsing and exit code scheme"

requirements-completed: [PLAT-08]

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 180 Plan 02: Container Fallback and Capability Matrix Summary

**Podman/Docker container abstraction with Minecraft deployment shortcut and 5-backend capability matrix for downstream feature gating**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T07:15:26Z
- **Completed:** 2026-02-18T07:18:22Z
- **Tasks:** 2/2
- **Files created:** 3

## Accomplishments

- Container runtime abstraction with auto-detection (Podman preferred, Docker fallback)
- Minecraft-specific convenience function deploys itzg/minecraft-server with Fabric 1.21.4, RCON, correct ports, and volume mount
- Full container lifecycle CLI (create, start, stop, destroy, status, list, logs, exec) via container-ctl.sh
- Comprehensive capability matrix documenting all 5 backends (KVM, VMware, VirtualBox, Podman, Docker) with operations, features, resource overhead, and selection priority

## Task Commits

Each task was committed atomically:

1. **Task 1: Create container fallback library and CLI entry point** - `9c47061` (feat)
2. **Task 2: Create hypervisor capability matrix** - `3f89d09` (feat)

## Files Created/Modified

- `infra/scripts/lib/container-fallback.sh` - Container runtime abstraction: ct_detect_runtime, ct_create, ct_create_minecraft, ct_start, ct_stop, ct_destroy, ct_status, ct_list, ct_logs, ct_exec
- `infra/scripts/container-ctl.sh` - CLI entry point with --runtime override, minecraft shortcut, argument parsing, and all container operations
- `infra/inventory/hypervisor-capabilities.yaml` - Capability matrix with 5 backends, 12 operations each, features, resource overhead, selection priority, and Minecraft requirements

## Decisions Made

- Podman preferred over Docker as default runtime (rootless, daemonless, no daemon overhead)
- itzg/minecraft-server with Fabric 1.21.4 as the standard Minecraft container image
- Capability matrix is static YAML (hand-maintained) rather than auto-generated -- serves as documentation and feature-gating reference
- container-ctl.sh shares exit code scheme with vm-ctl.sh (0=success, 1=operation error, 2=no runtime, 3=invalid args)
- Container minimum RAM for Minecraft set to 2048MB (vs 4096MB for VM) reflecting lower overhead

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Container fallback ready for consumption by Phase 173 (Server Foundation) for resource-constrained deployments
- Capability matrix ready for Phase 172 (VM Provisioning) and Phase 181 (Hardware Adaptation Engine) for feature gating
- Both container-ctl.sh and vm-ctl.sh provide consistent CLI interfaces for downstream automation
- Phase 180 (Hypervisor Abstraction Layer) is now fully complete (both plans)

## Self-Check: PASSED

- All 3 created files exist on disk
- Both task commits found in git log (9c47061, 3f89d09)
- SUMMARY.md exists at expected path

---
*Phase: 180-hypervisor-abstraction-layer*
*Completed: 2026-02-18*
