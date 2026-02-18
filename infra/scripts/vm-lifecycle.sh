#!/usr/bin/env bash
# vm-lifecycle.sh -- Unified VM lifecycle manager
#
# Auto-detects the hypervisor backend (KVM or VMware) and dispatches
# VM operations through a single interface. All operations are idempotent.
#
# Part of the infrastructure-level provisioning pipeline (Phase 172).
# Sits above vm-backend-kvm.sh and vm-backend-vmware.sh, providing a
# unified entry point for vm-lifecycle operations.
#
# Usage: vm-lifecycle.sh <command> [options]
#
# Commands:
#   create    Create a new VM (ISO, PXE, or kickstart boot)
#   start     Start a stopped VM
#   stop      Graceful shutdown with force fallback
#   snapshot  Create a named snapshot
#   clone     Clone from an existing VM (optionally from a snapshot)
#   destroy   Remove VM completely (requires --force)
#   status    Show VM state, snapshots
#   list      List all managed VMs
#
# Global options:
#   --dry-run           Show what would be done without executing
#   --backend kvm|vmware  Override auto-detected backend
#   --help              Show this help message
#
# Exit codes:
#   0 -- Success
#   1 -- Operation failed
#   2 -- Usage error
#   3 -- No backend available

set -euo pipefail

# ---------------------------------------------------------------------------
# Script location
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

# ---------------------------------------------------------------------------
# Source shared VM library
# ---------------------------------------------------------------------------

# shellcheck source=lib/vm-common.sh
source "${SCRIPT_DIR}/lib/vm-common.sh"

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

DRY_RUN=false
COMMAND=""
VM_NAME="${VM_NAME:-}"
VM_RAM_MB="${VM_RAM_MB:-}"
VM_VCPUS="${VM_VCPUS:-}"
VM_DISK_GB="${VM_DISK_GB:-}"
VM_ISO_PATH="${VM_ISO_PATH:-}"
VM_NETWORK="${VM_NETWORK:-}"
VM_STORAGE_DIR="${VM_STORAGE_DIR:-}"
VM_OS_VARIANT="${VM_OS_VARIANT:-}"
KICKSTART_URL="${KICKSTART_URL:-}"
VALUES_FILE=""
SNAPSHOT_NAME=""
SOURCE_VM=""
FORCE=false
STOP_TIMEOUT="${STOP_TIMEOUT:-60}"

# Backend function dispatch table (set after backend is loaded)
vm_do_create=""
vm_do_start=""
vm_do_stop=""
vm_do_snapshot=""
vm_do_clone=""
vm_do_destroy=""

# ---------------------------------------------------------------------------
# Dry-run helper
# ---------------------------------------------------------------------------

dry_run_cmd() {
    if [[ "${DRY_RUN}" == true ]]; then
        echo -e "  ${_VM_YELLOW}[DRY-RUN]${_VM_NC} $*" >&2
        return 0
    fi
    return 1
}

# ---------------------------------------------------------------------------
# Backend loading
# ---------------------------------------------------------------------------

# Load the appropriate backend script and map functions to generic names.
load_backend() {
    local backend="${VM_BACKEND}"

    # Preserve DRY_RUN across source (backend scripts reset DRY_RUN=false)
    local _saved_dry_run="${DRY_RUN}"

    case "${backend}" in
        kvm)
            local backend_script="${SCRIPT_DIR}/vm-backend-kvm.sh"
            if [[ ! -f "${backend_script}" ]]; then
                vm_error "KVM backend script not found: ${backend_script}"
                exit 3
            fi
            # Source only the function definitions (not main())
            # shellcheck source=vm-backend-kvm.sh
            source "${backend_script}" --_sourced 2>/dev/null || true
            DRY_RUN="${_saved_dry_run}"

            vm_do_create="kvm_create"
            vm_do_start="kvm_start"
            vm_do_stop="kvm_stop"
            vm_do_snapshot="kvm_snapshot"
            vm_do_clone="kvm_clone"
            vm_do_destroy="kvm_destroy"

            # Check prerequisites (unless dry-run)
            if [[ "${DRY_RUN}" != true ]]; then
                kvm_check_prereqs || vm_die "KVM prerequisites not met"
            fi
            vm_ok "Backend loaded: KVM (virsh/virt-install)"
            ;;
        vmware)
            local backend_script="${SCRIPT_DIR}/vm-backend-vmware.sh"
            if [[ ! -f "${backend_script}" ]]; then
                vm_error "VMware backend script not found: ${backend_script}"
                exit 3
            fi
            # shellcheck source=vm-backend-vmware.sh
            source "${backend_script}" --_sourced 2>/dev/null || true
            DRY_RUN="${_saved_dry_run}"

            vm_do_create="vmware_create"
            vm_do_start="vmware_start"
            vm_do_stop="vmware_stop"
            vm_do_snapshot="vmware_snapshot"
            vm_do_clone="vmware_clone"
            vm_do_destroy="vmware_destroy"

            # Check prerequisites (unless dry-run)
            if [[ "${DRY_RUN}" != true ]]; then
                vmware_check_prereqs || vm_die "VMware prerequisites not met"
            fi
            vm_ok "Backend loaded: VMware (vmrun)"
            ;;
        *)
            vm_error "Unknown backend: ${backend}"
            vm_error "Supported backends: kvm, vmware"
            exit 3
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Operations
# ---------------------------------------------------------------------------

# Create a new VM
# Idempotent: if VM exists, log and exit 0
do_create() {
    vm_step "Create VM: ${VM_NAME} (backend: ${VM_BACKEND})"

    # Load values if provided
    if [[ -n "${VALUES_FILE}" ]]; then
        vm_load_values "${VALUES_FILE}"
    fi

    # Validate parameters
    vm_validate_params || exit 1

    vm_info "Parameters: name=${VM_NAME} ram=${VM_RAM_MB}MB vcpus=${VM_VCPUS} disk=${VM_DISK_GB}GB"
    vm_info "Backend: ${VM_BACKEND}"

    # Idempotent check
    if vm_exists "${VM_NAME}" 2>/dev/null; then
        vm_warn "VM '${VM_NAME}' already exists -- skipping create"
        return 0
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        dry_run_cmd "Would create VM '${VM_NAME}' via ${VM_BACKEND} backend"
        dry_run_cmd "  RAM: ${VM_RAM_MB}MB, vCPUs: ${VM_VCPUS}, Disk: ${VM_DISK_GB}GB"
        if [[ -n "${KICKSTART_URL:-}" ]]; then
            dry_run_cmd "  Boot: PXE + Kickstart (${KICKSTART_URL})"
        elif [[ -n "${VM_ISO_PATH:-}" ]]; then
            dry_run_cmd "  Boot: ISO (${VM_ISO_PATH})"
        else
            dry_run_cmd "  Boot: PXE (network boot)"
        fi
        return 0
    fi

    ${vm_do_create}
}

# Start a VM
# Idempotent: if already running, exit 0
do_start() {
    vm_step "Start VM: ${VM_NAME} (backend: ${VM_BACKEND})"

    if [[ -z "${VM_NAME}" ]]; then
        vm_error "VM_NAME is required for start (use --name or --values)"
        exit 2
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        dry_run_cmd "Would start VM '${VM_NAME}' via ${VM_BACKEND} backend"
        return 0
    fi

    ${vm_do_start}
}

# Stop a VM (graceful shutdown with force fallback)
# Idempotent: if already stopped, exit 0
do_stop() {
    vm_step "Stop VM: ${VM_NAME} (backend: ${VM_BACKEND}, timeout: ${STOP_TIMEOUT}s)"

    if [[ -z "${VM_NAME}" ]]; then
        vm_error "VM_NAME is required for stop (use --name or --values)"
        exit 2
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        dry_run_cmd "Would stop VM '${VM_NAME}' via ${VM_BACKEND} backend (${STOP_TIMEOUT}s timeout)"
        return 0
    fi

    ${vm_do_stop}
}

# Create a named snapshot
# Idempotent: if snapshot exists, exit 0
do_snapshot() {
    vm_step "Snapshot VM: ${VM_NAME} -> ${SNAPSHOT_NAME} (backend: ${VM_BACKEND})"

    if [[ -z "${VM_NAME}" ]]; then
        vm_error "VM_NAME is required for snapshot (use --name or --values)"
        exit 2
    fi

    if [[ -z "${SNAPSHOT_NAME}" ]]; then
        vm_error "Snapshot name is required (use --snapshot)"
        exit 2
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        dry_run_cmd "Would snapshot VM '${VM_NAME}' as '${SNAPSHOT_NAME}' via ${VM_BACKEND} backend"
        return 0
    fi

    ${vm_do_snapshot} "${SNAPSHOT_NAME}"
}

# Clone a VM from source (optionally from a snapshot)
# Idempotent: if target exists, exit 0
do_clone() {
    vm_step "Clone VM: ${SOURCE_VM} -> ${VM_NAME} (backend: ${VM_BACKEND})"

    if [[ -z "${VM_NAME}" ]]; then
        vm_error "VM_NAME (target) is required for clone (use --name)"
        exit 2
    fi

    if [[ -z "${SOURCE_VM}" ]]; then
        vm_error "Source VM is required for clone (use --source)"
        exit 2
    fi

    # Idempotent check
    if vm_exists "${VM_NAME}" 2>/dev/null; then
        vm_warn "Target VM '${VM_NAME}' already exists -- skipping clone"
        return 0
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        dry_run_cmd "Would clone VM '${SOURCE_VM}' -> '${VM_NAME}' via ${VM_BACKEND} backend"
        if [[ -n "${SNAPSHOT_NAME}" ]]; then
            dry_run_cmd "  From snapshot: ${SNAPSHOT_NAME}"
        fi
        return 0
    fi

    # Stop source if running (required for most backends)
    if vm_is_running "${SOURCE_VM}" 2>/dev/null; then
        vm_info "Source VM '${SOURCE_VM}' is running -- lifecycle manager will let backend handle stop"
    fi

    ${vm_do_clone} "${SOURCE_VM}"
}

# Destroy a VM (requires --force)
# Idempotent: if VM does not exist, exit 0
do_destroy() {
    vm_step "Destroy VM: ${VM_NAME} (backend: ${VM_BACKEND})"

    if [[ -z "${VM_NAME}" ]]; then
        vm_error "VM_NAME is required for destroy (use --name)"
        exit 2
    fi

    if [[ "${FORCE}" != true ]]; then
        vm_error "Destroy requires --force flag (safety: no accidental deletions)"
        vm_error "Usage: ${SCRIPT_NAME} destroy --name ${VM_NAME} --force"
        exit 2
    fi

    # Idempotent check
    if ! vm_exists "${VM_NAME}" 2>/dev/null; then
        vm_warn "VM '${VM_NAME}' does not exist -- nothing to destroy"
        return 0
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        dry_run_cmd "Would destroy VM '${VM_NAME}' via ${VM_BACKEND} backend (storage + snapshots)"
        return 0
    fi

    ${vm_do_destroy}
}

# Show VM status
do_status() {
    vm_step "Status: ${VM_NAME} (backend: ${VM_BACKEND})"

    if [[ -z "${VM_NAME}" ]]; then
        vm_error "VM_NAME is required for status (use --name)"
        exit 2
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        dry_run_cmd "Would show status for VM '${VM_NAME}' via ${VM_BACKEND} backend"
        return 0
    fi

    echo ""
    echo "VM Status: ${VM_NAME}"
    echo "Backend:   ${VM_BACKEND}"
    echo ""

    # Check existence
    if ! vm_exists "${VM_NAME}" 2>/dev/null; then
        echo "State:     NOT FOUND"
        return 0
    fi

    echo "Exists:    yes"

    # Check running state
    if vm_is_running "${VM_NAME}" 2>/dev/null; then
        echo "State:     RUNNING"
    else
        echo "State:     STOPPED"
    fi

    # List snapshots (backend-specific)
    echo ""
    echo "Snapshots:"
    case "${VM_BACKEND}" in
        kvm)
            if _vm_has_command virsh; then
                virsh snapshot-list "${VM_NAME}" 2>/dev/null || echo "  (unable to list snapshots)"
            fi
            ;;
        vmware)
            local vmx_path
            vmx_path="$(_vmware_vmx_path "${VM_NAME}" 2>/dev/null || echo "")"
            if [[ -n "${vmx_path}" ]] && _vm_has_command vmrun; then
                vmrun listSnapshots "${vmx_path}" 2>/dev/null || echo "  (unable to list snapshots)"
            fi
            ;;
    esac
}

# List all managed VMs
do_list() {
    vm_step "List VMs (backend: ${VM_BACKEND})"

    if [[ "${DRY_RUN}" == true ]]; then
        dry_run_cmd "Would list all VMs via ${VM_BACKEND} backend"
        return 0
    fi

    echo ""
    echo "Managed VMs (backend: ${VM_BACKEND})"
    echo "$(printf '%.0s-' {1..40})"

    case "${VM_BACKEND}" in
        kvm)
            if _vm_has_command virsh; then
                virsh list --all 2>/dev/null || echo "  (unable to list VMs)"
            else
                vm_warn "virsh not available -- cannot list KVM VMs"
            fi
            ;;
        vmware)
            if _vm_has_command vmrun; then
                vmrun list 2>/dev/null || echo "  (unable to list VMs)"
            else
                vm_warn "vmrun not available -- cannot list VMware VMs"
            fi
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} <command> [options]

Unified VM lifecycle manager. Auto-detects the hypervisor backend
(KVM or VMware) and dispatches operations through a single interface.
All operations are idempotent -- safe to call repeatedly.

Commands:
  create      Create a new VM (requires --values or parameter flags)
  start       Start a stopped VM (requires --name)
  stop        Graceful shutdown with force fallback (requires --name)
  snapshot    Create a named snapshot (requires --name --snapshot)
  clone       Clone from an existing VM (requires --name --source)
  destroy     Remove VM completely (requires --name --force)
  status      Show VM state and snapshots (requires --name)
  list        List all managed VMs

Create Options:
  --name NAME           VM name (or set VM_NAME env var)
  --ram-mb N            RAM in megabytes (minimum 512)
  --vcpus N             Number of virtual CPUs (minimum 1)
  --disk-gb N           Disk size in gigabytes (minimum 10)
  --iso PATH            ISO image path for CDROM boot
  --pxe                 Boot from PXE (default if no --iso)
  --kickstart-url URL   Kickstart URL for automated installation
  --network BRIDGE      Network bridge or virtual network (default: virbr0/vmnet8)
  --storage-dir DIR     VM disk storage directory
  --os-variant TYPE     OS variant for virt-install (default: centos-stream9)
  --values PATH         Load all params from local-values YAML file

Clone Options:
  --source NAME         Source VM name (required)
  --snapshot SNAP_NAME  Clone from specific snapshot (optional)

Stop Options:
  --timeout SECS        Graceful shutdown timeout (default: 60)

Global Options:
  --backend kvm|vmware  Override auto-detected backend
  --dry-run             Show what would be done without executing
  --force               Required for destroy (safety flag)
  --help                Show this help message

Exit Codes:
  0  Success (or idempotent no-op)
  1  Operation failed
  2  Usage error (missing args, invalid params)
  3  No backend available

Backend Detection:
  1. VM_BACKEND environment variable (explicit override)
  2. hardware-capabilities.yaml (auto-detection)
  3. --backend flag (CLI override)

Examples:
  # Create from local-values file
  ${SCRIPT_NAME} create --values infra/local/vm-provisioning.local-values

  # Create with explicit parameters
  ${SCRIPT_NAME} create --name test-vm --ram-mb 4096 --vcpus 2 --disk-gb 20

  # Golden image workflow
  ${SCRIPT_NAME} stop --name minecraft-server
  ${SCRIPT_NAME} snapshot --name minecraft-server --snapshot golden-v1
  ${SCRIPT_NAME} clone --name minecraft-clone --source minecraft-server

  # Dry-run preview
  ${SCRIPT_NAME} create --values infra/local/vm-provisioning.local-values --dry-run

  # Destroy with safety flag
  ${SCRIPT_NAME} destroy --name test-vm --force

  # Status check
  ${SCRIPT_NAME} status --name minecraft-server

  # List all VMs
  ${SCRIPT_NAME} list
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            create|start|stop|snapshot|clone|destroy|status|list)
                COMMAND="$1"
                shift
                ;;
            --name)
                VM_NAME="${2:?'--name requires a value'}"
                shift 2
                ;;
            --ram-mb)
                VM_RAM_MB="${2:?'--ram-mb requires a value'}"
                shift 2
                ;;
            --vcpus)
                VM_VCPUS="${2:?'--vcpus requires a value'}"
                shift 2
                ;;
            --disk-gb)
                VM_DISK_GB="${2:?'--disk-gb requires a value'}"
                shift 2
                ;;
            --iso)
                VM_ISO_PATH="${2:?'--iso requires a path'}"
                shift 2
                ;;
            --pxe)
                # PXE is the default if no --iso, this is explicit
                shift
                ;;
            --kickstart-url)
                KICKSTART_URL="${2:?'--kickstart-url requires a URL'}"
                shift 2
                ;;
            --network)
                VM_NETWORK="${2:?'--network requires a value'}"
                shift 2
                ;;
            --storage-dir)
                VM_STORAGE_DIR="${2:?'--storage-dir requires a path'}"
                shift 2
                ;;
            --os-variant)
                VM_OS_VARIANT="${2:?'--os-variant requires a value'}"
                shift 2
                ;;
            --values)
                VALUES_FILE="${2:?'--values requires a path'}"
                shift 2
                ;;
            --source)
                SOURCE_VM="${2:?'--source requires a value'}"
                shift 2
                ;;
            --snapshot)
                SNAPSHOT_NAME="${2:?'--snapshot requires a value'}"
                shift 2
                ;;
            --snapshot-name)
                # Alias for compatibility with backend scripts
                SNAPSHOT_NAME="${2:?'--snapshot-name requires a value'}"
                shift 2
                ;;
            --timeout)
                STOP_TIMEOUT="${2:?'--timeout requires a value'}"
                shift 2
                ;;
            --backend)
                VM_BACKEND="${2:?'--backend requires kvm or vmware'}"
                shift 2
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                usage
                exit 0
                ;;
            --_sourced)
                # Internal: when sourced by another script, don't run main
                return 0
                ;;
            *)
                vm_error "Unknown option: $1 (use --help for usage)"
                exit 2
                ;;
        esac
    done
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    parse_args "$@"

    # Check for --_sourced (skip execution when sourced)
    for arg in "$@"; do
        if [[ "${arg}" == "--_sourced" ]]; then
            return 0
        fi
    done

    if [[ -z "${COMMAND}" ]]; then
        vm_error "No command specified"
        echo "" >&2
        usage
        exit 2
    fi

    # Load values file first if provided (may set VM_NAME etc)
    if [[ -n "${VALUES_FILE}" ]] && [[ "${COMMAND}" != "create" ]]; then
        vm_load_values "${VALUES_FILE}"
    fi

    # Detect backend (unless already set via --backend or env)
    if [[ -z "${VM_BACKEND:-}" ]]; then
        vm_detect_backend || exit 3
    fi

    # Validate backend value
    case "${VM_BACKEND}" in
        kvm|vmware)
            ;;
        *)
            vm_error "Invalid backend: '${VM_BACKEND}' (must be 'kvm' or 'vmware')"
            exit 3
            ;;
    esac

    # Load backend functions
    load_backend

    # Dispatch to operation
    case "${COMMAND}" in
        create)   do_create ;;
        start)    do_start ;;
        stop)     do_stop ;;
        snapshot) do_snapshot ;;
        clone)    do_clone ;;
        destroy)  do_destroy ;;
        status)   do_status ;;
        list)     do_list ;;
        *)
            vm_error "Unknown command: ${COMMAND}"
            exit 2
            ;;
    esac
}

main "$@"
