# hv-vmware.sh -- VMware Workstation backend implementation
#
# Implements the hypervisor abstraction interface for VMware via vmrun CLI.
# Sourced by hypervisor-common.sh when VMware backend is selected.
#
# This file has NO shebang -- it is meant to be sourced, not executed directly.
# All functions use local variables and produce no side effects when sourced.
#
# VM paths stored under: $HOME/vmware/{name}/{name}.vmx
# Required tools: vmrun (from VMware Workstation/Fusion)

set -euo pipefail

# ---------------------------------------------------------------------------
# Guard: verify vmrun is available
# ---------------------------------------------------------------------------

_hv_vmware_check_tools() {
    if ! has_command vmrun; then
        warn "vmrun not found -- install VMware Workstation or Fusion"
        return 1
    fi
    return 0
}

# ---------------------------------------------------------------------------
# Internal: resolve VM paths
# ---------------------------------------------------------------------------

_hv_vmware_vm_dir() {
    local name="$1"
    echo "${HOME}/vmware/${name}"
}

_hv_vmware_vmx_path() {
    local name="$1"
    echo "${HOME}/vmware/${name}/${name}.vmx"
}

_hv_vmware_disk_path() {
    local name="$1"
    echo "${HOME}/vmware/${name}/${name}.vmdk"
}

# Check if a VM is currently running by checking vmrun list output
_hv_vmware_is_running() {
    local vmx_path="$1"
    vmrun list 2>/dev/null | grep -qF "${vmx_path}"
}

# ---------------------------------------------------------------------------
# create -- Create a new VMware VM
# ---------------------------------------------------------------------------
# Args: name cpus ram_mb disk_gb iso_path
hv_vmware_create() {
    local name="$1"
    local cpus="$2"
    local ram_mb="$3"
    local disk_gb="$4"
    local iso_path="$5"
    local vm_dir vmx_path disk_path

    _hv_vmware_check_tools || return 1

    vm_dir=$(_hv_vmware_vm_dir "${name}")
    vmx_path=$(_hv_vmware_vmx_path "${name}")
    disk_path=$(_hv_vmware_disk_path "${name}")

    # Idempotent: if .vmx already exists, warn and return 0
    if [[ -f "${vmx_path}" ]]; then
        warn "VMware VM '${name}' already exists at ${vmx_path} -- skipping create"
        return 0
    fi

    # Create VM directory
    mkdir -p "${vm_dir}"

    # Create virtual disk
    if has_command vmware-vdiskmanager; then
        vmware-vdiskmanager -c -s "${disk_gb}GB" -a lsilogic -t 0 "${disk_path}"
    elif has_command qemu-img; then
        warn "vmware-vdiskmanager not found -- using qemu-img as fallback"
        qemu-img create -f vmdk "${disk_path}" "${disk_gb}G"
    else
        warn "No disk creation tool found (vmware-vdiskmanager or qemu-img)"
        return 1
    fi

    # Generate minimal .vmx configuration
    cat > "${vmx_path}" <<VMXEOF
.encoding = "UTF-8"
config.version = "8"
virtualHW.version = "19"
displayName = "${name}"
guestOS = "centos-64"
numvcpus = "${cpus}"
memsize = "${ram_mb}"
scsi0.present = "TRUE"
scsi0.virtualDev = "lsilogic"
scsi0:0.present = "TRUE"
scsi0:0.fileName = "${name}.vmdk"
ide0:0.present = "TRUE"
ide0:0.deviceType = "cdrom-image"
ide0:0.fileName = "${iso_path}"
ide0:0.startConnected = "TRUE"
ethernet0.present = "TRUE"
ethernet0.connectionType = "nat"
ethernet0.virtualDev = "e1000"
ethernet0.startConnected = "TRUE"
ethernet0.addressType = "generated"
tools.syncTime = "TRUE"
powerType.powerOff = "soft"
powerType.suspend = "soft"
powerType.reset = "soft"
VMXEOF

    return 0
}

# ---------------------------------------------------------------------------
# start -- Start a stopped VMware VM
# ---------------------------------------------------------------------------
# Args: name
hv_vmware_start() {
    local name="$1"
    local vmx_path

    _hv_vmware_check_tools || return 1

    vmx_path=$(_hv_vmware_vmx_path "${name}")

    if [[ ! -f "${vmx_path}" ]]; then
        printf "[ERROR] VMware VM '%s' not found at %s\n" "${name}" "${vmx_path}" >&2
        return 1
    fi

    # Idempotent: if already running, return 0
    if _hv_vmware_is_running "${vmx_path}"; then
        warn "VMware VM '${name}' is already running"
        return 0
    fi

    vmrun start "${vmx_path}" nogui
    return 0
}

# ---------------------------------------------------------------------------
# stop -- Graceful shutdown (soft first, hard after 30s)
# ---------------------------------------------------------------------------
# Args: name
hv_vmware_stop() {
    local name="$1"
    local vmx_path

    _hv_vmware_check_tools || return 1

    vmx_path=$(_hv_vmware_vmx_path "${name}")

    if [[ ! -f "${vmx_path}" ]]; then
        printf "[ERROR] VMware VM '%s' not found at %s\n" "${name}" "${vmx_path}" >&2
        return 1
    fi

    # Idempotent: if not running, return 0
    if ! _hv_vmware_is_running "${vmx_path}"; then
        warn "VMware VM '${name}' is not running"
        return 0
    fi

    # Try soft shutdown
    vmrun stop "${vmx_path}" soft 2>/dev/null || true

    # Poll for up to 30 seconds
    local elapsed=0
    while [[ ${elapsed} -lt 30 ]]; do
        sleep 1
        elapsed=$((elapsed + 1))
        if ! _hv_vmware_is_running "${vmx_path}"; then
            return 0
        fi
    done

    # Force stop after timeout
    warn "VMware VM '${name}' did not stop gracefully after 30s -- forcing off"
    vmrun stop "${vmx_path}" hard 2>/dev/null || true
    return 0
}

# ---------------------------------------------------------------------------
# snapshot -- Create a named snapshot
# ---------------------------------------------------------------------------
# Args: name snap_name
hv_vmware_snapshot() {
    local name="$1"
    local snap_name="$2"
    local vmx_path

    _hv_vmware_check_tools || return 1

    vmx_path=$(_hv_vmware_vmx_path "${name}")

    if [[ ! -f "${vmx_path}" ]]; then
        printf "[ERROR] VMware VM '%s' not found at %s\n" "${name}" "${vmx_path}" >&2
        return 1
    fi

    vmrun snapshot "${vmx_path}" "${snap_name}"
    return 0
}

# ---------------------------------------------------------------------------
# destroy -- Remove VM and its storage completely
# ---------------------------------------------------------------------------
# Args: name
hv_vmware_destroy() {
    local name="$1"
    local vm_dir vmx_path

    _hv_vmware_check_tools || return 1

    vm_dir=$(_hv_vmware_vm_dir "${name}")
    vmx_path=$(_hv_vmware_vmx_path "${name}")

    # Idempotent: if VM directory doesn't exist, return 0
    if [[ ! -d "${vm_dir}" ]]; then
        warn "VMware VM '${name}' directory does not exist -- nothing to destroy"
        return 0
    fi

    # Force stop if running (ignore errors)
    if [[ -f "${vmx_path}" ]] && _hv_vmware_is_running "${vmx_path}"; then
        vmrun stop "${vmx_path}" hard 2>/dev/null || true
    fi

    # Delete the VM from vmrun's registry if possible
    if [[ -f "${vmx_path}" ]]; then
        vmrun deleteVM "${vmx_path}" 2>/dev/null || true
    fi

    # Remove VM directory and all storage
    rm -rf "${vm_dir}"
    return 0
}

# ---------------------------------------------------------------------------
# status -- Print VM state: running/stopped/not-found
# ---------------------------------------------------------------------------
# Args: name
hv_vmware_status() {
    local name="$1"
    local vmx_path

    _hv_vmware_check_tools || return 1

    vmx_path=$(_hv_vmware_vmx_path "${name}")

    if [[ ! -f "${vmx_path}" ]]; then
        echo "not-found"
        return 0
    fi

    if _hv_vmware_is_running "${vmx_path}"; then
        echo "running"
    else
        echo "stopped"
    fi

    return 0
}

# ---------------------------------------------------------------------------
# list -- Print all VMware VMs, one per line
# ---------------------------------------------------------------------------
hv_vmware_list() {
    local vmware_dir="${HOME}/vmware"

    _hv_vmware_check_tools || return 1

    # List VMs from the directory convention
    if [[ ! -d "${vmware_dir}" ]]; then
        return 0
    fi

    local entry name
    for entry in "${vmware_dir}"/*/; do
        [[ -d "${entry}" ]] || continue
        name=$(basename "${entry}")
        if [[ -f "${entry}/${name}.vmx" ]]; then
            echo "${name}"
        fi
    done

    return 0
}
