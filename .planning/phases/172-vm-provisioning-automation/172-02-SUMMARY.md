---
phase: 172-vm-provisioning-automation
plan: 02
subsystem: infra
tags: [bash, vm-lifecycle, provisioning-orchestrator, golden-image, idempotent, dry-run, kvm, vmware, test-suite]

requires:
  - phase: 172-01
    provides: "Shared VM library (vm-common.sh) and KVM/VMware backend scripts for create/start/stop/snapshot/clone/destroy"
  - phase: 170-02
    provides: "deploy-pxe.sh orchestrator pattern (numbered steps, colored output, dry-run, validation-first)"
  - phase: 169-02
    provides: "Resource budget calculator generating resource-budget.yaml for VM sizing"
provides:
  - "Unified VM lifecycle manager (vm-lifecycle.sh) dispatching to auto-detected KVM or VMware backend"
  - "Master provisioning orchestrator (provision-vm.sh) with fresh/golden/clone/destroy modes"
  - "Test suite with 71 assertions validating parameter validation, backend detection, idempotent operations, and provisioning modes"
  - "Three test fixtures for deterministic backend detection across KVM, VMware, and no-backend scenarios"
affects:
  - "173 (Minecraft server deployment uses provision-vm.sh for VM creation)"
  - "197 (Golden image rapid rebuild uses clone mode for <5 minute recovery)"
  - "177 (Integration verification tests the complete PXE-to-playing pipeline via provision-vm.sh)"

tech-stack:
  added: []
  patterns: [unified-dispatcher, golden-image-workflow, mode-based-orchestration, backend-function-dispatch]

key-files:
  created:
    - infra/scripts/vm-lifecycle.sh
    - infra/scripts/provision-vm.sh
    - infra/tests/test-vm-lifecycle.sh
    - infra/tests/fixtures/vm-capabilities-kvm.yaml
    - infra/tests/fixtures/vm-capabilities-vmware.yaml
    - infra/tests/fixtures/vm-capabilities-none.yaml
  modified:
    - infra/scripts/vm-backend-kvm.sh
    - infra/scripts/vm-backend-vmware.sh

key-decisions:
  - "vm-lifecycle.sh dispatches via function references (vm_do_create etc.) rather than subshell calls for performance"
  - "Backend scripts support --_sourced flag to allow importing functions without executing main()"
  - "DRY_RUN state preserved across backend sourcing (backends reset DRY_RUN=false at top-level)"
  - "provision-vm.sh calls vm-lifecycle.sh exclusively (never calls backends directly) for single point of backend selection"
  - "Clone mode measures and reports against 5-minute INFRA-11 target with explicit YES/NO indicator"
  - "destroy subcommand requires --force flag as safety guard against accidental deletion"

patterns-established:
  - "Unified dispatcher: single script sources backend and maps functions to generic names for all operations"
  - "Golden image workflow: fresh -> golden (snapshot) -> clone pipeline with timing measurement"
  - "Mode-based orchestration: --mode flag selects entire workflow (fresh/golden/clone/destroy) with mode-specific validation"
  - "Backend function dispatch: vm_do_create/start/stop/etc. variables point to backend-specific functions"

requirements-completed: [INFRA-11, INFRA-12]

duration: 9min
completed: 2026-02-18
---

# Phase 172 Plan 02: Unified VM Lifecycle Manager, Provisioning Orchestrator, and Test Suite Summary

**Single-entry-point VM lifecycle management with auto-detected backend dispatch, golden image provisioning workflow with 4 modes, and 71-assertion test suite validating all operations without requiring hypervisor installation**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-18T07:31:26Z
- **Completed:** 2026-02-18T07:40:15Z
- **Tasks:** 3
- **Files created:** 6
- **Files modified:** 2

## Accomplishments

- 656-line unified VM lifecycle manager (vm-lifecycle.sh) with 8 subcommands (create, start, stop, snapshot, clone, destroy, status, list) dispatching to auto-detected KVM or VMware backend
- 750-line master provisioning orchestrator (provision-vm.sh) with 4 modes: fresh (PXE/kickstart), golden (snapshot), clone (<5 min target), and destroy -- following deploy-pxe.sh numbered-step pattern
- 525-line test suite with 71 assertions across 5 test groups: parameter validation (15), backend detection (11), idempotent operations (16), provisioning orchestrator (15), and local-values loading (14)
- 3 YAML fixtures enabling deterministic backend detection testing across KVM-only, VMware-only, and no-hypervisor scenarios
- Updated backend scripts (vm-backend-kvm.sh, vm-backend-vmware.sh) to support sourcing via --_sourced flag without executing main()

## Task Commits

Each task was committed atomically:

1. **Task 1: Unified VM lifecycle manager** - `1502743` (feat) -- vm-lifecycle.sh with backend dispatch + backend script --_sourced support
2. **Task 2: Master provisioning orchestrator** - `89c2ca0` (feat) -- provision-vm.sh with 4 modes and resource-budget.yaml integration
3. **Task 3: Test suite with fixtures** - `d8dd338` (test) -- 71-assertion test suite with 3 capability fixtures

## Files Created/Modified

- `infra/scripts/vm-lifecycle.sh` - Unified VM lifecycle manager (656 lines), auto-detects backend, dispatches to KVM or VMware
- `infra/scripts/provision-vm.sh` - Master provisioning orchestrator (750 lines), 4 modes with timing measurement
- `infra/tests/test-vm-lifecycle.sh` - Test suite (525 lines), 71 assertions across 5 groups
- `infra/tests/fixtures/vm-capabilities-kvm.yaml` - KVM-only hypervisor capability fixture
- `infra/tests/fixtures/vm-capabilities-vmware.yaml` - VMware-only hypervisor capability fixture
- `infra/tests/fixtures/vm-capabilities-none.yaml` - No-hypervisor capability fixture (error path testing)
- `infra/scripts/vm-backend-kvm.sh` - Modified: added --_sourced guard for function-only import
- `infra/scripts/vm-backend-vmware.sh` - Modified: added --_sourced guard for function-only import

## Decisions Made

- **Function dispatch over subshell calls:** vm-lifecycle.sh uses `vm_do_create=kvm_create` variable assignment and calls `${vm_do_create}` for zero-overhead dispatch, avoiding the cost of spawning subshells for every operation.
- **DRY_RUN preservation:** Backend scripts reset `DRY_RUN=false` at top level when sourced. The lifecycle manager saves/restores DRY_RUN around source commands to prevent losing dry-run state.
- **Single integration point:** provision-vm.sh never calls backend scripts directly -- it always goes through vm-lifecycle.sh, ensuring backend selection happens in exactly one place.
- **Explicit safety:** destroy requires `--force` flag. This prevents accidental VM deletion via tab-completion or command history mistakes.
- **Clone timing target:** Clone mode explicitly measures execution time and reports whether the INFRA-11 under-5-minute target was met, making performance regression visible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Backend scripts needed --_sourced support for sourcing**
- **Found during:** Task 1
- **Issue:** Backend scripts had `main "$@"` at the end which would execute when sourced by vm-lifecycle.sh
- **Fix:** Added `--_sourced` guard: `if [[ "${1:-}" != "--_sourced" ]]; then main "$@"; fi`
- **Files modified:** infra/scripts/vm-backend-kvm.sh, infra/scripts/vm-backend-vmware.sh
- **Commit:** 1502743

**2. [Rule 1 - Bug] DRY_RUN reset by sourced backend scripts**
- **Found during:** Task 1
- **Issue:** When vm-lifecycle.sh sourced a backend script, the backend's `DRY_RUN=false` declaration overwrote the lifecycle manager's DRY_RUN state, causing dry-run mode to silently fail
- **Fix:** Save/restore DRY_RUN around source commands: `local _saved_dry_run="${DRY_RUN}"; source ...; DRY_RUN="${_saved_dry_run}"`
- **Files modified:** infra/scripts/vm-lifecycle.sh
- **Commit:** 1502743

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None -- no external service configuration required. Both vm-lifecycle.sh and provision-vm.sh work immediately in `--dry-run` mode for preview. For live operations, ensure:
- KVM: `virsh` and `virt-install` installed (libvirt-daemon-system)
- VMware: `vmrun` installed (VMware Workstation/Fusion)
- Local values: Copy `infra/templates/vm/vm-provisioning.local-values.example` to `infra/local/vm-provisioning.local-values`

## Next Phase Readiness

- Phase 172 complete -- both plans executed successfully
- Phase 173 (Server Foundation) can use `provision-vm.sh --mode fresh` to create the Minecraft VM
- Phase 197 (Golden Image & Rapid Rebuild) can use `provision-vm.sh --mode clone` for <5 minute recovery
- Phase 177 (Integration Verification) can test the complete PXE-to-playing pipeline

## Self-Check: PASSED

All 6 created files verified present. All 3 commit hashes (1502743, 89c2ca0, d8dd338) verified in git log. vm-lifecycle.sh: 656 lines (min 120). provision-vm.sh: 750 lines (min 150). test-vm-lifecycle.sh: 525 lines (min 100). All 3 fixtures: 6 lines each (min 5). Test suite passes: 71/71 assertions.

---
*Phase: 172-vm-provisioning-automation*
*Completed: 2026-02-18*
