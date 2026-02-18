---
name: vm-lifecycle
description: "Manages VM lifecycle operations (create, start, stop, snapshot, clone, destroy) across KVM/libvirt and VMware Workstation backends with idempotent operations. Use when creating, managing, or provisioning virtual machines."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "vm.*(create|start|stop|snapshot|clone|destroy)"
          - "provision.*vm"
          - "virtual.*machine"
          - "golden.*image"
        files:
          - "infra/scripts/vm-lifecycle.sh"
          - "infra/scripts/provision-vm.sh"
          - "infra/scripts/vm-backend-*.sh"
          - "infra/scripts/lib/vm-common.sh"
        contexts:
          - "vm management"
          - "infrastructure provisioning"
        threshold: 0.7
      token_budget: "2%"
      version: 1
      enabled: true
      plan_origin: "01-infrastructure-foundation"
      phase_origin: "172"
---

# VM Lifecycle

## Purpose

Manages the complete VM lifecycle (create, start, stop, snapshot, clone, destroy) across KVM/libvirt and VMware Workstation backends. This is the infrastructure-level provisioning pipeline -- distinct from the platform-level hypervisor-abstraction skill which handles backend dispatch via vm-ctl.sh. Uses function-reference dispatch for zero-overhead backend switching and enforces idempotent operations.

## Capabilities

- Full VM lifecycle: create, start, stop, snapshot, clone, destroy
- Multi-backend support: KVM/libvirt (vm-backend-kvm.sh) and VMware Workstation (vm-backend-vmware.sh)
- Function-reference dispatch (vm_do_create etc.) for zero-overhead backend switching
- Backend scripts support `--_sourced` flag for function-only import
- Idempotent operations: running start on a started VM is a no-op
- 60-second graceful shutdown timeout with force fallback
- Clone mode measures and reports against 5-minute INFRA-11 target
- `destroy` subcommand requires `--force` safety flag
- DRY_RUN state preserved across backend sourcing
- VM_BACKEND environment variable override for explicit backend selection
- Parameter validation reports ALL failures at once (not fail-fast)

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/vm-lifecycle.sh` | Main VM lifecycle manager with backend dispatch |
| `infra/scripts/provision-vm.sh` | High-level provisioning pipeline (calls vm-lifecycle.sh) |
| `infra/scripts/vm-backend-kvm.sh` | KVM/libvirt backend implementation |
| `infra/scripts/vm-backend-vmware.sh` | VMware Workstation backend implementation |
| `infra/scripts/lib/vm-common.sh` | Shared VM utility functions |

## Dependencies

- Resource budget from `calculate-budget.sh` (resource-budgeting skill)
- Hardware profile from `discover-hardware.sh` (hardware-discovery skill)
- KVM/libvirt or VMware Workstation installed on host
- `virsh` CLI for KVM backend; `vmrun` CLI for VMware backend
- Bash 4.0+ for function references and associative arrays

## Usage Examples

**Create a new VM:**
```bash
infra/scripts/vm-lifecycle.sh create \
  --name minecraft-server \
  --ram 8192 --cores 4 --disk 50G
```

**Snapshot before changes:**
```bash
infra/scripts/vm-lifecycle.sh snapshot \
  --name minecraft-server \
  --snapshot-name pre-upgrade
```

**Clone from golden image:**
```bash
infra/scripts/vm-lifecycle.sh clone \
  --source golden-centos9 \
  --name minecraft-server
# Reports time against 5-minute target
```

**Destroy with safety flag:**
```bash
infra/scripts/vm-lifecycle.sh destroy --name minecraft-server --force
```

## Test Cases

### Test 1: Idempotent start
- **Input:** Run `vm-lifecycle.sh start` twice on the same VM
- **Expected:** Second invocation is a no-op (exit code 0, no error)
- **Verify:** `vm-lifecycle.sh status --name test-vm` shows "running" after both calls

### Test 2: Destroy requires --force
- **Input:** Run `vm-lifecycle.sh destroy --name test-vm` without `--force`
- **Expected:** Command exits with error, VM not destroyed
- **Verify:** Exit code is non-zero and VM still exists in `vm-lifecycle.sh list`

### Test 3: Backend dispatch
- **Input:** Set `VM_BACKEND=kvm` and run `vm-lifecycle.sh status`
- **Expected:** Uses KVM backend functions (virsh-based)
- **Verify:** Dry-run output shows virsh commands

## Token Budget Rationale

2% budget reflects the multi-file nature of this skill: vm-lifecycle.sh (~300 lines), provision-vm.sh (~150 lines), two backend scripts (~200 lines each), and lib/vm-common.sh. The function-reference dispatch pattern and multi-backend architecture require sufficient context for correct usage.
