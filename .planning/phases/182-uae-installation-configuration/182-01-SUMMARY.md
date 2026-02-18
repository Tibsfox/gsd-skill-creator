---
phase: 182-uae-installation-configuration
plan: 01
subsystem: infra
tags: [fs-uae, amiga, aros, flatpak, emulation, uae]

# Dependency graph
requires:
  - phase: 179-distribution-abstraction-layer
    provides: pkg-abstraction.sh and pkg-names.sh for cross-distro package installation
  - phase: 181-hardware-adaptation-engine
    provides: discovery-common.sh helpers (has_command, warn, safe_read)
provides:
  - Cross-distro FS-UAE installation with Flatpak fallback (install-fs-uae.sh)
  - AROS ROM acquisition with retry logic and integrity verification (setup-aros-rom.sh)
  - Base FS-UAE A1200 configuration for AROS Workbench booting (base.fs-uae)
  - Updated package name mappings for UAE dependencies (flatpak, SDL2, openal-soft)
  - Test suite with 20 assertions across 4 test groups
affects: [182-02-uae-overlay-configuration, 183-amiga-application-profiles, 184-asset-conversion]

# Tech tracking
tech-stack:
  added: [fs-uae, flatpak, aros-rom]
  patterns: [three-tier-install-fallback, configurable-url-override, placeholder-token-config]

key-files:
  created:
    - infra/scripts/install-fs-uae.sh
    - infra/scripts/setup-aros-rom.sh
    - infra/config/uae/base.fs-uae
    - infra/tests/test-install-fs-uae.sh
  modified:
    - infra/scripts/lib/pkg-names.sh

key-decisions:
  - "Three-tier install strategy: detect existing -> native pkg manager -> Flatpak fallback"
  - "Flatpak wrapper at ~/.local/bin/fs-uae for transparent command access on dnf systems"
  - "Configurable AROS_ROM_URL and AROS_SYSTEM_URL env vars for mirror flexibility"
  - "Placeholder tokens {ROM_DIR} and {DATA_DIR} in base.fs-uae for render-step substitution"
  - "A1200 model with AGA chipset for best AROS compatibility"

patterns-established:
  - "Three-tier install: detect-existing -> native-package -> flatpak-fallback for packages not in all repos"
  - "Configurable URL pattern: environment variable override with sensible defaults for download scripts"
  - "Placeholder token config: {TOKEN} syntax in config files for template rendering"

requirements-completed: [AMIGA-01, AMIGA-02]

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 182 Plan 01: UAE Installation and Configuration Summary

**Cross-distro FS-UAE installation with Flatpak fallback, AROS ROM acquisition with retry logic, and A1200 base config for Workbench booting**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18T12:04:51Z
- **Completed:** 2026-02-18T12:09:41Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- FS-UAE installation script with three-tier strategy: detect existing, try native package manager, fall back to Flatpak
- AROS ROM acquisition script with configurable URLs, retry logic (3 attempts), and file integrity verification
- Base FS-UAE configuration for A1200 with AGA chipset, 2MB Chip + 8MB Fast RAM, PAL display defaults
- Package name mappings updated with flatpak, SDL2, SDL2-devel, and openal-soft for all three backends
- Complete test suite with 20 assertions covering package mappings, script structure, and config correctness

## Task Commits

Each task was committed atomically:

1. **Task 1: FS-UAE installation script with Flatpak fallback and updated package mappings** - `6a1fc49` (feat)
2. **Task 2: AROS ROM acquisition, base UAE configuration, and test suite** - `1f79cd8` (feat)

## Files Created/Modified
- `infra/scripts/install-fs-uae.sh` - Cross-distro FS-UAE installation with three-tier strategy (detect/native/Flatpak)
- `infra/scripts/setup-aros-rom.sh` - AROS ROM download with retry logic, extraction, and integrity verification
- `infra/config/uae/base.fs-uae` - Base FS-UAE configuration for A1200 with AROS ROM and Workbench settings
- `infra/tests/test-install-fs-uae.sh` - Test suite with 20 assertions across 4 groups
- `infra/scripts/lib/pkg-names.sh` - Added flatpak, SDL2, SDL2-devel, openal-soft mappings for dnf/apt/pacman

## Decisions Made
- Three-tier install strategy (detect -> native -> Flatpak) ensures FS-UAE works on all Tier 1 distros including CentOS where fs-uae is not in repos
- Flatpak wrapper script at ~/.local/bin/fs-uae so downstream scripts can call `fs-uae` uniformly regardless of install method
- AROS download URLs are configurable via AROS_ROM_URL and AROS_SYSTEM_URL environment variables for mirror flexibility
- Base config uses {ROM_DIR} and {DATA_DIR} placeholder tokens for path substitution by Plan 02 render step
- A1200 model selected for AGA chipset which provides best AROS compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed printf format string issue in test suite**
- **Found during:** Task 2 (test suite creation)
- **Issue:** `printf "--- ..."` caused printf to interpret leading `--` as an option flag
- **Fix:** Changed to `printf "%s\n" "--- ..."` pattern for section headers
- **Files modified:** infra/tests/test-install-fs-uae.sh
- **Verification:** All 20 test assertions pass
- **Committed in:** 1f79cd8 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor printf format fix. No scope creep.

## Issues Encountered
None beyond the printf format string fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- FS-UAE installation script ready for all Tier 1 distros (Ubuntu via apt, Arch via pacman, CentOS/Fedora via Flatpak)
- AROS ROM acquisition automated with manual fallback instructions if download fails
- Base config ready for Plan 02 overlay generation from local-values.yaml (GPU display and audio settings)
- All scripts use --dry-run for safe testing without modifying the system

## Self-Check: PASSED

All 5 files verified present. Both task commits (6a1fc49, 1f79cd8) verified in git log.

---
*Phase: 182-uae-installation-configuration*
*Completed: 2026-02-18*
