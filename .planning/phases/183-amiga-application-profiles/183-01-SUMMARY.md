---
phase: 183-amiga-application-profiles
plan: 01
subsystem: infra
tags: [amiga, uae, fs-uae, whdload, ocs, aga, protracker, octamed, deluxe-paint, ppaint]

requires:
  - phase: 182-uae-installation-configuration
    provides: "Base FS-UAE installation, AROS ROM, display/audio config generators, render-uae-config.sh"
provides:
  - "Five UAE profile configs (base + 4 creative apps) with chipset/CPU/memory optimization per application"
  - "WHDLoad hard-drive boot profile and HDF image creation script"
  - "Profile launcher that merges base + app profile with local-values runtime overrides"
  - "Bidirectional host-UAE file exchange directory for IFF/MOD asset flow"
  - "56-assertion test suite validating all profiles and launcher behavior"
affects: [184-asset-conversion-pipeline, amiga-creative-workflow]

tech-stack:
  added: [fs-uae-profiles, whdload-hdf, xdftool]
  patterns: [profile-merge-override, placeholder-substitution, section-aware-yaml-parsing]

key-files:
  created:
    - infra/amiga/profiles/base.uae
    - infra/amiga/profiles/deluxe-paint.uae
    - infra/amiga/profiles/octamed.uae
    - infra/amiga/profiles/protracker.uae
    - infra/amiga/profiles/ppaint.uae
    - infra/amiga/profiles/whdload.uae
    - infra/amiga/profiles/README.md
    - infra/scripts/launch-amiga-app.sh
    - infra/scripts/setup-whdload.sh
    - infra/scripts/setup-amiga-exchange.sh
    - infra/tests/test-amiga-profiles.sh
  modified: []

key-decisions:
  - "Profile merge uses awk last-value-wins for duplicate keys (app profile overrides base)"
  - "Vulkan display mapped to opengl for FS-UAE compatibility (FS-UAE uses OpenGL internally)"
  - "Default fallback values (opengl, 44100Hz, 512 buffer) when local-values.yaml missing"
  - "WHDLoad HDF formatting requires xdftool (amitools pip package), manual fallback documented"
  - "Exchange path stored in infra/local/amiga-exchange.path for launcher auto-detection"

patterns-established:
  - "Profile override pattern: base.uae provides shared defaults, app profiles override specific keys"
  - "Placeholder substitution: __UAE_DISPLAY__, __UAE_SAMPLE_RATE__, __UAE_BUFFER_SIZE__ replaced at launch"
  - "Test patching pattern: sed-based launcher patching for deterministic test environments"

requirements-completed: [AMIGA-05, AMIGA-06]

duration: 7min
completed: 2026-02-18
---

# Phase 183 Plan 01: Amiga Application Profiles Summary

**OCS/AGA-optimized UAE profiles for Deluxe Paint, OctaMED, ProTracker, PPaint with profile launcher, WHDLoad HDF integration, and bidirectional host file exchange**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-18T12:30:25Z
- **Completed:** 2026-02-18T12:37:47Z
- **Tasks:** 3
- **Files created:** 11

## Accomplishments
- Five UAE profile configs with per-application chipset, CPU, memory, and audio optimization
- Profile launcher merges base + app profile with runtime display/audio values from local-values.yaml
- WHDLoad setup creates formatted HDF image with S/, C/, WHDLoad/, Games/, Demos/, Apps/ structure
- Bidirectional file exchange with to-amiga/ and from-amiga/{iff,mod,misc}/ for Phase 184 pipeline
- 56-assertion test suite covering all profiles and launcher edge cases, 100% pass rate

## Task Commits

Each task was committed atomically:

1. **Task 1: Application profile configs and profile launcher** - `6c66614` (feat)
2. **Task 2: WHDLoad integration and host file exchange** - `eb949b2` (feat)
3. **Task 3: Profile validation test suite** - `3bbfb52` (test)

## Files Created/Modified
- `infra/amiga/profiles/base.uae` - Base UAE config template with placeholder variables
- `infra/amiga/profiles/deluxe-paint.uae` - OCS/68000 profile for 32-color pixel art
- `infra/amiga/profiles/octamed.uae` - AGA/68020 profile for 8+ channel audio with MIDI
- `infra/amiga/profiles/protracker.uae` - OCS/68000 profile for timing-accurate 4-channel tracker
- `infra/amiga/profiles/ppaint.uae` - AGA/68020 profile for hi-res HAM8 pixel art
- `infra/amiga/profiles/whdload.uae` - AGA/68020 hard-drive boot profile for WHDLoad
- `infra/amiga/profiles/README.md` - Profile system documentation with usage examples
- `infra/scripts/launch-amiga-app.sh` - Profile launcher with merge, substitution, and CLI flags
- `infra/scripts/setup-whdload.sh` - WHDLoad HDF image creation with xdftool formatting
- `infra/scripts/setup-amiga-exchange.sh` - Host-UAE bidirectional file exchange setup
- `infra/tests/test-amiga-profiles.sh` - 56-assertion validation test suite

## Decisions Made
- Profile merge uses awk last-value-wins for duplicate keys -- app profiles cleanly override base settings
- Vulkan display backend mapped to opengl for FS-UAE (which uses OpenGL internally)
- Sensible defaults (opengl, 44100Hz, 512 buffer) when local-values.yaml is absent, with stderr warning
- WHDLoad HDF formatting delegated to xdftool from amitools pip package, with manual fallback instructions
- Exchange directory path persisted to infra/local/amiga-exchange.path for automatic launcher detection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Test launcher patching initially failed because SCRIPT_DIR resolved to the temp directory instead of the real scripts location -- fixed by patching SCRIPT_DIR in the sed substitution to point back to the original scripts directory

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All five application profiles ready for creative tool launches
- WHDLoad setup script ready for HDF creation (user must acquire WHDLoad binary from whdload.de)
- Exchange directory ready for Phase 184 asset conversion pipeline (IFF/MOD subdirectories prepared)
- Profile launcher integrates with Phase 182's local-values display/audio configuration

## Self-Check: PASSED

All 11 created files verified present. All 3 task commits (6c66614, eb949b2, 3bbfb52) verified in git log.

---
*Phase: 183-amiga-application-profiles*
*Completed: 2026-02-18*
