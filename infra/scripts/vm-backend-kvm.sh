#!/usr/bin/env bash
# shellcheck disable=SC2155 # local+assign pattern acceptable for non-critical date values
# vm-backend-kvm.sh -- KVM/libvirt VM provisioning backend
#
# Implements VM lifecycle operations for KVM via virsh/virt-install.
# Part of the infrastructure-level provisioning pipeline (Phase 172).
#
# Operations: create, start, stop, snapshot, clone, destroy
# All operations are idempotent -- safe to call repeatedly.
#
# Relationship to Phase 180 (hv-kvm.sh):
#   180/hv-kvm.sh provides PLATFORM-LEVEL abstraction (hv_kvm_create with minimal args)
#   172/vm-backend-kvm.sh provides INFRASTRUCTURE-LEVEL provisioning (kickstart support,
#   PXE boot, configurable storage dirs, OS variant, network bridge selection)
#
# Usage: vm-backend-kvm.sh <command> [options]
#
# Commands:
#   create    Create a new KVM VM (ISO, PXE, or kickstart boot)
#   start     Start a stopped VM
#   stop      Graceful shutdown with force fallback (60s timeout)
#   snapshot  Create a named snapshot
#   clone     Clone from an existing VM
#   destroy   Remove VM completely (storage + snapshots)
#
# Global options:
#   --dry-run     Show what would be done without executing
#   --help        Show this help message
#
# Exit codes:
#   0 -- Success
#   1 -- Error (missing prerequisites, validation failure, operation failure)

set -euo pipefail

# --- Script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

# --- Source shared VM library ---
# shellcheck source=lib/vm-common.sh
source "${SCRIPT_DIR}/lib/vm-common.sh"

# --- State ---
DRY_RUN=false

# ---------------------------------------------------------------------------
# Dry-run helper
# ---------------------------------------------------------------------------

# If dry-run mode is active, log the command and return 0.
# If not dry-run, return 1 (caller should execute the real command).
dry_run_cmd() {
    if [[ "${DRY_RUN}" == true ]]; then
        echo -e "  ${_VM_YELLOW}[DRY-RUN]${_VM_NC} $*" >&2
        return 0
    fi
    return 1
}

# ---------------------------------------------------------------------------
# Prerequisites check
# ---------------------------------------------------------------------------

# Verify required KVM tools are available
kvm_check_prereqs() {
    local ok=true

    if ! _vm_has_command virsh; then
        vm_error "virsh not found -- install libvirt-daemon-system (or libvirt on Fedora/CentOS)"
        ok=false
    fi

    if ! _vm_has_command virt-install; then
        vm_error "virt-install not found -- install virt-install package"
        ok=false
    fi

    if [[ "${ok}" != true ]]; then
        return 1
    fi
    return 0
}

# ---------------------------------------------------------------------------
# VM state checks
# ---------------------------------------------------------------------------

# Check if a KVM VM exists by name.
# Returns 0 if exists, 1 if not.
kvm_vm_exists() {
    local name="${1:?kvm_vm_exists requires VM name}"
    virsh dominfo "${name}" &>/dev/null
}

# Check if a KVM VM is currently running.
# Returns 0 if running, 1 if stopped or not found.
kvm_vm_is_running() {
    local name="${1:?kvm_vm_is_running requires VM name}"
    local state
    state=$(virsh domstate "${name}" 2>/dev/null | tr -d '[:space:]') || true
    [[ "${state}" == "running" ]]
}

# ---------------------------------------------------------------------------
# Operations
# ---------------------------------------------------------------------------

# Create a new KVM VM via virt-install.
# Supports three boot modes: ISO (cdrom), PXE (network boot), kickstart (PXE + ks URL).
# Idempotent: if VM already exists, logs and returns 0.
kvm_create() {
    vm_step "Create KVM VM: ${VM_NAME}"

    # Idempotent check
    if kvm_vm_exists "${VM_NAME}"; then
        vm_warn "VM '${VM_NAME}' already exists -- skipping create"
        return 0
    fi

    local storage_dir="${VM_STORAGE_DIR:-/var/lib/libvirt/images}"
    local disk_path="${storage_dir}/${VM_NAME}.qcow2"
    local network="${VM_NETWORK:-virbr0}"
    local os_variant="${VM_OS_VARIANT:-centos-stream9}"

    vm_info "Name:       ${VM_NAME}"
    vm_info "RAM:        ${VM_RAM_MB} MB"
    vm_info "vCPUs:      ${VM_VCPUS}"
    vm_info "Disk:       ${VM_DISK_GB} GB (${disk_path})"
    vm_info "Network:    bridge=${network}"
    vm_info "OS variant: ${os_variant}"

    # Build virt-install command
    local cmd=(
        virt-install
        --name "${VM_NAME}"
        --ram "${VM_RAM_MB}"
        --vcpus "${VM_VCPUS}"
        --disk "path=${disk_path},size=${VM_DISK_GB},format=qcow2"
        --os-variant "${os_variant}"
        --network "bridge=${network}"
        --graphics none
        --noautoconsole
        --wait 0
    )

    # Determine boot mode
    if [[ -n "${KICKSTART_URL:-}" ]]; then
        # Kickstart via PXE boot
        vm_info "Boot mode:  PXE + Kickstart (${KICKSTART_URL})"
        cmd+=(--pxe --boot "network,hd")
        cmd+=(--extra-args "inst.ks=${KICKSTART_URL}")
    elif [[ -n "${VM_ISO_PATH:-}" && -f "${VM_ISO_PATH:-}" ]]; then
        # ISO boot
        vm_info "Boot mode:  ISO (${VM_ISO_PATH})"
        cmd+=(--cdrom "${VM_ISO_PATH}" --boot "cdrom,hd")
    else
        # PXE boot (no kickstart)
        vm_info "Boot mode:  PXE (network boot)"
        cmd+=(--pxe --boot "network,hd")
    fi

    if dry_run_cmd "${cmd[*]}"; then
        return 0
    fi

    # Ensure storage directory exists
    mkdir -p "${storage_dir}"

    "${cmd[@]}"
    vm_ok "VM '${VM_NAME}' created successfully"
    return 0
}

# Start a stopped KVM VM.
# Idempotent: if already running, returns 0.
kvm_start() {
    vm_step "Start KVM VM: ${VM_NAME}"

    if ! kvm_vm_exists "${VM_NAME}"; then
        vm_die "VM '${VM_NAME}' not found -- cannot start"
    fi

    if kvm_vm_is_running "${VM_NAME}"; then
        vm_warn "VM '${VM_NAME}' is already running"
        return 0
    fi

    if dry_run_cmd "virsh start ${VM_NAME}"; then
        return 0
    fi

    virsh start "${VM_NAME}"
    vm_ok "VM '${VM_NAME}' started"
    return 0
}

# Graceful shutdown with force fallback after 60 seconds.
# Idempotent: if already shut off, returns 0.
kvm_stop() {
    vm_step "Stop KVM VM: ${VM_NAME}"

    if ! kvm_vm_exists "${VM_NAME}"; then
        vm_die "VM '${VM_NAME}' not found -- cannot stop"
    fi

    local state
    state=$(virsh domstate "${VM_NAME}" 2>/dev/null | tr -d '[:space:]')

    if [[ "${state}" == "shutoff" ]]; then
        vm_warn "VM '${VM_NAME}' is already shut off"
        return 0
    fi

    if dry_run_cmd "virsh shutdown ${VM_NAME} (60s timeout, then force)"; then
        return 0
    fi

    vm_info "Sending ACPI shutdown to '${VM_NAME}'..."
    virsh shutdown "${VM_NAME}" 2>/dev/null || true

    # Wait up to 60 seconds for graceful shutdown
    local elapsed=0
    while [[ ${elapsed} -lt 60 ]]; do
        sleep 2
        elapsed=$((elapsed + 2))
        state=$(virsh domstate "${VM_NAME}" 2>/dev/null | tr -d '[:space:]')
        if [[ "${state}" == "shutoff" ]]; then
            vm_ok "VM '${VM_NAME}' shut down gracefully after ${elapsed}s"
            return 0
        fi
        # Progress indicator every 10 seconds
        if [[ $((elapsed % 10)) -eq 0 ]]; then
            vm_info "Waiting for shutdown... (${elapsed}s / 60s)"
        fi
    done

    # Force stop after timeout
    vm_warn "VM '${VM_NAME}' did not shut down gracefully after 60s -- forcing off"
    virsh destroy "${VM_NAME}" 2>/dev/null || true
    vm_ok "VM '${VM_NAME}' force-stopped"
    return 0
}

# Create a named snapshot of a VM.
# Idempotent: if snapshot name already exists, returns 0.
kvm_snapshot() {
    local snap_name="${1:?kvm_snapshot requires a snapshot name}"

    vm_step "Snapshot KVM VM: ${VM_NAME} -> ${snap_name}"

    if ! kvm_vm_exists "${VM_NAME}"; then
        vm_die "VM '${VM_NAME}' not found -- cannot snapshot"
    fi

    # Idempotent: check if snapshot already exists
    if virsh snapshot-list "${VM_NAME}" --name 2>/dev/null | grep -qx "${snap_name}"; then
        vm_warn "Snapshot '${snap_name}' already exists for VM '${VM_NAME}' -- skipping"
        return 0
    fi

    local description="GSD provisioning snapshot created $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

    if dry_run_cmd "virsh snapshot-create-as ${VM_NAME} --name ${snap_name} --description '${description}'"; then
        return 0
    fi

    virsh snapshot-create-as "${VM_NAME}" --name "${snap_name}" --description "${description}"
    vm_ok "Snapshot '${snap_name}' created for VM '${VM_NAME}'"
    return 0
}

# Clone an existing VM.
# Source VM must be shut off (will be stopped if running).
# Idempotent: if target VM already exists, returns 0.
kvm_clone() {
    local source_vm="${1:?kvm_clone requires a source VM name}"

    vm_step "Clone KVM VM: ${source_vm} -> ${VM_NAME}"

    # Idempotent: if target already exists, skip
    if kvm_vm_exists "${VM_NAME}"; then
        vm_warn "Target VM '${VM_NAME}' already exists -- skipping clone"
        return 0
    fi

    # Source must exist
    if ! kvm_vm_exists "${source_vm}"; then
        vm_die "Source VM '${source_vm}' not found -- cannot clone"
    fi

    # Source must be shut off for cloning
    if kvm_vm_is_running "${source_vm}"; then
        vm_info "Source VM '${source_vm}' is running -- stopping for clone..."
        if dry_run_cmd "virsh shutdown ${source_vm} (for clone)"; then
            :
        else
            virsh shutdown "${source_vm}" 2>/dev/null || true
            # Wait up to 30 seconds
            local elapsed=0
            while [[ ${elapsed} -lt 30 ]]; do
                sleep 2
                elapsed=$((elapsed + 2))
                local state
                state=$(virsh domstate "${source_vm}" 2>/dev/null | tr -d '[:space:]')
                if [[ "${state}" == "shutoff" ]]; then
                    break
                fi
            done
            # Force if still running
            if kvm_vm_is_running "${source_vm}"; then
                virsh destroy "${source_vm}" 2>/dev/null || true
            fi
        fi
    fi

    if ! _vm_has_command virt-clone; then
        vm_die "virt-clone not found -- install virt-install package"
    fi

    if dry_run_cmd "virt-clone --original ${source_vm} --name ${VM_NAME} --auto-clone"; then
        return 0
    fi

    virt-clone --original "${source_vm}" --name "${VM_NAME}" --auto-clone
    vm_ok "VM '${VM_NAME}' cloned from '${source_vm}'"
    return 0
}

# Remove a VM completely: stop, undefine, remove storage and snapshots.
# Idempotent: if VM does not exist, returns 0.
kvm_destroy() {
    vm_step "Destroy KVM VM: ${VM_NAME}"

    if ! kvm_vm_exists "${VM_NAME}"; then
        vm_warn "VM '${VM_NAME}' does not exist -- nothing to destroy"
        return 0
    fi

    if dry_run_cmd "virsh destroy + undefine --remove-all-storage --snapshots-metadata ${VM_NAME}"; then
        return 0
    fi

    # Stop if running
    if kvm_vm_is_running "${VM_NAME}"; then
        vm_info "Stopping VM '${VM_NAME}' before destroy..."
        virsh destroy "${VM_NAME}" 2>/dev/null || true
    fi

    # Undefine with storage and snapshot cleanup
    virsh undefine "${VM_NAME}" --remove-all-storage --snapshots-metadata 2>/dev/null || true
    vm_ok "VM '${VM_NAME}' destroyed (storage and snapshots removed)"
    return 0
}

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} <command> [options]

KVM/libvirt VM provisioning backend. Creates and manages VMs via
virsh and virt-install with full provisioning pipeline support.

Commands:
  create      Create a new VM (requires --values or parameter env vars)
  start       Start a stopped VM (requires --name)
  stop        Graceful shutdown with force fallback (requires --name)
  snapshot    Create a named snapshot (requires --name --snapshot-name)
  clone       Clone from an existing VM (requires --name --source)
  destroy     Remove VM completely (requires --name)

Options:
  --name NAME           VM name (or set VM_NAME env var)
  --values PATH         Path to local-values YAML file
  --snapshot-name NAME  Snapshot name (for snapshot command)
  --source NAME         Source VM name (for clone command)
  --dry-run             Show what would be done without executing
  --help                Show this help message

All operations are idempotent -- safe to call repeatedly.

Prerequisites:
  - virsh (from libvirt-daemon-system or libvirt package)
  - virt-install (from virt-install package)
  - virt-clone (from virt-install package, for clone operation)

Examples:
  # Create from local-values file
  ${SCRIPT_NAME} create --values infra/local/vm-provisioning.local-values

  # Create with explicit parameters
  VM_NAME=test-vm VM_RAM_MB=4096 VM_VCPUS=2 VM_DISK_GB=20 ${SCRIPT_NAME} create

  # Snapshot and clone workflow
  ${SCRIPT_NAME} stop --name minecraft-server
  ${SCRIPT_NAME} snapshot --name minecraft-server --snapshot-name golden-v1
  ${SCRIPT_NAME} clone --name minecraft-clone --source minecraft-server

  # Dry-run preview
  ${SCRIPT_NAME} create --values infra/local/vm-provisioning.local-values --dry-run

  # Destroy (idempotent)
  ${SCRIPT_NAME} destroy --name minecraft-server
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing and dispatch
# ---------------------------------------------------------------------------

main() {
    local command=""
    local values_file=""
    local snapshot_name=""
    local source_vm=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            create|start|stop|snapshot|clone|destroy)
                command="$1"
                shift
                ;;
            --name)
                VM_NAME="${2:?'--name requires a value'}"
                shift 2
                ;;
            --values)
                values_file="${2:?'--values requires a path'}"
                shift 2
                ;;
            --snapshot-name)
                snapshot_name="${2:?'--snapshot-name requires a value'}"
                shift 2
                ;;
            --source)
                source_vm="${2:?'--source requires a value'}"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                usage
                exit 0
                ;;
            *)
                vm_die "Unknown option: $1 (use --help for usage)"
                ;;
        esac
    done

    if [[ -z "${command}" ]]; then
        vm_error "No command specified"
        usage
        exit 1
    fi

    # Check prerequisites
    kvm_check_prereqs || vm_die "KVM prerequisites not met"

    # Load values file if provided
    if [[ -n "${values_file}" ]]; then
        vm_load_values "${values_file}"
    fi

    # Validate parameters for commands that need them
    case "${command}" in
        create)
            vm_validate_params || exit 1
            kvm_create
            ;;
        start)
            [[ -z "${VM_NAME:-}" ]] && vm_die "VM_NAME required (use --name or --values)"
            kvm_start
            ;;
        stop)
            [[ -z "${VM_NAME:-}" ]] && vm_die "VM_NAME required (use --name or --values)"
            kvm_stop
            ;;
        snapshot)
            [[ -z "${VM_NAME:-}" ]] && vm_die "VM_NAME required (use --name or --values)"
            [[ -z "${snapshot_name}" ]] && vm_die "Snapshot name required (use --snapshot-name)"
            kvm_snapshot "${snapshot_name}"
            ;;
        clone)
            [[ -z "${VM_NAME:-}" ]] && vm_die "VM_NAME required (use --name or --values)"
            [[ -z "${source_vm}" ]] && vm_die "Source VM required (use --source)"
            kvm_clone "${source_vm}"
            ;;
        destroy)
            [[ -z "${VM_NAME:-}" ]] && vm_die "VM_NAME required (use --name or --values)"
            kvm_destroy
            ;;
        *)
            vm_die "Unknown command: ${command} (use --help for usage)"
            ;;
    esac
}

# Allow sourcing without executing main (for vm-lifecycle.sh dispatch)
if [[ "${1:-}" != "--_sourced" ]]; then
    main "$@"
fi
