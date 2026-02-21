# hypervisor-common.sh -- Shared hypervisor abstraction interface and backend dispatcher
#
# Sourced by vm-ctl.sh and hypervisor backend files.
# Provides backend detection, loading, dispatch, and the operation interface contract.
#
# This file has NO shebang -- it is meant to be sourced, not executed directly.
# All functions use local variables and produce no side effects when sourced.
#
# Required backends implement these functions with prefix hv_{backend}_:
#   create (name, cpus, ram_mb, disk_gb, iso_path)
#   start (name)
#   stop (name)
#   snapshot (name, snap_name)
#   destroy (name)
#   status (name)
#   list ()

set -euo pipefail

# Source discovery-common.sh for YAML helpers, has_command, warn
_HC_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=discovery-common.sh
source "${_HC_LIB_DIR}/discovery-common.sh"

# ---------------------------------------------------------------------------
# Backend state
# ---------------------------------------------------------------------------

# Currently loaded backend name (empty if none loaded)
HV_BACKEND=""

# Known operations that every backend must implement
HV_OPERATIONS="create start stop snapshot destroy status list"

# ---------------------------------------------------------------------------
# Backend auto-detection
# ---------------------------------------------------------------------------

# Detect the best available hypervisor backend from hardware-capabilities.yaml
# Priority: kvm > vmware > virtualbox (prefer open standard)
#
# Reads from $CAPABILITIES_YAML if set, otherwise tries standard paths.
# Returns backend name string via stdout, or "none" if no backend found.
hv_detect_backend() {
    local caps_file="${CAPABILITIES_YAML:-}"
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # Try standard paths if not explicitly set
    if [[ -z "${caps_file}" ]]; then
        local inventory_dir="${script_dir}/../../inventory"
        if [[ -f "${inventory_dir}/hardware-capabilities.yaml" ]]; then
            caps_file="${inventory_dir}/hardware-capabilities.yaml"
        elif [[ -f "${inventory_dir}/../local/hardware-capabilities-local.yaml" ]]; then
            caps_file="${inventory_dir}/../local/hardware-capabilities-local.yaml"
        fi
    fi

    if [[ -z "${caps_file}" || ! -f "${caps_file}" ]]; then
        warn "No hardware-capabilities.yaml found for backend detection"
        echo "none"
        return 0
    fi

    # Parse hypervisor section from YAML (simple grep-based)
    local kvm_val vmware_val vbox_val

    kvm_val=$(grep -E '^\s+kvm:\s' "${caps_file}" 2>/dev/null | head -1 | sed 's/^[^:]*:\s*//' | tr -d '[:space:]') || true
    vmware_val=$(grep -E '^\s+vmware:\s' "${caps_file}" 2>/dev/null | head -1 | sed 's/^[^:]*:\s*//' | tr -d '[:space:]') || true
    vbox_val=$(grep -E '^\s+virtualbox:\s' "${caps_file}" 2>/dev/null | head -1 | sed 's/^[^:]*:\s*//' | tr -d '[:space:]') || true

    # Priority: kvm > vmware > virtualbox
    if [[ "${kvm_val}" == "true" ]]; then
        echo "kvm"
        return 0
    fi
    if [[ "${vmware_val}" == "true" ]]; then
        echo "vmware"
        return 0
    fi
    if [[ "${vbox_val}" == "true" ]]; then
        echo "vbox"
        return 0
    fi

    echo "none"
    return 0
}

# ---------------------------------------------------------------------------
# Backend loading
# ---------------------------------------------------------------------------

# Load a specific hypervisor backend by name
# Sources the matching hv-{backend}.sh from the lib/ directory.
# Exits 1 with clear message if backend file not found.
#
# Usage: hv_load_backend "kvm"
hv_load_backend() {
    local backend="$1"
    local lib_dir
    lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local backend_file="${lib_dir}/hv-${backend}.sh"

    if [[ ! -f "${backend_file}" ]]; then
        printf "[ERROR] Hypervisor backend file not found: %s\n" "${backend_file}" >&2
        printf "[ERROR] Available backends: kvm, vmware, vbox\n" >&2
        return 1
    fi

    # shellcheck source=/dev/null
    source "${backend_file}"
    HV_BACKEND="${backend}"
    return 0
}

# ---------------------------------------------------------------------------
# Backend requirement check
# ---------------------------------------------------------------------------

# Check that a backend has been loaded; exit 1 if not.
#
# Usage: hv_require_backend
hv_require_backend() {
    if [[ -z "${HV_BACKEND}" ]]; then
        printf "[ERROR] No hypervisor backend loaded. Run hv_load_backend first.\n" >&2
        return 1
    fi
    return 0
}

# ---------------------------------------------------------------------------
# Operation dispatch
# ---------------------------------------------------------------------------

# Dispatch an operation to the currently loaded backend.
# Validates that the operation is in the known set before calling.
#
# Usage: hv_dispatch "create" "myvm" 4 8192 50 "/path/to/iso"
#        hv_dispatch "start" "myvm"
#        hv_dispatch "list"
hv_dispatch() {
    local operation="$1"
    shift

    hv_require_backend || return 1

    # Validate operation is in the known set
    local valid=false
    local op
    for op in ${HV_OPERATIONS}; do
        if [[ "${op}" == "${operation}" ]]; then
            valid=true
            break
        fi
    done

    if [[ "${valid}" != true ]]; then
        printf "[ERROR] Unknown operation: %s\n" "${operation}" >&2
        printf "[ERROR] Valid operations: %s\n" "${HV_OPERATIONS}" >&2
        return 1
    fi

    # Call hv_{BACKEND}_{operation} with remaining arguments
    local func="hv_${HV_BACKEND}_${operation}"

    if ! declare -f "${func}" &>/dev/null; then
        printf "[ERROR] Backend '%s' does not implement operation '%s' (missing function: %s)\n" \
            "${HV_BACKEND}" "${operation}" "${func}" >&2
        return 1
    fi

    "${func}" "$@"
}

# ---------------------------------------------------------------------------
# Utility: list available backends on this machine
# ---------------------------------------------------------------------------

# Check which hypervisor backends have their required tools installed.
# Prints one line per backend: "backend: available|not-found"
hv_list_available_backends() {
    local backend tool status

    for backend in kvm vmware vbox; do
        case "${backend}" in
            kvm)    tool="virsh" ;;
            vmware) tool="vmrun" ;;
            vbox)   tool="VBoxManage" ;;
        esac

        if has_command "${tool}"; then
            status="available"
        else
            status="not-found (requires ${tool})"
        fi

        printf "  %-10s %s\n" "${backend}:" "${status}"
    done
}
