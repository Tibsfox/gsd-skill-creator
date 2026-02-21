#!/usr/bin/env bash
# discover-hardware.sh -- Hardware discovery and profile generation
#
# Queries Linux standard interfaces to detect CPU, RAM, storage, GPU,
# and hypervisor capabilities. Generates two YAML files:
#   1. Sanitized hardware-profile.yaml (safe for git, no identifying info)
#   2. Local hardware-values.yaml (actual values, gitignored)
#
# Usage: discover-hardware.sh [--output-dir <path>]
#
# Exit codes:
#   0 -- success, minimum requirements met
#   1 -- success, but minimum requirements NOT met (files still generated)

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_OUTPUT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_DIR="${DEFAULT_OUTPUT_DIR}"

PROFILE_PATH=""
VALUES_PATH=""

MIN_RAM_GB=16

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case "$1" in
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --help|-h)
            printf "Usage: %s [--output-dir <path>]\n" "$(basename "$0")"
            printf "\nDiscover hardware and generate YAML profiles.\n"
            printf "\nOptions:\n"
            printf "  --output-dir <path>  Base directory (default: parent of script dir)\n"
            printf "                       Profile goes to <path>/inventory/hardware-profile.yaml\n"
            printf "                       Values go to <path>/local/hardware-values.yaml\n"
            exit 0
            ;;
        *)
            printf "Unknown option: %s\n" "$1" >&2
            exit 2
            ;;
    esac
done

PROFILE_PATH="${OUTPUT_DIR}/inventory/hardware-profile.yaml"
VALUES_PATH="${OUTPUT_DIR}/local/hardware-values.yaml"

# Ensure output directories exist
mkdir -p "$(dirname "${PROFILE_PATH}")"
mkdir -p "$(dirname "${VALUES_PATH}")"

# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------

has_cmd() {
    command -v "$1" &>/dev/null
}

# Safely read a file, return empty string if missing
safe_read() {
    cat "$1" 2>/dev/null || echo ""
}

# Convert bytes to GB (integer, rounded)
bytes_to_gb() {
    local bytes="${1:-0}"
    echo $(( (bytes + 536870912) / 1073741824 ))
}

# Convert KB to GB (integer, rounded)
kb_to_gb() {
    local kb="${1:-0}"
    echo $(( (kb + 524288) / 1048576 ))
}

# ---------------------------------------------------------------------------
# CPU Discovery
# ---------------------------------------------------------------------------

discover_cpu() {
    local arch model_name cores_physical cores_logical virt_type=""
    local freq_mhz="" max_freq_mhz="" has_virtualization="false"

    arch="$(uname -m)"

    if [[ -f /proc/cpuinfo ]]; then
        model_name="$(grep -m1 '^model name' /proc/cpuinfo 2>/dev/null | cut -d: -f2 | sed 's/^ //' || echo "Unknown")"
        cores_logical="$(grep -c '^processor' /proc/cpuinfo 2>/dev/null || echo "1")"
    else
        model_name="Unknown"
        cores_logical="1"
    fi

    if has_cmd lscpu; then
        local lscpu_out
        lscpu_out="$(lscpu 2>/dev/null)"
        cores_physical="$(echo "${lscpu_out}" | grep '^Core(s) per socket:' | awk '{print $NF}' || echo "")"
        local sockets
        sockets="$(echo "${lscpu_out}" | grep '^Socket(s):' | awk '{print $NF}' || echo "1")"
        if [[ -n "${cores_physical}" && -n "${sockets}" ]]; then
            cores_physical=$(( cores_physical * sockets ))
        fi
        freq_mhz="$(echo "${lscpu_out}" | grep '^CPU MHz:' | awk '{print $NF}' | cut -d. -f1 || echo "")"
        max_freq_mhz="$(echo "${lscpu_out}" | grep '^CPU max MHz:' | awk '{print $NF}' | cut -d. -f1 || echo "")"
    fi

    # Fallback for physical cores
    if [[ -z "${cores_physical}" || "${cores_physical}" == "0" ]]; then
        cores_physical="${cores_logical}"
    fi

    # Check virtualization support
    if [[ -f /proc/cpuinfo ]]; then
        if grep -qE '\b(vmx)\b' /proc/cpuinfo 2>/dev/null; then
            has_virtualization="true"
            virt_type="vmx"
        elif grep -qE '\b(svm)\b' /proc/cpuinfo 2>/dev/null; then
            has_virtualization="true"
            virt_type="svm"
        fi
    fi

    # Derive a sanitized family name (strip stepping, microcode, specific SKU)
    local family
    family="$(echo "${model_name}" | sed -E 's/\s+/ /g; s/\(R\)//g; s/\(TM\)//g; s/CPU //; s/ @.*//; s/ [0-9]+\.[0-9]+GHz//')"

    # Export for profile generation
    CPU_ARCH="${arch}"
    CPU_MODEL="${model_name}"
    CPU_FAMILY="${family}"
    CPU_CORES_PHYSICAL="${cores_physical}"
    CPU_CORES_LOGICAL="${cores_logical}"
    CPU_VIRTUALIZATION="${has_virtualization}"
    CPU_VIRT_TYPE="${virt_type}"
    CPU_FREQ_MHZ="${freq_mhz}"
    CPU_MAX_FREQ_MHZ="${max_freq_mhz}"

    printf "  [CPU] %s -- %s cores/%s threads -- virt: %s\n" \
        "${CPU_FAMILY}" "${CPU_CORES_PHYSICAL}" "${CPU_CORES_LOGICAL}" "${CPU_VIRTUALIZATION}"
}

# ---------------------------------------------------------------------------
# Memory Discovery
# ---------------------------------------------------------------------------

discover_memory() {
    local total_kb=0 available_kb=0 swap_total_kb=0 swap_free_kb=0

    if [[ -f /proc/meminfo ]]; then
        total_kb="$(grep '^MemTotal:' /proc/meminfo | awk '{print $2}' || echo "0")"
        available_kb="$(grep '^MemAvailable:' /proc/meminfo | awk '{print $2}' || echo "0")"
        swap_total_kb="$(grep '^SwapTotal:' /proc/meminfo | awk '{print $2}' || echo "0")"
        swap_free_kb="$(grep '^SwapFree:' /proc/meminfo | awk '{print $2}' || echo "0")"
    fi

    MEM_TOTAL_KB="${total_kb}"
    MEM_TOTAL_BYTES=$(( total_kb * 1024 ))
    MEM_TOTAL_GB="$(kb_to_gb "${total_kb}")"
    MEM_AVAILABLE_GB="$(kb_to_gb "${available_kb}")"
    MEM_SWAP_TOTAL_GB="$(kb_to_gb "${swap_total_kb}")"
    MEM_SWAP_FREE_GB="$(kb_to_gb "${swap_free_kb}")"

    printf "  [RAM] %s GB total -- %s GB available -- swap %s GB\n" \
        "${MEM_TOTAL_GB}" "${MEM_AVAILABLE_GB}" "${MEM_SWAP_TOTAL_GB}"
}

# ---------------------------------------------------------------------------
# Storage Discovery
# ---------------------------------------------------------------------------

discover_storage() {
    STORAGE_DEVICES=()
    STORAGE_TOTAL_GB=0

    if has_cmd lsblk; then
        # Use lsblk to find all disk devices
        while IFS= read -r line; do
            local name size_bytes rotational type_str mountpoint model serial
            name="$(echo "${line}" | awk '{print $1}')"
            size_bytes="$(echo "${line}" | awk '{print $2}')"
            rotational="$(echo "${line}" | awk '{print $3}')"
            type_str="$(echo "${line}" | awk '{print $4}')"
            mountpoint="$(echo "${line}" | awk '{$1=$2=$3=$4=""; print $0}' | sed 's/^ *//')"

            # Only process whole disks
            if [[ "${type_str}" != "disk" ]]; then
                continue
            fi

            local disk_type="ssd"
            if [[ "${rotational}" == "1" ]]; then
                disk_type="hdd"
            fi

            local size_gb
            size_gb="$(bytes_to_gb "${size_bytes}")"

            # Try to get model and serial (may need root)
            model="$(safe_read "/sys/block/${name}/device/model" | sed 's/[[:space:]]*$//')"
            serial="$(safe_read "/sys/block/${name}/device/serial" | sed 's/[[:space:]]*$//')"

            STORAGE_DEVICES+=("${name}|${disk_type}|${size_gb}|${model}|${serial}")
            STORAGE_TOTAL_GB=$(( STORAGE_TOTAL_GB + size_gb ))

        done < <(lsblk -dnb -o NAME,SIZE,ROTA,TYPE,MOUNTPOINT 2>/dev/null || true)
    fi

    printf "  [DISK] %s device(s) -- %s GB total\n" "${#STORAGE_DEVICES[@]}" "${STORAGE_TOTAL_GB}"
}

# ---------------------------------------------------------------------------
# GPU Discovery
# ---------------------------------------------------------------------------

discover_gpu() {
    GPU_PRESENT="false"
    GPU_VENDOR=""
    GPU_FAMILY=""
    GPU_MODEL=""
    GPU_VRAM_MB=""
    GPU_DRIVER=""
    GPU_IOMMU="false"
    GPU_PCI_SLOT=""

    if has_cmd lspci; then
        local vga_line
        vga_line="$(lspci 2>/dev/null | grep -i 'vga\|3d controller\|display' | head -1 || echo "")"

        if [[ -n "${vga_line}" ]]; then
            GPU_PRESENT="true"
            GPU_PCI_SLOT="$(echo "${vga_line}" | awk '{print $1}')"

            # Detect vendor
            if echo "${vga_line}" | grep -qi 'nvidia'; then
                GPU_VENDOR="nvidia"
                GPU_FAMILY="$(echo "${vga_line}" | sed -E 's/.*NVIDIA Corporation //' | sed -E 's/ \[.*//; s/ \(.*//' || echo "NVIDIA")"
            elif echo "${vga_line}" | grep -qi 'amd\|ati\|radeon'; then
                GPU_VENDOR="amd"
                GPU_FAMILY="$(echo "${vga_line}" | sed -E 's/.*(AMD|ATI)[^:]*: //' | sed -E 's/ \[.*//; s/ \(.*//' || echo "AMD")"
            elif echo "${vga_line}" | grep -qi 'intel'; then
                GPU_VENDOR="intel"
                GPU_FAMILY="$(echo "${vga_line}" | sed -E 's/.*Intel Corporation //' | sed -E 's/ \[.*//; s/ \(.*//' || echo "Intel Integrated")"
            else
                GPU_VENDOR="unknown"
                GPU_FAMILY="$(echo "${vga_line}" | cut -d: -f3- | sed 's/^ //')"
            fi

            GPU_MODEL="${vga_line}"

            # Try to detect VRAM
            if [[ "${GPU_VENDOR}" == "nvidia" ]] && has_cmd nvidia-smi; then
                GPU_VRAM_MB="$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -1 | tr -d ' ' || echo "")"
            fi

            # Try to detect driver
            if [[ -n "${GPU_PCI_SLOT}" ]]; then
                GPU_DRIVER="$(lspci -k -s "${GPU_PCI_SLOT}" 2>/dev/null | grep 'Kernel driver in use:' | awk '{print $NF}' || echo "")"
            fi
        fi
    fi

    # Check IOMMU
    if [[ -d /sys/kernel/iommu_groups/ ]]; then
        local group_count
        group_count="$(ls /sys/kernel/iommu_groups/ 2>/dev/null | wc -l)"
        if [[ "${group_count}" -gt 0 ]]; then
            GPU_IOMMU="true"
        fi
    fi

    if [[ "${GPU_PRESENT}" == "true" ]]; then
        local vram_str=""
        if [[ -n "${GPU_VRAM_MB}" ]]; then
            vram_str=" -- ${GPU_VRAM_MB} MB VRAM"
        fi
        printf "  [GPU] %s %s%s -- driver: %s -- IOMMU: %s\n" \
            "${GPU_VENDOR}" "${GPU_FAMILY}" "${vram_str}" "${GPU_DRIVER:-none}" "${GPU_IOMMU}"
    else
        printf "  [GPU] No discrete GPU detected (integrated or none)\n"
    fi
}

# ---------------------------------------------------------------------------
# Hypervisor Discovery
# ---------------------------------------------------------------------------

discover_hypervisor() {
    HV_KVM="false"
    HV_VMWARE="false"
    HV_VIRTUALBOX="false"
    HV_PODMAN="false"
    HV_DOCKER="false"
    HV_NESTED="false"

    # KVM/libvirt
    if [[ -c /dev/kvm ]]; then
        HV_KVM="true"
    elif has_cmd virsh && virsh version &>/dev/null; then
        HV_KVM="true"
    fi

    # VMware
    if has_cmd vmrun || has_cmd vmware; then
        HV_VMWARE="true"
    fi

    # VirtualBox
    if has_cmd VBoxManage && VBoxManage --version &>/dev/null; then
        HV_VIRTUALBOX="true"
    fi

    # Container runtimes
    if has_cmd podman && podman version &>/dev/null; then
        HV_PODMAN="true"
    fi

    if has_cmd docker && docker version &>/dev/null; then
        HV_DOCKER="true"
    fi

    # Nested virtualization
    if [[ -f /sys/module/kvm_intel/parameters/nested ]]; then
        local nested_val
        nested_val="$(safe_read /sys/module/kvm_intel/parameters/nested)"
        if [[ "${nested_val}" == "Y" || "${nested_val}" == "1" ]]; then
            HV_NESTED="true"
        fi
    elif [[ -f /sys/module/kvm_amd/parameters/nested ]]; then
        local nested_val
        nested_val="$(safe_read /sys/module/kvm_amd/parameters/nested)"
        if [[ "${nested_val}" == "Y" || "${nested_val}" == "1" ]]; then
            HV_NESTED="true"
        fi
    fi

    printf "  [HV] KVM: %s -- VMware: %s -- VBox: %s -- Podman: %s -- Docker: %s -- Nested: %s\n" \
        "${HV_KVM}" "${HV_VMWARE}" "${HV_VIRTUALBOX}" "${HV_PODMAN}" "${HV_DOCKER}" "${HV_NESTED}"
}

# ---------------------------------------------------------------------------
# Network Discovery (local values only)
# ---------------------------------------------------------------------------

discover_network() {
    NET_INTERFACES=()

    if has_cmd ip; then
        while IFS= read -r iface; do
            [[ -z "${iface}" ]] && continue
            [[ "${iface}" == "lo" ]] && continue

            local mac ipv4
            mac="$(ip link show "${iface}" 2>/dev/null | grep 'link/ether' | awk '{print $2}' || echo "")"
            ipv4="$(ip -4 addr show "${iface}" 2>/dev/null | grep -oP 'inet \K[\d.]+' | head -1 || echo "")"

            NET_INTERFACES+=("${iface}|${mac}|${ipv4}")
        done < <(ip -o link show 2>/dev/null | awk -F': ' '{print $2}' | sed 's/@.*//')
    fi

    printf "  [NET] %s interface(s) detected\n" "${#NET_INTERFACES[@]}"
}

# ---------------------------------------------------------------------------
# Capabilities Assessment
# ---------------------------------------------------------------------------

assess_capabilities() {
    CAN_RUN_VMS="false"
    CAN_PASSTHROUGH_GPU="false"
    MEETS_MINIMUM="false"

    # Can run VMs: virtualization support + a hypervisor or /dev/kvm
    if [[ "${CPU_VIRTUALIZATION}" == "true" ]]; then
        if [[ "${HV_KVM}" == "true" || "${HV_VMWARE}" == "true" || "${HV_VIRTUALBOX}" == "true" ]]; then
            CAN_RUN_VMS="true"
        fi
    fi

    # Can passthrough GPU: IOMMU available + discrete GPU
    if [[ "${GPU_IOMMU}" == "true" && "${GPU_PRESENT}" == "true" && "${GPU_VENDOR}" != "intel" ]]; then
        CAN_PASSTHROUGH_GPU="true"
    fi

    # Meets minimum: 16GB RAM + virtualization
    if [[ "${MEM_TOTAL_GB}" -ge "${MIN_RAM_GB}" && "${CPU_VIRTUALIZATION}" == "true" ]]; then
        MEETS_MINIMUM="true"
    fi

    printf "  [CAP] VMs: %s -- GPU passthrough: %s -- Meets minimum: %s\n" \
        "${CAN_RUN_VMS}" "${CAN_PASSTHROUGH_GPU}" "${MEETS_MINIMUM}"
}

# ---------------------------------------------------------------------------
# YAML Generation -- Sanitized Profile
# ---------------------------------------------------------------------------

generate_sanitized_profile() {
    local date_str
    date_str="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

    local vram_line=""
    if [[ -n "${GPU_VRAM_MB}" ]]; then
        local vram_gb
        vram_gb=$(( (GPU_VRAM_MB + 512) / 1024 ))
        vram_line="  vram_gb: ${vram_gb}"
    else
        vram_line="  vram_gb: null"
    fi

    local virt_type_line=""
    if [[ -n "${CPU_VIRT_TYPE}" ]]; then
        virt_type_line="  virtualization_type: ${CPU_VIRT_TYPE}"
    else
        virt_type_line="  virtualization_type: null"
    fi

    cat > "${PROFILE_PATH}" <<YAML
# Hardware Profile (sanitized -- safe for version control)
# Generated by discover-hardware.sh on ${date_str}
# Contains NO identifying information (no MACs, serials, hostnames)

cpu:
  architecture: ${CPU_ARCH}
  family: "${CPU_FAMILY}"
  cores_physical: ${CPU_CORES_PHYSICAL}
  cores_logical: ${CPU_CORES_LOGICAL}
  virtualization: ${CPU_VIRTUALIZATION}
${virt_type_line}

memory:
  total_gb: ${MEM_TOTAL_GB}
  swap_gb: ${MEM_SWAP_TOTAL_GB}

storage:
  devices:
YAML

    # Add storage devices (sanitized: type and size only)
    if [[ ${#STORAGE_DEVICES[@]} -gt 0 ]]; then
        for device in "${STORAGE_DEVICES[@]}"; do
            local dtype dsize
            dtype="$(echo "${device}" | cut -d'|' -f2)"
            dsize="$(echo "${device}" | cut -d'|' -f3)"
            printf "    - type: %s\n      size_gb: %s\n" "${dtype}" "${dsize}" >> "${PROFILE_PATH}"
        done
    else
        printf "    []  # no block devices detected\n" >> "${PROFILE_PATH}"
    fi

    cat >> "${PROFILE_PATH}" <<YAML
  total_gb: ${STORAGE_TOTAL_GB}

gpu:
  present: ${GPU_PRESENT}
  vendor: ${GPU_VENDOR:-null}
  family: "${GPU_FAMILY:-none}"
${vram_line}
  driver: ${GPU_DRIVER:-null}
  iommu_available: ${GPU_IOMMU}

hypervisor:
  kvm: ${HV_KVM}
  vmware: ${HV_VMWARE}
  virtualbox: ${HV_VIRTUALBOX}
  podman: ${HV_PODMAN}
  docker: ${HV_DOCKER}
  nested_virtualization: ${HV_NESTED}

capabilities:
  can_run_vms: ${CAN_RUN_VMS}
  can_passthrough_gpu: ${CAN_PASSTHROUGH_GPU}
  meets_minimum: ${MEETS_MINIMUM}
YAML

    printf "  [OUT] Sanitized profile: %s\n" "${PROFILE_PATH}"
}

# ---------------------------------------------------------------------------
# YAML Generation -- Local Values
# ---------------------------------------------------------------------------

generate_local_values() {
    local date_str hostname_str
    date_str="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    hostname_str="$(hostname 2>/dev/null || echo "unknown")"

    cat > "${VALUES_PATH}" <<YAML
# Local Hardware Values (GITIGNORED -- contains actual system data)
# Generated by discover-hardware.sh on ${date_str}
# Used by downstream provisioning scripts

hostname: "${hostname_str}"

cpu:
  model: "${CPU_MODEL}"
  cores_physical: ${CPU_CORES_PHYSICAL}
  cores_logical: ${CPU_CORES_LOGICAL}
  frequency_mhz: ${CPU_FREQ_MHZ:-null}
  max_frequency_mhz: ${CPU_MAX_FREQ_MHZ:-null}

memory:
  total_bytes: ${MEM_TOTAL_BYTES}
  total_gb: ${MEM_TOTAL_GB}
  available_gb: ${MEM_AVAILABLE_GB}
  swap_total_gb: ${MEM_SWAP_TOTAL_GB}

storage:
  devices:
YAML

    if [[ ${#STORAGE_DEVICES[@]} -gt 0 ]]; then
        for device in "${STORAGE_DEVICES[@]}"; do
            local dname dtype dsize dmodel dserial
            dname="$(echo "${device}" | cut -d'|' -f1)"
            dtype="$(echo "${device}" | cut -d'|' -f2)"
            dsize="$(echo "${device}" | cut -d'|' -f3)"
            dmodel="$(echo "${device}" | cut -d'|' -f4)"
            dserial="$(echo "${device}" | cut -d'|' -f5)"
            cat >> "${VALUES_PATH}" <<YAML
    - name: ${dname}
      type: ${dtype}
      size_gb: ${dsize}
      model: "${dmodel}"
      serial: "${dserial}"
YAML
        done
    else
        printf "    []  # no block devices detected\n" >> "${VALUES_PATH}"
    fi

    cat >> "${VALUES_PATH}" <<YAML
  total_gb: ${STORAGE_TOTAL_GB}

gpu:
  pci_slot: "${GPU_PCI_SLOT}"
  model: "${GPU_MODEL}"
  vram_mb: ${GPU_VRAM_MB:-null}

network:
  interfaces:
YAML

    if [[ ${#NET_INTERFACES[@]} -gt 0 ]]; then
        for iface in "${NET_INTERFACES[@]}"; do
            local iname imac iipv4
            iname="$(echo "${iface}" | cut -d'|' -f1)"
            imac="$(echo "${iface}" | cut -d'|' -f2)"
            iipv4="$(echo "${iface}" | cut -d'|' -f3)"
            cat >> "${VALUES_PATH}" <<YAML
    - name: ${iname}
      mac: "${imac}"
      ipv4: "${iipv4}"
YAML
        done
    else
        printf "    []  # no network interfaces detected\n" >> "${VALUES_PATH}"
    fi

    printf "  [OUT] Local values: %s\n" "${VALUES_PATH}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    printf "=== Hardware Discovery ===\n"
    printf "Output directory: %s\n\n" "${OUTPUT_DIR}"

    printf "Discovering hardware...\n"
    discover_cpu
    discover_memory
    discover_storage
    discover_gpu
    discover_hypervisor
    discover_network
    printf "\nAssessing capabilities...\n"
    assess_capabilities

    printf "\nGenerating profiles...\n"
    generate_sanitized_profile
    generate_local_values

    printf "\n=== Discovery Complete ===\n"

    # Minimum requirements check
    if [[ "${MEETS_MINIMUM}" != "true" ]]; then
        printf "\n*** WARNING: Minimum requirements NOT met ***\n"
        if [[ "${MEM_TOTAL_GB}" -lt "${MIN_RAM_GB}" ]]; then
            printf "  - RAM: %s GB (minimum: %s GB)\n" "${MEM_TOTAL_GB}" "${MIN_RAM_GB}"
        fi
        if [[ "${CPU_VIRTUALIZATION}" != "true" ]]; then
            printf "  - Virtualization: not available (required)\n"
        fi
        printf "\nProfiles were still generated, but some features may not work.\n"
        exit 1
    fi

    printf "\nMinimum requirements met: %s GB RAM, virtualization: %s\n" \
        "${MEM_TOTAL_GB}" "${CPU_VIRT_TYPE:-none}"
    exit 0
}

main "$@"
