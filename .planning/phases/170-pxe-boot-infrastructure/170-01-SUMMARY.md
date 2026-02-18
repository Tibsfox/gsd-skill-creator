---
phase: 170-pxe-boot-infrastructure
plan: 01
subsystem: infra
tags: [bash, pxe, dnsmasq, tftp, dhcp, centos, network-boot, template]

requires: []
provides:
  - "dnsmasq PXE/TFTP/DHCP configuration template with variable substitution"
  - "Example local-values file documenting all PXE template variables"
  - "CentOS Stream 9 boot media download script with SHA256 verification"
  - "TFTP root directory setup script for BIOS and UEFI boot paths"
affects:
  - "170-02 (boot menu templates, deploy script depend on TFTP root structure)"
  - "Phase 171 (kickstart system serves files via the PXE infrastructure)"
  - "Phase 172 (VM provisioning uses PXE to boot new VMs)"

tech-stack:
  added: [dnsmasq, syslinux, grub2-efi, tftp, pxe]
  patterns: [template-local-values, checksum-verification, idempotent-scripts]

key-files:
  created:
    - infra/templates/dnsmasq/pxe-boot.conf.template
    - infra/templates/dnsmasq/pxe-boot.local-values.example
    - infra/scripts/download-centos-boot-media.sh
    - infra/scripts/setup-tftp-root.sh
  modified: []

key-decisions:
  - decision: "DHCP range scoped to 192.168.122.200-250 (small PXE provisioning range)"
    rationale: "Prevents rogue DHCP lease conflicts with existing network services"
  - decision: "bind-interfaces + specific interface for DHCP/TFTP isolation"
    rationale: "Safety: prevents PXE services from leaking onto unintended networks"
  - decision: "BIOS/UEFI detection via DHCP option 93 (client-arch)"
    rationale: "Standard PXE approach, works with all major hypervisors and hardware"

requirements-completed: []
duration: 3 min
completed: 2026-02-18
---

# Phase 170 Plan 01: dnsmasq PXE/TFTP/DHCP Config + CentOS Boot Media Summary

dnsmasq PXE configuration template with DHCP/TFTP services scoped to a provisioning-only IP range, BIOS/UEFI client detection via DHCP option 93, and CentOS Stream 9 boot media download with SHA256 verification and TFTP root directory setup.

## Execution Stats

- Duration: ~3 min
- Tasks: 2 (1 config template + 1 scripts)
- Files created: 4
- Commits: 2 (a9825cb, 44b0ab5)

## Task Results

### Task 1: dnsmasq PXE/TFTP/DHCP Configuration Template
- Created `infra/templates/dnsmasq/pxe-boot.conf.template` with DHCP range, TFTP enable, BIOS/UEFI boot tags
- Created `infra/templates/dnsmasq/pxe-boot.local-values.example` with all template variables documented
- Template adds ONLY DHCP/TFTP/PXE services -- no DNS interference with existing dnsmasq config
- All site-specific values use `${VARIABLE}` syntax with zero hardcoded IPs

### Task 2: TFTP Root Setup and CentOS Boot Media Download
- Created `infra/scripts/setup-tftp-root.sh` (8.1KB) -- creates standard TFTP directory layout for both BIOS (pxelinux) and UEFI (grub) boot paths
- Created `infra/scripts/download-centos-boot-media.sh` (10.7KB) -- downloads and verifies CentOS Stream 9 vmlinuz + initrd.img with SHA256 checksums
- Both scripts: `set -euo pipefail`, parameterized via arguments, idempotent, clear error messages

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- PXE infrastructure foundation complete -- Plan 170-02 can create boot menus and deploy orchestrator
- TFTP root structure ready to receive boot menu files and CentOS media
- Template/local-values pattern continues from Phase 169

## Self-Check: PASSED

All 4 created files verified present. Both commit hashes (a9825cb, 44b0ab5) verified in git log.

---
*Phase: 170-pxe-boot-infrastructure*
*Completed: 2026-02-18*
