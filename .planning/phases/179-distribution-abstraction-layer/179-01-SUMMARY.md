---
phase: 179-distribution-abstraction-layer
plan: 01
subsystem: infra
tags: [bash, package-manager, dnf, apt, pacman, abstraction, multi-distro]

# Dependency graph
requires:
  - phase: 178-hardware-discovery-framework
    provides: "discover-distro.sh for distribution detection, discovery-common.sh for shared helpers, hardware-capabilities.yaml with distro section"
provides:
  - "pkg_install, pkg_remove, pkg_available, pkg_installed, pkg_update functions via pkg-abstraction.sh"
  - "resolve_pkg_name logical-to-distro mapping via pkg-names.sh"
  - "Four-strategy backend detection: env var, YAML, discover-distro.sh, runtime"
affects: [171-base-image-kickstart, 173-minecraft-server, 180-hypervisor-abstraction, 181-hardware-adaptation, 182-uae-installation]

# Tech tracking
tech-stack:
  added: []
  patterns: [associative-array-based-name-mapping, four-strategy-detection-cascade, sourced-library-pattern]

key-files:
  created:
    - infra/scripts/lib/pkg-names.sh
    - infra/scripts/lib/pkg-abstraction.sh
  modified: []

key-decisions:
  - "Associative arrays for name mapping -- enables O(1) lookup with bash-native data structures"
  - "Empty mapping value signals package unavailable on backend (return 1) vs missing key signals passthrough"
  - "Four-strategy detection cascade with PKG_BACKEND env override as highest priority for testing and CI"
  - "apt cache staleness threshold at 1 hour to avoid stale package lists on Debian/Ubuntu"

patterns-established:
  - "Sourced library pattern: no shebang, set -euo pipefail, SCRIPT_DIR-relative sourcing"
  - "Name mapping pattern: logical names as keys, declare -gA associative arrays per backend"
  - "Auto-detection pattern: _pkg_ensure_backend called lazily on first API use"

requirements-completed: [PLAT-04, PLAT-05]

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 179 Plan 01: Package Manager Abstraction Summary

**Package manager abstraction with logical name mapping dispatching to dnf/apt/pacman backends via four-strategy detection cascade**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T02:39:46Z
- **Completed:** 2026-02-18T02:42:25Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Package name mapping library with 16 logical package names mapped across dnf, apt, and pacman
- Package manager abstraction with install, remove, available, installed, and update operations
- Four-strategy backend detection: PKG_BACKEND env var, hardware-capabilities.yaml, discover-distro.sh, runtime command detection
- Informative error messages for unsupported backends and unavailable packages (no crashes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create package name mapping library** - `b8465a3` (feat)
2. **Task 2: Create package manager abstraction library** - `5a8527b` (feat)

## Files Created/Modified
- `infra/scripts/lib/pkg-names.sh` - Associative-array-based logical-to-distro package name mapping with resolve_pkg_name and list_known_packages
- `infra/scripts/lib/pkg-abstraction.sh` - Package manager abstraction layer with pkg_install, pkg_remove, pkg_available, pkg_installed, pkg_update dispatching to detected backend

## Decisions Made
- Used bash associative arrays (`declare -gA`) for O(1) name lookup rather than case statements or external files
- Empty string in mapping signals "package unavailable on this backend" (returns exit code 1) vs missing key signals "use logical name as-is" (passthrough)
- PKG_BACKEND env var override is highest-priority detection strategy, enabling testing and CI overrides
- apt cache staleness threshold set at 1 hour (3600s) -- refreshes automatically before installs if stale

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Package abstraction ready for use by all downstream phases (171 kickstart, 173 Minecraft server, 182 UAE)
- Plan 02 (integration testing and CI verification scripts) can proceed
- Any script can now `source lib/pkg-abstraction.sh` and call `pkg_install java-21-jdk` without knowing the active package manager

## Self-Check: PASSED

- [x] infra/scripts/lib/pkg-names.sh exists (132 lines, min 40)
- [x] infra/scripts/lib/pkg-abstraction.sh exists (401 lines, min 80)
- [x] Commit b8465a3 exists (Task 1)
- [x] Commit 5a8527b exists (Task 2)
- [x] bash -n syntax check passes on both files
- [x] resolve_pkg_name maps correctly for all 3 backends
- [x] pkg_detect_backend detects system package manager
- [x] pkg_installed reports curl/bash correctly
- [x] Unsupported backend produces informative error

---
*Phase: 179-distribution-abstraction-layer*
*Completed: 2026-02-18*
