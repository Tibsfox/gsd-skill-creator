#!/usr/bin/env bash
# assess-gpu.sh -- GPU capability assessment module
#
# Reads a hardware-capabilities YAML and produces a gpu_assessment YAML
# section to stdout classifying compute, rendering, passthrough, and
# display backend recommendations.
#
# Usage:
#   assess-gpu.sh <hardware-capabilities.yaml>
#
# Input: Path to capabilities YAML (first argument).
#   Extracts from gpu: section -- present, vendor, family, vram_gb, driver, iommu_available
#   Extracts from hypervisor: section -- kvm, nested_virtualization
#
# Output (stdout): gpu_assessment YAML section
# Diagnostics (stderr): classification reasoning
#
# Exit codes:
#   0 -- always (assessment of "no GPU" is a valid result)
#   2 -- usage error (missing arguments, file not found)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source shared library for YAML emission helpers
# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

if [[ $# -lt 1 ]]; then
    printf "Usage: %s <hardware-capabilities.yaml>\n" "$(basename "$0")" >&2
    exit 2
fi

INPUT_FILE="$1"

if [[ ! -f "${INPUT_FILE}" ]]; then
    printf "Error: Input file not found: %s\n" "${INPUT_FILE}" >&2
    exit 2
fi

# ---------------------------------------------------------------------------
# Section-aware YAML parsing (awk-based, established pattern)
# ---------------------------------------------------------------------------

# Extract a value from a specific YAML section
# Usage: section_val "gpu" "vendor" "$INPUT_FILE"
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

# ---------------------------------------------------------------------------
# Read GPU section values
# ---------------------------------------------------------------------------

GPU_PRESENT="$(section_val "gpu" "present" "${INPUT_FILE}")"
GPU_VENDOR="$(section_val "gpu" "vendor" "${INPUT_FILE}")"
GPU_FAMILY="$(section_val "gpu" "family" "${INPUT_FILE}")"
GPU_VRAM="$(section_val "gpu" "vram_gb" "${INPUT_FILE}")"
GPU_DRIVER="$(section_val "gpu" "driver" "${INPUT_FILE}")"
GPU_IOMMU="$(section_val "gpu" "iommu_available" "${INPUT_FILE}")"

# Read hypervisor section values
HV_KVM="$(section_val "hypervisor" "kvm" "${INPUT_FILE}")"

# ---------------------------------------------------------------------------
# Normalize values (handle null/empty/none as safe defaults)
# ---------------------------------------------------------------------------

# Normalize present flag
case "${GPU_PRESENT,,}" in
    true)  GPU_PRESENT="true" ;;
    *)     GPU_PRESENT="false" ;;
esac

# Normalize vendor
GPU_VENDOR="${GPU_VENDOR,,}"  # lowercase
case "${GPU_VENDOR}" in
    nvidia|amd|intel) ;; # valid
    null|none|"") GPU_VENDOR="none" ;;
    *) GPU_VENDOR="${GPU_VENDOR}" ;;  # passthrough unknown
esac

# Normalize VRAM (handle null/empty/none as 0)
case "${GPU_VRAM,,}" in
    null|none|"") GPU_VRAM=0 ;;
    *) GPU_VRAM="${GPU_VRAM}" ;;
esac

# Normalize driver
GPU_DRIVER="${GPU_DRIVER,,}"
case "${GPU_DRIVER}" in
    null|none|"") GPU_DRIVER="none" ;;
esac

# Normalize booleans
case "${GPU_IOMMU,,}" in
    true)  GPU_IOMMU="true" ;;
    *)     GPU_IOMMU="false" ;;
esac

case "${HV_KVM,,}" in
    true)  HV_KVM="true" ;;
    *)     HV_KVM="false" ;;
esac

printf "[INFO] GPU assessment input: present=%s vendor=%s vram=%s driver=%s iommu=%s kvm=%s\n" \
    "${GPU_PRESENT}" "${GPU_VENDOR}" "${GPU_VRAM}" "${GPU_DRIVER}" "${GPU_IOMMU}" "${HV_KVM}" >&2

# ---------------------------------------------------------------------------
# Classification logic
# ---------------------------------------------------------------------------

# compute_capable: true if NVIDIA with proprietary driver, OR AMD with amdgpu driver
COMPUTE_CAPABLE="false"
if [[ "${GPU_VENDOR}" == "nvidia" && "${GPU_DRIVER}" == "nvidia" ]]; then
    COMPUTE_CAPABLE="true"
elif [[ "${GPU_VENDOR}" == "amd" && "${GPU_DRIVER}" == "amdgpu" ]]; then
    COMPUTE_CAPABLE="true"
fi

# compute_level: none | basic | standard | advanced
# none = no GPU, basic = integrated Intel, standard = AMD discrete, advanced = NVIDIA with CUDA
COMPUTE_LEVEL="none"
if [[ "${GPU_PRESENT}" == "true" ]]; then
    if [[ "${GPU_VENDOR}" == "nvidia" && "${GPU_DRIVER}" == "nvidia" ]]; then
        COMPUTE_LEVEL="advanced"
    elif [[ "${GPU_VENDOR}" == "amd" ]]; then
        COMPUTE_LEVEL="standard"
    elif [[ "${GPU_VENDOR}" == "intel" ]]; then
        COMPUTE_LEVEL="basic"
    fi
fi

# rendering_capable: true if any GPU present with a working driver
RENDERING_CAPABLE="false"
if [[ "${GPU_PRESENT}" == "true" && "${GPU_DRIVER}" != "none" ]]; then
    RENDERING_CAPABLE="true"
fi

# rendering_backend: mesa for Intel/AMD open-source, nvidia for proprietary NVIDIA, amdgpu for AMD, none if no GPU
RENDERING_BACKEND="none"
if [[ "${GPU_PRESENT}" == "true" ]]; then
    case "${GPU_DRIVER}" in
        nvidia)  RENDERING_BACKEND="nvidia" ;;
        amdgpu)  RENDERING_BACKEND="amdgpu" ;;
        i915|nouveau|mesa) RENDERING_BACKEND="mesa" ;;
        none)    RENDERING_BACKEND="none" ;;
        *)       RENDERING_BACKEND="mesa" ;;  # default to mesa for unknown open-source drivers
    esac
fi

# passthrough_viable: true only if iommu_available=true AND gpu present AND vendor != intel AND kvm=true
PASSTHROUGH_VIABLE="false"
if [[ "${GPU_IOMMU}" == "true" && "${GPU_PRESENT}" == "true" && "${GPU_VENDOR}" != "intel" && "${HV_KVM}" == "true" ]]; then
    PASSTHROUGH_VIABLE="true"
fi

# passthrough_method: vfio if passthrough viable, none otherwise
PASSTHROUGH_METHOD="none"
if [[ "${PASSTHROUGH_VIABLE}" == "true" ]]; then
    PASSTHROUGH_METHOD="vfio"
fi

# vram_tier: none=0, low=1-4GB, medium=4-8GB, high=8GB+
VRAM_TIER="none"
if [[ "${GPU_VRAM}" -gt 0 ]] 2>/dev/null; then
    if [[ "${GPU_VRAM}" -ge 8 ]]; then
        VRAM_TIER="high"
    elif [[ "${GPU_VRAM}" -ge 4 ]]; then
        VRAM_TIER="medium"
    else
        VRAM_TIER="low"
    fi
fi

# driver_status: opensource for mesa/amdgpu/i915/nouveau, proprietary for nvidia, none if no driver
DRIVER_STATUS="none"
case "${GPU_DRIVER}" in
    nvidia)                        DRIVER_STATUS="proprietary" ;;
    amdgpu|mesa|i915|nouveau)      DRIVER_STATUS="opensource" ;;
    none)                          DRIVER_STATUS="none" ;;
    *)                             DRIVER_STATUS="opensource" ;;  # default unknown to opensource
esac

# uae_display: vulkan if rendering_capable and modern driver, opengl if rendering_capable, software if no GPU
UAE_DISPLAY="software"
if [[ "${RENDERING_CAPABLE}" == "true" ]]; then
    case "${GPU_DRIVER}" in
        nvidia|amdgpu)  UAE_DISPLAY="vulkan" ;;
        *)              UAE_DISPLAY="opengl" ;;
    esac
fi

printf "[INFO] GPU assessment result: compute=%s/%s render=%s/%s passthrough=%s/%s vram=%s driver=%s uae=%s\n" \
    "${COMPUTE_CAPABLE}" "${COMPUTE_LEVEL}" "${RENDERING_CAPABLE}" "${RENDERING_BACKEND}" \
    "${PASSTHROUGH_VIABLE}" "${PASSTHROUGH_METHOD}" "${VRAM_TIER}" "${DRIVER_STATUS}" "${UAE_DISPLAY}" >&2

# ---------------------------------------------------------------------------
# Output YAML
# ---------------------------------------------------------------------------

yaml_section "" "gpu_assessment"
yaml_bool "  " "compute_capable" "${COMPUTE_CAPABLE}"
yaml_key "  " "compute_level" "${COMPUTE_LEVEL}"
yaml_bool "  " "rendering_capable" "${RENDERING_CAPABLE}"
yaml_key "  " "rendering_backend" "${RENDERING_BACKEND}"
yaml_bool "  " "passthrough_viable" "${PASSTHROUGH_VIABLE}"
yaml_key "  " "passthrough_method" "${PASSTHROUGH_METHOD}"
yaml_key "  " "vram_tier" "${VRAM_TIER}"
yaml_key "  " "driver_status" "${DRIVER_STATUS}"
yaml_key "  " "uae_display" "${UAE_DISPLAY}"

exit 0
