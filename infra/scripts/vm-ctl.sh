#!/usr/bin/env bash
# vm-ctl.sh -- Unified CLI entry point for VM lifecycle operations
#
# Dispatches to KVM/libvirt, VMware Workstation, or VirtualBox backend
# based on auto-detection from hardware-capabilities.yaml or explicit
# --backend flag.
#
# Usage: vm-ctl.sh [--backend kvm|vmware|vbox] <operation> [args...]
#
# Operations:
#   create <name> --cpus N --ram-mb N --disk-gb N --iso PATH
#   start <name>
#   stop <name>
#   snapshot <name> <snapshot-name>
#   destroy <name>
#   status <name>
#   list
#   detect              Print auto-detected backend
#   backends            List available backends on this machine
#
# Exit codes:
#   0 -- Success
#   1 -- Operation error
#   2 -- No backend available
#   3 -- Invalid arguments

set -euo pipefail

# --- Script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

# --- Source shared libraries ---
# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"
# shellcheck source=lib/hypervisor-common.sh
source "${SCRIPT_DIR}/lib/hypervisor-common.sh"

# --- Default capabilities YAML path ---
if [[ -z "${CAPABILITIES_YAML:-}" ]]; then
    if [[ -f "${SCRIPT_DIR}/../inventory/hardware-capabilities.yaml" ]]; then
        export CAPABILITIES_YAML="${SCRIPT_DIR}/../inventory/hardware-capabilities.yaml"
    elif [[ -f "${SCRIPT_DIR}/../local/hardware-capabilities-local.yaml" ]]; then
        export CAPABILITIES_YAML="${SCRIPT_DIR}/../local/hardware-capabilities-local.yaml"
    fi
fi

# --- Defaults ---
BACKEND_OVERRIDE=""
OPERATION=""

# --- Helper functions ---
msg() { printf "[vm-ctl] %s\n" "$*" >&2; }
err() { printf "[vm-ctl] ERROR: %s\n" "$*" >&2; }

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [--backend kvm|vmware|vbox] <operation> [args...]

Unified VM lifecycle manager. Auto-detects hypervisor backend from
hardware-capabilities.yaml, or accepts explicit --backend override.

Operations:
  create <name> --cpus N --ram-mb N --disk-gb N --iso PATH
      Create a new VM with specified resources and boot ISO

  start <name>
      Start a stopped VM

  stop <name>
      Graceful shutdown (ACPI first, force after 30s timeout)

  snapshot <name> <snapshot-name>
      Create a named snapshot of the VM

  destroy <name>
      Remove VM and all its storage (irreversible)

  status <name>
      Print VM state: running/stopped/paused/not-found

  list
      List all VMs managed by the active backend

  detect
      Print which hypervisor backend was auto-detected

  backends
      List all available backends on this machine

Options:
  --backend kvm|vmware|vbox   Override auto-detection with explicit backend
  --help, -h                  Show this help message

Exit Codes:
  0  Success
  1  Operation error
  2  No backend available
  3  Invalid arguments

Examples:
  # Auto-detect backend and list VMs
  ${SCRIPT_NAME} list

  # Create a VM using KVM
  ${SCRIPT_NAME} --backend kvm create myvm --cpus 4 --ram-mb 8192 --disk-gb 50 --iso /path/to/centos.iso

  # Check status of a VM
  ${SCRIPT_NAME} status myvm

  # Snapshot before changes
  ${SCRIPT_NAME} snapshot myvm pre-upgrade

  # See which backend would be used
  ${SCRIPT_NAME} detect

  # See which backends are available
  ${SCRIPT_NAME} backends
EOF
}

# --- Argument parsing (phase 1: extract --backend and --help) ---
ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --backend)
            if [[ -z "${2:-}" ]]; then
                err "Missing value for --backend (expected: kvm, vmware, vbox)"
                exit 3
            fi
            BACKEND_OVERRIDE="$2"
            shift 2
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            ARGS+=("$1")
            shift
            ;;
    esac
done

# Restore positional arguments
set -- "${ARGS[@]+"${ARGS[@]}"}"

# --- Extract operation ---
if [[ $# -lt 1 ]]; then
    err "No operation specified"
    echo "" >&2
    usage
    exit 3
fi

OPERATION="$1"
shift

# --- Handle diagnostic operations (no backend needed) ---
case "${OPERATION}" in
    detect)
        detected=$(hv_detect_backend)
        if [[ "${detected}" == "none" ]]; then
            msg "No hypervisor backend detected"
            msg "Checked hardware-capabilities.yaml for: kvm, vmware, virtualbox"
            if [[ -n "${CAPABILITIES_YAML:-}" ]]; then
                msg "Capabilities file: ${CAPABILITIES_YAML}"
            else
                msg "No capabilities file found"
            fi
            exit 0
        fi
        msg "Detected backend: ${detected}"
        echo "${detected}"
        exit 0
        ;;

    backends)
        msg "Available hypervisor backends:"
        hv_list_available_backends
        exit 0
        ;;
esac

# --- Resolve backend ---
BACKEND=""

if [[ -n "${BACKEND_OVERRIDE}" ]]; then
    # Validate override value
    case "${BACKEND_OVERRIDE}" in
        kvm|vmware|vbox)
            BACKEND="${BACKEND_OVERRIDE}"
            ;;
        *)
            err "Invalid backend: '${BACKEND_OVERRIDE}' (valid: kvm, vmware, vbox)"
            exit 3
            ;;
    esac
else
    BACKEND=$(hv_detect_backend)
    if [[ "${BACKEND}" == "none" ]]; then
        err "No hypervisor backend detected"
        err "Run '${SCRIPT_NAME} backends' to see available backends"
        err "Or specify one explicitly with --backend kvm|vmware|vbox"
        exit 2
    fi
fi

# --- Load backend ---
msg "Using backend: ${BACKEND}"

if ! hv_load_backend "${BACKEND}"; then
    err "Failed to load backend: ${BACKEND}"
    exit 2
fi

# --- Dispatch operations ---
case "${OPERATION}" in
    create)
        # Parse create arguments
        if [[ $# -lt 1 ]]; then
            err "create requires: <name> --cpus N --ram-mb N --disk-gb N --iso PATH"
            exit 3
        fi

        VM_NAME="$1"
        shift

        CREATE_CPUS=""
        CREATE_RAM_MB=""
        CREATE_DISK_GB=""
        CREATE_ISO=""

        while [[ $# -gt 0 ]]; do
            case "$1" in
                --cpus)
                    CREATE_CPUS="${2:-}"
                    shift 2
                    ;;
                --ram-mb)
                    CREATE_RAM_MB="${2:-}"
                    shift 2
                    ;;
                --disk-gb)
                    CREATE_DISK_GB="${2:-}"
                    shift 2
                    ;;
                --iso)
                    CREATE_ISO="${2:-}"
                    shift 2
                    ;;
                *)
                    err "Unknown create option: $1"
                    exit 3
                    ;;
            esac
        done

        # Validate all required create parameters
        local_exit=0
        if [[ -z "${CREATE_CPUS}" ]]; then
            err "Missing required --cpus"
            local_exit=3
        elif [[ ! "${CREATE_CPUS}" =~ ^[0-9]+$ ]] || [[ "${CREATE_CPUS}" -le 0 ]]; then
            err "--cpus must be a positive integer (got: ${CREATE_CPUS})"
            local_exit=3
        fi
        if [[ -z "${CREATE_RAM_MB}" ]]; then
            err "Missing required --ram-mb"
            local_exit=3
        elif [[ ! "${CREATE_RAM_MB}" =~ ^[0-9]+$ ]] || [[ "${CREATE_RAM_MB}" -le 0 ]]; then
            err "--ram-mb must be a positive integer (got: ${CREATE_RAM_MB})"
            local_exit=3
        fi
        if [[ -z "${CREATE_DISK_GB}" ]]; then
            err "Missing required --disk-gb"
            local_exit=3
        elif [[ ! "${CREATE_DISK_GB}" =~ ^[0-9]+$ ]] || [[ "${CREATE_DISK_GB}" -le 0 ]]; then
            err "--disk-gb must be a positive integer (got: ${CREATE_DISK_GB})"
            local_exit=3
        fi
        if [[ -z "${CREATE_ISO}" ]]; then
            err "Missing required --iso"
            local_exit=3
        elif [[ ! -f "${CREATE_ISO}" ]]; then
            warn "ISO path does not exist: ${CREATE_ISO} (proceeding anyway for dry-run compatibility)"
        fi

        if [[ ${local_exit} -ne 0 ]]; then
            err "Usage: ${SCRIPT_NAME} create <name> --cpus N --ram-mb N --disk-gb N --iso PATH"
            exit ${local_exit}
        fi

        hv_dispatch create "${VM_NAME}" "${CREATE_CPUS}" "${CREATE_RAM_MB}" "${CREATE_DISK_GB}" "${CREATE_ISO}"
        ;;

    start)
        if [[ $# -lt 1 ]]; then
            err "start requires: <name>"
            exit 3
        fi
        hv_dispatch start "$1"
        ;;

    stop)
        if [[ $# -lt 1 ]]; then
            err "stop requires: <name>"
            exit 3
        fi
        hv_dispatch stop "$1"
        ;;

    snapshot)
        if [[ $# -lt 2 ]]; then
            err "snapshot requires: <name> <snapshot-name>"
            exit 3
        fi
        hv_dispatch snapshot "$1" "$2"
        ;;

    destroy)
        if [[ $# -lt 1 ]]; then
            err "destroy requires: <name>"
            exit 3
        fi
        hv_dispatch destroy "$1"
        ;;

    status)
        if [[ $# -lt 1 ]]; then
            err "status requires: <name>"
            exit 3
        fi
        hv_dispatch status "$1"
        ;;

    list)
        hv_dispatch list
        ;;

    *)
        err "Unknown operation: '${OPERATION}'"
        err "Valid operations: create, start, stop, snapshot, destroy, status, list, detect, backends"
        exit 3
        ;;
esac
