#!/usr/bin/env bash
# calculate-budget.sh -- Resource budget calculator
#
# Reads a hardware profile YAML and computes VM resource allocations
# while guaranteeing the host OS retains minimum 4GB RAM and 2 CPU cores.
#
# Usage:
#   calculate-budget.sh <hardware-values.yaml> [output-budget.yaml]
#
# If output path is omitted, defaults to infra/local/resource-budget.yaml
#
# Allocation rules:
#   - Host OS reserved: minimum 4GB RAM, 2 CPU cores (non-negotiable floor)
#   - Available for VMs = total - host_reserved
#   - If total RAM < 16GB OR virtualization == false: reject with exit 1
#   - Minecraft VM: min(available * 0.5, 16GB) RAM, min(available_cores * 0.5, 8) cores
#   - Remaining goes to unallocated pool
#
# Tiers:
#   - minimal:     16GB RAM
#   - comfortable:  32GB RAM
#   - generous:    64GB+ RAM
#
# Exit codes:
#   0 -- success, requirements met, budget generated
#   1 -- rejected, minimum requirements not met
#   2 -- usage error (missing arguments, bad input)

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_OUTPUT="${SCRIPT_DIR}/../local/resource-budget.yaml"

HOST_RESERVED_RAM_GB=4
HOST_RESERVED_CORES=2
MIN_RAM_GB=16
MC_MAX_RAM_GB=16
MC_MAX_CORES=8
MC_STORAGE_BASE_GB=50

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

if [[ $# -lt 1 ]]; then
    printf "Usage: %s <hardware-values.yaml> [output-budget.yaml]\n" "$(basename "$0")" >&2
    exit 2
fi

INPUT_FILE="$1"
OUTPUT_FILE="${2:-${DEFAULT_OUTPUT}}"

if [[ ! -f "${INPUT_FILE}" ]]; then
    printf "Error: Input file not found: %s\n" "${INPUT_FILE}" >&2
    exit 2
fi

# ---------------------------------------------------------------------------
# YAML parsing (grep/awk, no external dependencies)
# ---------------------------------------------------------------------------

# Extract a simple YAML value by key name
# Handles: "key: value", "key: \"value\"", nested keys (matches first occurrence)
yaml_get() {
    local key="$1"
    local file="$2"
    local match
    match="$(grep -E "^[[:space:]]*${key}:" "${file}" 2>/dev/null | head -1 || true)"
    if [[ -n "${match}" ]]; then
        echo "${match}" \
            | sed -E 's/^[^:]+:[[:space:]]*//' \
            | sed 's/[[:space:]]*#.*//' \
            | sed 's/^"//' \
            | sed 's/"$//' \
            | sed 's/^[[:space:]]*//' \
            | sed 's/[[:space:]]*$//'
    fi
}

# ---------------------------------------------------------------------------
# Read hardware profile
# ---------------------------------------------------------------------------

TOTAL_RAM_GB="$(yaml_get "total_gb" "${INPUT_FILE}")"
CORES_PHYSICAL="$(yaml_get "cores_physical" "${INPUT_FILE}")"
VIRTUALIZATION="$(yaml_get "virtualization" "${INPUT_FILE}")"

# Handle the case where total_gb appears multiple times (memory vs storage)
# We need the memory section's total_gb
# Parse more carefully: get the value after "memory:" section
TOTAL_RAM_GB="$(awk '
    /^memory:/ { in_memory=1; next }
    /^[a-z]/ && !/^[[:space:]]/ { in_memory=0 }
    in_memory && /total_gb:/ { gsub(/.*total_gb:[[:space:]]*/, ""); gsub(/[[:space:]]*#.*/, ""); print; exit }
' "${INPUT_FILE}")"

# Get cores_physical from cpu section
CORES_PHYSICAL="$(awk '
    /^cpu:/ { in_cpu=1; next }
    /^[a-z]/ && !/^[[:space:]]/ { in_cpu=0 }
    in_cpu && /cores_physical:/ { gsub(/.*cores_physical:[[:space:]]*/, ""); gsub(/[[:space:]]*#.*/, ""); print; exit }
' "${INPUT_FILE}")"

# Get virtualization from cpu section
VIRTUALIZATION="$(awk '
    /^cpu:/ { in_cpu=1; next }
    /^[a-z]/ && !/^[[:space:]]/ { in_cpu=0 }
    in_cpu && /^[[:space:]]+virtualization:/ { gsub(/.*virtualization:[[:space:]]*/, ""); gsub(/[[:space:]]*#.*/, ""); print; exit }
' "${INPUT_FILE}")"

# Fallback: if virtualization not in cpu section, check capabilities section
# (local hardware-values.yaml may not have virtualization field directly)
if [[ -z "${VIRTUALIZATION}" ]]; then
    VIRTUALIZATION="$(awk '
        /^capabilities:/ { in_cap=1; next }
        /^[a-z]/ && !/^[[:space:]]/ { in_cap=0 }
        in_cap && /can_run_vms:/ { gsub(/.*can_run_vms:[[:space:]]*/, ""); gsub(/[[:space:]]*#.*/, ""); print; exit }
    ' "${INPUT_FILE}")"
fi

# Fallback: try companion sanitized profile (same parent dir, inventory/hardware-profile.yaml)
if [[ -z "${VIRTUALIZATION}" ]]; then
    local_dir="$(dirname "${INPUT_FILE}")"
    parent_dir="$(dirname "${local_dir}")"
    profile_path="${parent_dir}/inventory/hardware-profile.yaml"
    if [[ -f "${profile_path}" ]]; then
        VIRTUALIZATION="$(awk '
            /^cpu:/ { in_cpu=1; next }
            /^[a-z]/ && !/^[[:space:]]/ { in_cpu=0 }
            in_cpu && /^[[:space:]]+virtualization:/ { gsub(/.*virtualization:[[:space:]]*/, ""); gsub(/[[:space:]]*#.*/, ""); print; exit }
        ' "${profile_path}")"
    fi
fi

# Get storage total_gb
STORAGE_TOTAL_GB="$(awk '
    /^storage:/ { in_storage=1; next }
    /^[a-z]/ && !/^[[:space:]]/ { in_storage=0 }
    in_storage && /total_gb:/ { gsub(/.*total_gb:[[:space:]]*/, ""); gsub(/[[:space:]]*#.*/, ""); print; exit }
' "${INPUT_FILE}")"

# Validate we got values
if [[ -z "${TOTAL_RAM_GB}" || -z "${CORES_PHYSICAL}" || -z "${VIRTUALIZATION}" ]]; then
    printf "Error: Could not parse required fields from %s\n" "${INPUT_FILE}" >&2
    printf "  total_gb (memory): '%s'\n" "${TOTAL_RAM_GB}" >&2
    printf "  cores_physical: '%s'\n" "${CORES_PHYSICAL}" >&2
    printf "  virtualization: '%s'\n" "${VIRTUALIZATION}" >&2
    exit 2
fi

# ---------------------------------------------------------------------------
# Minimum requirements check
# ---------------------------------------------------------------------------

REJECTION_REASONS=()

if [[ "${TOTAL_RAM_GB}" -lt "${MIN_RAM_GB}" ]]; then
    REJECTION_REASONS+=("Insufficient RAM (${TOTAL_RAM_GB}GB, need ${MIN_RAM_GB}GB)")
fi

if [[ "${VIRTUALIZATION}" != "true" ]]; then
    REJECTION_REASONS+=("No hardware virtualization")
fi

if [[ ${#REJECTION_REASONS[@]} -gt 0 ]]; then
    printf "Error: Minimum requirements not met:\n" >&2
    for reason in "${REJECTION_REASONS[@]}"; do
        printf "  - %s\n" "${reason}" >&2
    done
    exit 1
fi

# ---------------------------------------------------------------------------
# Calculate resource budget
# ---------------------------------------------------------------------------

# Host reserved (non-negotiable floor)
HOST_RAM="${HOST_RESERVED_RAM_GB}"
HOST_CORES="${HOST_RESERVED_CORES}"

# Available for VMs
VM_RAM=$(( TOTAL_RAM_GB - HOST_RAM ))
VM_CORES=$(( CORES_PHYSICAL - HOST_CORES ))

# Ensure VM available is non-negative
if [[ "${VM_RAM}" -lt 0 ]]; then VM_RAM=0; fi
if [[ "${VM_CORES}" -lt 0 ]]; then VM_CORES=0; fi

# Minecraft VM allocation: 50% of available, capped at maximums
MC_RAM=$(( VM_RAM / 2 ))
MC_CORES=$(( VM_CORES / 2 ))

# Apply caps
if [[ "${MC_RAM}" -gt "${MC_MAX_RAM_GB}" ]]; then MC_RAM="${MC_MAX_RAM_GB}"; fi
if [[ "${MC_CORES}" -gt "${MC_MAX_CORES}" ]]; then MC_CORES="${MC_MAX_CORES}"; fi

# Enforce minimum 1 core for Minecraft VM if any cores available
if [[ "${MC_CORES}" -lt 1 && "${VM_CORES}" -ge 1 ]]; then MC_CORES=1; fi

# Unallocated pool
UNALLOC_RAM=$(( VM_RAM - MC_RAM ))
UNALLOC_CORES=$(( VM_CORES - MC_CORES ))

# Storage allocation for Minecraft VM (base allocation)
MC_STORAGE="${MC_STORAGE_BASE_GB}"

# Determine tier
if [[ "${TOTAL_RAM_GB}" -ge 64 ]]; then
    TIER="generous"
elif [[ "${TOTAL_RAM_GB}" -ge 32 ]]; then
    TIER="comfortable"
else
    TIER="minimal"
fi

# ---------------------------------------------------------------------------
# Generate output YAML
# ---------------------------------------------------------------------------

mkdir -p "$(dirname "${OUTPUT_FILE}")"

cat > "${OUTPUT_FILE}" <<YAML
# Resource Budget (generated by calculate-budget.sh)
# Source: ${INPUT_FILE}
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

host_reserved:
  ram_gb: ${HOST_RAM}
  cores: ${HOST_CORES}

vm_available:
  ram_gb: ${VM_RAM}
  cores: ${VM_CORES}

minecraft_vm:
  ram_gb: ${MC_RAM}
  cores: ${MC_CORES}
  storage_gb: ${MC_STORAGE}

unallocated:
  ram_gb: ${UNALLOC_RAM}
  cores: ${UNALLOC_CORES}

meets_requirements: true
tier: ${TIER}
YAML

printf "Resource budget generated: %s\n" "${OUTPUT_FILE}" >&2
printf "  Tier: %s (%sGB RAM, %s cores)\n" "${TIER}" "${TOTAL_RAM_GB}" "${CORES_PHYSICAL}" >&2
printf "  Host reserved: %sGB RAM, %s cores\n" "${HOST_RAM}" "${HOST_CORES}" >&2
printf "  Minecraft VM: %sGB RAM, %s cores, %sGB storage\n" "${MC_RAM}" "${MC_CORES}" "${MC_STORAGE}" >&2
printf "  Unallocated: %sGB RAM, %s cores\n" "${UNALLOC_RAM}" "${UNALLOC_CORES}" >&2

exit 0
