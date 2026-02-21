# vm-common.sh -- Shared VM provisioning library
#
# Sourced by vm-backend-kvm.sh and vm-backend-vmware.sh.
# Provides backend auto-detection, parameter validation, VM state queries,
# logging helpers, and local-values loading for VM provisioning.
#
# This file has NO shebang -- it is meant to be sourced, not executed directly.
# All functions use local variables and produce no side effects when sourced.
#
# Relationship to Phase 180 (hypervisor-common.sh):
#   180 provides PLATFORM-LEVEL hypervisor abstraction (hv_detect_backend, hv_dispatch)
#   172 provides INFRASTRUCTURE-LEVEL provisioning backends (vm_create with kickstart,
#   PXE, disk sizing, storage directories -- the full provisioning pipeline)

set -euo pipefail

# ---------------------------------------------------------------------------
# Script location (for relative path resolution)
# ---------------------------------------------------------------------------

_VM_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# Colors (if stderr is a terminal)
# ---------------------------------------------------------------------------

if [[ -t 2 ]]; then
    _VM_RED='\033[0;31m'
    _VM_GREEN='\033[0;32m'
    _VM_YELLOW='\033[1;33m'
    _VM_BLUE='\033[0;34m'
    _VM_BOLD='\033[1m'
    _VM_NC='\033[0m'
else
    _VM_RED='' _VM_GREEN='' _VM_YELLOW='' _VM_BLUE='' _VM_BOLD='' _VM_NC=''
fi

# ---------------------------------------------------------------------------
# Logging helpers (matching deploy-pxe.sh pattern, log to stderr)
# ---------------------------------------------------------------------------

# Info message
vm_info()  { echo -e "${_VM_BLUE}[INFO]${_VM_NC}  $*" >&2; }

# Success message
vm_ok()    { echo -e "${_VM_GREEN}[OK]${_VM_NC}    $*" >&2; }

# Warning message
vm_warn()  { echo -e "${_VM_YELLOW}[WARN]${_VM_NC}  $*" >&2; }

# Error message (non-fatal)
vm_error() { echo -e "${_VM_RED}[ERROR]${_VM_NC} $*" >&2; }

# Fatal error -- prints message and exits with code 1
vm_die()   { vm_error "$@"; exit 1; }

# Step counter for numbered progress steps
_VM_STEP_NUM=0

# Numbered progress step (resets per script invocation)
vm_step() {
    _VM_STEP_NUM=$((_VM_STEP_NUM + 1))
    echo "" >&2
    echo -e "${_VM_BOLD}[Step ${_VM_STEP_NUM}]${_VM_NC} $*" >&2
    echo -e "${_VM_BOLD}$(printf '%.0s-' {1..60})${_VM_NC}" >&2
}

# ---------------------------------------------------------------------------
# Tool detection
# ---------------------------------------------------------------------------

# Check if a command exists on the system
# Usage: _vm_has_command "virsh" && virsh list
_vm_has_command() {
    local cmd="$1"
    command -v "${cmd}" &>/dev/null
}

# ---------------------------------------------------------------------------
# YAML parsing helper (simple grep-based, same pattern as calculate-budget.sh)
# ---------------------------------------------------------------------------

# Read a value from a YAML file by key.
# Handles indented keys under sections. Returns first match.
# Usage: val=$(_vm_yaml_get "file.yaml" "kvm")
_vm_yaml_get() {
    local file="$1"
    local key="$2"
    local val
    val=$(grep -E "^[[:space:]]*${key}[[:space:]]*:" "${file}" 2>/dev/null \
        | head -1 \
        | sed 's/^[^:]*:[[:space:]]*//' \
        | sed 's/^"//;s/"[[:space:]]*$//' \
        | tr -d '[:space:]') || true
    echo "${val}"
}

# ---------------------------------------------------------------------------
# Backend auto-detection
# ---------------------------------------------------------------------------

# Detect the best available VM provisioning backend.
#
# Priority: KVM first (open standard, per PROJECT.md), then VMware.
#
# Detection logic:
#   1. If VM_BACKEND environment variable is set, use it (explicit override)
#   2. Read hypervisor section from hardware-capabilities.yaml
#   3. For KVM: verify kvm=true in YAML AND virsh command available
#   4. For VMware: verify vmware=true in YAML AND vmrun command available
#
# Sets the VM_BACKEND global variable to "kvm" or "vmware".
# Returns 1 with descriptive error if no usable backend found.
vm_detect_backend() {
    # Allow explicit override via environment variable
    if [[ -n "${VM_BACKEND:-}" ]]; then
        vm_info "Using explicitly set VM_BACKEND=${VM_BACKEND}"
        return 0
    fi

    # Find hardware-capabilities.yaml
    local caps_file=""
    local script_dir="${_VM_LIB_DIR}"

    # Try path relative to lib/ -> ../../inventory/
    local inventory_path="${script_dir}/../../inventory/hardware-capabilities.yaml"
    if [[ -f "${inventory_path}" ]]; then
        caps_file="${inventory_path}"
    fi

    # Try path relative to script that sourced us -> ../inventory/
    local alt_inventory_path="${script_dir}/../inventory/hardware-capabilities.yaml"
    if [[ -z "${caps_file}" ]] && [[ -f "${alt_inventory_path}" ]]; then
        caps_file="${alt_inventory_path}"
    fi

    if [[ -z "${caps_file}" || ! -f "${caps_file}" ]]; then
        vm_error "Cannot find hardware-capabilities.yaml for backend detection"
        vm_error "Expected at: ${inventory_path}"
        vm_error "Set VM_BACKEND=kvm or VM_BACKEND=vmware to override"
        return 1
    fi

    vm_info "Reading capabilities from: ${caps_file}"

    # Parse hypervisor section
    local kvm_val vmware_val
    kvm_val=$(_vm_yaml_get "${caps_file}" "kvm")
    vmware_val=$(_vm_yaml_get "${caps_file}" "vmware")

    # Priority: KVM first (open standard)
    if [[ "${kvm_val}" == "true" ]]; then
        if _vm_has_command virsh; then
            VM_BACKEND="kvm"
            vm_ok "Detected backend: KVM (virsh available, kvm=true in capabilities)"
            return 0
        else
            vm_warn "KVM enabled in capabilities but virsh not found -- skipping"
        fi
    fi

    # Then VMware
    if [[ "${vmware_val}" == "true" ]]; then
        if _vm_has_command vmrun; then
            VM_BACKEND="vmware"
            vm_ok "Detected backend: VMware (vmrun available, vmware=true in capabilities)"
            return 0
        else
            vm_warn "VMware enabled in capabilities but vmrun not found -- skipping"
        fi
    fi

    vm_error "No usable VM backend found"
    vm_error "  KVM:    kvm=${kvm_val:-unset}, virsh=$(_vm_has_command virsh && echo "found" || echo "not found")"
    vm_error "  VMware: vmware=${vmware_val:-unset}, vmrun=$(_vm_has_command vmrun && echo "found" || echo "not found")"
    vm_error "Set VM_BACKEND=kvm or VM_BACKEND=vmware to override"
    return 1
}

# ---------------------------------------------------------------------------
# Parameter validation
# ---------------------------------------------------------------------------

# Validate required VM parameters.
# Checks all parameters and reports ALL validation failures (not just first).
#
# Expected variables: VM_NAME, VM_RAM_MB, VM_VCPUS, VM_DISK_GB
# Returns 0 if valid, 1 if any validation fails.
vm_validate_params() {
    local errors=0
    local error_msgs=""

    # VM_NAME: must be set and alphanumeric + hyphens only
    if [[ -z "${VM_NAME:-}" ]]; then
        error_msgs="${error_msgs}\n  - VM_NAME is required"
        errors=$((errors + 1))
    elif [[ ! "${VM_NAME}" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]*$ ]]; then
        error_msgs="${error_msgs}\n  - VM_NAME must be alphanumeric + hyphens only (got: '${VM_NAME}')"
        errors=$((errors + 1))
    fi

    # VM_RAM_MB: must be positive integer >= 512
    if [[ -z "${VM_RAM_MB:-}" ]]; then
        error_msgs="${error_msgs}\n  - VM_RAM_MB is required"
        errors=$((errors + 1))
    elif [[ ! "${VM_RAM_MB}" =~ ^[0-9]+$ ]]; then
        error_msgs="${error_msgs}\n  - VM_RAM_MB must be a positive integer (got: '${VM_RAM_MB}')"
        errors=$((errors + 1))
    elif [[ "${VM_RAM_MB}" -lt 512 ]]; then
        error_msgs="${error_msgs}\n  - VM_RAM_MB must be >= 512 (got: ${VM_RAM_MB})"
        errors=$((errors + 1))
    fi

    # VM_VCPUS: must be positive integer >= 1
    if [[ -z "${VM_VCPUS:-}" ]]; then
        error_msgs="${error_msgs}\n  - VM_VCPUS is required"
        errors=$((errors + 1))
    elif [[ ! "${VM_VCPUS}" =~ ^[0-9]+$ ]]; then
        error_msgs="${error_msgs}\n  - VM_VCPUS must be a positive integer (got: '${VM_VCPUS}')"
        errors=$((errors + 1))
    elif [[ "${VM_VCPUS}" -lt 1 ]]; then
        error_msgs="${error_msgs}\n  - VM_VCPUS must be >= 1 (got: ${VM_VCPUS})"
        errors=$((errors + 1))
    fi

    # VM_DISK_GB: must be positive integer >= 10
    if [[ -z "${VM_DISK_GB:-}" ]]; then
        error_msgs="${error_msgs}\n  - VM_DISK_GB is required"
        errors=$((errors + 1))
    elif [[ ! "${VM_DISK_GB}" =~ ^[0-9]+$ ]]; then
        error_msgs="${error_msgs}\n  - VM_DISK_GB must be a positive integer (got: '${VM_DISK_GB}')"
        errors=$((errors + 1))
    elif [[ "${VM_DISK_GB}" -lt 10 ]]; then
        error_msgs="${error_msgs}\n  - VM_DISK_GB must be >= 10 (got: ${VM_DISK_GB})"
        errors=$((errors + 1))
    fi

    if [[ ${errors} -gt 0 ]]; then
        vm_error "Parameter validation failed (${errors} error(s)):${error_msgs}"
        return 1
    fi

    vm_ok "Parameters valid: name=${VM_NAME} ram=${VM_RAM_MB}MB vcpus=${VM_VCPUS} disk=${VM_DISK_GB}GB"
    return 0
}

# ---------------------------------------------------------------------------
# VM state queries (delegated to backend-specific functions)
# ---------------------------------------------------------------------------

# Check if a VM exists.
# Delegates to kvm_vm_exists() or vmware_vm_exists() based on VM_BACKEND.
# Returns 0 if VM exists, 1 if not.
vm_exists() {
    local name="${1:?vm_exists requires VM name}"

    case "${VM_BACKEND:-}" in
        kvm)    kvm_vm_exists "${name}" ;;
        vmware) vmware_vm_exists "${name}" ;;
        *)
            vm_error "vm_exists: no backend loaded (VM_BACKEND=${VM_BACKEND:-unset})"
            return 1
            ;;
    esac
}

# Check if a VM is currently running.
# Delegates to kvm_vm_is_running() or vmware_vm_is_running() based on VM_BACKEND.
# Returns 0 if running, 1 if stopped or not found.
vm_is_running() {
    local name="${1:?vm_is_running requires VM name}"

    case "${VM_BACKEND:-}" in
        kvm)    kvm_vm_is_running "${name}" ;;
        vmware) vmware_vm_is_running "${name}" ;;
        *)
            vm_error "vm_is_running: no backend loaded (VM_BACKEND=${VM_BACKEND:-unset})"
            return 1
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Local-values loader
# ---------------------------------------------------------------------------

# Load VM provisioning parameters from a local-values YAML file.
# Sets global variables: VM_NAME, VM_RAM_MB, VM_VCPUS, VM_DISK_GB,
#   VM_ISO_PATH, VM_NETWORK, VM_STORAGE_DIR, VM_OS_VARIANT, KICKSTART_URL
#
# Also supports reading defaults from resource-budget.yaml (minecraft_vm section)
# if the local-values file doesn't specify sizing.
#
# Usage: vm_load_values "/path/to/vm-provisioning.local-values"
vm_load_values() {
    local values_file="${1:?vm_load_values requires a values file path}"

    if [[ ! -f "${values_file}" ]]; then
        vm_die "Values file not found: ${values_file}"
    fi

    vm_info "Loading VM parameters from: ${values_file}"

    # Read values from the local-values file
    local val

    val=$(_vm_yaml_get "${values_file}" "vm_name")
    [[ -n "${val}" ]] && VM_NAME="${val}"

    val=$(_vm_yaml_get "${values_file}" "vm_ram_mb")
    [[ -n "${val}" ]] && VM_RAM_MB="${val}"

    val=$(_vm_yaml_get "${values_file}" "vm_vcpus")
    [[ -n "${val}" ]] && VM_VCPUS="${val}"

    val=$(_vm_yaml_get "${values_file}" "vm_disk_gb")
    [[ -n "${val}" ]] && VM_DISK_GB="${val}"

    val=$(_vm_yaml_get "${values_file}" "vm_iso_path")
    [[ -n "${val}" ]] && VM_ISO_PATH="${val}"

    val=$(_vm_yaml_get "${values_file}" "vm_network")
    [[ -n "${val}" ]] && VM_NETWORK="${val}"

    val=$(_vm_yaml_get "${values_file}" "vm_storage_dir")
    [[ -n "${val}" ]] && VM_STORAGE_DIR="${val}"

    val=$(_vm_yaml_get "${values_file}" "vm_os_variant")
    [[ -n "${val}" ]] && VM_OS_VARIANT="${val}"

    val=$(_vm_yaml_get "${values_file}" "kickstart_url")
    [[ -n "${val}" ]] && KICKSTART_URL="${val}"

    # Try to read resource-budget.yaml for defaults if sizing not specified
    local budget_file="${_VM_LIB_DIR}/../../local/resource-budget.yaml"
    if [[ -f "${budget_file}" ]]; then
        if [[ -z "${VM_RAM_MB:-}" ]]; then
            val=$(_vm_yaml_get "${budget_file}" "ram_gb")
            if [[ -n "${val}" && "${val}" =~ ^[0-9]+$ ]]; then
                VM_RAM_MB=$((val * 1024))
                vm_info "Using resource-budget.yaml default: VM_RAM_MB=${VM_RAM_MB}"
            fi
        fi
        if [[ -z "${VM_VCPUS:-}" ]]; then
            val=$(_vm_yaml_get "${budget_file}" "cores")
            if [[ -n "${val}" && "${val}" =~ ^[0-9]+$ ]]; then
                VM_VCPUS="${val}"
                vm_info "Using resource-budget.yaml default: VM_VCPUS=${VM_VCPUS}"
            fi
        fi
        if [[ -z "${VM_DISK_GB:-}" ]]; then
            val=$(_vm_yaml_get "${budget_file}" "storage_gb")
            if [[ -n "${val}" && "${val}" =~ ^[0-9]+$ ]]; then
                VM_DISK_GB="${val}"
                vm_info "Using resource-budget.yaml default: VM_DISK_GB=${VM_DISK_GB}"
            fi
        fi
    fi

    vm_ok "Values loaded: name=${VM_NAME:-unset} ram=${VM_RAM_MB:-unset}MB vcpus=${VM_VCPUS:-unset} disk=${VM_DISK_GB:-unset}GB"
    return 0
}
