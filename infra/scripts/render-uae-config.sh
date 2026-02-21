#!/usr/bin/env bash
# render-uae-config.sh -- Configuration renderer for FS-UAE
#
# Merges base.fs-uae config with GPU display and audio overlays into a
# single launchable FS-UAE configuration file. Replaces placeholder tokens
# with actual paths.
#
# Usage:
#   render-uae-config.sh [--local-values <path>] [--rom-dir <path>]
#                        [--data-dir <path>] [--scanlines] [--output <path>]
#
# Options:
#   --local-values <path>  Path to local-values.yaml (default: infra/local/local-values.yaml)
#   --rom-dir <path>       FS-UAE ROMs directory (default: ~/.local/share/fs-uae/ROMs)
#   --data-dir <path>      FS-UAE data directory (default: ~/.local/share/fs-uae)
#   --scanlines            Enable CRT scanline shader in display config
#   --output <path>        Output config path (default: ~/.local/share/fs-uae/Configurations/GSD-Workbench.fs-uae)
#
# Process:
#   1. Read base.fs-uae and replace {ROM_DIR}, {DATA_DIR}, {CONFIG_DIR} tokens
#   2. Run configure-uae-display.sh for GPU-adaptive settings
#   3. Run configure-uae-audio.sh for audio routing settings
#   4. Merge all into a single config file
#
# Exit codes:
#   0 -- config rendered successfully
#   1 -- error (missing local-values or other runtime error)
#   2 -- usage error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CONFIG_DIR="${PROJECT_ROOT}/infra/config/uae"
BASE_CONFIG="${CONFIG_DIR}/base.fs-uae"

# Source shared library
# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

LOCAL_VALUES="${PROJECT_ROOT}/infra/local/local-values.yaml"
ROM_DIR="${HOME}/.local/share/fs-uae/ROMs"
DATA_DIR="${HOME}/.local/share/fs-uae"
OUTPUT_FILE="${HOME}/.local/share/fs-uae/Configurations/GSD-Workbench.fs-uae"
ENABLE_SCANLINES=""

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case "$1" in
        --local-values)
            LOCAL_VALUES="$2"
            shift 2
            ;;
        --rom-dir)
            ROM_DIR="$2"
            shift 2
            ;;
        --data-dir)
            DATA_DIR="$2"
            shift 2
            ;;
        --scanlines)
            ENABLE_SCANLINES="--scanlines"
            shift
            ;;
        --output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -h|--help)
            printf "Usage: %s [--local-values <path>] [--rom-dir <path>] [--data-dir <path>] [--scanlines] [--output <path>]\n" "$(basename "$0")"
            printf "\nConfiguration renderer merging base + display + audio into final FS-UAE config.\n"
            printf "\nOptions:\n"
            printf "  --local-values <path>  Path to local-values.yaml (default: infra/local/local-values.yaml)\n"
            printf "  --rom-dir <path>       FS-UAE ROMs directory (default: ~/.local/share/fs-uae/ROMs)\n"
            printf "  --data-dir <path>      FS-UAE data directory (default: ~/.local/share/fs-uae)\n"
            printf "  --scanlines            Enable CRT scanline shader\n"
            printf "  --output <path>        Output config path (default: ~/.local/share/fs-uae/Configurations/GSD-Workbench.fs-uae)\n"
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
    printf "Run 'infra/scripts/generate-local-values.sh' first to generate hardware-adaptive configuration.\n" >&2
    exit 1
fi

if [[ ! -f "${BASE_CONFIG}" ]]; then
    printf "Error: Base config not found: %s\n" "${BASE_CONFIG}" >&2
    printf "Expected at: infra/config/uae/base.fs-uae\n" >&2
    exit 1
fi

# Verify ROM file exists at resolved path (warn if not)
ROM_FILE="${ROM_DIR}/aros-amiga-m68k-rom.bin"
if [[ ! -f "${ROM_FILE}" ]]; then
    printf "[WARN] ROM file not found at %s\n" "${ROM_FILE}" >&2
    printf "[WARN] Run 'infra/scripts/setup-aros-rom.sh' to download AROS ROM\n" >&2
fi

# ---------------------------------------------------------------------------
# Step 1: Render base config with placeholder replacement
# ---------------------------------------------------------------------------

printf "[INFO] Rendering base config from: %s\n" "${BASE_CONFIG}" >&2
printf "[INFO] ROM directory: %s\n" "${ROM_DIR}" >&2
printf "[INFO] Data directory: %s\n" "${DATA_DIR}" >&2
printf "[INFO] Config directory: %s\n" "${CONFIG_DIR}" >&2

# Read base config and replace placeholder tokens
RENDERED_BASE="$(sed \
    -e "s|{ROM_DIR}|${ROM_DIR}|g" \
    -e "s|{DATA_DIR}|${DATA_DIR}|g" \
    -e "s|{CONFIG_DIR}|${CONFIG_DIR}|g" \
    "${BASE_CONFIG}")"

# ---------------------------------------------------------------------------
# Step 2: Generate display configuration
# ---------------------------------------------------------------------------

DISPLAY_SCRIPT="${SCRIPT_DIR}/configure-uae-display.sh"
if [[ ! -f "${DISPLAY_SCRIPT}" ]]; then
    printf "Error: Display config script not found: %s\n" "${DISPLAY_SCRIPT}" >&2
    exit 1
fi

printf "[INFO] Generating display configuration...\n" >&2
# shellcheck disable=SC2086
DISPLAY_CONFIG="$(bash "${DISPLAY_SCRIPT}" --local-values "${LOCAL_VALUES}" ${ENABLE_SCANLINES} 2>/dev/null)" || {
    printf "Error: Display configuration generation failed\n" >&2
    exit 1
}

# ---------------------------------------------------------------------------
# Step 3: Generate audio configuration
# ---------------------------------------------------------------------------

AUDIO_SCRIPT="${SCRIPT_DIR}/configure-uae-audio.sh"
if [[ ! -f "${AUDIO_SCRIPT}" ]]; then
    printf "Error: Audio config script not found: %s\n" "${AUDIO_SCRIPT}" >&2
    exit 1
fi

printf "[INFO] Generating audio configuration...\n" >&2
AUDIO_CONFIG="$(bash "${AUDIO_SCRIPT}" --local-values "${LOCAL_VALUES}" 2>/dev/null)" || {
    printf "Error: Audio configuration generation failed\n" >&2
    exit 1
}

# ---------------------------------------------------------------------------
# Step 4: Merge all sections into final config
# ---------------------------------------------------------------------------

FINAL_CONFIG="${RENDERED_BASE}

# --- GPU Display (from local-values.yaml) ---
${DISPLAY_CONFIG}

# --- Audio (from local-values.yaml) ---
${AUDIO_CONFIG}"

# ---------------------------------------------------------------------------
# Step 5: Write to output path
# ---------------------------------------------------------------------------

mkdir -p "$(dirname "${OUTPUT_FILE}")"
printf "%s\n" "${FINAL_CONFIG}" > "${OUTPUT_FILE}"

# ---------------------------------------------------------------------------
# Step 6: Summary
# ---------------------------------------------------------------------------

# Extract display backend for summary
DISPLAY_BACKEND="unknown"
if printf "%s" "${DISPLAY_CONFIG}" | grep -q "low_latency_vsync"; then
    DISPLAY_BACKEND="vulkan"
elif printf "%s" "${DISPLAY_CONFIG}" | grep -q "texture_filter = linear"; then
    DISPLAY_BACKEND="opengl"
else
    DISPLAY_BACKEND="software"
fi

# Extract audio backend for summary
AUDIO_BACKEND="unknown"
if printf "%s" "${AUDIO_CONFIG}" | grep -q "sound_output = exact"; then
    AUDIO_BACKEND="active"
elif printf "%s" "${AUDIO_CONFIG}" | grep -q "sound_output = none"; then
    AUDIO_BACKEND="disabled"
fi

printf "\n[INFO] FS-UAE configuration rendered successfully\n" >&2
printf "[INFO] Output: %s\n" "${OUTPUT_FILE}" >&2
printf "[INFO] ROM path: %s\n" "${ROM_DIR}" >&2
printf "[INFO] Display: %s\n" "${DISPLAY_BACKEND}" >&2
printf "[INFO] Audio: %s\n" "${AUDIO_BACKEND}" >&2

exit 0
