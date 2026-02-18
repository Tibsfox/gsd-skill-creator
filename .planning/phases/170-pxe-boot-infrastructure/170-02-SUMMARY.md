---
phase: 170-pxe-boot-infrastructure
plan: 02
subsystem: infra
tags: [bash, pxe, pxelinux, grub, uefi, bios, template-rendering, dnsmasq, centos, network-boot]

requires:
  - phase: 170-01
    provides: "dnsmasq PXE/TFTP/DHCP config template, TFTP root setup, CentOS boot media download"
provides:
  - "BIOS PXE boot menu template with GSD branding and CentOS Stream 9 entries"
  - "UEFI GRUB boot menu template with GSD branding and CentOS Stream 9 entries"
  - "General-purpose template renderer (render-pxe-menu.sh) for ${VAR} substitution from local-values"
  - "Master PXE deployment orchestrator (deploy-pxe.sh) with dry-run and safety features"
  - "GSD ASCII art splash branding for boot screens"
affects:
  - "Phase 171 (kickstart system reuses render-pxe-menu.sh for kickstart template rendering)"
  - "Phase 172 (VM provisioning PXE-boots through these menus)"
  - "Any future template-driven config (render-pxe-menu.sh is general-purpose)"

tech-stack:
  added: [pxelinux, grub2-uefi, vesamenu]
  patterns: [template-rendering-pipeline, deployment-orchestrator, dry-run-safety, pre-restart-validation]

key-files:
  created:
    - infra/templates/pxe/pxelinux.cfg-default.template
    - infra/templates/pxe/grub.cfg.template
    - infra/templates/pxe/gsd-splash.txt
    - infra/scripts/render-pxe-menu.sh
    - infra/scripts/deploy-pxe.sh
  modified:
    - infra/templates/dnsmasq/pxe-boot.local-values.example
    - infra/templates/dnsmasq/pxe-boot.conf.template

key-decisions:
  - decision: "Template variable naming: UPPER_SNAKE_CASE in templates, lower_snake_case in values files"
    rationale: "Clear visual distinction between placeholders and rendered values; renderer lowercases for lookup"
  - decision: "General-purpose renderer rather than PXE-specific script"
    rationale: "render-pxe-menu.sh works for any template/values pair, reusable across kickstart, dnsmasq, and future configs"
  - decision: "Boot menu defaults to local disk on timeout (30 seconds)"
    rationale: "Safety: prevents accidental OS reinstallation if a machine PXE-boots unattended"

patterns-established:
  - "Template rendering pipeline: template + local-values YAML -> rendered config via render-pxe-menu.sh"
  - "Deployment orchestrator pattern: single script calls all setup scripts in dependency order with dry-run mode"
  - "Pre-restart validation: always validate config syntax before restarting a service"
  - "Config backup before overwrite: timestamped .bak files before replacing active configs"

requirements-completed: []
duration: 5 min
completed: 2026-02-18
---

# Phase 170 Plan 02: PXE Boot Menus + Template Renderer + Deploy Orchestrator Summary

**BIOS and UEFI PXE boot menus with GSD branding offering base and Minecraft server CentOS installations, general-purpose template renderer for variable substitution, and master deployment script orchestrating the full PXE setup with dry-run mode and pre-restart safety validation.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-18T02:12:45Z
- **Completed:** 2026-02-18T02:18:34Z
- **Tasks:** 2
- **Files created:** 5
- **Files modified:** 2

## Accomplishments
- BIOS pxelinux and UEFI GRUB boot menus with identical logical entries (base image, Minecraft server, local disk fallback) in their respective bootloader syntaxes
- General-purpose template renderer that maps UPPER_SNAKE_CASE template variables to lower_snake_case local-values YAML keys with missing variable detection
- Master deployment script orchestrating 10 steps from prerequisites through service health verification, with dry-run preview and config backup safety features
- All site-specific values parameterized via template variables with zero hardcoded IPs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BIOS and UEFI PXE boot menu templates with GSD branding** - `d0570d3` (feat)
2. **Task 2: Create template renderer and master PXE deployment script** - `07637ea` (feat)

## Files Created/Modified
- `infra/templates/pxe/pxelinux.cfg-default.template` - BIOS PXE boot menu with vesamenu, 3 entries, timeout safety
- `infra/templates/pxe/grub.cfg.template` - UEFI GRUB boot menu with linuxefi/initrdefi, 3 entries, timeout safety
- `infra/templates/pxe/gsd-splash.txt` - ASCII art GSD branding banner
- `infra/scripts/render-pxe-menu.sh` - Template renderer: parses YAML values, substitutes ${VAR} placeholders, validates completeness
- `infra/scripts/deploy-pxe.sh` - Master orchestrator: prerequisites, TFTP setup, media download, config render, validate, restart, verify
- `infra/templates/dnsmasq/pxe-boot.local-values.example` - Added pxe_timeout_seconds and pxe_timeout_tenths variables
- `infra/templates/dnsmasq/pxe-boot.conf.template` - Fixed comment text to not trigger template renderer

## Decisions Made
- Template variable naming convention: UPPER_SNAKE_CASE in templates maps to lower_snake_case in values files (renderer lowercases for lookup)
- General-purpose renderer design: render-pxe-menu.sh is not PXE-specific; it handles any template + values pair, enabling reuse for kickstart files and future configs
- Boot menu safety: both BIOS and UEFI menus default to "Boot from Local Disk" on timeout to prevent accidental reinstallation
- Variable name regex requires underscore: prevents false matches on comment text like `${VAR}`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed template comments triggering variable substitution**
- **Found during:** Task 2 (render-pxe-menu.sh testing)
- **Issue:** Comment lines like `# Template: ${VAR} replaced at deployment time` contained `${VAR}` which the renderer treated as a real variable, causing "missing variable" errors
- **Fix:** Changed comment text across all 3 templates to not use `${VAR}` syntax; also tightened the renderer regex to require at least one underscore in variable names (all real variables use UPPER_SNAKE_CASE)
- **Files modified:** pxelinux.cfg-default.template, grub.cfg.template, pxe-boot.conf.template, render-pxe-menu.sh
- **Verification:** Renderer successfully processes all 3 templates without false matches
- **Committed in:** 07637ea (Task 2 commit)

**2. [Rule 1 - Bug] Fixed sed escaping corrupting URLs in rendered output**
- **Found during:** Task 2 (render-pxe-menu.sh testing)
- **Issue:** Sed escape function turned `http://` into `http:\/\/` in rendered output because bash parameter expansion was used (not sed) but sed escaping was applied
- **Fix:** Removed unnecessary sed escaping; bash `${var//pattern/replacement}` handles literal strings correctly
- **Files modified:** render-pxe-menu.sh
- **Verification:** URLs render correctly: `http://192.168.122.10:8080/kickstart/base.ks`
- **Committed in:** 07637ea (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for correct template rendering. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 170 PXE boot infrastructure is complete -- all dnsmasq config, TFTP structure, boot media download, boot menus, and deployment orchestration are in place
- Phase 171 (kickstart system) can reuse render-pxe-menu.sh for kickstart template rendering
- Phase 172 (VM provisioning) can PXE-boot VMs through these menus
- To deploy: `sudo infra/scripts/deploy-pxe.sh --local-values infra/local/pxe-boot.local-values`
- To preview: `infra/scripts/deploy-pxe.sh --local-values infra/local/pxe-boot.local-values --dry-run`

## Self-Check: PASSED

All 5 created files verified present. Both commit hashes (d0570d3, 07637ea) verified in git log.

---
*Phase: 170-pxe-boot-infrastructure*
*Completed: 2026-02-18*
