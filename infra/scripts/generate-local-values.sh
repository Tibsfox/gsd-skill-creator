#!/usr/bin/env bash
# generate-local-values.sh -- Adaptive configuration generator
#
# Reads hardware-capabilities.yaml + resource-budget.yaml + GPU/audio
# assessments and produces a complete local-values.yaml for all downstream
# consumers in the GSD Minecraft Knowledge World project.
#
# Usage:
#   generate-local-values.sh [--capabilities <path>] [--budget <path>] [--output <path>]
#
# Defaults:
#   --capabilities: infra/inventory/hardware-capabilities.yaml (or local variant)
#   --budget:       infra/local/resource-budget.yaml
#   --output:       infra/local/local-values.yaml
#
# If budget file doesn't exist, runs calculate-budget.sh automatically.
# If capabilities file doesn't exist, errors with helpful message.
#
# Output: Complete local-values YAML covering 10 sections:
#   system, resources, minecraft, network, gpu, audio, hypervisor,
#   distro, capabilities
#
# Exit codes:
#   0 -- success, local-values.yaml generated
#   1 -- error (missing capabilities, assessment failure)
#   2 -- usage error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Source shared library for YAML emission helpers
# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

DEFAULT_CAPABILITIES="${PROJECT_ROOT}/infra/inventory/hardware-capabilities.yaml"
DEFAULT_BUDGET="${PROJECT_ROOT}/infra/local/resource-budget.yaml"
DEFAULT_OUTPUT="${PROJECT_ROOT}/infra/local/local-values.yaml"

CAPABILITIES_FILE=""
BUDGET_FILE=""
OUTPUT_FILE=""

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case "$1" in
        --capabilities)
            CAPABILITIES_FILE="$2"
            shift 2
            ;;
        --budget)
            BUDGET_FILE="$2"
            shift 2
            ;;
        --output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -h|--help)
            printf "Usage: %s [--capabilities <path>] [--budget <path>] [--output <path>]\n" "$(basename "$0")"
            printf "\nAdaptive configuration generator producing complete local-values YAML.\n"
            printf "\nOptions:\n"
            printf "  --capabilities  Path to hardware-capabilities.yaml (default: infra/inventory/hardware-capabilities.yaml)\n"
            printf "  --budget        Path to resource-budget.yaml (default: infra/local/resource-budget.yaml)\n"
            printf "  --output        Output path for local-values.yaml (default: infra/local/local-values.yaml)\n"
            exit 0
            ;;
        *)
            printf "Error: Unknown argument: %s\n" "$1" >&2
            printf "Usage: %s [--capabilities <path>] [--budget <path>] [--output <path>]\n" "$(basename "$0")" >&2
            exit 2
            ;;
    esac
done

# Apply defaults
CAPABILITIES_FILE="${CAPABILITIES_FILE:-${DEFAULT_CAPABILITIES}}"
BUDGET_FILE="${BUDGET_FILE:-${DEFAULT_BUDGET}}"
OUTPUT_FILE="${OUTPUT_FILE:-${DEFAULT_OUTPUT}}"

# ---------------------------------------------------------------------------
# Validate inputs
# ---------------------------------------------------------------------------

if [[ ! -f "${CAPABILITIES_FILE}" ]]; then
    printf "Error: Hardware capabilities file not found: %s\n" "${CAPABILITIES_FILE}" >&2
    printf "\nRun 'infra/scripts/discover-all.sh' first to generate hardware capabilities.\n" >&2
    printf "Or specify a capabilities file with --capabilities <path>\n" >&2
    exit 1
fi

# If budget file doesn't exist, try to generate it
if [[ ! -f "${BUDGET_FILE}" ]]; then
    printf "[INFO] Budget file not found at %s, attempting to generate...\n" "${BUDGET_FILE}" >&2
    CALCULATOR="${SCRIPT_DIR}/calculate-budget.sh"
    if [[ -f "${CALCULATOR}" ]]; then
        # calculate-budget.sh needs a hardware profile (not capabilities).
        # Use a local hardware-values.yaml if available, otherwise warn.
        local_values="${PROJECT_ROOT}/infra/local/hardware-values.yaml"
        if [[ -f "${local_values}" ]]; then
            bash "${CALCULATOR}" "${local_values}" "${BUDGET_FILE}" >&2 || {
                printf "Error: calculate-budget.sh failed. Cannot generate resource budget.\n" >&2
                exit 1
            }
        else
            printf "Error: Cannot auto-generate budget. No hardware-values.yaml found at %s\n" "${local_values}" >&2
            printf "Run discover-hardware.sh first, or provide --budget <path>\n" >&2
            exit 1
        fi
    else
        printf "Error: Budget file not found and calculate-budget.sh not available.\n" >&2
        printf "Provide --budget <path> or run calculate-budget.sh manually.\n" >&2
        exit 1
    fi
fi

# ---------------------------------------------------------------------------
# Section-aware YAML parsing (awk-based, established pattern from Plan 01)
# ---------------------------------------------------------------------------

# Extract a value from a specific top-level YAML section
# Usage: section_val "gpu" "vendor" "$FILE"
section_val() {
    local section="$1"
    local key="$2"
    local file="$3"
    awk -v sect="${section}" -v k="${key}" '
        $0 ~ "^"sect":" { in_sect=1; next }
        /^[a-zA-Z]/ && !/^[[:space:]]/ { in_sect=0 }
        in_sect && $0 ~ "^[[:space:]]+"k":" {
            val=$0
            gsub(/^[^:]+:[[:space:]]*/, "", val)
            gsub(/[[:space:]]*#.*/, "", val)
            gsub(/^"/, "", val)
            gsub(/"$/, "", val)
            gsub(/^[[:space:]]+/, "", val)
            gsub(/[[:space:]]+$/, "", val)
            print val
            exit
        }
    ' "${file}"
}

# Extract a value from a nested subsection within a section
# Usage: subsection_val "audio" "midi" "present" "$FILE"
subsection_val() {
    local section="$1"
    local subsec="$2"
    local key="$3"
    local file="$4"
    awk -v sect="${section}" -v subsec="${subsec}" -v k="${key}" '
        $0 ~ "^"sect":" { in_sect=1; next }
        /^[a-zA-Z]/ && !/^[[:space:]]/ { in_sect=0 }
        in_sect && $0 ~ "^  "subsec":" { in_sub=1; next }
        in_sect && /^  [a-zA-Z]/ && $0 !~ "^    " { in_sub=0 }
        in_sect && in_sub && $0 ~ "^[[:space:]]+"k":" {
            val=$0
            gsub(/^[^:]+:[[:space:]]*/, "", val)
            gsub(/[[:space:]]*#.*/, "", val)
            gsub(/^"/, "", val)
            gsub(/"$/, "", val)
            gsub(/^[[:space:]]+/, "", val)
            gsub(/[[:space:]]+$/, "", val)
            print val
            exit
        }
    ' "${file}"
}

# Extract a top-level YAML key (no section)
# Usage: toplevel_val "tier" "$FILE"
toplevel_val() {
    local key="$1"
    local file="$2"
    awk -v k="${key}" '
        /^[a-zA-Z]/ && $0 ~ "^"k":" {
            val=$0
            gsub(/^[^:]+:[[:space:]]*/, "", val)
            gsub(/[[:space:]]*#.*/, "", val)
            gsub(/^"/, "", val)
            gsub(/"$/, "", val)
            gsub(/^[[:space:]]+/, "", val)
            gsub(/[[:space:]]+$/, "", val)
            print val
            exit
        }
    ' "${file}"
}

# Find the first ethernet interface with state=up from the network section
# Falls back to first ethernet interface, then "eth0"
find_management_interface() {
    local file="$1"
    local result
    result="$(awk '
        /^network:/ { in_net=1; next }
        /^[a-zA-Z]/ && !/^[[:space:]]/ { in_net=0 }
        in_net && /^  interfaces:/ { in_ifaces=1; next }
        in_net && /^  [a-zA-Z]/ && !/^    / { in_ifaces=0 }
        in_ifaces && /name:/ {
            name=$0
            gsub(/.*name:[[:space:]]*/, "", name)
            gsub(/[[:space:]]*#.*/, "", name)
            gsub(/^"/, "", name)
            gsub(/"$/, "", name)
            current_name=name
        }
        in_ifaces && /type:/ {
            t=$0
            gsub(/.*type:[[:space:]]*/, "", t)
            gsub(/[[:space:]]*#.*/, "", t)
            current_type=t
        }
        in_ifaces && /state:/ {
            s=$0
            gsub(/.*state:[[:space:]]*/, "", s)
            gsub(/[[:space:]]*#.*/, "", s)
            current_state=s
            if (current_type == "ethernet" && first_eth == "") first_eth=current_name
            if (current_type == "ethernet" && s == "up" && result == "") result=current_name
        }
        END {
            if (result != "") print result
            else if (first_eth != "") print first_eth
            else print "eth0"
        }
    ' "${file}")"
    printf "%s" "${result}"
}

# ---------------------------------------------------------------------------
# Read capabilities data
# ---------------------------------------------------------------------------

printf "[INFO] Reading capabilities from: %s\n" "${CAPABILITIES_FILE}" >&2
printf "[INFO] Reading budget from: %s\n" "${BUDGET_FILE}" >&2

# --- Budget values ---
BUDGET_HOST_RAM="$(section_val "host_reserved" "ram_gb" "${BUDGET_FILE}")"
BUDGET_HOST_CORES="$(section_val "host_reserved" "cores" "${BUDGET_FILE}")"
BUDGET_VM_RAM="$(section_val "vm_available" "ram_gb" "${BUDGET_FILE}")"
BUDGET_VM_CORES="$(section_val "vm_available" "cores" "${BUDGET_FILE}")"
BUDGET_MC_RAM="$(section_val "minecraft_vm" "ram_gb" "${BUDGET_FILE}")"
BUDGET_MC_CORES="$(section_val "minecraft_vm" "cores" "${BUDGET_FILE}")"
BUDGET_MC_STORAGE="$(section_val "minecraft_vm" "storage_gb" "${BUDGET_FILE}")"
BUDGET_UNALLOC_RAM="$(section_val "unallocated" "ram_gb" "${BUDGET_FILE}")"
BUDGET_UNALLOC_CORES="$(section_val "unallocated" "cores" "${BUDGET_FILE}")"
BUDGET_TIER="$(toplevel_val "tier" "${BUDGET_FILE}")"

# Normalize defaults
BUDGET_HOST_RAM="${BUDGET_HOST_RAM:-4}"
BUDGET_HOST_CORES="${BUDGET_HOST_CORES:-2}"
BUDGET_VM_RAM="${BUDGET_VM_RAM:-12}"
BUDGET_VM_CORES="${BUDGET_VM_CORES:-2}"
BUDGET_MC_RAM="${BUDGET_MC_RAM:-6}"
BUDGET_MC_CORES="${BUDGET_MC_CORES:-1}"
BUDGET_MC_STORAGE="${BUDGET_MC_STORAGE:-50}"
BUDGET_UNALLOC_RAM="${BUDGET_UNALLOC_RAM:-0}"
BUDGET_UNALLOC_CORES="${BUDGET_UNALLOC_CORES:-0}"
BUDGET_TIER="${BUDGET_TIER:-minimal}"

printf "[INFO] Budget tier: %s (MC RAM: %sGB, MC cores: %s)\n" \
    "${BUDGET_TIER}" "${BUDGET_MC_RAM}" "${BUDGET_MC_CORES}" >&2

# --- Hypervisor values ---
HV_KVM="$(section_val "hypervisor" "kvm" "${CAPABILITIES_FILE}")"
HV_VMWARE="$(section_val "hypervisor" "vmware" "${CAPABILITIES_FILE}")"
HV_VBOX="$(section_val "hypervisor" "virtualbox" "${CAPABILITIES_FILE}")"
HV_PODMAN="$(section_val "hypervisor" "podman" "${CAPABILITIES_FILE}")"
HV_DOCKER="$(section_val "hypervisor" "docker" "${CAPABILITIES_FILE}")"
HV_NESTED="$(section_val "hypervisor" "nested_virtualization" "${CAPABILITIES_FILE}")"

# Normalize booleans
normalize_bool() {
    case "${1,,}" in
        true)  printf "true" ;;
        *)     printf "false" ;;
    esac
}

HV_KVM="$(normalize_bool "${HV_KVM:-false}")"
HV_VMWARE="$(normalize_bool "${HV_VMWARE:-false}")"
HV_VBOX="$(normalize_bool "${HV_VBOX:-false}")"
HV_PODMAN="$(normalize_bool "${HV_PODMAN:-false}")"
HV_DOCKER="$(normalize_bool "${HV_DOCKER:-false}")"
HV_NESTED="$(normalize_bool "${HV_NESTED:-false}")"

# --- Distro values ---
DISTRO_ID="$(section_val "distro" "id" "${CAPABILITIES_FILE}")"
DISTRO_PKG_MGR="$(section_val "distro" "package_manager" "${CAPABILITIES_FILE}")"
DISTRO_FIREWALL="$(section_val "distro" "firewall" "${CAPABILITIES_FILE}")"
DISTRO_TIER="$(section_val "distro" "tier" "${CAPABILITIES_FILE}")"
DISTRO_SELINUX="$(subsection_val "distro" "security" "selinux" "${CAPABILITIES_FILE}")"

DISTRO_ID="${DISTRO_ID:-unknown}"
DISTRO_PKG_MGR="${DISTRO_PKG_MGR:-unknown}"
DISTRO_FIREWALL="${DISTRO_FIREWALL:-none}"
DISTRO_TIER="${DISTRO_TIER:-2}"
DISTRO_SELINUX="${DISTRO_SELINUX:-absent}"

# --- Network ---
MGMT_IFACE="$(find_management_interface "${CAPABILITIES_FILE}")"
HAS_BRIDGE="$(subsection_val "network" "capabilities" "has_bridge_support" "${CAPABILITIES_FILE}")"
HAS_BRIDGE="$(normalize_bool "${HAS_BRIDGE:-false}")"

# --- Capabilities ---
CAN_RUN_VMS="$(section_val "capabilities" "can_run_vms" "${CAPABILITIES_FILE}")"
CAN_PASSTHROUGH_GPU="$(section_val "capabilities" "can_passthrough_gpu" "${CAPABILITIES_FILE}")"
HAS_AUDIO_OUTPUT="$(section_val "capabilities" "has_audio_output" "${CAPABILITIES_FILE}")"
HAS_MIDI="$(section_val "capabilities" "has_midi" "${CAPABILITIES_FILE}")"
HAS_ETHERNET="$(section_val "capabilities" "has_ethernet" "${CAPABILITIES_FILE}")"
HAS_USB3="$(section_val "capabilities" "has_usb3" "${CAPABILITIES_FILE}")"
IS_TIER1_DISTRO="$(section_val "capabilities" "is_tier1_distro" "${CAPABILITIES_FILE}")"

CAN_RUN_VMS="$(normalize_bool "${CAN_RUN_VMS:-false}")"
CAN_PASSTHROUGH_GPU="$(normalize_bool "${CAN_PASSTHROUGH_GPU:-false}")"
HAS_AUDIO_OUTPUT="$(normalize_bool "${HAS_AUDIO_OUTPUT:-false}")"
HAS_MIDI="$(normalize_bool "${HAS_MIDI:-false}")"
HAS_ETHERNET="$(normalize_bool "${HAS_ETHERNET:-false}")"
HAS_USB3="$(normalize_bool "${HAS_USB3:-false}")"
IS_TIER1_DISTRO="$(normalize_bool "${IS_TIER1_DISTRO:-false}")"

# ---------------------------------------------------------------------------
# Run GPU and audio assessments
# ---------------------------------------------------------------------------

GPU_ASSESSMENT=""
AUDIO_ASSESSMENT=""

GPU_ASSESSOR="${SCRIPT_DIR}/assess-gpu.sh"
AUDIO_ASSESSOR="${SCRIPT_DIR}/assess-audio.sh"

if [[ -f "${GPU_ASSESSOR}" ]]; then
    GPU_ASSESSMENT="$(bash "${GPU_ASSESSOR}" "${CAPABILITIES_FILE}" 2>/dev/null)" || {
        printf "[WARN] GPU assessment failed, using safe defaults\n" >&2
        GPU_ASSESSMENT=""
    }
else
    printf "[WARN] assess-gpu.sh not found, using safe defaults\n" >&2
fi

if [[ -f "${AUDIO_ASSESSOR}" ]]; then
    AUDIO_ASSESSMENT="$(bash "${AUDIO_ASSESSOR}" "${CAPABILITIES_FILE}" 2>/dev/null)" || {
        printf "[WARN] Audio assessment failed, using safe defaults\n" >&2
        AUDIO_ASSESSMENT=""
    }
else
    printf "[WARN] assess-audio.sh not found, using safe defaults\n" >&2
fi

# Extract GPU assessment values (or defaults)
gpu_val() {
    local key="$1"
    local default="$2"
    if [[ -n "${GPU_ASSESSMENT}" ]]; then
        local val
        val="$(printf "%s" "${GPU_ASSESSMENT}" | awk -v k="${key}" '
            $0 ~ "^[[:space:]]+"k":" {
                v=$0
                gsub(/^[^:]+:[[:space:]]*/, "", v)
                gsub(/[[:space:]]*#.*/, "", v)
                gsub(/^"/, "", v)
                gsub(/"$/, "", v)
                gsub(/^[[:space:]]+/, "", v)
                gsub(/[[:space:]]+$/, "", v)
                print v
                exit
            }
        ')"
        printf "%s" "${val:-${default}}"
    else
        printf "%s" "${default}"
    fi
}

audio_val() {
    local key="$1"
    local default="$2"
    if [[ -n "${AUDIO_ASSESSMENT}" ]]; then
        local val
        val="$(printf "%s" "${AUDIO_ASSESSMENT}" | awk -v k="${key}" '
            $0 ~ "^[[:space:]]+"k":" {
                v=$0
                gsub(/^[^:]+:[[:space:]]*/, "", v)
                gsub(/[[:space:]]*#.*/, "", v)
                gsub(/^"/, "", v)
                gsub(/"$/, "", v)
                gsub(/^[[:space:]]+/, "", v)
                gsub(/[[:space:]]+$/, "", v)
                print v
                exit
            }
        ')"
        printf "%s" "${val:-${default}}"
    else
        printf "%s" "${default}"
    fi
}

# GPU values
GPU_COMPUTE_CAPABLE="$(gpu_val "compute_capable" "false")"
GPU_COMPUTE_LEVEL="$(gpu_val "compute_level" "none")"
GPU_RENDERING_CAPABLE="$(gpu_val "rendering_capable" "false")"
GPU_RENDERING_BACKEND="$(gpu_val "rendering_backend" "none")"
GPU_PASSTHROUGH_VIABLE="$(gpu_val "passthrough_viable" "false")"
GPU_VRAM_TIER="$(gpu_val "vram_tier" "none")"
GPU_UAE_DISPLAY="$(gpu_val "uae_display" "software")"

# Audio values
AUDIO_USABLE="$(audio_val "usable" "false")"
AUDIO_SERVER="$(audio_val "server" "none")"
AUDIO_ROUTING="$(audio_val "routing_method" "none")"
AUDIO_UAE_AUDIO="$(audio_val "uae_audio_backend" "none")"
AUDIO_UAE_MIDI="$(audio_val "uae_midi_backend" "none")"
AUDIO_SAMPLE_RATE="$(audio_val "recommended_sample_rate" "44100")"
AUDIO_BUFFER_SIZE="$(audio_val "recommended_buffer_size" "1024")"

# ---------------------------------------------------------------------------
# Tier-adaptive configuration values
# ---------------------------------------------------------------------------

# JVM heap_max_mb = minecraft_vm.ram_gb * 1024 - 512 (leave OS overhead)
JVM_HEAP_MAX=$(( BUDGET_MC_RAM * 1024 - 512 ))

# Tier-adaptive values
case "${BUDGET_TIER}" in
    generous)
        JVM_HEAP_MIN=4096
        VIEW_DISTANCE=24
        SIMULATION_DISTANCE=12
        MAX_PLAYERS=20
        ENTITY_BROADCAST_RANGE=150
        SYNCMATICA_MAX_SIZE=1000000
        # ZGC if heap >= 8GB (8192 MB)
        if [[ "${JVM_HEAP_MAX}" -ge 8192 ]]; then
            GC_TYPE="ZGC"
            GC_FLAGS="-XX:+UseZGC -XX:+ZGenerational"
        else
            GC_TYPE="G1GC"
            GC_FLAGS="-XX:+UseG1GC -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=16M -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40"
        fi
        EXTRA_JVM_FLAGS="-XX:+ParallelRefProcEnabled -XX:+DisableExplicitGC -XX:+AlwaysPreTouch"
        ;;
    comfortable)
        JVM_HEAP_MIN=2048
        VIEW_DISTANCE=16
        SIMULATION_DISTANCE=10
        MAX_PLAYERS=10
        ENTITY_BROADCAST_RANGE=100
        SYNCMATICA_MAX_SIZE=500000
        GC_TYPE="G1GC"
        GC_FLAGS="-XX:+UseG1GC -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=16M -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40"
        EXTRA_JVM_FLAGS="-XX:+ParallelRefProcEnabled -XX:+DisableExplicitGC -XX:+AlwaysPreTouch"
        ;;
    *)  # minimal
        JVM_HEAP_MIN=1024
        VIEW_DISTANCE=10
        SIMULATION_DISTANCE=6
        MAX_PLAYERS=5
        ENTITY_BROADCAST_RANGE=50
        SYNCMATICA_MAX_SIZE=100000
        GC_TYPE="G1GC"
        GC_FLAGS="-XX:+UseG1GC -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=16M"
        EXTRA_JVM_FLAGS="-XX:+ParallelRefProcEnabled -XX:+DisableExplicitGC"
        ;;
esac

# ---------------------------------------------------------------------------
# Hypervisor preference logic
# ---------------------------------------------------------------------------

# KVM preferred (open standard), then VMware, then VirtualBox
# If none but container runtime available, set preferred=container
HV_PREFERRED="none"
if [[ "${HV_KVM}" == "true" ]]; then
    HV_PREFERRED="kvm"
elif [[ "${HV_VMWARE}" == "true" ]]; then
    HV_PREFERRED="vmware"
elif [[ "${HV_VBOX}" == "true" ]]; then
    HV_PREFERRED="virtualbox"
elif [[ "${HV_PODMAN}" == "true" || "${HV_DOCKER}" == "true" ]]; then
    HV_PREFERRED="container"
fi

# Container runtime preference: podman > docker
CONTAINER_RUNTIME="none"
if [[ "${HV_PODMAN}" == "true" ]]; then
    CONTAINER_RUNTIME="podman"
elif [[ "${HV_DOCKER}" == "true" ]]; then
    CONTAINER_RUNTIME="docker"
fi

# ---------------------------------------------------------------------------
# Generate output YAML
# ---------------------------------------------------------------------------

mkdir -p "$(dirname "${OUTPUT_FILE}")"

generate_yaml() {
    printf "# Generated by generate-local-values.sh\n"
    printf "# Source: %s + %s\n" "${CAPABILITIES_FILE}" "${BUDGET_FILE}"
    printf "# Tier: %s\n" "${BUDGET_TIER}"
    printf "# Generated: %s\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    printf "\n"

    # --- System Identity (Phase 171: kickstart) ---
    yaml_section "" "system"
    yaml_key "  " "tier" "${BUDGET_TIER}"
    yaml_key "  " "hostname_prefix" "gsd"
    yaml_key "  " "domain" "gsd.local"
    yaml_key "  " "timezone" "UTC"
    printf "\n"

    # --- Resource Allocation (Phase 172: VM provisioning) ---
    yaml_section "" "resources"
    yaml_section "  " "host_reserved"
    yaml_int "    " "ram_gb" "${BUDGET_HOST_RAM}"
    yaml_int "    " "cores" "${BUDGET_HOST_CORES}"
    yaml_section "  " "minecraft_vm"
    yaml_int "    " "ram_gb" "${BUDGET_MC_RAM}"
    yaml_int "    " "cores" "${BUDGET_MC_CORES}"
    yaml_int "    " "storage_gb" "${BUDGET_MC_STORAGE}"
    yaml_section "  " "unallocated"
    yaml_int "    " "ram_gb" "${BUDGET_UNALLOC_RAM}"
    yaml_int "    " "cores" "${BUDGET_UNALLOC_CORES}"
    printf "\n"

    # --- Minecraft Server (Phase 173-175: server foundation/config) ---
    yaml_section "" "minecraft"
    yaml_section "  " "jvm"
    yaml_int "    " "heap_min_mb" "${JVM_HEAP_MIN}"
    yaml_int "    " "heap_max_mb" "${JVM_HEAP_MAX}"
    yaml_key "    " "gc_type" "${GC_TYPE}"
    yaml_key "    " "gc_flags" "${GC_FLAGS}"
    yaml_key "    " "extra_flags" "${EXTRA_JVM_FLAGS}"
    yaml_section "  " "server"
    yaml_int "    " "view_distance" "${VIEW_DISTANCE}"
    yaml_int "    " "simulation_distance" "${SIMULATION_DISTANCE}"
    yaml_int "    " "max_players" "${MAX_PLAYERS}"
    yaml_int "    " "network_compression_threshold" "256"
    yaml_int "    " "entity_broadcast_range" "${ENTITY_BROADCAST_RANGE}"
    yaml_section "  " "mods"
    yaml_int "    " "syncmatica_max_schematic_size" "${SYNCMATICA_MAX_SIZE}"
    printf "\n"

    # --- Network (Phase 170-171: PXE/kickstart) ---
    yaml_section "" "network"
    yaml_key "  " "management_interface" "${MGMT_IFACE}"
    yaml_key "  " "pxe_dhcp_range_start" "192.168.122.200"
    yaml_key "  " "pxe_dhcp_range_end" "192.168.122.250"
    yaml_int "  " "game_port" "25565"
    yaml_int "  " "rcon_port" "25575"
    yaml_bool "  " "has_bridge_support" "${HAS_BRIDGE}"
    printf "\n"

    # --- GPU Configuration (Phase 182: UAE) ---
    yaml_section "" "gpu"
    yaml_bool "  " "compute_capable" "${GPU_COMPUTE_CAPABLE}"
    yaml_key "  " "compute_level" "${GPU_COMPUTE_LEVEL}"
    yaml_bool "  " "rendering_capable" "${GPU_RENDERING_CAPABLE}"
    yaml_key "  " "rendering_backend" "${GPU_RENDERING_BACKEND}"
    yaml_bool "  " "passthrough_viable" "${GPU_PASSTHROUGH_VIABLE}"
    yaml_key "  " "vram_tier" "${GPU_VRAM_TIER}"
    yaml_key "  " "uae_display" "${GPU_UAE_DISPLAY}"
    printf "\n"

    # --- Audio Configuration (Phase 182: UAE) ---
    yaml_section "" "audio"
    yaml_bool "  " "usable" "${AUDIO_USABLE}"
    yaml_key "  " "server" "${AUDIO_SERVER}"
    yaml_key "  " "routing_method" "${AUDIO_ROUTING}"
    yaml_key "  " "uae_audio_backend" "${AUDIO_UAE_AUDIO}"
    yaml_key "  " "uae_midi_backend" "${AUDIO_UAE_MIDI}"
    yaml_int "  " "recommended_sample_rate" "${AUDIO_SAMPLE_RATE}"
    yaml_int "  " "recommended_buffer_size" "${AUDIO_BUFFER_SIZE}"
    printf "\n"

    # --- Hypervisor (Phase 172/180: VM provisioning/abstraction) ---
    yaml_section "" "hypervisor"
    yaml_key "  " "preferred" "${HV_PREFERRED}"
    yaml_key "  " "container_runtime" "${CONTAINER_RUNTIME}"
    yaml_bool "  " "can_nested_virtualize" "${HV_NESTED}"
    printf "\n"

    # --- Distribution (Phase 179: distro abstraction) ---
    yaml_section "" "distro"
    yaml_key "  " "id" "${DISTRO_ID}"
    yaml_key "  " "package_manager" "${DISTRO_PKG_MGR}"
    yaml_key "  " "firewall" "${DISTRO_FIREWALL}"
    yaml_int "  " "tier" "${DISTRO_TIER}"
    yaml_key "  " "selinux" "${DISTRO_SELINUX}"
    printf "\n"

    # --- Capabilities Summary (feature gating for all phases) ---
    yaml_section "" "capabilities"
    yaml_bool "  " "can_run_vms" "${CAN_RUN_VMS}"
    yaml_bool "  " "can_passthrough_gpu" "${CAN_PASSTHROUGH_GPU}"
    yaml_bool "  " "has_audio_output" "${HAS_AUDIO_OUTPUT}"
    yaml_bool "  " "has_midi" "${HAS_MIDI}"
    yaml_bool "  " "has_ethernet" "${HAS_ETHERNET}"
    yaml_bool "  " "has_bridge_support" "${HAS_BRIDGE}"
    yaml_bool "  " "has_usb3" "${HAS_USB3}"
    yaml_bool "  " "is_tier1_distro" "${IS_TIER1_DISTRO}"
}

if [[ "${OUTPUT_FILE}" == "/dev/stdout" || "${OUTPUT_FILE}" == "-" ]]; then
    generate_yaml
else
    generate_yaml > "${OUTPUT_FILE}"
    printf "[INFO] Local values generated: %s\n" "${OUTPUT_FILE}" >&2
    printf "[INFO] Tier: %s | GC: %s | View: %s | Players: %s | Hypervisor: %s\n" \
        "${BUDGET_TIER}" "${GC_TYPE}" "${VIEW_DISTANCE}" "${MAX_PLAYERS}" "${HV_PREFERRED}" >&2
fi

exit 0
