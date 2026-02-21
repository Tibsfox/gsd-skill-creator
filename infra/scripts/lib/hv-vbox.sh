# hv-vbox.sh -- VirtualBox backend implementation
#
# Implements the hypervisor abstraction interface for VirtualBox via VBoxManage CLI.
# Sourced by hypervisor-common.sh when VirtualBox backend is selected.
#
# This file has NO shebang -- it is meant to be sourced, not executed directly.
# All functions use local variables and produce no side effects when sourced.
#
# Required tools: VBoxManage (from VirtualBox)

set -euo pipefail

# ---------------------------------------------------------------------------
# Guard: verify VBoxManage is available
# ---------------------------------------------------------------------------

_hv_vbox_check_tools() {
    if ! has_command VBoxManage; then
        warn "VBoxManage not found -- install VirtualBox"
        return 1
    fi
    return 0
}

# ---------------------------------------------------------------------------
# Internal: check if a VM exists in VirtualBox
# ---------------------------------------------------------------------------

_hv_vbox_vm_exists() {
    local name="$1"
    VBoxManage showvminfo "${name}" &>/dev/null
}

# Get VM state from machinereadable output
_hv_vbox_get_state() {
    local name="$1"
    local state_line
    state_line=$(VBoxManage showvminfo "${name}" --machinereadable 2>/dev/null | grep '^VMState=' | head -1) || true
    # Extract value between quotes: VMState="running" -> running
    echo "${state_line}" | sed 's/^VMState="//;s/"$//'
}

# ---------------------------------------------------------------------------
# create -- Create a new VirtualBox VM
# ---------------------------------------------------------------------------
# Args: name cpus ram_mb disk_gb iso_path
hv_vbox_create() {
    local name="$1"
    local cpus="$2"
    local ram_mb="$3"
    local disk_gb="$4"
    local iso_path="$5"
    local disk_mb disk_path

    _hv_vbox_check_tools || return 1

    # Idempotent: if VM already exists, warn and return 0
    if _hv_vbox_vm_exists "${name}"; then
        warn "VirtualBox VM '${name}' already exists -- skipping create"
        return 0
    fi

    # Convert disk size from GB to MB for VBoxManage
    disk_mb=$((disk_gb * 1024))

    # Determine disk path (VirtualBox default location)
    local vbox_dir="${HOME}/VirtualBox VMs/${name}"
    disk_path="${vbox_dir}/${name}.vdi"

    # Create and register the VM
    VBoxManage createvm --name "${name}" --ostype RedHat_64 --register

    # Configure CPU and memory
    VBoxManage modifyvm "${name}" \
        --cpus "${cpus}" \
        --memory "${ram_mb}" \
        --vram 16 \
        --ioapic on

    # Create virtual hard disk
    mkdir -p "${vbox_dir}"
    VBoxManage createhd \
        --filename "${disk_path}" \
        --size "${disk_mb}" \
        --format VDI

    # Add SATA controller and attach disk
    VBoxManage storagectl "${name}" \
        --name "SATA" \
        --add sata \
        --controller IntelAhci \
        --portcount 2

    VBoxManage storageattach "${name}" \
        --storagectl "SATA" \
        --port 0 \
        --device 0 \
        --type hdd \
        --medium "${disk_path}"

    # Attach ISO to DVD drive
    VBoxManage storageattach "${name}" \
        --storagectl "SATA" \
        --port 1 \
        --device 0 \
        --type dvddrive \
        --medium "${iso_path}"

    # Configure networking (NAT by default)
    VBoxManage modifyvm "${name}" \
        --nic1 nat

    return 0
}

# ---------------------------------------------------------------------------
# start -- Start a stopped VirtualBox VM
# ---------------------------------------------------------------------------
# Args: name
hv_vbox_start() {
    local name="$1"

    _hv_vbox_check_tools || return 1

    if ! _hv_vbox_vm_exists "${name}"; then
        printf "[ERROR] VirtualBox VM '%s' not found\n" "${name}" >&2
        return 1
    fi

    # Idempotent: if already running, return 0
    local state
    state=$(_hv_vbox_get_state "${name}")
    if [[ "${state}" == "running" ]]; then
        warn "VirtualBox VM '${name}' is already running"
        return 0
    fi

    VBoxManage startvm "${name}" --type headless
    return 0
}

# ---------------------------------------------------------------------------
# stop -- Graceful shutdown (ACPI first, force after 30s)
# ---------------------------------------------------------------------------
# Args: name
hv_vbox_stop() {
    local name="$1"

    _hv_vbox_check_tools || return 1

    if ! _hv_vbox_vm_exists "${name}"; then
        printf "[ERROR] VirtualBox VM '%s' not found\n" "${name}" >&2
        return 1
    fi

    # Idempotent: if already powered off, return 0
    local state
    state=$(_hv_vbox_get_state "${name}")
    if [[ "${state}" == "poweroff" || "${state}" == "aborted" || "${state}" == "saved" ]]; then
        warn "VirtualBox VM '${name}' is already stopped (state: ${state})"
        return 0
    fi

    # Try ACPI power button (graceful)
    VBoxManage controlvm "${name}" acpipowerbutton 2>/dev/null || true

    # Poll for up to 30 seconds
    local elapsed=0
    while [[ ${elapsed} -lt 30 ]]; do
        sleep 1
        elapsed=$((elapsed + 1))
        state=$(_hv_vbox_get_state "${name}")
        if [[ "${state}" == "poweroff" || "${state}" == "aborted" ]]; then
            return 0
        fi
    done

    # Force power off after timeout
    warn "VirtualBox VM '${name}' did not shut down gracefully after 30s -- forcing off"
    VBoxManage controlvm "${name}" poweroff 2>/dev/null || true
    return 0
}

# ---------------------------------------------------------------------------
# snapshot -- Create a named snapshot
# ---------------------------------------------------------------------------
# Args: name snap_name
hv_vbox_snapshot() {
    local name="$1"
    local snap_name="$2"

    _hv_vbox_check_tools || return 1

    if ! _hv_vbox_vm_exists "${name}"; then
        printf "[ERROR] VirtualBox VM '%s' not found\n" "${name}" >&2
        return 1
    fi

    VBoxManage snapshot "${name}" take "${snap_name}"
    return 0
}

# ---------------------------------------------------------------------------
# destroy -- Remove VM and all storage
# ---------------------------------------------------------------------------
# Args: name
hv_vbox_destroy() {
    local name="$1"

    _hv_vbox_check_tools || return 1

    # Idempotent: if VM doesn't exist, return 0
    if ! _hv_vbox_vm_exists "${name}"; then
        warn "VirtualBox VM '${name}' does not exist -- nothing to destroy"
        return 0
    fi

    # Force power off if running (ignore errors)
    local state
    state=$(_hv_vbox_get_state "${name}")
    if [[ "${state}" == "running" || "${state}" == "paused" ]]; then
        VBoxManage controlvm "${name}" poweroff 2>/dev/null || true
        # Brief wait for state to settle
        sleep 1
    fi

    # Unregister and delete all files
    VBoxManage unregistervm "${name}" --delete 2>/dev/null || true
    return 0
}

# ---------------------------------------------------------------------------
# status -- Print VM state: running/stopped/paused/not-found
# ---------------------------------------------------------------------------
# Args: name
hv_vbox_status() {
    local name="$1"

    _hv_vbox_check_tools || return 1

    if ! _hv_vbox_vm_exists "${name}"; then
        echo "not-found"
        return 0
    fi

    local state
    state=$(_hv_vbox_get_state "${name}")

    case "${state}" in
        running)                     echo "running" ;;
        paused)                      echo "paused" ;;
        poweroff|aborted|saved|"")   echo "stopped" ;;
        *)                           echo "stopped" ;;
    esac

    return 0
}

# ---------------------------------------------------------------------------
# list -- Print all VirtualBox VMs, one per line
# ---------------------------------------------------------------------------
hv_vbox_list() {
    _hv_vbox_check_tools || return 1

    # VBoxManage list vms outputs: "name" {uuid}
    # Extract the name between quotes
    VBoxManage list vms 2>/dev/null | while IFS= read -r line; do
        local vm_name
        vm_name=$(echo "${line}" | sed 's/^"//;s/".*//')
        if [[ -n "${vm_name}" ]]; then
            echo "${vm_name}"
        fi
    done

    return 0
}
