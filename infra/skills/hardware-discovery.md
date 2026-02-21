---
name: hardware-discovery
description: "Discovers hardware capabilities (CPU, RAM, storage, GPU, hypervisor) on Linux systems and generates machine-readable YAML profiles. Use when profiling hardware, generating capability reports, or preparing for VM provisioning."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "discover.*hardware"
          - "hardware.*profile"
          - "hardware.*capabilit"
          - "system.*inventory"
          - "what.*hardware"
        files:
          - "infra/scripts/discover-hardware.sh"
          - "infra/inventory/hardware-*.yaml"
          - "infra/scripts/lib/discovery-common.sh"
        contexts:
          - "provisioning setup"
          - "hardware profiling"
        threshold: 0.7
      token_budget: "1.5%"
      version: 1
      enabled: true
      plan_origin: "01-infrastructure-foundation"
      phase_origin: "169"
---

# Hardware Discovery

## Purpose

Discovers and profiles hardware capabilities on Linux systems, producing machine-readable YAML output for downstream provisioning decisions. Generates both a sanitized profile (safe for version control, no MACs or serials) and a local profile (gitignored, full detail) from a single script run. Essential first step before VM provisioning, resource budgeting, or any hardware-dependent configuration.

## Capabilities

- Detects CPU model, core count, and virtualization support (VT-x/AMD-V)
- Reports total and available RAM with DIMM slot details
- Inventories storage devices with capacity, type (SSD/HDD/NVMe), and mount points
- Identifies GPU vendor, model, VRAM, and driver information
- Detects hypervisor capabilities (KVM, VMware, VirtualBox)
- Produces dual YAML output: sanitized (git-safe) and local (gitignored)
- Enforces minimum requirements threshold: 16GB RAM + CPU virtualization support
- Uses shared discovery-common.sh library for consistent YAML emission

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/discover-hardware.sh` | Main hardware discovery script producing YAML profiles |
| `infra/scripts/lib/discovery-common.sh` | Shared library for printf-based YAML emission and common utilities |

## Dependencies

- Linux system with `/proc/cpuinfo`, `/proc/meminfo`, `lspci`, `lsblk`
- `dmidecode` (optional, for DIMM details; requires root)
- No external YAML libraries -- uses printf-based YAML emission
- Bash 4.0+ for associative arrays

## Usage Examples

**Discover hardware on current system:**
```bash
infra/scripts/discover-hardware.sh
# Produces: infra/inventory/hardware-profile.yaml (local)
#           infra/inventory/hardware-capabilities.yaml (sanitized)
```

**Check if system meets minimum requirements:**
```bash
infra/scripts/discover-hardware.sh && echo "Meets requirements"
# Exit code 1 if below 16GB RAM or no virtualization support
```

**Use profile for downstream provisioning:**
```bash
infra/scripts/discover-hardware.sh
infra/scripts/calculate-budget.sh  # Reads hardware-profile.yaml
```

## Test Cases

### Test 1: YAML output structure
- **Input:** Run `discover-hardware.sh` on current system
- **Expected:** YAML output contains cpu, memory, storage, gpu, and hypervisor top-level sections
- **Verify:** `grep -c '^\(cpu\|memory\|storage\|gpu\|hypervisor\):' infra/inventory/hardware-capabilities.yaml` returns 5

### Test 2: Sanitized output excludes sensitive data
- **Input:** Compare hardware-capabilities.yaml with hardware-profile.yaml
- **Expected:** Sanitized file excludes MAC addresses, serial numbers, hostnames, PCI slot addresses
- **Verify:** `grep -ci 'serial\|mac_address\|hostname' infra/inventory/hardware-capabilities.yaml` returns 0

### Test 3: Minimum requirements check
- **Input:** Run on system with <16GB RAM (mocked)
- **Expected:** Script exits with code 1 and reports insufficient resources
- **Verify:** Check exit code is non-zero

## Token Budget Rationale

1.5% budget reflects the moderate complexity of discover-hardware.sh (~200 lines) plus the shared discovery-common.sh library. The script's output is structured YAML that downstream skills (resource-budgeting, vm-lifecycle) consume, making it a foundational skill that needs sufficient context for correct invocation.
