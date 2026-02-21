---
name: resource-budgeting
description: "Calculates VM resource allocations from hardware profiles using integer arithmetic with host floor guarantees. Use when sizing VMs, planning resource allocation, or checking available capacity."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "resource.*budget"
          - "vm.*allocat"
          - "calculate.*budget"
          - "how much.*ram"
          - "vm.*sizing"
        files:
          - "infra/scripts/calculate-budget.sh"
          - "infra/local/resource-budget.yaml"
        contexts:
          - "vm provisioning"
          - "resource planning"
        threshold: 0.7
      token_budget: "1%"
      version: 1
      enabled: true
      plan_origin: "01-infrastructure-foundation"
      phase_origin: "169"
---

# Resource Budgeting

## Purpose

Calculates optimal VM resource allocations from hardware profiles using integer-only bash arithmetic. Enforces non-negotiable host floor reserves (4GB RAM, 2 cores) and applies three-tier classification (minimal/comfortable/generous) to determine Minecraft VM sizing. Produces a resource-budget.yaml consumed by provisioning scripts.

## Capabilities

- Integer-only arithmetic for reliable bash resource calculations
- Three-tier hardware classification: minimal (16GB), comfortable (32GB), generous (64GB+)
- Non-negotiable host floor: 4GB RAM + 2 cores reserved before any VM allocation
- Minecraft VM caps: 16GB RAM and 8 cores maximum (50% of available, whichever is less)
- Multi-format YAML parsing with companion profile fallback
- Generates resource-budget.yaml with host_reserved, vm_allocated, and tier sections

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/calculate-budget.sh` | Main resource budget calculator reading hardware profiles |

## Dependencies

- `infra/scripts/discover-hardware.sh` output (hardware-profile.yaml or hardware-capabilities.yaml)
- Bash 4.0+ for arithmetic operations
- No external dependencies -- pure bash integer arithmetic

## Usage Examples

**Calculate budget from current hardware profile:**
```bash
infra/scripts/discover-hardware.sh   # Generate profile first
infra/scripts/calculate-budget.sh    # Calculate allocations
# Produces: infra/local/resource-budget.yaml
```

**Check available capacity:**
```bash
infra/scripts/calculate-budget.sh
grep 'vm_ram_mb:' infra/local/resource-budget.yaml
```

**Use in provisioning pipeline:**
```bash
infra/scripts/calculate-budget.sh
infra/scripts/provision-vm.sh --from-budget  # Reads resource-budget.yaml
```

## Test Cases

### Test 1: Host floor guarantee
- **Input:** Run with 32GB RAM fixture hardware profile
- **Expected:** host_reserved_ram >= 4GB and host_reserved_cores >= 2
- **Verify:** `grep 'host_reserved_ram_mb:' infra/local/resource-budget.yaml | awk '{print $2}'` returns >= 4096

### Test 2: VM cap enforcement
- **Input:** Run with 128GB RAM fixture (generous tier)
- **Expected:** vm_ram_mb <= 16384 (16GB cap) and vm_cores <= 8
- **Verify:** `grep 'vm_ram_mb:' infra/local/resource-budget.yaml | awk '{print $2}'` returns <= 16384

### Test 3: Tier classification
- **Input:** Run with 32GB fixture
- **Expected:** tier is "comfortable"
- **Verify:** `grep 'tier:' infra/local/resource-budget.yaml` shows "comfortable"

## Token Budget Rationale

1% budget is sufficient for calculate-budget.sh (~150 lines) which performs straightforward integer arithmetic. The script is self-contained with no library dependencies, and its output format is simple YAML key-value pairs.
