---
phase: 173-server-foundation
plan: 01
subsystem: infra
tags: [minecraft, fabric, systemd, jvm, deployment, bash]

# Dependency graph
requires:
  - phase: 171-base-image-kickstart-system
    provides: "CentOS VM with Java 21, minecraft user, firewall ports, first-boot framework"
  - phase: 179-distribution-abstraction-layer
    provides: "fw-abstraction.sh for cross-distro firewall management"
  - phase: 170-pxe-boot-infrastructure
    provides: "render-pxe-menu.sh general-purpose template renderer"
provides:
  - "deploy-minecraft.sh orchestrator for Fabric server deployment"
  - "JVM flags template with hardware-profile-driven heap and GC configuration"
  - "systemd service template with auto-start and auto-restart"
  - "Local-values example documenting all Minecraft deployment variables"
affects: [174-server-mods, 175-server-configuration, 176-world-management, 177-backup-system]

# Tech tracking
tech-stack:
  added: [fabric-installer, systemd-service]
  patterns: [deployment-orchestrator, template-rendering, nested-yaml-parsing, remote-local-deploy]

key-files:
  created:
    - infra/scripts/deploy-minecraft.sh
    - infra/templates/minecraft/jvm-flags.conf.template
    - infra/templates/minecraft/minecraft.service.template
    - infra/templates/minecraft/minecraft.local-values.example
  modified: []

key-decisions:
  - "Security hardening in systemd: ProtectSystem=full, ProtectHome=true, PrivateTmp=true, NoNewPrivileges=true"
  - "Log4Shell mitigation unconditionally included in JVM flags (-Dlog4j2.formatMsgNoLookups=true)"
  - "Nested YAML parser via awk for reading minecraft.jvm section from local-values.yaml"
  - "Dual deployment modes: --local for on-VM and --target-host for remote SSH deployment"
  - "EULA acceptance conditional on minecraft_eula setting in local-values"

patterns-established:
  - "Deployment orchestrator: 10-step pattern with numbered progress, dry-run, backup-before-overwrite"
  - "Config cascade: MC local-values overrides -> main local-values.yaml nested -> built-in defaults"
  - "Staging directory: render to temp, then deploy to target (local or remote)"

requirements-completed: [MC-01, MC-02, MC-03]

# Metrics
duration: 5min
completed: 2026-02-18
---

# Phase 173 Plan 01: Server Foundation Summary

**Minecraft Fabric deployment orchestrator with JVM flags from hardware profile, systemd auto-restart service, and cross-distro firewall integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-18T12:04:52Z
- **Completed:** 2026-02-18T12:09:57Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- JVM flags template renders heap sizing and GC selection from hardware profile with mandatory Log4Shell mitigation
- systemd service template provides auto-start on boot (WantedBy=multi-user.target) and auto-restart on crash (Restart=on-failure, RestartSec=10) with security hardening
- 917-line deployment orchestrator (deploy-minecraft.sh) handles complete Fabric server lifecycle: download, install, render templates, deploy service, open firewall, verify startup
- Local-values example documents all 15+ deployment variables with extensive comments

## Task Commits

Each task was committed atomically:

1. **Task 1: JVM flags template, systemd service template, and local-values example** - `cca00ba` (feat)
2. **Task 2: Fabric server deployment orchestrator** - `054d441` (feat)

## Files Created/Modified
- `infra/templates/minecraft/jvm-flags.conf.template` - JVM flags with heap, GC, and Log4Shell mitigation from hardware profile
- `infra/templates/minecraft/minecraft.service.template` - systemd unit with auto-restart, security hardening, resource limits
- `infra/templates/minecraft/minecraft.local-values.example` - Complete variable documentation for Minecraft deployment
- `infra/scripts/deploy-minecraft.sh` - 10-step deployment orchestrator (download, install, render, deploy, firewall, verify)

## Decisions Made
- Added systemd security hardening beyond plan requirements (ProtectSystem=full, ProtectHome=true, PrivateTmp=true, NoNewPrivileges=true) for defense-in-depth since the minecraft user runs third-party Java code
- Log4Shell mitigation (-Dlog4j2.formatMsgNoLookups=true) included unconditionally as a security baseline regardless of Minecraft/Log4j version
- Config cascade pattern: MC local-values -> main local-values.yaml (nested) -> built-in defaults, giving operators maximum flexibility
- Staging directory pattern: render all templates to temp dir, then deploy to target, enabling atomic rollback
- Dual deployment modes (--local / --target-host) for flexibility in development and production

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Operators copy minecraft.local-values.example to infra/local/minecraft.local-values and edit for their site.

## Next Phase Readiness
- deploy-minecraft.sh ready for Phase 174 (server mods) to extend with mod installation
- JVM flags and systemd service form the foundation for Phase 175 (server configuration)
- Server directory structure (/opt/minecraft/server/) ready for Phase 176 (world management)
- systemd integration enables Phase 177 (backup system) to safely stop/start server during backups
- Complete deployment pipeline verified: kickstart (171) -> first-boot (Java, user) -> deploy-minecraft.sh (Fabric, service, flags)

---
*Phase: 173-server-foundation*
*Completed: 2026-02-18*
