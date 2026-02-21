#!/usr/bin/env bash
# discover-all.sh -- Unified hardware discovery orchestrator
#
# Calls all discovery modules (base + audio + network + USB + distro) and
# merges their output into a single comprehensive YAML capability database.
#
# Outputs TWO files:
#   1. hardware-capabilities.yaml (sanitized, safe for git)
#   2. hardware-capabilities-local.yaml (full values, gitignored)
#
# Usage: discover-all.sh [--output-dir DIR] [--local-dir DIR] [--subsystems LIST] [--help]
#
# Exit codes:
#   0 -- success (even if hardware is absent in some subsystems)
#   1 -- script-level error (can't find modules, can't write output)

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

OUTPUT_DIR="${PROJECT_ROOT}/infra/inventory"
LOCAL_DIR="${PROJECT_ROOT}/infra/local"
SUBSYSTEMS="all"
SCRIPT_VERSION="1.0.0"

# Source shared library
# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"

require_linux

# ---------------------------------------------------------------------------
# Argument Parsing
# ---------------------------------------------------------------------------

usage() {
    printf "Usage: %s [OPTIONS]\n\n" "$(basename "$0")"
    printf "Unified hardware discovery orchestrator. Calls all subsystem modules\n"
    printf "and merges output into a comprehensive YAML capability database.\n\n"
    printf "Options:\n"
    printf "  --output-dir DIR     Where to write sanitized YAML (default: infra/inventory/)\n"
    printf "  --local-dir DIR      Where to write local values (default: infra/local/)\n"
    printf "  --subsystems LIST    Comma-separated subsystems (default: all)\n"
    printf "                       Available: cpu,memory,storage,gpu,hypervisor,audio,network,usb,distro\n"
    printf "  --help               Show this help message\n\n"
    printf "Output files:\n"
    printf "  hardware-capabilities.yaml       Sanitized (no MACs, serials, hostnames)\n"
    printf "  hardware-capabilities-local.yaml Full values for provisioning\n"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --local-dir)
            LOCAL_DIR="$2"
            shift 2
            ;;
        --subsystems)
            SUBSYSTEMS="$2"
            shift 2
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            printf "Unknown option: %s\n" "$1" >&2
            usage >&2
            exit 1
            ;;
    esac
done

# Ensure output directories exist
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${LOCAL_DIR}"

SANITIZED_PATH="${OUTPUT_DIR}/hardware-capabilities.yaml"
LOCAL_PATH="${LOCAL_DIR}/hardware-capabilities-local.yaml"

# Temp directory for module outputs
TMPDIR_WORK="$(mktemp -d)"
trap 'rm -rf "${TMPDIR_WORK}"' EXIT

# ---------------------------------------------------------------------------
# Subsystem filter
# ---------------------------------------------------------------------------

should_discover() {
    local subsystem="$1"
    if [[ "${SUBSYSTEMS}" == "all" ]]; then
        return 0
    fi
    echo ",${SUBSYSTEMS}," | grep -q ",${subsystem}," && return 0
    return 1
}

# ---------------------------------------------------------------------------
# Module runner: capture YAML output from a discovery module
# ---------------------------------------------------------------------------

run_module() {
    local module_name="$1"
    local module_path="${SCRIPT_DIR}/${module_name}"
    local output_file="${TMPDIR_WORK}/${module_name%.sh}.yaml"

    if [[ -x "${module_path}" ]]; then
        bash "${module_path}" > "${output_file}" 2>/dev/null || true
    else
        warn "Module not found or not executable: ${module_path}"
        touch "${output_file}"
    fi

    echo "${output_file}"
}

# ---------------------------------------------------------------------------
# Inline base discovery (fallback if discover-hardware.sh not present)
# Produces equivalent CPU, memory, storage, GPU, hypervisor sections
# ---------------------------------------------------------------------------

discover_cpu_inline() {
    local arch model_name cores_physical cores_logical
    local has_virt="false" virt_type="" family

    arch="$(uname -m)"

    if [[ -f /proc/cpuinfo ]]; then
        model_name="$(grep -m1 '^model name' /proc/cpuinfo 2>/dev/null | cut -d: -f2 | sed 's/^ //' || echo "Unknown")"
        cores_logical="$(grep -c '^processor' /proc/cpuinfo 2>/dev/null || echo "1")"
    else
        model_name="Unknown"
        cores_logical="1"
    fi

    cores_physical="${cores_logical}"
    if has_command lscpu; then
        local lscpu_out
        lscpu_out="$(lscpu 2>/dev/null)"
        local cpp sockets
        cpp="$(echo "${lscpu_out}" | grep '^Core(s) per socket:' | awk '{print $NF}' || echo "")"
        sockets="$(echo "${lscpu_out}" | grep '^Socket(s):' | awk '{print $NF}' || echo "1")"
        if [[ -n "${cpp}" && -n "${sockets}" ]]; then
            cores_physical=$(( cpp * sockets ))
        fi
    fi

    if [[ -f /proc/cpuinfo ]]; then
        if grep -qE '\b(vmx)\b' /proc/cpuinfo 2>/dev/null; then
            has_virt="true"; virt_type="vmx"
        elif grep -qE '\b(svm)\b' /proc/cpuinfo 2>/dev/null; then
            has_virt="true"; virt_type="svm"
        fi
    fi

    family="$(echo "${model_name}" | sed -E 's/\s+/ /g; s/\(R\)//g; s/\(TM\)//g; s/CPU //; s/ @.*//; s/ [0-9]+\.[0-9]+GHz//')"

    # Sanitized output
    {
        yaml_section "" "cpu"
        yaml_key "  " "architecture" "${arch}"
        yaml_key "  " "family" "${family}"
        yaml_int "  " "cores_physical" "${cores_physical}"
        yaml_int "  " "cores_logical" "${cores_logical}"
        yaml_bool "  " "virtualization" "${has_virt}"
        if [[ -n "${virt_type}" ]]; then
            yaml_key "  " "virtualization_type" "${virt_type}"
        else
            printf "  virtualization_type: null\n"
        fi
    } > "${TMPDIR_WORK}/cpu-sanitized.yaml"

    # Local output
    {
        yaml_section "" "cpu"
        yaml_key "  " "model" "${model_name}"
        yaml_key "  " "family" "${family}"
        yaml_int "  " "cores_physical" "${cores_physical}"
        yaml_int "  " "cores_logical" "${cores_logical}"
        yaml_bool "  " "virtualization" "${has_virt}"
    } > "${TMPDIR_WORK}/cpu-local.yaml"

    # Export for capability assessment
    _CPU_VIRT="${has_virt}"
}

discover_memory_inline() {
    local total_kb=0 available_kb=0 swap_total_kb=0

    if [[ -f /proc/meminfo ]]; then
        total_kb="$(grep '^MemTotal:' /proc/meminfo | awk '{print $2}' || echo "0")"
        available_kb="$(grep '^MemAvailable:' /proc/meminfo | awk '{print $2}' || echo "0")"
        swap_total_kb="$(grep '^SwapTotal:' /proc/meminfo | awk '{print $2}' || echo "0")"
    fi

    local total_gb=$(( (total_kb + 524288) / 1048576 ))
    local available_gb=$(( (available_kb + 524288) / 1048576 ))
    local swap_gb=$(( (swap_total_kb + 524288) / 1048576 ))

    {
        yaml_section "" "memory"
        yaml_int "  " "total_gb" "${total_gb}"
        yaml_int "  " "swap_gb" "${swap_gb}"
    } > "${TMPDIR_WORK}/memory-sanitized.yaml"

    {
        yaml_section "" "memory"
        yaml_int "  " "total_gb" "${total_gb}"
        yaml_int "  " "available_gb" "${available_gb}"
        yaml_int "  " "swap_gb" "${swap_gb}"
        yaml_int "  " "total_kb" "${total_kb}"
    } > "${TMPDIR_WORK}/memory-local.yaml"

    _MEM_TOTAL_GB="${total_gb}"
}

discover_storage_inline() {
    local device_count=0 total_gb=0

    {
        yaml_section "" "storage"
        printf "  devices:\n"

        if has_command lsblk; then
            while IFS= read -r line; do
                local name size_bytes rotational type_str
                name="$(echo "${line}" | awk '{print $1}')"
                size_bytes="$(echo "${line}" | awk '{print $2}')"
                rotational="$(echo "${line}" | awk '{print $3}')"
                type_str="$(echo "${line}" | awk '{print $4}')"

                [[ "${type_str}" != "disk" ]] && continue

                local disk_type="ssd"
                [[ "${rotational}" == "1" ]] && disk_type="hdd"

                local size_gb=$(( (size_bytes + 536870912) / 1073741824 ))

                printf "    - type: %s\n      size_gb: %s\n" "${disk_type}" "${size_gb}"
                device_count=$((device_count + 1))
                total_gb=$((total_gb + size_gb))
            done < <(lsblk -dnb -o NAME,SIZE,ROTA,TYPE 2>/dev/null || true)
        fi

        if [[ ${device_count} -eq 0 ]]; then
            printf "    []\n"
        fi

        yaml_int "  " "total_gb" "${total_gb}"
        yaml_int "  " "device_count" "${device_count}"
    } > "${TMPDIR_WORK}/storage-sanitized.yaml"

    # Local output includes device names and models
    {
        yaml_section "" "storage"
        printf "  devices:\n"

        if has_command lsblk; then
            while IFS= read -r line; do
                local name size_bytes rotational type_str
                name="$(echo "${line}" | awk '{print $1}')"
                size_bytes="$(echo "${line}" | awk '{print $2}')"
                rotational="$(echo "${line}" | awk '{print $3}')"
                type_str="$(echo "${line}" | awk '{print $4}')"

                [[ "${type_str}" != "disk" ]] && continue

                local disk_type="ssd"
                [[ "${rotational}" == "1" ]] && disk_type="hdd"
                local size_gb=$(( (size_bytes + 536870912) / 1073741824 ))
                local model
                model="$(safe_read "/sys/block/${name}/device/model" | sed 's/[[:space:]]*$//')"
                local serial
                serial="$(safe_read "/sys/block/${name}/device/serial" | sed 's/[[:space:]]*$//')"

                printf "    - name: %s\n" "${name}"
                printf "      type: %s\n" "${disk_type}"
                printf "      size_gb: %s\n" "${size_gb}"
                printf "      model: \"%s\"\n" "${model}"
                printf "      serial: \"%s\"\n" "${serial}"
            done < <(lsblk -dnb -o NAME,SIZE,ROTA,TYPE 2>/dev/null || true)
        fi

        yaml_int "  " "total_gb" "${total_gb}"
    } > "${TMPDIR_WORK}/storage-local.yaml"
}

discover_gpu_inline() {
    local gpu_present="false" gpu_vendor="" gpu_family="" gpu_driver=""
    local gpu_vram_mb="" gpu_iommu="false" gpu_pci_slot="" gpu_model=""

    if has_command lspci; then
        local vga_line
        vga_line="$(lspci 2>/dev/null | grep -i 'vga\|3d controller\|display' | head -1 || echo "")"

        if [[ -n "${vga_line}" ]]; then
            gpu_present="true"
            gpu_pci_slot="$(echo "${vga_line}" | awk '{print $1}')"
            gpu_model="${vga_line}"

            if echo "${vga_line}" | grep -qi 'nvidia'; then
                gpu_vendor="nvidia"
                gpu_family="$(echo "${vga_line}" | sed -E 's/.*NVIDIA Corporation //' | sed -E 's/ \[.*//; s/ \(.*//' || echo "NVIDIA")"
            elif echo "${vga_line}" | grep -qi 'amd\|ati\|radeon'; then
                gpu_vendor="amd"
                gpu_family="$(echo "${vga_line}" | sed -E 's/.*(AMD|ATI)[^:]*: //' | sed -E 's/ \[.*//; s/ \(.*//' || echo "AMD")"
            elif echo "${vga_line}" | grep -qi 'intel'; then
                gpu_vendor="intel"
                gpu_family="$(echo "${vga_line}" | sed -E 's/.*Intel Corporation //' | sed -E 's/ \[.*//; s/ \(.*//' || echo "Intel Integrated")"
            else
                gpu_vendor="unknown"
                gpu_family="$(echo "${vga_line}" | cut -d: -f3- | sed 's/^ //')"
            fi

            if [[ "${gpu_vendor}" == "nvidia" ]] && has_command nvidia-smi; then
                gpu_vram_mb="$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -1 | tr -d ' ' || echo "")"
            fi

            if [[ -n "${gpu_pci_slot}" ]]; then
                gpu_driver="$(lspci -k -s "${gpu_pci_slot}" 2>/dev/null | grep 'Kernel driver in use:' | awk '{print $NF}' || echo "")"
            fi
        fi
    fi

    if [[ -d /sys/kernel/iommu_groups/ ]]; then
        local group_count
        group_count="$(ls /sys/kernel/iommu_groups/ 2>/dev/null | wc -l)"
        if [[ "${group_count}" -gt 0 ]]; then
            gpu_iommu="true"
        fi
    fi

    local vram_gb="null"
    if [[ -n "${gpu_vram_mb}" ]]; then
        vram_gb=$(( (gpu_vram_mb + 512) / 1024 ))
    fi

    {
        yaml_section "" "gpu"
        yaml_bool "  " "present" "${gpu_present}"
        yaml_key "  " "vendor" "${gpu_vendor:-null}"
        yaml_key "  " "family" "${gpu_family:-none}"
        printf "  vram_gb: %s\n" "${vram_gb}"
        yaml_key "  " "driver" "${gpu_driver:-null}"
        yaml_bool "  " "iommu_available" "${gpu_iommu}"
    } > "${TMPDIR_WORK}/gpu-sanitized.yaml"

    {
        yaml_section "" "gpu"
        yaml_bool "  " "present" "${gpu_present}"
        yaml_key "  " "vendor" "${gpu_vendor:-null}"
        yaml_key "  " "family" "${gpu_family:-none}"
        yaml_key "  " "model" "${gpu_model}"
        yaml_key "  " "pci_slot" "${gpu_pci_slot}"
        if [[ -n "${gpu_vram_mb}" ]]; then
            yaml_int "  " "vram_mb" "${gpu_vram_mb}"
        else
            printf "  vram_mb: null\n"
        fi
        yaml_key "  " "driver" "${gpu_driver:-null}"
        yaml_bool "  " "iommu_available" "${gpu_iommu}"
    } > "${TMPDIR_WORK}/gpu-local.yaml"

    _GPU_PRESENT="${gpu_present}"
    _GPU_VENDOR="${gpu_vendor}"
    _GPU_IOMMU="${gpu_iommu}"
}

discover_hypervisor_inline() {
    local hv_kvm="false" hv_vmware="false" hv_vbox="false"
    local hv_podman="false" hv_docker="false" hv_nested="false"

    if [[ -c /dev/kvm ]]; then
        hv_kvm="true"
    elif has_command virsh && virsh version &>/dev/null; then
        hv_kvm="true"
    fi

    if has_command vmrun || has_command vmware; then
        hv_vmware="true"
    fi

    if has_command VBoxManage && VBoxManage --version &>/dev/null; then
        hv_vbox="true"
    fi

    if has_command podman && podman version &>/dev/null; then
        hv_podman="true"
    fi

    if has_command docker && docker version &>/dev/null; then
        hv_docker="true"
    fi

    if [[ -f /sys/module/kvm_intel/parameters/nested ]]; then
        local nv
        nv="$(safe_read /sys/module/kvm_intel/parameters/nested)"
        if [[ "${nv}" == "Y" || "${nv}" == "1" ]]; then
            hv_nested="true"
        fi
    elif [[ -f /sys/module/kvm_amd/parameters/nested ]]; then
        local nv
        nv="$(safe_read /sys/module/kvm_amd/parameters/nested)"
        if [[ "${nv}" == "Y" || "${nv}" == "1" ]]; then
            hv_nested="true"
        fi
    fi

    {
        yaml_section "" "hypervisor"
        yaml_bool "  " "kvm" "${hv_kvm}"
        yaml_bool "  " "vmware" "${hv_vmware}"
        yaml_bool "  " "virtualbox" "${hv_vbox}"
        yaml_bool "  " "podman" "${hv_podman}"
        yaml_bool "  " "docker" "${hv_docker}"
        yaml_bool "  " "nested_virtualization" "${hv_nested}"
    } > "${TMPDIR_WORK}/hypervisor-sanitized.yaml"

    # Local output is identical for hypervisor (no sensitive data)
    cp "${TMPDIR_WORK}/hypervisor-sanitized.yaml" "${TMPDIR_WORK}/hypervisor-local.yaml"

    _HV_KVM="${hv_kvm}"
    _HV_VMWARE="${hv_vmware}"
    _HV_VBOX="${hv_vbox}"
}

# ---------------------------------------------------------------------------
# Extended module output parsing
# ---------------------------------------------------------------------------

# Extract capability flags from module YAML output
# Usage: extract_capability "file.yaml" "has_audio_output"
extract_capability() {
    local file="$1"
    local key="$2"
    local value
    value="$(grep -m1 "${key}:" "${file}" 2>/dev/null | awk '{print $2}' || echo "false")"
    echo "${value}"
}

# ---------------------------------------------------------------------------
# Unified Capability Assessment
# ---------------------------------------------------------------------------

generate_capabilities() {
    local sanitized_file="$1"
    local audio_file="${TMPDIR_WORK}/discover-audio.yaml"
    local network_file="${TMPDIR_WORK}/discover-network.yaml"
    local usb_file="${TMPDIR_WORK}/discover-usb.yaml"
    local distro_file="${TMPDIR_WORK}/discover-distro.yaml"

    # Base capabilities
    local can_run_vms="false"
    if [[ "${_CPU_VIRT:-false}" == "true" ]]; then
        if [[ "${_HV_KVM:-false}" == "true" || "${_HV_VMWARE:-false}" == "true" || "${_HV_VBOX:-false}" == "true" ]]; then
            can_run_vms="true"
        fi
    fi

    local can_passthrough_gpu="false"
    if [[ "${_GPU_IOMMU:-false}" == "true" && "${_GPU_PRESENT:-false}" == "true" && "${_GPU_VENDOR:-}" != "intel" ]]; then
        can_passthrough_gpu="true"
    fi

    local meets_minimum="false"
    if [[ "${_MEM_TOTAL_GB:-0}" -ge 16 && "${_CPU_VIRT:-false}" == "true" ]]; then
        meets_minimum="true"
    fi

    # Audio capabilities
    local has_audio_output
    has_audio_output="$(extract_capability "${audio_file}" "has_audio_output")"
    local has_audio_input
    has_audio_input="$(extract_capability "${audio_file}" "has_audio_input")"
    local has_midi
    has_midi="$(extract_capability "${audio_file}" "has_midi")"

    # Network capabilities
    local has_ethernet
    has_ethernet="$(extract_capability "${network_file}" "has_ethernet")"
    local has_wifi
    has_wifi="$(extract_capability "${network_file}" "has_wifi")"
    local has_bridge_support
    has_bridge_support="$(extract_capability "${network_file}" "has_bridge_support")"

    # USB capabilities
    local has_usb3
    has_usb3="$(extract_capability "${usb_file}" "has_usb3")"

    # Distro capabilities
    local is_tier1_distro
    is_tier1_distro="$(extract_capability "${distro_file}" "is_tier1")"
    local has_systemd
    has_systemd="$(extract_capability "${distro_file}" "has_systemd")"
    local has_selinux
    has_selinux="$(extract_capability "${distro_file}" "has_selinux")"

    {
        printf "capabilities:\n"
        printf "  # Base discovery (CPU, memory, storage, GPU, hypervisor)\n"
        yaml_bool "  " "can_run_vms" "${can_run_vms}"
        yaml_bool "  " "can_passthrough_gpu" "${can_passthrough_gpu}"
        yaml_bool "  " "meets_minimum" "${meets_minimum}"
        printf "  # Extended discovery (audio, network, USB)\n"
        yaml_bool "  " "has_audio_output" "${has_audio_output}"
        yaml_bool "  " "has_audio_input" "${has_audio_input}"
        yaml_bool "  " "has_midi" "${has_midi}"
        yaml_bool "  " "has_ethernet" "${has_ethernet}"
        yaml_bool "  " "has_wifi" "${has_wifi}"
        yaml_bool "  " "has_bridge_support" "${has_bridge_support}"
        yaml_bool "  " "has_usb3" "${has_usb3}"
        printf "  # Distribution detection\n"
        yaml_bool "  " "is_tier1_distro" "${is_tier1_distro}"
        yaml_bool "  " "has_systemd" "${has_systemd}"
        yaml_bool "  " "has_selinux" "${has_selinux}"
    } >> "${sanitized_file}"
}

# ---------------------------------------------------------------------------
# Network local values (MACs, IPs)
# ---------------------------------------------------------------------------

generate_network_local() {
    local local_file="$1"

    if has_command ip; then
        printf "network_local:\n" >> "${local_file}"
        printf "  interfaces:\n" >> "${local_file}"

        while IFS= read -r iface; do
            [[ -z "${iface}" ]] && continue
            [[ "${iface}" == "lo" ]] && continue

            local mac ipv4
            mac="$(ip link show "${iface}" 2>/dev/null | grep 'link/ether' | awk '{print $2}' || echo "")"
            ipv4="$(ip -4 addr show "${iface}" 2>/dev/null | grep -oP 'inet \K[\d.]+' | head -1 || echo "")"

            printf "    - name: %s\n" "${iface}" >> "${local_file}"
            if [[ -n "${mac}" ]]; then
                printf "      mac: \"%s\"\n" "${mac}" >> "${local_file}"
            fi
            if [[ -n "${ipv4}" ]]; then
                printf "      ipv4: \"%s\"\n" "${ipv4}" >> "${local_file}"
            fi
        done < <(ip -o link show 2>/dev/null | awk -F': ' '{print $2}' | sed 's/@.*//')
    fi
}

# ---------------------------------------------------------------------------
# Main Assembly
# ---------------------------------------------------------------------------

main() {
    local date_str
    date_str="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    local hostname_str
    hostname_str="$(hostname 2>/dev/null || echo "unknown")"

    printf "=== Unified Hardware Discovery ===\n" >&2
    printf "Output: %s\n" "${SANITIZED_PATH}" >&2
    printf "Local:  %s\n\n" "${LOCAL_PATH}" >&2

    # -----------------------------------------------------------------------
    # Phase 1: Base discovery (CPU, memory, storage, GPU, hypervisor)
    # -----------------------------------------------------------------------

    if should_discover "cpu" || should_discover "memory" || should_discover "storage" || should_discover "gpu" || should_discover "hypervisor"; then
        printf "  Discovering base hardware...\n" >&2

        # Use Phase 169's discover-hardware.sh if available, otherwise inline
        if [[ -x "${SCRIPT_DIR}/discover-hardware.sh" ]]; then
            printf "    Using discover-hardware.sh (Phase 169)\n" >&2
            # discover-hardware.sh writes to its own output files
            # We run it to a temp output dir and read results
            local hw_tmp="${TMPDIR_WORK}/hw-output"
            mkdir -p "${hw_tmp}/inventory" "${hw_tmp}/local"
            bash "${SCRIPT_DIR}/discover-hardware.sh" --output-dir "${hw_tmp}" >/dev/null 2>&1 || true

            # Parse the generated YAML for individual sections
            if [[ -f "${hw_tmp}/inventory/hardware-profile.yaml" ]]; then
                # Extract sections from hardware-profile.yaml
                local hw_profile="${hw_tmp}/inventory/hardware-profile.yaml"
                local hw_values="${hw_tmp}/local/hardware-values.yaml"

                # Extract each section using awk (stop BEFORE printing the next top-level key)
                for section in cpu memory storage gpu hypervisor; do
                    awk "
                        /^${section}:/ { found=1 }
                        /^[a-zA-Z]/ && !/^${section}:/ { if(found) exit }
                        found { print }
                    " "${hw_profile}" > "${TMPDIR_WORK}/${section}-sanitized.yaml" 2>/dev/null || true
                done

                # Extract local sections
                if [[ -f "${hw_values}" ]]; then
                    for section in cpu memory storage gpu; do
                        awk "
                            /^${section}:/ { found=1 }
                            /^[a-zA-Z]/ && !/^${section}:/ { if(found) exit }
                            found { print }
                        " "${hw_values}" > "${TMPDIR_WORK}/${section}-local.yaml" 2>/dev/null || true
                    done
                fi

                # Read capability values from the profile for assessment
                _CPU_VIRT="$(grep 'virtualization:' "${hw_profile}" | head -1 | awk '{print $2}' || echo "false")"
                _MEM_TOTAL_GB="$(grep 'total_gb:' "${hw_profile}" | head -1 | awk '{print $2}' || echo "0")"
                _GPU_PRESENT="$(grep 'present:' "${hw_profile}" | head -1 | awk '{print $2}' || echo "false")"
                _GPU_VENDOR="$(grep 'vendor:' "${hw_profile}" | head -1 | awk '{print $2}' || echo "")"
                _GPU_IOMMU="$(grep 'iommu_available:' "${hw_profile}" | head -1 | awk '{print $2}' || echo "false")"
                _HV_KVM="$(grep 'kvm:' "${hw_profile}" | head -1 | awk '{print $2}' || echo "false")"
                _HV_VMWARE="$(grep 'vmware:' "${hw_profile}" | head -1 | awk '{print $2}' || echo "false")"
                _HV_VBOX="$(grep 'virtualbox:' "${hw_profile}" | head -1 | awk '{print $2}' || echo "false")"

                # capabilities section from discover-hardware.sh (not used in output --
                # we generate our own unified capabilities section)
                # Intentionally skipped: base capabilities are recalculated from variables
            else
                warn "discover-hardware.sh ran but produced no output, falling back to inline"
                should_discover "cpu" && discover_cpu_inline
                should_discover "memory" && discover_memory_inline
                should_discover "storage" && discover_storage_inline
                should_discover "gpu" && discover_gpu_inline
                should_discover "hypervisor" && discover_hypervisor_inline
            fi
        else
            printf "    discover-hardware.sh not found, using inline discovery\n" >&2
            should_discover "cpu" && discover_cpu_inline
            should_discover "memory" && discover_memory_inline
            should_discover "storage" && discover_storage_inline
            should_discover "gpu" && discover_gpu_inline
            should_discover "hypervisor" && discover_hypervisor_inline
        fi
    fi

    # -----------------------------------------------------------------------
    # Phase 2: Extended discovery modules
    # -----------------------------------------------------------------------

    if should_discover "audio"; then
        printf "  Discovering audio...\n" >&2
        run_module "discover-audio.sh" > /dev/null
    fi

    if should_discover "network"; then
        printf "  Discovering network...\n" >&2
        run_module "discover-network.sh" > /dev/null
    fi

    if should_discover "usb"; then
        printf "  Discovering USB...\n" >&2
        run_module "discover-usb.sh" > /dev/null
    fi

    if should_discover "distro"; then
        printf "  Discovering distribution...\n" >&2
        run_module "discover-distro.sh" > /dev/null
    fi

    # -----------------------------------------------------------------------
    # Phase 3: Assemble sanitized YAML
    # -----------------------------------------------------------------------

    printf "\n  Assembling unified YAML...\n" >&2

    {
        printf "# Unified Hardware Capabilities (sanitized -- safe for version control)\n"
        printf "# Generated by discover-all.sh v%s on %s\n" "${SCRIPT_VERSION}" "${date_str}"
        printf "# Contains NO identifying information (no MACs, serials, hostnames, IPs)\n"
        printf "#\n"
        printf "# Subsystems: cpu, memory, storage, gpu, hypervisor, audio, network, usb, distro\n"
        printf "# Downstream consumers: Phase 179 (distro abstraction), Phase 180 (hypervisor),\n"
        printf "#   Phase 181 (hardware adaptation engine), Phase 182 (UAE installation)\n"
        printf "\n"

        # Metadata
        printf "metadata:\n"
        printf "  version: %s\n" "${SCRIPT_VERSION}"
        printf "  generated: %s\n" "${date_str}"
        printf "  subsystems_discovered:\n"

        for sub in cpu memory storage gpu hypervisor audio network usb distro; do
            if [[ -s "${TMPDIR_WORK}/${sub}-sanitized.yaml" ]] || [[ -s "${TMPDIR_WORK}/discover-${sub}.yaml" ]]; then
                printf "    - %s\n" "${sub}"
            fi
        done

        printf "\n"

        # Base subsystem sections
        for section in cpu memory storage gpu hypervisor; do
            if [[ -s "${TMPDIR_WORK}/${section}-sanitized.yaml" ]]; then
                cat "${TMPDIR_WORK}/${section}-sanitized.yaml"
                printf "\n"
            fi
        done

        # Extended module sections (these output with their top-level key)
        for module in audio network usb distro; do
            local module_file="${TMPDIR_WORK}/discover-${module}.yaml"
            if [[ -s "${module_file}" ]]; then
                cat "${module_file}"
                printf "\n"
            fi
        done

    } > "${SANITIZED_PATH}"

    # Append unified capabilities
    generate_capabilities "${SANITIZED_PATH}"

    # -----------------------------------------------------------------------
    # Phase 4: Assemble local YAML (full values)
    # -----------------------------------------------------------------------

    {
        printf "# Unified Hardware Capabilities -- LOCAL VALUES\n"
        printf "# Generated by discover-all.sh v%s on %s\n" "${SCRIPT_VERSION}" "${date_str}"
        printf "# GITIGNORED -- contains actual system data (MACs, IPs, serials, hostname)\n"
        printf "# Used by downstream provisioning scripts that need real values\n"
        printf "\n"

        printf "metadata:\n"
        printf "  version: %s\n" "${SCRIPT_VERSION}"
        printf "  generated: %s\n" "${date_str}"
        yaml_key "  " "hostname" "${hostname_str}"
        printf "\n"

        # Local base sections
        for section in cpu memory storage gpu; do
            if [[ -s "${TMPDIR_WORK}/${section}-local.yaml" ]]; then
                cat "${TMPDIR_WORK}/${section}-local.yaml"
                printf "\n"
            fi
        done

        # Hypervisor (same as sanitized)
        if [[ -s "${TMPDIR_WORK}/hypervisor-local.yaml" ]]; then
            cat "${TMPDIR_WORK}/hypervisor-local.yaml"
            printf "\n"
        fi

        # Extended modules (same YAML, capabilities are not sensitive)
        for module in audio network usb distro; do
            local module_file="${TMPDIR_WORK}/discover-${module}.yaml"
            if [[ -s "${module_file}" ]]; then
                cat "${module_file}"
                printf "\n"
            fi
        done

    } > "${LOCAL_PATH}"

    # Add network local values (MACs, IPs) to local file
    generate_network_local "${LOCAL_PATH}"

    # -----------------------------------------------------------------------
    # Phase 5: Validation
    # -----------------------------------------------------------------------

    printf "  Validating YAML...\n" >&2

    if has_command python3; then
        if python3 -c "import yaml; yaml.safe_load(open('${SANITIZED_PATH}'))" 2>/dev/null; then
            printf "    Sanitized YAML: valid\n" >&2
        else
            warn "Sanitized YAML failed validation (PyYAML may not be installed)"
        fi

        if python3 -c "import yaml; yaml.safe_load(open('${LOCAL_PATH}'))" 2>/dev/null; then
            printf "    Local YAML: valid\n" >&2
        else
            warn "Local YAML failed validation (PyYAML may not be installed)"
        fi
    else
        printf "    python3 not available, skipping YAML validation\n" >&2
    fi

    printf "\n=== Discovery Complete ===\n" >&2
    printf "  Sanitized: %s\n" "${SANITIZED_PATH}" >&2
    printf "  Local:     %s\n" "${LOCAL_PATH}" >&2

    exit 0
}

main "$@"
