# hv-kvm.sh -- KVM/libvirt backend implementation
#
# Implements the hypervisor abstraction interface for KVM via virsh/virt-install.
# Sourced by hypervisor-common.sh when KVM backend is selected.
#
# This file has NO shebang -- it is meant to be sourced, not executed directly.
# All functions use local variables and produce no side effects when sourced.
#
# Required tools: virsh, virt-install (from libvirt/virt-install packages)

set -euo pipefail

# ---------------------------------------------------------------------------
# Guard: verify virsh is available
# ---------------------------------------------------------------------------

_hv_kvm_check_tools() {
    if ! has_command virsh; then
        warn "virsh not found -- install libvirt-client"
        return 1
    fi
    return 0
}

# ---------------------------------------------------------------------------
# create -- Create a new KVM VM
# ---------------------------------------------------------------------------
# Args: name cpus ram_mb disk_gb iso_path
hv_kvm_create() {
    local name="$1"
    local cpus="$2"
    local ram_mb="$3"
    local disk_gb="$4"
    local iso_path="$5"

    _hv_kvm_check_tools || return 1

    # Idempotent: if VM already exists, warn and return 0
    if virsh dominfo "${name}" &>/dev/null; then
        warn "KVM VM '${name}' already exists -- skipping create"
        return 0
    fi

    # Verify virt-install is available for creation
    if ! has_command virt-install; then
        warn "virt-install not found -- install virt-install package"
        return 1
    fi

    virt-install \
        --name "${name}" \
        --vcpus "${cpus}" \
        --memory "${ram_mb}" \
        --disk "size=${disk_gb}" \
        --cdrom "${iso_path}" \
        --os-variant centos-stream9 \
        --network bridge=virbr0 \
        --graphics none \
        --noautoconsole \
        --wait 0

    return 0
}

# ---------------------------------------------------------------------------
# start -- Start a stopped KVM VM
# ---------------------------------------------------------------------------
# Args: name
hv_kvm_start() {
    local name="$1"

    _hv_kvm_check_tools || return 1

    # Check if VM exists
    if ! virsh dominfo "${name}" &>/dev/null; then
        printf "[ERROR] KVM VM '%s' not found\n" "${name}" >&2
        return 1
    fi

    # Idempotent: if already running, return 0
    local state
    state=$(virsh domstate "${name}" 2>/dev/null | tr -d '[:space:]')
    if [[ "${state}" == "running" ]]; then
        warn "KVM VM '${name}' is already running"
        return 0
    fi

    virsh start "${name}"
    return 0
}

# ---------------------------------------------------------------------------
# stop -- Graceful shutdown (ACPI first, force after 30s)
# ---------------------------------------------------------------------------
# Args: name
hv_kvm_stop() {
    local name="$1"

    _hv_kvm_check_tools || return 1

    # Check if VM exists
    if ! virsh dominfo "${name}" &>/dev/null; then
        printf "[ERROR] KVM VM '%s' not found\n" "${name}" >&2
        return 1
    fi

    # Idempotent: if already shut off, return 0
    local state
    state=$(virsh domstate "${name}" 2>/dev/null | tr -d '[:space:]')
    if [[ "${state}" == "shutoff" ]]; then
        warn "KVM VM '${name}' is already shut off"
        return 0
    fi

    # Try graceful ACPI shutdown
    virsh shutdown "${name}" 2>/dev/null || true

    # Poll for up to 30 seconds
    local elapsed=0
    while [[ ${elapsed} -lt 30 ]]; do
        sleep 1
        elapsed=$((elapsed + 1))
        state=$(virsh domstate "${name}" 2>/dev/null | tr -d '[:space:]')
        if [[ "${state}" == "shutoff" ]]; then
            return 0
        fi
    done

    # Force off after timeout
    warn "KVM VM '${name}' did not shut down gracefully after 30s -- forcing off"
    virsh destroy "${name}" 2>/dev/null || true
    return 0
}

# ---------------------------------------------------------------------------
# snapshot -- Create a named snapshot
# ---------------------------------------------------------------------------
# Args: name snap_name
hv_kvm_snapshot() {
    local name="$1"
    local snap_name="$2"

    _hv_kvm_check_tools || return 1

    # Check if VM exists
    if ! virsh dominfo "${name}" &>/dev/null; then
        printf "[ERROR] KVM VM '%s' not found\n" "${name}" >&2
        return 1
    fi

    # Idempotent: if snapshot already exists, warn and return 0
    if virsh snapshot-list "${name}" --name 2>/dev/null | grep -qx "${snap_name}"; then
        warn "KVM snapshot '${snap_name}' already exists for VM '${name}' -- skipping"
        return 0
    fi

    virsh snapshot-create-as "${name}" --name "${snap_name}"
    return 0
}

# ---------------------------------------------------------------------------
# destroy -- Remove VM and its storage completely
# ---------------------------------------------------------------------------
# Args: name
hv_kvm_destroy() {
    local name="$1"

    _hv_kvm_check_tools || return 1

    # Idempotent: if VM doesn't exist, return 0
    if ! virsh dominfo "${name}" &>/dev/null; then
        warn "KVM VM '${name}' does not exist -- nothing to destroy"
        return 0
    fi

    # Force stop if running (ignore errors)
    virsh destroy "${name}" 2>/dev/null || true

    # Undefine and remove storage
    virsh undefine "${name}" --remove-all-storage 2>/dev/null || true
    return 0
}

# ---------------------------------------------------------------------------
# status -- Print VM state: running/stopped/paused/not-found
# ---------------------------------------------------------------------------
# Args: name
hv_kvm_status() {
    local name="$1"

    _hv_kvm_check_tools || return 1

    # Check if VM exists
    if ! virsh dominfo "${name}" &>/dev/null; then
        echo "not-found"
        return 0
    fi

    local state
    state=$(virsh domstate "${name}" 2>/dev/null | tr -d '[:space:]')

    case "${state}" in
        running)  echo "running" ;;
        shutoff)  echo "stopped" ;;
        paused)   echo "paused" ;;
        *)        echo "stopped" ;;
    esac

    return 0
}

# ---------------------------------------------------------------------------
# list -- Print all VMs managed by libvirt, one per line
# ---------------------------------------------------------------------------
hv_kvm_list() {
    _hv_kvm_check_tools || return 1

    # List all VMs (running and stopped), filter to non-empty lines
    virsh list --all --name 2>/dev/null | while IFS= read -r line; do
        line=$(echo "${line}" | tr -d '[:space:]')
        if [[ -n "${line}" ]]; then
            echo "${line}"
        fi
    done

    return 0
}
