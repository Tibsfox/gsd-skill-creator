---
phase: 172-vm-provisioning-automation
plan: 01
subsystem: infra
tags: [bash, kvm, vmware, virsh, virt-install, vmrun, vm-provisioning, idempotent, qcow2, vmdk]

requires:
  - phase: 169-02
    provides: "Resource budget calculator (calculate-budget.sh) generating resource-budget.yaml for VM sizing defaults"
  - phase: 170-02
    provides: "Template renderer and deploy orchestrator patterns (colored logging, dry-run, step numbering)"
  - phase: 178-02
    provides: "Hardware capabilities YAML with hypervisor section (kvm/vmware/virtualbox boolean flags)"
provides:
  - "Shared VM provisioning library (vm-common.sh) with backend detection, parameter validation, logging"
  - "KVM/libvirt backend (vm-backend-kvm.sh) implementing create/start/stop/snapshot/clone/destroy via virsh"
  - "VMware Workstation backend (vm-backend-vmware.sh) implementing same operations via vmrun"
  - "Example local-values file documenting all VM provisioning parameters per hypervisor"
affects:
  - "172-02 (VM lifecycle manager and provisioning orchestrator will use these backends)"
  - "197 (Golden image rapid rebuild uses clone/snapshot operations)"
  - "173 (Minecraft server deployment will call these backends for VM creation)"

tech-stack:
  added: [virsh, virt-install, virt-clone, vmrun, vmware-vdiskmanager]
  patterns: [backend-dispatch, idempotent-operations, infrastructure-provisioning-pipeline, local-values-loading]

key-files:
  created:
    - infra/scripts/lib/vm-common.sh
    - infra/scripts/vm-backend-kvm.sh
    - infra/scripts/vm-backend-vmware.sh
    - infra/templates/vm/vm-provisioning.local-values.example
  modified: []

key-decisions:
  - "Infrastructure-level backends separate from Phase 180 platform-level abstraction -- 172 handles full provisioning pipeline (kickstart, PXE, storage dirs, OS variant)"
  - "KVM priority order for auto-detection (open standard, per PROJECT.md libvirt/KVM primary)"
  - "60-second graceful shutdown timeout with force fallback (vs 30s in Phase 180 platform layer)"
  - "VM_BACKEND environment variable override for explicit backend selection without capabilities YAML"
  - "Parameter validation reports ALL failures at once (not fail-fast on first error)"

patterns-established:
  - "VM backend dispatch: subcommand + options CLI pattern with --values, --name, --dry-run"
  - "Idempotent VM operations: every operation checks state before acting, running twice produces no errors"
  - "Infrastructure provisioning pipeline: local-values -> validate -> create/manage with backend-specific tooling"
  - "Resource-budget fallback: vm_load_values reads sizing from resource-budget.yaml when local-values omits them"

requirements-completed: [INFRA-10]

duration: 5min
completed: 2026-02-18
---

# Phase 172 Plan 01: Shared VM Library + KVM and VMware Backend Scripts Summary

**Hypervisor-agnostic VM provisioning backends for KVM/libvirt and VMware Workstation with shared validation library, auto-detection from hardware capabilities, and idempotent create/start/stop/snapshot/clone/destroy operations**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-18T07:22:16Z
- **Completed:** 2026-02-18T07:27:41Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments

- 262-line shared VM library providing backend auto-detection from hardware-capabilities.yaml, parameter validation, colored logging, and local-values loading with resource-budget.yaml fallback
- 504-line KVM backend implementing 6 VM operations via virsh/virt-install with PXE, ISO, and kickstart boot modes
- 636-line VMware backend implementing 6 VM operations via vmrun/vmware-vdiskmanager with .vmx generation and parameterized hardware config
- 74-line example local-values file documenting all provisioning variables with per-hypervisor guidance

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared VM library and example local-values** - `84b462d` (feat) -- vm-common.sh + local-values example
2. **Task 2: KVM/libvirt and VMware Workstation backend scripts** - `4e6a0e4` (feat) -- vm-backend-kvm.sh + vm-backend-vmware.sh

## Files Created/Modified

- `infra/scripts/lib/vm-common.sh` - Shared VM provisioning library (backend detection, parameter validation, logging, values loading)
- `infra/scripts/vm-backend-kvm.sh` - KVM/libvirt backend with virsh/virt-install operations
- `infra/scripts/vm-backend-vmware.sh` - VMware Workstation backend with vmrun/vmware-vdiskmanager operations
- `infra/templates/vm/vm-provisioning.local-values.example` - Example local-values with all provisioning variables documented

## Decisions Made

- **Infrastructure vs platform layer separation:** Phase 172 backends handle full provisioning pipeline (kickstart URLs, PXE boot order, storage directories, OS variant) while Phase 180 backends handle platform-level abstraction (simple create with minimal args). Both layers coexist intentionally.
- **60-second shutdown timeout:** Infrastructure provisioning requires more patience for graceful shutdown than platform operations (30s in Phase 180), since VMs may be mid-install or running services.
- **VM_BACKEND environment override:** Allows explicit backend selection without requiring hardware-capabilities.yaml, useful for testing and CI environments.
- **All-at-once validation:** vm_validate_params reports all parameter failures simultaneously, not fail-fast. Better UX when multiple parameters are wrong.
- **Resource-budget.yaml fallback:** When local-values file omits VM sizing, the loader falls back to minecraft_vm allocation from calculate-budget.sh output, connecting the hardware discovery pipeline to VM provisioning.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Copy `infra/templates/vm/vm-provisioning.local-values.example` to `infra/local/vm-provisioning.local-values` and edit for your site.

## Next Phase Readiness

- Phase 172-01 complete -- both VM backends and shared library ready
- Phase 172-02 (VM lifecycle manager + provisioning orchestrator) can import these backends
- Both backends accept identical parameters and follow the same subcommand dispatch pattern
- To create a KVM VM: `bash infra/scripts/vm-backend-kvm.sh create --values infra/local/vm-provisioning.local-values`
- To preview: add `--dry-run` to any command

## Self-Check: PASSED

All 4 created files verified present. Both commit hashes (84b462d, 4e6a0e4) verified in git log. vm-common.sh: 262 lines (min 80). vm-backend-kvm.sh: 504 lines (min 150). vm-backend-vmware.sh: 636 lines (min 150). local-values example: 74 lines (min 20).

---
*Phase: 172-vm-provisioning-automation*
*Completed: 2026-02-18*
