#!/usr/bin/env bash
# vm-backend-vmware.sh -- VMware Workstation VM provisioning backend
#
# Implements VM lifecycle operations for VMware via vmrun/vmware-vdiskmanager.
# Part of the infrastructure-level provisioning pipeline (Phase 172).
#
# Operations: create, start, stop, snapshot, clone, destroy
# All operations are idempotent -- safe to call repeatedly.
#
# Relationship to Phase 180 (hv-vmware.sh):
#   180/hv-vmware.sh provides PLATFORM-LEVEL abstraction (hv_vmware_create with minimal args)
#   172/vm-backend-vmware.sh provides INFRASTRUCTURE-LEVEL provisioning (PXE boot order,
#   configurable storage dirs, .vmx generation with full hardware config)
#
# Usage: vm-backend-vmware.sh <command> [options]
#
# Commands:
#   create    Create a new VMware VM (.vmx + .vmdk)
#   start     Start a stopped VM (vmrun start nogui)
#   stop      Graceful shutdown with force fallback (60s timeout)
#   snapshot  Create a named snapshot
#   clone     Full clone from an existing VM/snapshot
#   destroy   Remove VM completely (deleteVM + directory cleanup)
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

# Verify required VMware tools are available
vmware_check_prereqs() {
    local ok=true

    if ! _vm_has_command vmrun; then
        vm_error "vmrun not found -- install VMware Workstation or VMware Fusion"
        ok=false
    fi

    # vmware-vdiskmanager is optional (qemu-img fallback exists)
    if ! _vm_has_command vmware-vdiskmanager && ! _vm_has_command qemu-img; then
        vm_warn "Neither vmware-vdiskmanager nor qemu-img found -- disk creation will fail"
    fi

    if [[ "${ok}" != true ]]; then
        return 1
    fi
    return 0
}

# ---------------------------------------------------------------------------
# Path helpers
# ---------------------------------------------------------------------------

# Resolve the VM directory path
_vmware_vm_dir() {
    local name="$1"
    local storage_dir="${VM_STORAGE_DIR:-${HOME}/vmware}"
    echo "${storage_dir}/${name}"
}

# Resolve the .vmx file path
_vmware_vmx_path() {
    local name="$1"
    local vm_dir
    vm_dir=$(_vmware_vm_dir "${name}")
    echo "${vm_dir}/${name}.vmx"
}

# Resolve the .vmdk disk path
_vmware_disk_path() {
    local name="$1"
    local vm_dir
    vm_dir=$(_vmware_vm_dir "${name}")
    echo "${vm_dir}/${name}.vmdk"
}

# ---------------------------------------------------------------------------
# VM state checks
# ---------------------------------------------------------------------------

# Check if a VMware VM exists (by .vmx file presence).
# Returns 0 if exists, 1 if not.
vmware_vm_exists() {
    local name="${1:?vmware_vm_exists requires VM name}"
    local vmx_path
    vmx_path=$(_vmware_vmx_path "${name}")
    [[ -f "${vmx_path}" ]]
}

# Check if a VMware VM is currently running.
# Returns 0 if running, 1 if stopped or not found.
vmware_vm_is_running() {
    local name="${1:?vmware_vm_is_running requires VM name}"
    local vmx_path
    vmx_path=$(_vmware_vmx_path "${name}")
    vmrun list 2>/dev/null | grep -qF "${vmx_path}"
}

# ---------------------------------------------------------------------------
# Operations
# ---------------------------------------------------------------------------

# Create a new VMware VM by generating .vmx config and creating virtual disk.
# Supports three boot modes: ISO, PXE, and PXE+kickstart.
# Idempotent: if .vmx already exists, logs and returns 0.
vmware_create() {
    vm_step "Create VMware VM: ${VM_NAME}"

    local vm_dir vmx_path disk_path
    vm_dir=$(_vmware_vm_dir "${VM_NAME}")
    vmx_path=$(_vmware_vmx_path "${VM_NAME}")
    disk_path=$(_vmware_disk_path "${VM_NAME}")

    # Idempotent check
    if [[ -f "${vmx_path}" ]]; then
        vm_warn "VM '${VM_NAME}' already exists at ${vmx_path} -- skipping create"
        return 0
    fi

    local network="${VM_NETWORK:-vmnet8}"

    vm_info "Name:       ${VM_NAME}"
    vm_info "RAM:        ${VM_RAM_MB} MB"
    vm_info "vCPUs:      ${VM_VCPUS}"
    vm_info "Disk:       ${VM_DISK_GB} GB (${disk_path})"
    vm_info "Network:    ${network}"
    vm_info "VMX:        ${vmx_path}"

    if dry_run_cmd "Create VMware VM at ${vmx_path}"; then
        dry_run_cmd "vmware-vdiskmanager -c -s ${VM_DISK_GB}GB -a lsilogic -t 1 ${disk_path}"
        dry_run_cmd "Generate .vmx configuration"
        return 0
    fi

    # Create VM directory
    mkdir -p "${vm_dir}"

    # Create virtual disk
    if _vm_has_command vmware-vdiskmanager; then
        vm_info "Creating VMDK disk (vmware-vdiskmanager)..."
        vmware-vdiskmanager -c -s "${VM_DISK_GB}GB" -a lsilogic -t 1 "${disk_path}"
    elif _vm_has_command qemu-img; then
        vm_warn "vmware-vdiskmanager not found -- using qemu-img as fallback"
        qemu-img create -f vmdk "${disk_path}" "${VM_DISK_GB}G"
    else
        vm_die "No disk creation tool found (vmware-vdiskmanager or qemu-img)"
    fi

    # Determine boot order and ISO settings
    local boot_order="hdd"
    local iso_present="FALSE"
    local iso_filename=""
    local iso_start_connected="FALSE"

    if [[ -n "${KICKSTART_URL:-}" ]] || [[ -z "${VM_ISO_PATH:-}" ]]; then
        # PXE boot (with or without kickstart)
        boot_order="ethernet0,hdd"
        if [[ -n "${KICKSTART_URL:-}" ]]; then
            vm_info "Boot mode:  PXE + Kickstart (${KICKSTART_URL})"
        else
            vm_info "Boot mode:  PXE (network boot)"
        fi
    elif [[ -n "${VM_ISO_PATH:-}" ]]; then
        # ISO boot
        boot_order="cdrom,hdd"
        iso_present="TRUE"
        iso_filename="${VM_ISO_PATH}"
        iso_start_connected="TRUE"
        vm_info "Boot mode:  ISO (${VM_ISO_PATH})"
    fi

    # Determine network connection type from bridge/network name
    local net_type="nat"
    local net_vnet=""
    if [[ "${network}" == "vmnet"* ]]; then
        net_type="custom"
        net_vnet="${network}"
    fi

    # Map OS variant to VMware guestOS type
    local guest_os="centos-64"
    case "${VM_OS_VARIANT:-centos-stream9}" in
        centos*|rhel*|rocky*|alma*)  guest_os="centos-64" ;;
        fedora*)                      guest_os="fedora-64" ;;
        ubuntu*|debian*)             guest_os="ubuntu-64" ;;
        *)                           guest_os="other-64" ;;
    esac

    # Generate .vmx configuration
    vm_info "Generating .vmx configuration..."
    cat > "${vmx_path}" <<VMXEOF
# GSD VM Provisioning -- Generated by vm-backend-vmware.sh
# VM: ${VM_NAME}
# Created: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

.encoding = "UTF-8"
config.version = "8"
virtualHW.version = "19"

# VM identity
displayName = "${VM_NAME}"
guestOS = "${guest_os}"

# CPU and memory
numvcpus = "${VM_VCPUS}"
memsize = "${VM_RAM_MB}"

# SCSI controller and disk
scsi0.present = "TRUE"
scsi0.virtualDev = "lsilogic"
scsi0:0.present = "TRUE"
scsi0:0.fileName = "${VM_NAME}.vmdk"

# CD/DVD drive (for ISO boot)
ide0:0.present = "${iso_present}"
ide0:0.deviceType = "cdrom-image"
ide0:0.fileName = "${iso_filename}"
ide0:0.startConnected = "${iso_start_connected}"

# Network adapter
ethernet0.present = "TRUE"
ethernet0.connectionType = "${net_type}"
ethernet0.virtualDev = "e1000"
ethernet0.startConnected = "TRUE"
ethernet0.addressType = "generated"
VMXEOF

    # Add custom vmnet if specified
    if [[ -n "${net_vnet}" ]]; then
        echo "ethernet0.vnet = \"${net_vnet}\"" >> "${vmx_path}"
    fi

    # Add boot order and remaining settings
    cat >> "${vmx_path}" <<VMXEOF

# Boot order
bios.bootOrder = "${boot_order}"

# VMware tools and power management
tools.syncTime = "TRUE"
powerType.powerOff = "soft"
powerType.suspend = "soft"
powerType.reset = "soft"

# Misc
floppy0.present = "FALSE"
VMXEOF

    vm_ok "VM '${VM_NAME}' created at ${vmx_path}"
    return 0
}

# Start a stopped VMware VM.
# Idempotent: if already running, returns 0.
vmware_start() {
    vm_step "Start VMware VM: ${VM_NAME}"

    local vmx_path
    vmx_path=$(_vmware_vmx_path "${VM_NAME}")

    if [[ ! -f "${vmx_path}" ]]; then
        vm_die "VM '${VM_NAME}' not found at ${vmx_path} -- cannot start"
    fi

    # Idempotent: if already running, return 0
    if vmware_vm_is_running "${VM_NAME}"; then
        vm_warn "VM '${VM_NAME}' is already running"
        return 0
    fi

    if dry_run_cmd "vmrun start ${vmx_path} nogui"; then
        return 0
    fi

    vmrun start "${vmx_path}" nogui
    vm_ok "VM '${VM_NAME}' started"
    return 0
}

# Graceful shutdown with force fallback after 60 seconds.
# Idempotent: if not running, returns 0.
vmware_stop() {
    vm_step "Stop VMware VM: ${VM_NAME}"

    local vmx_path
    vmx_path=$(_vmware_vmx_path "${VM_NAME}")

    if [[ ! -f "${vmx_path}" ]]; then
        vm_die "VM '${VM_NAME}' not found at ${vmx_path} -- cannot stop"
    fi

    # Idempotent: if not running, return 0
    if ! vmware_vm_is_running "${VM_NAME}"; then
        vm_warn "VM '${VM_NAME}' is not running"
        return 0
    fi

    if dry_run_cmd "vmrun stop ${vmx_path} soft (60s timeout, then hard)"; then
        return 0
    fi

    vm_info "Sending soft shutdown to '${VM_NAME}'..."
    vmrun stop "${vmx_path}" soft 2>/dev/null || true

    # Wait up to 60 seconds for graceful shutdown
    local elapsed=0
    while [[ ${elapsed} -lt 60 ]]; do
        sleep 2
        elapsed=$((elapsed + 2))
        if ! vmware_vm_is_running "${VM_NAME}"; then
            vm_ok "VM '${VM_NAME}' shut down gracefully after ${elapsed}s"
            return 0
        fi
        # Progress indicator every 10 seconds
        if [[ $((elapsed % 10)) -eq 0 ]]; then
            vm_info "Waiting for shutdown... (${elapsed}s / 60s)"
        fi
    done

    # Force stop after timeout
    vm_warn "VM '${VM_NAME}' did not stop gracefully after 60s -- forcing off"
    vmrun stop "${vmx_path}" hard 2>/dev/null || true
    vm_ok "VM '${VM_NAME}' force-stopped"
    return 0
}

# Create a named snapshot.
# Idempotent: if snapshot name already exists, returns 0.
vmware_snapshot() {
    local snap_name="${1:?vmware_snapshot requires a snapshot name}"

    vm_step "Snapshot VMware VM: ${VM_NAME} -> ${snap_name}"

    local vmx_path
    vmx_path=$(_vmware_vmx_path "${VM_NAME}")

    if [[ ! -f "${vmx_path}" ]]; then
        vm_die "VM '${VM_NAME}' not found at ${vmx_path} -- cannot snapshot"
    fi

    # Idempotent: check if snapshot already exists
    if vmrun listSnapshots "${vmx_path}" 2>/dev/null | grep -qF "${snap_name}"; then
        vm_warn "Snapshot '${snap_name}' already exists for VM '${VM_NAME}' -- skipping"
        return 0
    fi

    if dry_run_cmd "vmrun snapshot ${vmx_path} ${snap_name}"; then
        return 0
    fi

    vmrun snapshot "${vmx_path}" "${snap_name}"
    vm_ok "Snapshot '${snap_name}' created for VM '${VM_NAME}'"
    return 0
}

# Full clone from an existing VM.
# Idempotent: if destination .vmx already exists, returns 0.
vmware_clone() {
    local source_vm="${1:?vmware_clone requires a source VM name}"

    vm_step "Clone VMware VM: ${source_vm} -> ${VM_NAME}"

    local dest_vmx_path
    dest_vmx_path=$(_vmware_vmx_path "${VM_NAME}")

    # Idempotent: if destination already exists, skip
    if [[ -f "${dest_vmx_path}" ]]; then
        vm_warn "Target VM '${VM_NAME}' already exists at ${dest_vmx_path} -- skipping clone"
        return 0
    fi

    local source_vmx_path
    source_vmx_path=$(_vmware_vmx_path "${source_vm}")

    if [[ ! -f "${source_vmx_path}" ]]; then
        vm_die "Source VM '${source_vm}' not found at ${source_vmx_path} -- cannot clone"
    fi

    # Stop source if running (required for full clone)
    if vmware_vm_is_running "${source_vm}"; then
        vm_info "Source VM '${source_vm}' is running -- stopping for clone..."
        if ! dry_run_cmd "vmrun stop ${source_vmx_path} soft"; then
            vmrun stop "${source_vmx_path}" soft 2>/dev/null || true
            # Wait up to 30 seconds
            local elapsed=0
            while [[ ${elapsed} -lt 30 ]]; do
                sleep 2
                elapsed=$((elapsed + 2))
                if ! vmware_vm_is_running "${source_vm}"; then
                    break
                fi
            done
            # Force if still running
            if vmware_vm_is_running "${source_vm}"; then
                vmrun stop "${source_vmx_path}" hard 2>/dev/null || true
            fi
        fi
    fi

    # Create destination directory
    local dest_vm_dir
    dest_vm_dir=$(_vmware_vm_dir "${VM_NAME}")

    if dry_run_cmd "vmrun clone ${source_vmx_path} ${dest_vmx_path} full"; then
        return 0
    fi

    mkdir -p "${dest_vm_dir}"
    vmrun clone "${source_vmx_path}" "${dest_vmx_path}" full
    vm_ok "VM '${VM_NAME}' cloned from '${source_vm}'"
    return 0
}

# Remove VM completely: stop + deleteVM + directory cleanup.
# Idempotent: if .vmx does not exist, returns 0.
vmware_destroy() {
    vm_step "Destroy VMware VM: ${VM_NAME}"

    local vm_dir vmx_path
    vm_dir=$(_vmware_vm_dir "${VM_NAME}")
    vmx_path=$(_vmware_vmx_path "${VM_NAME}")

    # Idempotent: if .vmx doesn't exist, nothing to destroy
    if [[ ! -f "${vmx_path}" ]]; then
        vm_warn "VM '${VM_NAME}' does not exist at ${vmx_path} -- nothing to destroy"
        return 0
    fi

    if dry_run_cmd "Stop + vmrun deleteVM ${vmx_path} + rm -rf ${vm_dir}"; then
        return 0
    fi

    # Stop if running
    if vmware_vm_is_running "${VM_NAME}"; then
        vm_info "Stopping VM '${VM_NAME}' before destroy..."
        vmrun stop "${vmx_path}" hard 2>/dev/null || true
    fi

    # Delete the VM via vmrun (removes from registry)
    vmrun deleteVM "${vmx_path}" 2>/dev/null || true

    # Clean up VM directory and all storage
    if [[ -d "${vm_dir}" ]]; then
        rm -rf "${vm_dir}"
    fi

    vm_ok "VM '${VM_NAME}' destroyed (storage removed)"
    return 0
}

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} <command> [options]

VMware Workstation VM provisioning backend. Creates and manages VMs via
vmrun and vmware-vdiskmanager with full provisioning pipeline support.

Commands:
  create      Create a new VM (requires --values or parameter env vars)
  start       Start a stopped VM (requires --name)
  stop        Graceful shutdown with force fallback (requires --name)
  snapshot    Create a named snapshot (requires --name --snapshot-name)
  clone       Full clone from an existing VM (requires --name --source)
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
  - vmrun (from VMware Workstation or VMware Fusion)
  - vmware-vdiskmanager (for disk creation; qemu-img as fallback)

Storage convention:
  VMs are stored under VM_STORAGE_DIR (default: ~/vmware):
    ~/vmware/{vm_name}/{vm_name}.vmx
    ~/vmware/{vm_name}/{vm_name}.vmdk

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
    vmware_check_prereqs || vm_die "VMware prerequisites not met"

    # Load values file if provided
    if [[ -n "${values_file}" ]]; then
        vm_load_values "${values_file}"
    fi

    # Validate parameters for commands that need them
    case "${command}" in
        create)
            vm_validate_params || exit 1
            vmware_create
            ;;
        start)
            [[ -z "${VM_NAME:-}" ]] && vm_die "VM_NAME required (use --name or --values)"
            vmware_start
            ;;
        stop)
            [[ -z "${VM_NAME:-}" ]] && vm_die "VM_NAME required (use --name or --values)"
            vmware_stop
            ;;
        snapshot)
            [[ -z "${VM_NAME:-}" ]] && vm_die "VM_NAME required (use --name or --values)"
            [[ -z "${snapshot_name}" ]] && vm_die "Snapshot name required (use --snapshot-name)"
            vmware_snapshot "${snapshot_name}"
            ;;
        clone)
            [[ -z "${VM_NAME:-}" ]] && vm_die "VM_NAME required (use --name or --values)"
            [[ -z "${source_vm}" ]] && vm_die "Source VM required (use --source)"
            vmware_clone "${source_vm}"
            ;;
        destroy)
            [[ -z "${VM_NAME:-}" ]] && vm_die "VM_NAME required (use --name or --values)"
            vmware_destroy
            ;;
        *)
            vm_die "Unknown command: ${command} (use --help for usage)"
            ;;
    esac
}

main "$@"
