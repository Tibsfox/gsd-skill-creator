---
phase: 176-client-setup-documentation
plan: 01
subsystem: docs
tags: [minecraft, fabric, prism-launcher, client-setup, troubleshooting, syncmatica, litematica]

# Dependency graph
requires:
  - phase: 174-mod-integration-deployment
    provides: "Server-side mod manifest template and deploy-mods.sh for Fabric API and Syncmatica"
  - phase: 175-server-configuration-tuning
    provides: "Server properties, whitelist management, RCON, performance tuning docs"
provides:
  - "Cross-platform client setup guide (Windows, macOS, Linux) with two paths (Prism Launcher and Vanilla)"
  - "Client-side mods manifest (single source of truth for 4 required mods)"
  - "Pre-configured Prism Launcher profile for one-click instance setup"
  - "Troubleshooting guide for 5 most common connection failure modes"
affects: [177-integration-verification, 184-knowledge-world-spatial-design]

# Tech tracking
tech-stack:
  added: [prism-launcher-mmc-format, yaml-mod-manifest]
  patterns: [single-source-of-truth-manifest, cross-platform-docs-structure, symptom-diagnosis-fix-verification]

key-files:
  created:
    - minecraft/client/mods-manifest.yaml
    - minecraft/client/prism-instance/mmc-pack.json
    - minecraft/client/prism-instance/instance.cfg
    - minecraft/client/README.md
    - docs/minecraft/client-setup-guide.md
    - docs/minecraft/troubleshooting.md
  modified: []

key-decisions:
  - "Prism Launcher MMC pack format (mmc-pack.json + instance.cfg) for portable instance configuration"
  - "4GB RAM minimum allocation in instance.cfg for Knowledge World performance"
  - "Directory-based profile (prism-instance/) instead of single JSON for Prism Launcher compatibility"
  - "SHA256 checksums deferred to deployment time (TO_BE_VERIFIED_AT_DEPLOYMENT) since JARs not downloaded"

patterns-established:
  - "Client mod manifest as single source of truth: all docs reference mods-manifest.yaml for versions"
  - "Dual-path documentation: recommended quick path (Prism Launcher) plus manual fallback (Vanilla)"
  - "Troubleshooting structure: symptom/diagnosis/fix/verification for every failure mode"

requirements-completed: [MC-09, MC-10]

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 176 Plan 01: Client Setup Documentation Summary

**Cross-platform Minecraft client setup package with mods manifest, Prism Launcher profile, installation guide (2 paths x 3 platforms), and 5-failure-mode troubleshooting guide**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18T12:22:47Z
- **Completed:** 2026-02-18T12:27:04Z
- **Tasks:** 2
- **Files created:** 6

## Accomplishments

- Created `mods-manifest.yaml` as the single source of truth for all 4 required client mods (Fabric API, Litematica, MaLiLib, Syncmatica) with pinned versions, filenames, and download URLs
- Created a pre-configured Prism Launcher instance (mmc-pack.json + instance.cfg) for one-click profile import with Minecraft 1.21.4 and Fabric Loader 0.16.10
- Created a comprehensive client setup guide with two installation paths: Path A (Prism Launcher, ~5 min) and Path B (Vanilla Launcher, ~10 min) covering Windows, macOS, and Linux
- Created a troubleshooting guide covering the 5 most common connection failures: wrong Java version, mod version mismatch, connection refused, whitelist rejection, and Syncmatica handshake failure

## Task Commits

Each task was committed atomically:

1. **Task 1: Client-side mods manifest and Prism Launcher profile** - `6fae319` (feat)
2. **Task 2: Cross-platform client installation guide and troubleshooting** - `40a7cbd` (feat)

## Files Created/Modified

- `minecraft/client/mods-manifest.yaml` - Single source of truth for client-side mod versions, filenames, checksums, and download URLs
- `minecraft/client/prism-instance/mmc-pack.json` - Prism Launcher MMC pack format specifying Minecraft 1.21.4 + Fabric Loader 0.16.10
- `minecraft/client/prism-instance/instance.cfg` - Instance settings: name, memory allocation (4GB), description
- `minecraft/client/prism-instance/.minecraft/mods/` - Empty mods directory for user to place downloaded JARs
- `minecraft/client/README.md` - Quick-start guide: import profile, download mods, set server address, verify
- `docs/minecraft/client-setup-guide.md` - Full installation guide: prerequisites, Path A (Prism Launcher), Path B (Vanilla), verification checklist
- `docs/minecraft/troubleshooting.md` - 5 failure modes with symptom/diagnosis/fix/verification for each

## Decisions Made

- **Prism Launcher directory-based profile:** Used `prism-instance/` directory with `mmc-pack.json` + `instance.cfg` rather than a single JSON file, matching Prism Launcher's native instance format for direct copy-paste import.
- **4GB RAM allocation:** Set `MaxMemAlloc=4096` in instance.cfg to ensure adequate memory for Fabric + mods + Knowledge World.
- **SHA256 deferred:** Checksums marked as `TO_BE_VERIFIED_AT_DEPLOYMENT` since actual JAR files are not downloaded during documentation creation. Checksums should be computed from actual downloads at deployment time.
- **Dual-path documentation:** Path A (Prism Launcher) targets 5-minute setup for the common case; Path B (Vanilla Launcher) provides a manual fallback covering the same mod stack with platform-specific commands.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Users follow the client setup guide to configure their own Minecraft clients.

## Next Phase Readiness

- Client documentation complete, ready for Phase 177 (Integration Verification) to validate end-to-end client-server connectivity
- Mods manifest provides version reference for any future mod update workflows
- Troubleshooting guide covers the failure modes most likely to surface during integration testing

## Self-Check: PASSED

- All 6 created files verified present on disk
- Commit `6fae319` (Task 1) verified in git log
- Commit `40a7cbd` (Task 2) verified in git log
- YAML validation passed for mods-manifest.yaml
- JSON validation passed for mmc-pack.json
- All mod entries contain required fields (name, version, filename, source, url, required, side)
- All 3 platforms (Windows, macOS, Linux) present in client-setup-guide.md
- All 5 failure modes present in troubleshooting.md with symptom/diagnosis/fix/verification
- Cross-references between documents verified intact
- Line counts meet minimums: guide 329 (min 200), troubleshooting 346 (min 100), manifest 58 (min 30), profile 32 (min 30), README 79 (min 20)

---
*Phase: 176-client-setup-documentation*
*Completed: 2026-02-18*
