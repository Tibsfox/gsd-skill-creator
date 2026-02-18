---
name: hypervisor-abstraction
description: "Provides unified VM and container operations across KVM/libvirt, VMware Workstation, VirtualBox, and Podman/Docker with automatic backend detection. Use when writing hypervisor-agnostic VM scripts or deploying containers as VM fallback."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "hypervisor.*(abstract|detect|manage)"
          - "container.*(fallback|deploy)"
          - "vm.*ctl"
          - "podman.*minecraft"
          - "unified.*vm"
        files:
          - "infra/scripts/vm-ctl.sh"
          - "infra/scripts/container-ctl.sh"
          - "infra/scripts/lib/hypervisor-common.sh"
          - "infra/scripts/lib/hv-*.sh"
          - "infra/scripts/lib/container-fallback.sh"
        contexts:
          - "hypervisor management"
          - "container deployment"
        threshold: 0.7
      token_budget: "2%"
      version: 1
      enabled: true
      plan_origin: "03-platform-portability"
      phase_origin: "180"
---

# Hypervisor Abstraction

## Purpose

Provides a platform-level unified interface for VM and container operations across multiple hypervisor backends. This is distinct from the vm-lifecycle skill (infrastructure-level provisioning pipeline via provision-vm.sh) -- hypervisor-abstraction handles backend dispatch via vm-ctl.sh for day-to-day VM operations and container-ctl.sh for Podman/Docker container management as a VM fallback.

## Capabilities

- Unified VM operations across KVM/libvirt, VMware Workstation, and VirtualBox
- Container operations via Podman (preferred, rootless/daemonless) with Docker fallback
- itzg/minecraft-server with Fabric 1.21.4 as standard container image
- Automatic backend detection with hypervisor preference: KVM > VMware > VirtualBox > container
- Static hand-maintained capability matrix YAML for feature gating
- Container exit codes match vm-ctl.sh convention (0=ok, 1=error, 2=no runtime, 3=args)
- Backend-specific implementations in lib/hv-*.sh modules

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/vm-ctl.sh` | Unified VM control dispatcher across hypervisors |
| `infra/scripts/container-ctl.sh` | Container operations with Podman/Docker for VM fallback |
| `infra/scripts/lib/hypervisor-common.sh` | Shared hypervisor utility functions |
| `infra/scripts/lib/hv-kvm.sh` | KVM/libvirt backend implementation |
| `infra/scripts/lib/hv-vmware.sh` | VMware Workstation backend implementation |
| `infra/scripts/lib/hv-vbox.sh` | VirtualBox backend implementation |
| `infra/scripts/lib/container-fallback.sh` | Container-as-VM-fallback logic |

## Dependencies

- At least one hypervisor: KVM/libvirt, VMware Workstation, VirtualBox, or Podman/Docker
- `virsh` for KVM, `vmrun` for VMware, `VBoxManage` for VirtualBox
- `podman` (preferred) or `docker` for container backend
- Hardware capabilities YAML from discover-all.sh for backend selection

## Usage Examples

**Start a VM via unified interface:**
```bash
infra/scripts/vm-ctl.sh start minecraft-server
# Automatically dispatches to detected hypervisor backend
```

**Deploy Minecraft as container fallback:**
```bash
infra/scripts/container-ctl.sh deploy minecraft \
  --image itzg/minecraft-server \
  --env TYPE=FABRIC
```

**Check VM status across backends:**
```bash
infra/scripts/vm-ctl.sh status minecraft-server
# Works regardless of which hypervisor manages the VM
```

## Test Cases

### Test 1: Backend dispatch
- **Input:** Run `vm-ctl.sh status` with mock backend
- **Expected:** Correct backend detected and dispatched (KVM if virsh available, etc.)
- **Verify:** Output indicates which backend was used

### Test 2: Container fallback
- **Input:** Run on system with no hypervisor but Podman installed
- **Expected:** container-ctl.sh used as fallback with itzg/minecraft-server image
- **Verify:** `podman ps` shows minecraft container after deployment

### Test 3: Exit code convention
- **Input:** Run container-ctl.sh with invalid arguments
- **Expected:** Exit code 3 (matching vm-ctl.sh convention for argument errors)
- **Verify:** `container-ctl.sh --bad-arg; echo $?` returns 3

## Token Budget Rationale

2% budget reflects the multi-backend architecture: vm-ctl.sh dispatcher, container-ctl.sh fallback, shared library, and three hypervisor-specific backend modules. Understanding the dispatch pattern and capability matrix requires sufficient context for correct backend selection and operation routing.
