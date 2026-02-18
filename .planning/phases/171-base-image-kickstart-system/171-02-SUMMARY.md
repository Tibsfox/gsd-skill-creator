---
phase: 171-base-image-kickstart-system
plan: 02
subsystem: infra
tags: [kickstart, centos, minecraft, java-21, pxe, template-rendering, bash]

# Dependency graph
requires:
  - phase: 171-01
    provides: "Base kickstart template, local-values example, first-boot framework"
  - phase: 170-02
    provides: "render-pxe-menu.sh general-purpose template renderer, deploy-pxe.sh orchestrator pattern"
provides:
  - "Minecraft-specific kickstart template with Java 21, dedicated user, game/RCON firewall ports"
  - "deploy-kickstart.sh orchestrator that renders and validates kickstart templates"
  - "Updated local-values example with Minecraft-specific variables"
affects: [173-minecraft-server-deployment, 175-server-configuration, 172-vm-provisioning]

# Tech tracking
tech-stack:
  added: [java-21-openjdk-headless, screen, jq]
  patterns: [kickstart-role-extension, first-boot-hooks, deploy-orchestrator-pattern]

key-files:
  created:
    - infra/templates/kickstart/minecraft.ks.template
    - infra/scripts/deploy-kickstart.sh
  modified:
    - infra/templates/kickstart/kickstart.local-values.example

key-decisions:
  - "Complete kickstart file (not %include) -- Anaconda HTTP %include is fragile"
  - "minecraft system user with nologin shell at /opt/minecraft for security"
  - "First-boot hook (50-minecraft-setup.sh) validates Java only -- no server software installed"
  - "Deploy script renders but does NOT serve HTTP -- operator chooses serving method"

patterns-established:
  - "Role-specific kickstarts duplicate base security + add role extensions"
  - "First-boot hooks use NN-prefix ordering in /opt/gsd/first-boot.d/"
  - "Deploy orchestrators follow step-based pattern with dry-run, backup, validation"

requirements-completed: [INFRA-08, INFRA-09]

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 171 Plan 02: Minecraft Kickstart and Deploy Script Summary

**Minecraft kickstart template with Java 21 headless, dedicated minecraft user, game/RCON firewall ports, and deploy-kickstart.sh orchestrator rendering both base and Minecraft kickstarts with validation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T07:15:19Z
- **Completed:** 2026-02-18T07:18:37Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Minecraft kickstart template with full base security (SELinux enforcing, SSH key-only, root locked) plus Java 21, game ports, dedicated user
- First-boot hook at /opt/gsd/first-boot.d/50-minecraft-setup.sh validates Java 21, sets SELinux contexts, marks server ready
- deploy-kickstart.sh orchestrator renders both templates via render-pxe-menu.sh with validation (no unresolved vars, structure checks)
- End-to-end pipeline verified: templates render cleanly with zero unresolved variables, all 9 Minecraft template vars mapped in local-values

## Task Commits

Each task was committed atomically:

1. **Task 1: Minecraft kickstart template extending base image** - `86b0750` (feat)
2. **Task 2: Kickstart deployment script (render + HTTP serve)** - `a27979f` (feat)

## Files Created/Modified
- `infra/templates/kickstart/minecraft.ks.template` - CentOS Stream 9 kickstart for Minecraft server VM with Java 21, firewall ports, first-boot hook
- `infra/scripts/deploy-kickstart.sh` - Step-based deployment orchestrator rendering kickstart templates with validation
- `infra/templates/kickstart/kickstart.local-values.example` - Added minecraft_hostname, minecraft_server_port, minecraft_rcon_port variables

## Decisions Made
- Used complete kickstart file rather than %include -- Anaconda's %include over HTTP is fragile and unreliable
- Minecraft system user created with nologin shell for security -- server process is managed, not interactive
- First-boot hook only validates Java 21 and sets SELinux contexts -- actual Minecraft server software is Phase 173
- Deploy script renders and validates but does not start an HTTP server -- operator chooses Apache, nginx, or Python http.server

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Minecraft kickstart template ready for VM provisioning (Phase 172)
- Deploy script completes the template-to-rendered-kickstart pipeline
- Phase 173 can build on the Minecraft environment (Java 21, directories, user) to deploy server software
- Phase 175 can deploy server.properties to /opt/minecraft/server/ (placeholder .gsd-ready marker exists)

## Self-Check: PASSED

All files exist, all commits verified:
- infra/templates/kickstart/minecraft.ks.template: FOUND
- infra/scripts/deploy-kickstart.sh: FOUND
- infra/templates/kickstart/kickstart.local-values.example: FOUND
- Commit 86b0750 (Task 1): FOUND
- Commit a27979f (Task 2): FOUND

---
*Phase: 171-base-image-kickstart-system*
*Completed: 2026-02-18*
