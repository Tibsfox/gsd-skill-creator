#!/usr/bin/env bash
# configure-uae-display.sh -- GPU-adaptive display configuration generator
#
# Reads gpu section from local-values.yaml (produced by generate-local-values.sh)
# and outputs FS-UAE display configuration lines to stdout.
#
# Usage:
#   configure-uae-display.sh [--local-values <path>] [--scanlines]
#
# Options:
#   --local-values <path>  Path to local-values.yaml (default: infra/local/local-values.yaml)
#   --scanlines            Enable CRT scanline shader overlay (requires GPU)
#
# Input (from local-values.yaml gpu section):
#   gpu.uae_display        -- vulkan, opengl, or software
#   gpu.rendering_capable  -- true or false
#   gpu.rendering_backend  -- nvidia, amdgpu, mesa, or none
#   gpu.vram_tier          -- none, low, medium, high
#
# Output: FS-UAE display configuration lines to stdout
# Diagnostics: classification reasoning to stderr
#
# Exit codes:
#   0 -- success
#   1 -- error (missing local-values)
#   2 -- usage error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CONFIG_DIR="${PROJECT_ROOT}/infra/config/uae"

# Source shared library for YAML emission helpers
# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

LOCAL_VALUES="${PROJECT_ROOT}/infra/local/local-values.yaml"
ENABLE_SCANLINES="false"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case "$1" in
        --local-values)
            LOCAL_VALUES="$2"
            shift 2
            ;;
        --scanlines)
            ENABLE_SCANLINES="true"
            shift
            ;;
        -h|--help)
            printf "Usage: %s [--local-values <path>] [--scanlines]\n" "$(basename "$0")"
            printf "\nGPU-adaptive display configuration generator for FS-UAE.\n"
            printf "\nOptions:\n"
            printf "  --local-values <path>  Path to local-values.yaml (default: infra/local/local-values.yaml)\n"
            printf "  --scanlines            Enable CRT scanline shader overlay (requires GPU)\n"
            exit 0
            ;;
        *)
            printf "Error: Unknown argument: %s\n" "$1" >&2
            exit 2
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Validate inputs
# ---------------------------------------------------------------------------

if [[ ! -f "${LOCAL_VALUES}" ]]; then
    printf "Error: local-values.yaml not found: %s\n" "${LOCAL_VALUES}" >&2
    printf "Run 'infra/scripts/generate-local-values.sh' first.\n" >&2
    exit 1
fi

# ---------------------------------------------------------------------------
# Section-aware YAML parsing (awk-based, established pattern)
# ---------------------------------------------------------------------------

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
# Read GPU section from local-values.yaml
# ---------------------------------------------------------------------------

UAE_DISPLAY="$(section_val "gpu" "uae_display" "${LOCAL_VALUES}")"
RENDERING_CAPABLE="$(section_val "gpu" "rendering_capable" "${LOCAL_VALUES}")"
RENDERING_BACKEND="$(section_val "gpu" "rendering_backend" "${LOCAL_VALUES}")"
VRAM_TIER="$(section_val "gpu" "vram_tier" "${LOCAL_VALUES}")"

# Normalize defaults
UAE_DISPLAY="${UAE_DISPLAY:-software}"
RENDERING_CAPABLE="${RENDERING_CAPABLE:-false}"
RENDERING_BACKEND="${RENDERING_BACKEND:-none}"
VRAM_TIER="${VRAM_TIER:-none}"

printf "[INFO] Display config input: uae_display=%s rendering_capable=%s backend=%s vram=%s scanlines=%s\n" \
    "${UAE_DISPLAY}" "${RENDERING_CAPABLE}" "${RENDERING_BACKEND}" "${VRAM_TIER}" "${ENABLE_SCANLINES}" >&2

# ---------------------------------------------------------------------------
# Generate FS-UAE display configuration
# ---------------------------------------------------------------------------

printf "# Display configuration (from local-values.yaml gpu section)\n"
printf "# Backend: %s | VRAM tier: %s | Rendering: %s\n" \
    "${UAE_DISPLAY}" "${VRAM_TIER}" "${RENDERING_BACKEND}"
printf "\n"

# Video sync -- always auto (let FS-UAE decide based on host capabilities)
printf "video_sync = auto\n"

# Display backend mapping
case "${UAE_DISPLAY}" in
    vulkan)
        printf "video_format = bgra\n"
        printf "texture_filter = linear\n"
        printf "low_latency_vsync = 1\n"
        printf "[INFO] Display backend: Vulkan -- modern GPU, best performance\n" >&2
        ;;
    opengl)
        printf "video_format = bgra\n"
        printf "texture_filter = linear\n"
        printf "[INFO] Display backend: OpenGL -- older GPU, hardware-accelerated\n" >&2
        ;;
    software|*)
        printf "video_format = bgra\n"
        printf "texture_filter = nearest\n"
        printf "[INFO] Display backend: Software -- CPU rendering only\n" >&2
        ;;
esac

printf "\n"

# Scaling and resolution based on VRAM tier
case "${VRAM_TIER}" in
    high)
        printf "# 3x integer scaling for high VRAM (8GB+)\n"
        printf "scale_x = 3\n"
        printf "scale_y = 3\n"
        ;;
    medium|low)
        printf "# 2x integer scaling for %s VRAM\n" "${VRAM_TIER}"
        printf "scale_x = 2\n"
        printf "scale_y = 2\n"
        ;;
    none|*)
        printf "# No scaling (1x native) -- no GPU or VRAM not detected\n"
        ;;
esac

# Fullscreen default (user can toggle)
printf "fullscreen = 0\n"

# Scanline shader
if [[ "${ENABLE_SCANLINES}" == "true" ]]; then
    if [[ "${RENDERING_CAPABLE}" == "true" ]]; then
        printf "\n# CRT scanline shader enabled\n"
        printf "shader = %s/scanline.fs-uae-shader\n" "${CONFIG_DIR}"
        printf "[INFO] Scanline shader enabled: %s/scanline.fs-uae-shader\n" "${CONFIG_DIR}" >&2
    else
        printf "[WARN] Scanlines requested but no GPU available -- shader requires GPU rendering, skipping\n" >&2
    fi
fi

printf "\n[INFO] Display configuration generated successfully\n" >&2

exit 0
